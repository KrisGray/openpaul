import { tool } from '@opencode-ai/plugin';
import { existsSync } from 'fs';
import { join } from 'path';
import { RoadmapManager } from '../roadmap/roadmap-manager';
import { formatHeader, formatBold, formatList } from '../output/formatter';
/**
 * /paul:remove-phase Command
 *
 * Remove a phase from the roadmap with automatic renumbering of subsequent phases.
 *
 * From CONTEXT.md locked decisions:
 * - Cannot remove completed phases
 * - Cannot remove current phase from STATE.md
 * - Cannot remove phase with in-progress plans
 * - All phase artifacts deleted on removal
 * - Renumbering only affects ROADMAP.md
 * - No --force override
 */
export const paulRemovePhase = tool({
    description: 'Remove a phase from the roadmap with automatic renumbering',
    args: {
        phase: tool.schema.number().describe('Phase number to remove'),
    },
    execute: async ({ phase }, context) => {
        try {
            const roadmapManager = new RoadmapManager(context.directory);
            // Check ROADMAP.md exists
            const roadmapPath = roadmapManager.resolveRoadmapPath();
            if (!roadmapPath) {
                return formatHeader(2, 'Cannot Remove Phase') + '\n\n' +
                    'ROADMAP.md not found. Run /openpaul:init first.\n\n' +
                    formatBold('What to do:') + '\n' +
                    formatList([
                        'Run `/openpaul:init` to initialize OpenPAUL',
                        'Or create a ROADMAP.md file in .paul/ or .openpaul/ directory',
                    ]);
            }
            // Determine STATE.md path (.paul/STATE.md or .openpaul/STATE.md)
            const paulStatePath = join(context.directory, '.paul', 'STATE.md');
            const openpaulStatePath = join(context.directory, '.openpaul', 'STATE.md');
            let statePath;
            if (existsSync(paulStatePath)) {
                statePath = paulStatePath;
            }
            else if (existsSync(openpaulStatePath)) {
                statePath = openpaulStatePath;
            }
            else {
                // Default to .paul for error message purposes
                statePath = paulStatePath;
            }
            // Validate removal safety
            const validation = roadmapManager.canRemovePhase(phase, statePath);
            if (!validation.valid) {
                return formatHeader(2, 'Cannot Remove Phase') + '\n\n' +
                    `Phase ${phase} cannot be removed:\n\n` +
                    formatList(validation.errors) + '\n\n' +
                    formatBold('Why this is blocked:') + '\n' +
                    formatList([
                        'Completed phases are preserved for historical accuracy',
                        'Current phase must be completed or skipped first',
                        'In-progress phases may contain important work',
                    ]);
            }
            // Execute removal
            const result = roadmapManager.removePhase(phase);
            if (!result.success) {
                return formatHeader(2, 'Removal Failed') + '\n\n' +
                    `Failed to remove phase ${phase}.\n\n` +
                    formatBold('Troubleshooting:') + '\n' +
                    formatList([
                        'Check that ROADMAP.md is not read-only',
                        'Ensure you have write permissions',
                        'Verify the phase exists in ROADMAP.md',
                    ]);
            }
            // Format success message
            let output = formatHeader(2, 'Phase Removed') + '\n\n';
            output += `Removed phase ${phase}`;
            if (result.renumberedPhases.length > 0) {
                output += ` (${result.renumberedPhases.length} subsequent phases renumbered)`;
            }
            output += '\n\n' + formatBold('Next steps:') + '\n' +
                formatList([
                    'Review ROADMAP.md to verify phase ordering',
                    'Update any phase references in your documentation',
                    'Run `/openpaul:status` to check current position',
                ]);
            return output;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, 'Removal Failed') + '\n\n' +
                `Failed to remove phase: ${errorMessage}\n\n` +
                formatBold('Troubleshooting:') + '\n' +
                formatList([
                    'Check that ROADMAP.md exists and is readable',
                    'Ensure phase number is valid',
                    'Try running /openpaul:status to check current state',
                ]);
        }
    },
});
//# sourceMappingURL=remove-phase.js.map