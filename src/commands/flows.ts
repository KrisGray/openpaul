import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { FlowsManager } from '../storage/flows-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import { existsSync } from 'fs'
import { join } from 'path'

export const openpaulFlows: ToolDefinition = tool({
  description: 'Manage special flows (list/enable/disable/init)',
  args: {
    action: tool.schema.enum(['list', 'enable', 'disable', 'init']).optional().describe('Flow action: list, enable, disable, init'),
    name: tool.schema.string().optional().describe('Flow name to enable or disable'),
  },
  execute: async ({ action = 'list', name }, context) => {
    try {
      const flowsDir = join(context.directory, '.openpaul')
      
      switch (action) {
        case 'init': {
          const flowsPath = FlowsManager.init(context.directory)
          return formatHeader(2, '⚡ Flows Initialized') + '\n\n' +
            formatBold('Flows file:') + ` ${flowsPath}\n\n` +
            'Run `/openpaul:flows action=list` to view flows.'
        }

        case 'list': {
          if (!existsSync(join(flowsDir, 'SPECIAL-FLOWS.md'))) {
            return formatHeader(2, '🌊 Special Flows') + '\n\n' +
              formatBold('Status:') + ' Not initialized\n\n' +
              'Run `/openpaul:flows action=init` to create flows file.'
          }

          const flowsManager = new FlowsManager(context.directory)
          const { enabled, disabled } = flowsManager.list()
          const enabledList = enabled.length > 0 ? formatList(enabled) : '- None'
          const disabledList = disabled.length > 0 ? formatList(disabled) : '- None'

          return formatHeader(2, '🌊 Special Flows') + '\n\n' +
            formatBold('Enabled:') + '\n' +
            `${enabledList}\n\n` +
            formatBold('Disabled:') + '\n' +
            `${disabledList}\n`
        }

        case 'enable': {
          if (!name) {
            return 'Error: --name required for enable action'
          }

          if (!existsSync(join(flowsDir, 'SPECIAL-FLOWS.md'))) {
            return 'Error: Flows not initialized. Run `/openpaul:flows action=init` first.'
          }

          const flowsManager = new FlowsManager(context.directory)
          flowsManager.enable(name)

          return formatHeader(2, '⚡ Flow Enabled') + '\n\n' +
            formatBold('Flow:') + ` ${name}\n\n` +
            'Run `/openpaul:flows action=list` to verify.'
        }

        case 'disable': {
          if (!name) {
            return 'Error: --name required for disable action'
          }

          if (!existsSync(join(flowsDir, 'SPECIAL-FLOWS.md'))) {
            return 'Error: Flows not initialized. Run `/openpaul:flows action=init` first.'
          }

          const flowsManager = new FlowsManager(context.directory)
          flowsManager.disable(name)

          return formatHeader(2, '⚡ Flow Disabled') + '\n\n' +
            formatBold('Flow:') + ` ${name}\n\n` +
            'Run `/openpaul:flows action=list` to verify.'
        }

        default:
          return 'Unknown action. Use: list, enable, disable, init'
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Flows Error') + '\n\n' +
        `Failed to ${action} flows: ${errorMessage}`
    }
  },
})
