import { tool } from '@opencode-ai/plugin';
import { formatHeader, formatBold, formatList } from '../output/formatter';
/**
 * /openpaul:help Command
 *
 * Show command reference for all 26 commands
 *
 * From CONTEXT.md:
 * - Lists all commands grouped by phase
 * - Provides detailed help for specific commands
 * - Output includes 📚 emoji and usage examples
 */
export const openpaulHelp = tool({
    description: 'Show command reference',
    args: {
        command: tool.schema.string().optional().describe('Show help for specific command'),
    },
    execute: async ({ command }, context) => {
        // Command reference organized by phase
        const COMMAND_REFERENCE = {
            // Core commands (Phase 2)
            init: {
                description: 'Initialize OpenPAUL in the current project',
                usage: '/openpaul:init [--force]',
            },
            plan: {
                description: 'Create an executable plan with tasks',
                usage: '/openpaul:plan --phase N --plan NN --tasks [...]',
                phase: '2',
            },
            apply: {
                description: 'Execute the current plan',
                usage: '/openpaul:apply [--dry-run] [--task N]',
                phase: '2',
            },
            unify: {
                description: 'Close the loop and generate summary',
                usage: '/openpaul:unify [--status success|partial|failed]',
                phase: '2',
            },
            progress: {
                description: 'View current loop status and next action',
                usage: '/openpaul:progress [--verbose]',
            },
            help: {
                description: 'Show command reference',
                usage: '/openpaul:help [command]',
            },
            // Session Management commands (Phase 3)
            pause: {
                description: 'Create session handoff',
                usage: '/openpaul:pause',
                phase: '3',
            },
            resume: {
                description: 'Restore from paused session',
                usage: '/openpaul:resume',
                phase: '3',
            },
            handoff: {
                description: 'Generate comprehensive handoff document',
                usage: '/openpaul:handoff',
                phase: '3',
            },
            status: {
                description: '[DEPRECATED] Use /openpaul:progress instead',
                usage: '/openpaul:status',
                phase: '3',
            },
            // Milestone Management commands (Phase 5)
            milestone: {
                description: 'Create new milestone',
                usage: '/openpaul:milestone --name "..."',
                phase: '5',
            },
            'complete-milestone': {
                description: 'Mark milestone complete and archive',
                usage: '/openpaul:complete-milestone --id ...',
                phase: '5',
            },
            'discuss-milestone': {
                description: 'Plan upcoming milestone',
                usage: '/openpaul:discuss-milestone',
                phase: '5',
            },
            // Planning Support commands (Phase 6)
            discuss: {
                description: 'Capture planning discussion',
                usage: '/openpaul:discuss --topic "..."',
                phase: '6',
            },
            assumptions: {
                description: 'Review intended approach',
                usage: '/openpaul:assumptions',
                phase: '6',
            },
            discover: {
                description: 'Explore options',
                usage: '/openpaul:discover --query "..."',
                phase: '6',
            },
            'consider-issues': {
                description: 'Triage deferred issues',
                usage: '/openpaul:consider-issues',
                phase: '6',
            },
            // Research & Quality commands (Phase 7)
            research: {
                description: 'Deploy research agents',
                usage: '/openpaul:research --question "..."',
                phase: '7',
            },
            'research-phase': {
                description: 'Research phase unknowns',
                usage: '/openpaul:research-phase --phase N',
                phase: '7',
            },
            verify: {
                description: 'Verify acceptance criteria',
                usage: '/openpaul:verify',
                phase: '7',
            },
            'plan-fix': {
                description: 'Plan UAT fixes',
                usage: '/openpaul:plan-fix',
                phase: '7',
            },
            // Roadmap & Configuration commands (Phase 8)
            'add-phase': {
                description: 'Append new phase to roadmap',
                usage: '/openpaul:add-phase --name "..."',
                phase: '8',
            },
            'remove-phase': {
                description: 'Remove future phase',
                usage: '/openpaul:remove-phase --phase N',
                phase: '8',
            },
            flows: {
                description: 'Configure skill requirements',
                usage: '/openpaul:flows',
                phase: '8',
            },
            config: {
                description: 'View/modify settings',
                usage: '/openpaul:config',
                phase: '8',
            },
        };
        // If specific command requested, show detailed help
        if (command) {
            const cmdInfo = COMMAND_REFERENCE[command.toLowerCase()];
            if (!cmdInfo) {
                return formatHeader(2, '❓ Unknown Command') + '\n\n' +
                    `Unknown command: ${command}\n\n` +
                    formatBold('Available commands:') + '\n' +
                    formatList(Object.keys(COMMAND_REFERENCE)) + '\n' +
                    'Run `/openpaul:help` to see all commands';
            }
            let output = formatHeader(1, `📖 Command: /openpaul:${command}`) + '\n\n';
            output += formatBold('Description:') + ` ${cmdInfo.description}\n`;
            output += formatBold('Usage:') + ` \`${cmdInfo.usage}\`\n`;
            if (cmdInfo.phase) {
                output += formatBold('Phase:') + ` ${cmdInfo.phase}\n`;
            }
            output += '\n' + formatBold('Tip:') + ' Run `/openpaul:help` to see all commands.';
            return output;
        }
        // Show all commands grouped by phase
        let output = formatHeader(1, '📚 OpenPAUL Command Reference') + '\n\n';
        // Core commands (no phase property)
        output += '\n' + formatHeader(2, 'Core Commands') + '\n';
        const coreCommands = Object.entries(COMMAND_REFERENCE)
            .filter(([, cmd]) => !cmd.phase)
            .map(([name, { description, usage }]) => {
            return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``;
        })
            .join('\n');
        output += coreCommands;
        // Core loop commands (Phase 2)
        output += '\n' + formatHeader(2, 'Core Loop Commands (Phase 2)') + '\n';
        const phase2Commands = Object.entries(COMMAND_REFERENCE)
            .filter(([, cmd]) => cmd.phase === '2')
            .map(([name, { description, usage }]) => {
            return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``;
        })
            .join('\n');
        output += phase2Commands;
        // Session Management commands (Phase 3)
        output += '\n' + formatHeader(2, 'Session Management (Phase 3)') + '\n';
        const sessionCommands = Object.entries(COMMAND_REFERENCE)
            .filter(([, cmd]) => cmd.phase === '3')
            .map(([name, { description, usage }]) => {
            return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``;
        })
            .join('\n');
        output += sessionCommands;
        // Project Management commands (Phase 4)
        output += '\n' + formatHeader(2, 'Project Management (Phase 4)') + '\n';
        const projectCommands = Object.entries(COMMAND_REFERENCE)
            .filter(([, cmd]) => cmd.phase === '4')
            .map(([name, { description, usage }]) => {
            return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``;
        })
            .join('\n');
        output += projectCommands;
        // Planning Support commands (Phase 5)
        output += '\n' + formatHeader(2, 'Planning Support (Phase 5)') + '\n';
        const planningCommands = Object.entries(COMMAND_REFERENCE)
            .filter(([, cmd]) => cmd.phase === '5')
            .map(([name, { description, usage }]) => {
            return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``;
        })
            .join('\n');
        output += planningCommands;
        // Research & Quality commands (Phase 6)
        output += '\n' + formatHeader(2, 'Research & Quality (Phase 6)') + '\n';
        const researchCommands = Object.entries(COMMAND_REFERENCE)
            .filter(([, cmd]) => cmd.phase === '6')
            .map(([name, { description, usage }]) => {
            return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``;
        })
            .join('\n');
        output += researchCommands;
        // Roadmap & Configuration commands (Phase 7)
        output += '\n' + formatHeader(2, 'Roadmap & Configuration (Phase 7)') + '\n';
        const roadmapCommands = Object.entries(COMMAND_REFERENCE)
            .filter(([, cmd]) => cmd.phase === '7')
            .map(([name, { description, usage }]) => {
            return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``;
        })
            .join('\n');
        output += roadmapCommands;
        output += '\n\n' + formatBold('Tip:') + ' Run `/openpaul:help {command}` for detailed usage.';
        return output;
    },
});
//# sourceMappingURL=help.js.map