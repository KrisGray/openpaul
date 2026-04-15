import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import type { CommandType } from '../types/command'

/**
 * /openpaul:help Command
 * 
 * Show command reference for all registered commands
 * 
 * From CONTEXT.md:
 * - Lists all commands grouped by phase
 * - Provides detailed help for specific commands
 * - Output includes usage examples
 */
export const openpaulHelp: ToolDefinition = tool({
  description: 'Show command reference',
  args: {
    command: tool.schema.string().optional().describe('Show help for specific command'),
  },
  execute: async ({ command }, context) => {
    const COMMAND_REFERENCE: Record<string, { description: string; usage: string; phase?: string }> = {
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
      pause: {
        description: 'Create session handoff',
        usage: '/openpaul:pause [--onUnsavedChanges commit|save|discard|abort]',
        phase: '3',
      },
      resume: {
        description: 'Restore from paused session',
        usage: '/openpaul:resume [--confirm]',
        phase: '3',
      },
      handoff: {
        description: 'Generate comprehensive handoff document',
        usage: '/openpaul:handoff',
        phase: '3',
      },
      milestone: {
        description: 'Create new milestone',
        usage: '/openpaul:milestone --name "..."',
        phase: '5',
      },
      'complete-milestone': {
        description: 'Mark milestone complete and archive',
        usage: '/openpaul:complete-milestone [--confirm] [--name "..."]',
        phase: '5',
      },
      verify: {
        description: 'Verify acceptance criteria',
        usage: '/openpaul:verify --phase N [--item N --result pass|fail|skip]',
        phase: '7',
      },
      'plan-fix': {
        description: 'Plan UAT fixes',
        usage: '/openpaul:plan-fix --phase N [--issue N] [--execute] [--confirm]',
        phase: '7',
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
      'map-codebase': {
        description: 'Generate codebase map for context',
        usage: '/openpaul:map-codebase',
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
          'Run `/openpaul:help` to see all commands'
      }

      let output = formatHeader(1, `📖 Command: /openpaul:${command}`) + '\n\n'
      output += formatBold('Description:') + ` ${cmdInfo.description}\n`
      output += formatBold('Usage:') + ` \`${cmdInfo.usage}\`\n`
      if (cmdInfo.phase) {
        output += formatBold('Phase:') + ` ${cmdInfo.phase}\n`
      }
      output += '\n' + formatBold('Tip:') + ' Run `/openpaul:help` to see all commands.'
      return output
    }
    // Show all commands grouped by phase
    const phaseSections: Array<{ title: string; phase: string | undefined }> = [
      { title: 'Core Commands', phase: undefined },
      { title: 'Core Loop Commands', phase: '2' },
      { title: 'Session Management', phase: '3' },
      { title: 'Milestones', phase: '5' },
      { title: 'Quality & Verification', phase: '7' },
      { title: 'Configuration', phase: '8' },
    ]

    let output = formatHeader(1, '📚 OpenPAUL Command Reference') + '\n'

    for (const section of phaseSections) {
      const commands = Object.entries(COMMAND_REFERENCE)
        .filter(([, cmd]) => cmd.phase === section.phase)
      if (commands.length === 0) continue
      output += '\n' + formatHeader(2, section.title) + '\n'
      output += commands.map(([name, { description, usage }]) => {
        return `- **/${name}** — ${description}\n  - Usage: \`${usage}\``
      }).join('\n')
    }

    output += '\n\n' + formatBold('Tip:') + ' Run `/openpaul:help {command}` for detailed usage.'
    return output
  },
})
