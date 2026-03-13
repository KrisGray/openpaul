import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { FlowsManager } from '../storage/flows-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import { existsSync } from 'fs'
import { join } from 'path'

const FLOWS_FILENAME = 'SPECIAL-FLOWS.md'
const FLOWS_DIRNAME = '.openpaul'

const getFlowsPath = (flowsDir: string) => join(flowsDir, FLOWS_FILENAME)

const getMissingNameMessage = (action: 'enable' | 'disable') =>
  `Error: --name required for ${action} action`

const getNotInitializedMessage = () =>
  formatHeader(2, '🌊 Special Flows') + '\n\n' +
  formatBold('Status:') + ' Not initialized\n\n' +
  'Run `/openpaul:flows action=init` to create flows file.'

const getFlowStatusMessage = (title: string, name: string) =>
  formatHeader(2, title) + '\n\n' +
  formatBold('Flow:') + ` ${name}\n\n` +
  'Run `/openpaul:flows action=list` to verify.'

export const openpaulFlows: ToolDefinition = tool({
  description: 'Manage special flows (list/enable/disable/init)',
  args: {
    action: tool.schema.enum(['list', 'enable', 'disable', 'init']).optional().describe('Flow action: list, enable, disable, init'),
    name: tool.schema.string().optional().describe('Flow name to enable or disable'),
  },
  execute: async ({ action = 'list', name }, context) => {
    try {
      const flowsDir = join(context.directory, FLOWS_DIRNAME)
      const flowsPath = getFlowsPath(flowsDir)
       
      switch (action) {
        case 'init': {
          const flowsPath = FlowsManager.init(context.directory)
          return formatHeader(2, '⚡ Flows Initialized') + '\n\n' +
            formatBold('Flows file:') + ` ${flowsPath}\n\n` +
            'Run `/openpaul:flows action=list` to view flows.'
        }

        case 'list': {
          if (!existsSync(flowsPath)) {
            return getNotInitializedMessage()
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
            return getMissingNameMessage('enable')
          }

          if (!existsSync(flowsPath)) {
            return 'Error: Flows not initialized. Run `/openpaul:flows action=init` first.'
          }

          const flowsManager = new FlowsManager(context.directory)
          flowsManager.enable(name)

          return getFlowStatusMessage('⚡ Flow Enabled', name)
        }

        case 'disable': {
          if (!name) {
            return getMissingNameMessage('disable')
          }

          if (!existsSync(flowsPath)) {
            return 'Error: Flows not initialized. Run `/openpaul:flows action=init` first.'
          }

          const flowsManager = new FlowsManager(context.directory)
          flowsManager.disable(name)

          return getFlowStatusMessage('⚡ Flow Disabled', name)
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
