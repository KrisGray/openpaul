import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { RoadmapManager } from '../roadmap/roadmap-manager';
import { MilestoneManager } from '../storage/milestone-manager';
import { formatHeader, formatBold, formatList } from '../output/formatter';
/**
 * /openpaul:complete-milestone Command
 *
 * Mark a milestone complete with archival and ROADMAP.md cleanup.
 *
 * From CONTEXT.md locked decisions:
 * - Shows summary with metrics before confirmation
 * - Prompts for confirmation unless --confirm flag
 * - Archives milestone to MILESTONE-ARCHIVE.md with summary + metrics
 * - Collapses phases to <details> section in ROADMAP.md
 */
const toolFactory = tool;
export const openpaulCompleteMilestone = toolFactory({
    name: 'openpaul:complete-milestone',
    description: 'Mark a milestone complete with archival and ROADMAP.md cleanup',
    parameters: z.object({
        name: z.string().optional().describe('Milestone name (defaults to active milestone)'),
        confirm: z.boolean().optional().describe('Skip confirmation prompt'),
        verbose: z.boolean().optional().describe('Show detailed breakdown per phase'),
    }),
    execute: async (args, context) => {
        try {
            const roadmapManager = new RoadmapManager(context.directory);
            const milestoneManager = new MilestoneManager(context.directory, roadmapManager);
            // Check ROADMAP.md exists
            const roadmapPath = roadmapManager.resolveRoadmapPath();
            if (!roadmapPath) {
                return formatHeader(2, 'Cannot Complete Milestone') + '\n\n' +
                    'ROADMAP.md not found. Run /openpaul:init first.\n\n' +
                    formatBold('What to do:') + '\n' +
                    formatList([
                        'Run `/openpaul:init` to initialize OpenPAUL',
                        'Or create a ROADMAP.md file in .paul/ or .openpaul/ directory',
                    ]);
            }
            // Get the milestone to complete
            let milestone = null;
            if (args.name) {
                milestone = milestoneManager.getMilestone(args.name.trim());
                if (!milestone) {
                    // List available milestones for helpful error
                    const activeMilestone = milestoneManager.getActiveMilestone();
                    const availableMsg = activeMilestone
                        ? `\n\n${formatBold('Active milestone:')} ${activeMilestone.name}`
                        : '\n\nNo active milestones found.';
                    return formatHeader(2, 'Milestone Not Found') + '\n\n' +
                        `Milestone "${args.name}" not found.` +
                        availableMsg + '\n\n' +
                        formatBold('Suggestion:') + '\n' +
                        formatList([
                            'Check the milestone name in ROADMAP.md',
                            'Use the exact name as it appears in the milestone section',
                        ]);
                }
            }
            else {
                // Use active milestone
                milestone = milestoneManager.getActiveMilestone();
                if (!milestone) {
                    return formatHeader(2, 'No Active Milestone') + '\n\n' +
                        'No active milestone found to complete.\n\n' +
                        formatBold('What to do:') + '\n' +
                        formatList([
                            'Create a milestone first with /openpaul:milestone',
                            'Or specify a milestone name with --name',
                        ]);
                }
            }
            // Check if already completed
            if (milestone.status === 'completed') {
                return formatHeader(2, 'Milestone Already Completed') + '\n\n' +
                    `Milestone "${milestone.name}" is already completed.\n\n` +
                    formatBold('What to do:') + '\n' +
                    formatList([
                        'Check MILESTONE-ARCHIVE.md for archived milestones',
                        'Create a new milestone for the next phase of work',
                    ]);
            }
            // Get progress metrics
            const progress = milestoneManager.getMilestoneProgress(milestone.name);
            if (!progress) {
                return formatHeader(2, 'Error Calculating Progress') + '\n\n' +
                    `Could not calculate progress for milestone "${milestone.name}".\n\n` +
                    formatBold('Troubleshooting:') + '\n' +
                    formatList([
                        'Check that all phase numbers in the milestone exist in ROADMAP.md',
                        'Verify ROADMAP.md is properly formatted',
                    ]);
            }
            // Check for incomplete phases and warn
            const incompletePhases = progress.phaseStatus.filter(p => p.status !== 'complete');
            // Format summary display
            const summaryDisplay = formatCompletionSummary(milestone, progress, args.verbose || false);
            // If phases are incomplete, show warning in summary
            if (incompletePhases.length > 0) {
                const incompleteList = incompletePhases.map(p => `Phase ${p.number} (${p.status})`).join(', ');
                // Show warning but still allow completion
                const warningDisplay = formatHeader(2, 'Warning: Incomplete Phases') + '\n\n' +
                    `The following phases are not complete: ${incompleteList}\n\n` +
                    'You can still complete the milestone, but this may indicate work is not finished.\n\n';
                // Without confirm flag, show summary and prompt
                if (!args.confirm) {
                    return warningDisplay +
                        summaryDisplay + '\n\n' +
                        formatBold('This will:') + '\n' +
                        formatList([
                            'Archive milestone to .planning/MILESTONE-ARCHIVE.md',
                            'Collapse phases to <details> section in ROADMAP.md',
                            'Update progress tracking',
                        ]) + '\n\n' +
                        formatBold('Confirm?') + ' Re-run with --confirm to proceed:\n' +
                        `/openpaul:complete-milestone --name "${milestone.name}" --confirm`;
                }
            }
            else {
                // All phases complete - standard flow
                if (!args.confirm) {
                    return summaryDisplay + '\n\n' +
                        formatBold('This will:') + '\n' +
                        formatList([
                            'Archive milestone to .planning/MILESTONE-ARCHIVE.md',
                            'Collapse phases to <details> section in ROADMAP.md',
                            'Update progress tracking',
                        ]) + '\n\n' +
                        formatBold('Confirm?') + ' Re-run with --confirm to proceed:\n' +
                        `/openpaul:complete-milestone --name "${milestone.name}" --confirm`;
                }
            }
            // Execute completion
            const archiveEntry = milestoneManager.completeMilestone(milestone.name);
            // Format success output
            return formatSuccessOutput(milestone, archiveEntry);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            // Handle specific error cases
            if (errorMessage.includes('not found')) {
                return formatHeader(2, 'Milestone Not Found') + '\n\n' +
                    errorMessage + '\n\n' +
                    formatBold('Troubleshooting:') + '\n' +
                    formatList([
                        'Check the milestone name in ROADMAP.md',
                        'Use /openpaul:status to see current milestone',
                    ]);
            }
            if (errorMessage.includes('already completed') || errorMessage.includes('already complete')) {
                return formatHeader(2, 'Milestone Already Completed') + '\n\n' +
                    errorMessage + '\n\n' +
                    formatBold('What to do:') + '\n' +
                    formatList([
                        'Check MILESTONE-ARCHIVE.md for the archived entry',
                        'Create a new milestone for the next phase of work',
                    ]);
            }
            return formatHeader(2, 'Completion Failed') + '\n\n' +
                `Failed to complete milestone: ${errorMessage}\n\n` +
                formatBold('Troubleshooting:') + '\n' +
                formatList([
                    'Ensure ROADMAP.md exists and is writable',
                    'Check that milestone name is correct',
                    'Verify milestone status is not already completed',
                    'Try running /openpaul:status to check current state',
                ]);
        }
    },
});
/**
 * Format completion summary before confirmation
 */
function formatCompletionSummary(milestone, progress, verbose) {
    const lines = [
        formatHeader(2, `Completing Milestone: ${milestone.name}`),
        '',
    ];
    // Primary metrics
    const percentage = progress.percentage;
    lines.push(formatBold('Phases:') + ` ${progress.phasesCompleted}/${progress.phasesTotal} complete (${percentage}%)`);
    // Detailed breakdown if verbose
    if (verbose) {
        lines.push('');
        lines.push(formatBold('Phase Details:'));
        for (const phase of progress.phaseStatus) {
            const statusIcon = phase.status === 'complete' ? '✅' :
                phase.status === 'in-progress' ? '🚧' : '📋';
            lines.push(`  ${statusIcon} Phase ${phase.number}: ${phase.status}`);
        }
    }
    // Scope reminder
    lines.push('');
    lines.push(formatBold('Scope:') + ' ' + milestone.scope);
    return lines.join('\n');
}
/**
 * Format success output after completion
 */
function formatSuccessOutput(milestone, archiveEntry) {
    const lines = [
        formatHeader(2, 'Milestone Completed'),
        '',
        formatBold('Milestone:') + ' ' + milestone.name,
        '',
        formatBold('Summary:'),
    ];
    // Metrics summary
    lines.push(`  - Phases: ${archiveEntry.phases.join(', ')}`);
    lines.push(`  - Plans Completed: ${archiveEntry.plansCompleted}/${archiveEntry.totalPlans}`);
    lines.push(`  - Execution Time: ${archiveEntry.executionTime}`);
    lines.push(`  - Requirements Addressed: ${archiveEntry.requirementsAddressed.length}`);
    lines.push('');
    lines.push(formatBold('Archive Location:'));
    lines.push('  .planning/MILESTONE-ARCHIVE.md');
    lines.push('');
    lines.push(formatBold('What happened:'));
    lines.push('  - Milestone archived to MILESTONE-ARCHIVE.md with metrics');
    lines.push('  - Phases collapsed to <details> section in ROADMAP.md');
    lines.push('  - Status updated to "shipped" in ROADMAP.md');
    lines.push('');
    lines.push(formatBold('Next Steps:'));
    lines.push('  - Review the archived milestone in MILESTONE-ARCHIVE.md');
    lines.push('  - Plan the next milestone with /openpaul:discuss-milestone');
    lines.push('  - Check current state with /openpaul:status');
    return lines.join('\n');
}
//# sourceMappingURL=complete-milestone.js.map