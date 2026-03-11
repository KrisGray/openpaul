import { tool } from '@opencode-ai/plugin'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import type { CommandType } from '../types/command'

/**
 * /paul:help Command
 * 
 * Show command reference for all 26 commands
 * 
 * From CONTEXT.md:
 * - Lists all commands grouped by phase
 * - Provides detailed help for specific commands
 * - Output includes 📚 emoji and usage examples
 */
export const paulHelp = tool({
  description: 'Show command reference',
  args: {
    command: tool.schema.string().optional().describe('Show help for specific command'),
  },
  execute: async ({ command }, context) => {
    // Command reference organized by phase
    const COMMAND_REFERENCE: Record<string, { description: string; usage: string; phase?: string }> = {
      // Core commands (Phase 2)
      init: {
        description: 'Initialize OpenPAUL in the current project',
        usage: '/paul:init [--force]',
      },
      plan: {
        description: 'Create an executable plan with tasks',
        usage: '/paul:plan --phase N --plan NN --tasks [...]',
        phase: '2',
      },
      apply: {
        description: 'Execute the current plan',
        usage: '/paul:apply [--dry-run] [--task N]',
        phase: '2',
      },
      unify: {
        description: 'Close the loop and generate summary',
        usage: '/paul:unify [--status success|partial|failed]',
        phase: '2',
      },
      progress: {
        description: 'View current loop status and next action',
        usage: '/paul:progress [--verbose]',
      },
      help: {
        description: 'Show command reference',
        usage: '/paul:help [command]',
      },
      // Session Management commands (Phase 3)
      pause: {
        description: 'Create session handoff',
        usage: '/paul:pause',
        phase: '3',
      },
      resume: {
        description: 'Restore from paused session',
        usage: '/paul:resume',
        phase: '3',
      },
      handoff: {
        description: 'Generate comprehensive handoff document',
        usage: '/paul:handoff',
        phase: '3',
      },
      status: {
        description: '[DEPRECATED] Use /paul:progress instead',
        usage: '/paul:status',
        phase: '3',
      },
      // Milestone Management commands (Phase 5)
      milestone: {
        description: 'Create new milestone',
        usage: '/paul:milestone --name "..."',
        phase: '5',
      },
      'complete-milestone': {
        description: 'Mark milestone complete and archive',
        usage: '/paul:complete-milestone --id ...',
        phase: '5',
      },
      'discuss-milestone': {
        description: 'Plan upcoming milestone',
        usage: '/paul:discuss-milestone',
        phase: '5',
      },
      // Planning Support commands (Phase 6)
      discuss: {
        description: 'Capture planning discussion',
        usage: '/paul:discuss --topic "..."',
        phase: '6',
      },
      assumptions: {
        description: 'Review intended approach',
        usage: '/paul:assumptions',
        phase: '6',
      },
      discover: {
        description: 'Explore options',
        usage: '/paul:discover --query "..."',
        phase: '6',
      },
      'consider-issues': {
        description: 'Triage deferred issues',
        usage: '/paul:consider-issues',
        phase: '6',
      },
      // Research & Quality commands (Phase 7)
      research: {
        description: 'Deploy research agents',
        usage: '/paul:research --question "..."',
        phase: '7',
      },
      'research-phase': {
        description: 'Research phase unknowns',
        usage: '/paul:research-phase --phase N',
        phase: '7',
      },
      verify: {
        description: 'Verify acceptance criteria',
        usage: '/paul:verify',
        phase: '7',
      },
      'plan-fix': {
        description: 'Plan UAT fixes',
        usage: '/paul:plan-fix',
        phase: '7',
      },
      // Roadmap & Configuration commands (Phase 8)
      'add-phase': {
        description: 'Append new phase to roadmap',
        usage: '/paul:add-phase --name "..."',
        phase: '8',
      },
      'remove-phase': {
        description: 'Remove future phase',
        usage: '/paul:remove-phase --phase N',
        phase: '8',
      },
      flows: {
        description: 'Configure skill requirements',
        usage: '/paul:flows',
        phase: '8',
      },
      config: {
        description: 'View/modify settings',
        usage: '/paul:config',
        phase: '8',
      },
    }

    // If specific command requested, show detailed help
    if (command) {
      const cmdInfo = COMMAND_REFERENCE[command.toLowerCase()]
      if (!cmdInfo) {
        return formatHeader(2, '❓ Unknown Command') + '\n\n' +
          `Unknown command: ${command}\n\n` +
          formatBold('Available commands:') + '\n' +
          formatList(Object.keys(COMMAND_REFERENCE)) + '\n' +
          'Run `/paul:help` to see all commands'
      }

      let output = formatHeader(1, `📖 Command: /paul:${command}`) + '\n\n'
      output += formatBold('Description:') + ` ${cmdInfo.description}\n`
      output += formatBold('Usage:') + ` \`${cmdInfo.usage}\`\n`
      if (cmdInfo.phase) {
        output += formatBold('Phase:') + ` ${cmdInfo.phase}\n`
      }
      output += '\n' + formatBold('Tip:') + ' Run `/paul:help` to see all commands.'
      return output
    }
    // Show all commands grouped by phase
    let output = formatHeader(1, '📚 OpenPAUL Command Reference') + '\n\n'
    // Core commands (no phase property)
    output += '\n' + formatHeader(2, 'Core Commands') + '\n'
    const coreCommands = Object.entries(COMMAND_REFERENCE)
      .filter(([, cmd]) => !cmd.phase)
      .map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      })
      .join('\n')
    output += coreCommands
    // Core loop commands (Phase 2)
    output += '\n' + formatHeader(2, 'Core Loop Commands (Phase 2)') + '\n'
    const phase2Commands = Object.entries(COMMAND_REFERENCE)
      .filter(([, cmd]) => cmd.phase === '2')
      .map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      })
      .join('\n')
    output += phase2Commands
    // Session Management commands (Phase 3)
    output += '\n' + formatHeader(2, 'Session Management (Phase 3)') + '\n'
    const sessionCommands = Object.entries(COMMAND_REFERENCE)
      .filter(([, cmd]) => cmd.phase === '3')
      .map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      })
      .join('\n')
    output += sessionCommands
    // Project Management commands (Phase 4)
    output += '\n' + formatHeader(2, 'Project Management (Phase 4)') + '\n'
    const projectCommands = Object.entries(COMMAND_REFERENCE)
      .filter(([, cmd]) => cmd.phase === '4')
      .map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      })
      .join('\n')
    output += projectCommands
    // Planning Support commands (Phase 5)
    output += '\n' + formatHeader(2, 'Planning Support (Phase 5)') + '\n'
    const planningCommands = Object.entries(COMMAND_REFERENCE)
      .filter(([, cmd]) => cmd.phase === '5')
      .map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      })
      .join('\n')
    output += planningCommands
    // Research & Quality commands (Phase 6)
    output += '\n' + formatHeader(2, 'Research & Quality (Phase 6)') + '\n'
    const researchCommands = Object.entries(COMMAND_REFERENCE)
      .filter(([, cmd]) => cmd.phase === '6')
      .map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      })
      .join('\n')
    output += researchCommands
    // Roadmap & Configuration commands (Phase 7)
    output += '\n' + formatHeader(2, 'Roadmap & Configuration (Phase 7)') + '\n'
    const roadmapCommands = Object.entries(COMMAND_REFERENCE)
      .filter(([, cmd]) => cmd.phase === '7')
      .map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      })
      .join('\n')
    output += roadmapCommands
    output += '\n\n' + formatBold('Tip:') + ' Run `/paul:help {command}` for detailed usage.'
    return output
  },
})
