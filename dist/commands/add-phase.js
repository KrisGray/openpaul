import { tool } from '@opencode-ai/plugin';
import { RoadmapManager } from '../roadmap/roadmap-manager';
import { formatHeader, formatBold, formatList } from '../output/formatter';
/**
 * /openpaul:add-phase Command
 *
 * Add a new phase to the roadmap at a specified position.
 *
 * From CONTEXT.md:
 * - Name is required argument
 * - Position specified with --after or --before flags
 * - Directory name auto-generated
 * - Brief success output only
 */
export const openpaulAddPhase = tool({
    description: 'Add a new phase to the roadmap at a specified position',
    args: {
        name: tool.schema.string().describe('Phase name'),
        after: tool.schema.number().optional().describe('Insert after this phase number'),
        before: tool.schema.number().optional().describe('Insert before this phase number'),
    },
    execute: async ({ name, after, before }, context) => {
        try {
            // Validate inputs
            const hasAfter = after !== undefined;
            const hasBefore = before !== undefined;
            // Must have exactly one position flag
            if (!hasAfter && !hasBefore) {
                return formatHeader(2, '❌ Invalid Arguments') + '\n\n' +
                    'Exactly one of --after or --before must be provided.\n\n' +
                    formatBold('Usage:') + '\n' +
                    formatList([
                        '/openpaul:add-phase "Search feature" --after 4',
                        '/openpaul:add-phase "Auth module" --before 6',
                    ]);
            }
            if (hasAfter && hasBefore) {
                return formatHeader(2, '❌ Invalid Arguments') + '\n\n' +
                    'Cannot specify both --after and --before. Choose one.\n\n' +
                    formatBold('Usage:') + '\n' +
                    formatList([
                        '/openpaul:add-phase "Search feature" --after 4',
                        '/openpaul:add-phase "Auth module" --before 6',
                    ]);
            }
            // Validate name is non-empty
            if (!name || name.trim().length === 0) {
                return formatHeader(2, '❌ Invalid Arguments') + '\n\n' +
                    'Phase name cannot be empty.\n\n' +
                    formatBold('Usage:') + '\n' +
                    formatList([
                        '/openpaul:add-phase "Search feature" --after 4',
                    ]);
            }
            // Create roadmap manager and check ROADMAP.md exists
            const roadmapManager = new RoadmapManager(context.directory);
            const roadmapPath = roadmapManager.resolveRoadmapPath();
            if (!roadmapPath) {
                return formatHeader(2, '❌ ROADMAP.md Not Found') + '\n\n' +
                    'ROADMAP.md not found. Run /openpaul:init first.\n\n' +
                    formatBold('Troubleshooting:') + '\n' +
                    formatList([
                        'Ensure you are in a project with OpenPAUL initialized',
                        'Run /openpaul:init to set up the project',
                        'Check that .paul/ROADMAP.md or .openpaul/ROADMAP.md exists',
                    ]);
            }
            // Build options for addPhase
            const options = {
                name: name.trim(),
                position: hasAfter ? 'after' : 'before',
                referencePhase: hasAfter ? after : before,
            };
            // Add the phase
            const newPhase = roadmapManager.addPhase(options);
            // Return brief success message
            return formatHeader(2, '✅ Phase Added') + '\n\n' +
                `Added phase ${newPhase.number}: ${newPhase.name}\n\n` +
                formatBold('Directory:') + ` .paul/phases/${newPhase.directoryName}/`;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, '❌ Add Phase Failed') + '\n\n' +
                `Failed to add phase: ${errorMessage}\n\n` +
                formatBold('Troubleshooting:') + '\n' +
                formatList([
                    'Ensure ROADMAP.md exists and is valid',
                    'Check that the reference phase number is valid',
                    'Verify you have write permissions',
                    'Ensure the phase name does not contain special characters',
                ]);
        }
    },
});
//# sourceMappingURL=add-phase.js.map