import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { QualityManager } from '../storage/quality-manager';
import { FileManager } from '../storage/file-manager';
import { atomicWrite } from '../storage/atomic-writes';
import { formatHeader, formatBold, formatList } from '../output/formatter';
/**
 * /openpaul:plan-fix Command
 *
 * Create fix plans from UAT verification issues.
 *
 * From CONTEXT.md locked decisions:
 * - Reads UAT-ISSUES.md to find open issues
 * - Displays numbered list of issues for selection
 * - Creates fix plans with alpha suffix (e.g., 06-01a, 06-01b)
 * - Inherits wave number from parent plan
 * - Prompts for execution after creation
 */
const toolFactory = tool;
export const openpaulPlanFix = toolFactory({
    name: 'openpaul:plan-fix',
    description: 'Create fix plans from UAT verification issues',
    parameters: z.object({
        phase: z.number().int().positive().describe('Phase number to fix issues in'),
        issue: z.number().int().positive().optional().describe('Issue ID to fix (from UAT-ISSUES.md)'),
        execute: z.boolean().optional().describe('Run execute-phase after creating plan'),
    }),
    execute: async (args, context) => {
        try {
            const qualityManager = new QualityManager(context.directory);
            const fileManager = new FileManager(context.directory);
            // Resolve phase directory
            const phaseDir = qualityManager.resolvePhaseDir(args.phase);
            if (!phaseDir) {
                return formatHeader(2, 'Cannot Create Fix Plan') + '\n\n' +
                    `Phase ${args.phase} directory not found.\n\n` +
                    formatBold('What to do:') + '\n' +
                    formatList([
                        'Run /openpaul:init to initialize the project',
                        'Make sure the phase has been planned and executed',
                    ]);
            }
            // Check UAT-ISSUES.md exists
            const uatIssues = qualityManager.readUATIssues(phaseDir);
            if (!uatIssues) {
                return formatHeader(2, 'No Issues Found') + '\n\n' +
                    'UAT-ISSUES.md not found. Run /openpaul:verify first to identify issues.\n\n' +
                    formatBold('What to do:') + '\n' +
                    formatList([
                        'Run `/openpaul:verify --phase ' + args.phase + '` to perform acceptance testing',
                        'Failed items will be recorded in UAT-ISSUES.md',
                    ]);
            }
            // Filter open issues
            const openIssues = uatIssues.issues.filter(issue => issue.status === 'open');
            // Check if any open issues exist
            if (openIssues.length === 0) {
                return formatHeader(2, 'No Open Issues') + '\n\n' +
                    'No open issues found in UAT-ISSUES.md.\n\n' +
                    formatBold('All issues have been resolved!') + '\n' +
                    'Run `/openpaul:verify --phase ' + args.phase + '` to test again.';
            }
            // If no issue specified, display list of issues
            if (args.issue === undefined) {
                return displayIssuesList(args.phase, openIssues);
            }
            // Validate issue ID
            const selectedIssue = openIssues.find(issue => issue.id === args.issue);
            if (!selectedIssue) {
                return formatHeader(2, 'Invalid Issue') + '\n\n' +
                    `Issue ${args.issue} not found or already fixed.\n\n` +
                    formatBold('Available open issues:') + '\n' +
                    formatList(openIssues.map(issue => `#${issue.id}: ${issue.description} (${issue.severity})`)) + '\n\n' +
                    formatBold('To create fix plan:') + '\n' +
                    `/openpaul:plan-fix --phase ${args.phase} --issue N`;
            }
            // Read parent plan to get wave number
            const parentPlanId = selectedIssue.sourcePlanId;
            const parentPhaseNumber = uatIssues.phaseNumber;
            // Try to read parent plan from both locations (.planning/phases and .paul/phases)
            let parentWave = 1; // Default wave if not found
            let parentRequirements = [];
            // First try .paul/phases location (JSON format)
            const parentPlanJson = fileManager.readPlan(parentPhaseNumber, parentPlanId);
            if (parentPlanJson) {
                parentWave = parentPlanJson.wave;
                parentRequirements = parentPlanJson.requirements || [];
            }
            else {
                // Try .planning/phases location (markdown format)
                const planningPlanPath = join(phaseDir, `${parentPhaseNumber}-${parentPlanId}-PLAN.md`);
                if (existsSync(planningPlanPath)) {
                    try {
                        const content = readFileSync(planningPlanPath, 'utf-8');
                        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
                        if (frontmatterMatch) {
                            const frontmatter = frontmatterMatch[1];
                            const waveMatch = frontmatter.match(/wave:\s*(\d+)/);
                            if (waveMatch) {
                                parentWave = parseInt(waveMatch[1], 10);
                            }
                            // Also get requirements
                            const requirementsMatch = frontmatter.match(/requirements:\s*\n((?:\s*-\s*.+\n?)+)/);
                            if (requirementsMatch) {
                                const requirements = [];
                                const reqLines = requirementsMatch[1].trim().split('\n');
                                for (const line of reqLines) {
                                    const match = line.match(/^\s*-\s*(.+)$/);
                                    if (match) {
                                        requirements.push(match[1].trim());
                                    }
                                }
                                parentRequirements = requirements;
                            }
                        }
                    }
                    catch (e) {
                        // Use defaults
                    }
                }
            }
            // Generate next alpha-suffix plan ID
            const nextPlanId = qualityManager.getNextAlphaPlanId(phaseDir, parentPlanId);
            const fullPlanId = `${parentPhaseNumber}-${nextPlanId}`;
            // Create the fix plan content
            const fixPlanContent = generateFixPlan({
                phase: uatIssues.phaseNumber.toString(),
                plan: nextPlanId,
                wave: parentWave,
                dependsOn: [parentPlanId],
                sourcePlanId: parentPlanId,
                issue: selectedIssue,
                requirements: parentRequirements || [],
            });
            // Write the fix plan file
            const planPath = join(phaseDir, `${fullPlanId}-PLAN.md`);
            await atomicWrite(planPath, fixPlanContent);
            // Format output
            let output = formatHeader(2, 'Fix Plan Created') + '\n\n';
            output += formatBold('Plan:') + ` ${fullPlanId}-PLAN.md\n`;
            output += formatBold('Location:') + ` ${planPath}\n\n`;
            output += formatBold('Issue addressed:') + '\n';
            output += `#${selectedIssue.id}: ${selectedIssue.description}\n\n`;
            output += formatBold('Details:') + '\n';
            output += `- Severity: ${selectedIssue.severity}\n`;
            output += `- Category: ${selectedIssue.category}\n`;
            output += `- Parent plan: ${parentPlanId}\n`;
            output += `- Wave: ${parentWave}\n\n`;
            if (args.execute) {
                output += formatBold('Next:') + '\n';
                output += 'Run `/gsd-execute-phase ' + args.phase + '` to implement the fix\n';
            }
            else {
                output += formatBold('Next:') + '\n';
                output += 'Run `/gsd-execute-phase ' + args.phase + '` to implement the fix\n\n';
                output += formatBold('Or execute immediately with:') + '\n';
                output += `/openpaul:plan-fix --phase ${args.phase} --issue ${args.issue} --execute\n`;
            }
            return output;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, 'Fix Plan Creation Failed') + '\n\n' +
                `Error: ${errorMessage}\n\n` +
                formatBold('Troubleshooting:') + '\n' +
                formatList([
                    'Ensure UAT-ISSUES.md exists with open issues',
                    'Check that the phase directory is writable',
                    'Verify the parent plan exists',
                ]);
        }
    },
});
/**
 * Display list of open issues
 */
function displayIssuesList(phase, issues) {
    const lines = [];
    lines.push(formatHeader(2, `Open Issues - Phase ${phase}`));
    lines.push('');
    lines.push(formatBold('Select an issue to fix:'));
    lines.push('');
    for (const issue of issues) {
        const severityIcon = issue.severity === 'critical' ? '🔴' :
            issue.severity === 'major' ? '🟠' : '🟡';
        lines.push(`${issue.id}. ${severityIcon} **${issue.severity}** - ${issue.description}`);
        lines.push(`   - Category: ${issue.category}`);
        if (issue.suggestedFix) {
            lines.push(`   - Suggested: ${issue.suggestedFix}`);
        }
        lines.push('');
    }
    lines.push(formatBold('To create fix plan:'));
    lines.push('');
    lines.push(`/openpaul:plan-fix --phase ${phase} --issue N`);
    lines.push('');
    lines.push('Replace N with the issue number.');
    return lines.join('\n');
}
/**
 * Generate fix plan content
 */
function generateFixPlan(params) {
    const { phase, plan, wave, dependsOn, sourcePlanId, issue, requirements } = params;
    // Create a task from the issue
    const taskDescription = issue.suggestedFix
        ? issue.suggestedFix
        : `Fix issue: ${issue.description}`;
    const planContent = `---
phase: ${phase}
plan: "${plan}"
type: execute
wave: ${wave}
depends_on:
  - "${sourcePlanId}"
autonomous: true
requirements:
${requirements.map(r => `  - ${r}`).join('\n')}
---

<objective>
Fix UAT issue #${issue.id}: ${issue.description}

Purpose: Address the ${issue.severity} ${issue.category} issue identified during verification.

Output: Working implementation that resolves the issue.
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/07-quality/${phase}-CONTEXT.md
@.planning/phases/07-quality/${sourcePlanId}-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Implement fix for issue #${issue.id}</name>
  <files>src/</files>
  <action>
${taskDescription}

Address the following:
- Category: ${issue.category}
- Severity: ${issue.severity}
- Original item: ${issue.itemDescription}
  </action>
  <verify><automated>npx tsc --noEmit</automated></verify>
  <done>Issue #${issue.id} resolved</done>
</task>

</tasks>

<verification>
- Issue resolved and verified
- Code compiles without errors
- Original test case now passes
</verification>

<success_criteria>
- Issue #${issue.id} is resolved
- Code is tested and working
- No regressions introduced
</success_criteria>

<output>
After completion, create SUMMARY.md
</output>
`;
    return planContent;
}
//# sourceMappingURL=plan-fix.js.map