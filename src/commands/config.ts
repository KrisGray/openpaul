import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { ConfigManager } from '../storage/config-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import { existsSync } from 'fs'
import { join } from 'path'

export const paulConfig: ToolDefinition = tool({
  description: 'Manage project configuration (init/list/get/set)',
  args: {
    action: tool.schema.enum(['init', 'list', 'get', 'set']).optional().describe('Config action: init, list, get, set'),
    key: tool.schema.string().optional().describe('Config key to get or set (e.g., "project.name")'),
    value: tool.schema.string().optional().describe('Value to set for the key'),
  },
  execute: async ({ action = 'list', key, value }, context) => {
    try {
      const configDir = join(context.directory, '.openpaul')
      
      switch (action) {
        case 'init': {
          const configPath = ConfigManager.init(context.directory)
          return formatHeader(2, '⚡ Config Initialized') + '\n\n' +
            formatBold('Config file:') + ` ${configPath}\n\n` +
            'Run `/openpaul:config action=list` to view configuration.'
        }

        case 'list': {
          if (!existsSync(join(configDir, 'config.md'))) {
            return formatHeader(2, '📋 Configuration') + '\n\n' +
              formatBold('Status:') + ' Not initialized\n\n' +
              'Run `/openpaul:config action=init` to create config file.'
          }

          const configManager = new ConfigManager(context.directory)
          const config = configManager.load()

          let output = formatHeader(2, '📋 Configuration') + '\n\n'
          output += formatBold('Version:') + ` ${config.version}\n\n`
          
          output += formatHeader(3, 'Project') + '\n'
          output += formatBold('Name:') + ` ${config.project.name}\n`
          if (config.project.description) {
            output += formatBold('Description:') + ` ${config.project.description}\n`
          }
          output += '\n'

          if (config.preferences) {
            output += formatHeader(3, 'Preferences') + '\n'
            if (config.preferences.autoAdvance !== undefined) {
              output += formatBold('Auto Advance:') + ` ${config.preferences.autoAdvance}\n`
            }
            if (config.preferences.parallelization !== undefined) {
              output += formatBold('Parallelization:') + ` ${config.preferences.parallelization}\n`
            }
            if (config.preferences.verbose !== undefined) {
              output += formatBold('Verbose:') + ` ${config.preferences.verbose}\n`
            }
            output += '\n'
          }

          if (config.integrations && Object.keys(config.integrations).length > 0) {
            output += formatHeader(3, 'Integrations') + '\n'
            for (const [name, integration] of Object.entries(config.integrations)) {
              output += formatBold(`${name}:`) + ' configured\n'
            }
            output += '\n'
          }

          if (config.flows && Object.keys(config.flows).length > 0) {
            output += formatHeader(3, 'Flows') + '\n'
            for (const [name, flow] of Object.entries(config.flows)) {
              output += `${name}: ${flow.enabled ? '✓' : '○'}\n`
            }
            output += '\n'
          }

          return output
        }

        case 'get': {
          if (!key) {
            return 'Error: --key required for get action'
          }

          if (!existsSync(join(configDir, 'config.md'))) {
            return 'Error: Config not initialized. Run `/openpaul:config action=init` first.'
          }

          const configManager = new ConfigManager(context.directory)
          const value = configManager.get(key)

          if (value === undefined) {
            return `Config key "${key}" not found.`
          }

          return `${key}: ${JSON.stringify(value, null, 2)}`
        }

        case 'set': {
          if (!key || value === undefined) {
            return 'Error: Both --key and --value required for set action'
          }

          if (!existsSync(join(configDir, 'config.md'))) {
            return 'Error: Config not initialized. Run `/openpaul:config action=init` first.'
          }

          const configManager = new ConfigManager(context.directory)
          
          let parsedValue: unknown = value
          try {
            parsedValue = JSON.parse(value)
          } catch {
            parsedValue = value
          }
          
          configManager.set(key, parsedValue)
          
          return formatHeader(2, '⚡ Config Updated') + '\n\n' +
            formatBold('Key:') + ` ${key}\n` +
            formatBold('Value:') + ` ${JSON.stringify(parsedValue)}\n\n` +
            'Run `/openpaul:config action=list` to verify.'
        }

        default:
          return 'Unknown action. Use: init, list, get, set'
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Config Error') + '\n\n' +
        `Failed to ${action} config: ${errorMessage}`
    }
  },
})
