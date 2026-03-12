import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrePlanningManager } from '../storage/pre-planning-manager';
import { formatHeader, formatList, formatBold } from '../output/formatter';
import { atomicWrite } from '../storage/atomic-writes';
const toolFactory = tool;
export const openpaulAssumptions = toolFactory({
    name: 'openpaul:assumptions',
    description: 'Capture and validate project assumptions',
    parameters: z.object({
        phase: z.number().int().positive().describe('Phase number'),
        assumptions: z.string().min(1).describe('Comma-separated assumption statements'),
        statuses: z.string().optional().describe('Comma-separated validation statuses (default: unvalidated)'),
        confidences: z.string().optional().describe('Comma-separated confidence levels (default: medium)'),
        impacts: z.string().optional().describe('Comma-separated impact descriptions'),
        append: z.boolean().optional().describe('Append to existing file'),
        overwrite: z.boolean().optional().describe('Overwrite existing file'),
    }),
    execute: async (args, context) => {
        try {
            const manager = new PrePlanningManager(context.directory);
            const phaseDir = manager.resolvePhaseDir(args.phase);
            if (!phaseDir) {
                return formatHeader(2, '\u274C Cannot Create Assumptions') + '\n\n' +
                    `Phase ${args.phase} directory not found.\n\n` +
                    formatBold('Next Steps:') + '\n' +
                    formatList(['Run /openpaul:init to initialize the project']);
            }
            const assumptionsPath = join(phaseDir, 'ASSUMPTIONS.md');
            if (existsSync(assumptionsPath) && !args.overwrite && !args.append) {
                return formatHeader(2, '\u26A0\uFE0F Assumptions Already Exist') + '\n\n' +
                    `ASSUMPTIONS.md already exists for phase ${args.phase}.\n\n` +
                    formatBold('Options:') + '\n' +
                    formatList([
                        'Run with --overwrite to replace',
                        'Run with --append to add more',
                    ]);
            }
            const assumptionStatements = args.assumptions.split(',').map((s) => s.trim()).filter(Boolean);
            const statusValues = args.statuses
                ? args.statuses.split(',').map((s) => s.trim())
                : [];
            const confidenceValues = args.confidences
                ? args.confidences.split(',').map((c) => c.trim())
                : [];
            const impactValues = args.impacts
                ? args.impacts.split(',').map((i) => i.trim())
                : [];
            const validStatuses = ['unvalidated', 'validated', 'invalidated'];
            const validConfidences = ['high', 'medium', 'low'];
            const entries = assumptionStatements.map((statement, i) => {
                const status = statusValues[i] || 'unvalidated';
                const confidence = confidenceValues[i] || 'medium';
                return {
                    statement,
                    validation_status: validStatuses.includes(status) ? status : 'unvalidated',
                    confidence: validConfidences.includes(confidence) ? confidence : 'medium',
                    impact: impactValues[i] || 'Impact not specified',
                };
            });
            const content = manager.createAssumptions(args.phase, entries);
            await atomicWrite(assumptionsPath, content);
            const statusCounts = {
                unvalidated: 0,
                validated: 0,
                invalidated: 0,
            };
            entries.forEach((e) => statusCounts[e.validation_status]++);
            let output = formatHeader(2, '\u2705 Assumptions Captured') + '\n\n';
            output += formatBold('Phase:') + ` ${args.phase}\n`;
            output += formatBold('File:') + ` ${assumptionsPath}\n`;
            output += formatBold('Count:') + ` ${entries.length} assumptions\n\n`;
            output += formatBold('By Status:') + '\n';
            output += formatList([
                `Unvalidated: ${statusCounts.unvalidated}`,
                `Validated: ${statusCounts.validated}`,
                `Invalidated: ${statusCounts.invalidated}`,
            ]);
            return output;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, '\u274C Assumptions Creation Failed') + '\n\n' +
                `Failed to create assumptions: ${errorMessage}\n\n` +
                formatBold('Troubleshooting:') + '\n' +
                formatList([
                    'Ensure valid validation statuses (unvalidated, validated, invalidated)',
                    'Ensure valid confidence levels (high, medium, low)',
                ]);
        }
    },
});
//# sourceMappingURL=assumptions.js.map