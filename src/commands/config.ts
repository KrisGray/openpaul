import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { ConfigManager, type ProjectConfig } from '../storage/config-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import { existsSync } from 'fs'
import { join } from 'path'

const buildOverrides = (key: string, value: unknown): Partial<ProjectConfig> => {
  const segments = key.split('.').filter(Boolean)
  if (segments.length === 0) {
    return {}
  }

  const [section, ...rest] = segments
  let nestedValue: unknown = value
  for (let i = rest.length - 1; i >= 0; i -= 1) {
    nestedValue = { [rest[i]]: nestedValue }
  }

  return {
    [section]: nestedValue,
  } as Partial<ProjectConfig>
}

const getValueFromConfig = (config: ProjectConfig, key: string): unknown => {
  const keys = key.split('.').filter(Boolean)
  let value: unknown = config as Record<string, unknown>
  for (const segment of keys) {
    if (value && typeof value === 'object' && segment in value) {
      value = (value as Record<string, unknown>)[segment]
    } else {
      return undefined
    }
  }
  return value
}

export const openpaulConfig: ToolDefinition = tool({
  description: 'Manage project configuration (init/list/get/set)',
  args: {
    action: tool.schema.enum(['init', 'list', 'get', 'set']).optional().describe('Config action: init, list, get, set'),
    key: tool.schema.string().optional().describe('Config key to get or set (e.g., "project.name")'),
    value: tool.schema.string().optional().describe('Value to set for the key'),
  },
  execute: async ({ action = 'list', key, value }, context) => {
    try {
      const configDir = join(context.directory, '.openpaul')
      const allowedTopLevel = 'project, integrations, preferences'
      
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
          const config = configManager.resolveEffectiveConfig()
          const missingRequired = configManager.validateRequired(config)
          if (missingRequired.length > 0) {
            return formatHeader(2, '❌ Config Error') + '\n\n' +
              `${ConfigManager.formatMissingRequired(missingRequired)}\n\n` +
              'Edit `.openpaul/config.md` to add the required keys.'
          }

          let output = formatHeader(2, '📋 Configuration') + '\n\n'
          output += formatHeader(3, 'Project') + '\n'
          const project = config.project ?? {}
          const projectLines = [`${formatBold('Name:')} ${project.name ?? 'Unknown'}`]
          if (project.description) {
            projectLines.push(`${formatBold('Description:')} ${project.description}`)
          }
          output += formatList(projectLines) + '\n\n'

          output += formatHeader(3, 'Integrations') + '\n'
          const integrationsLines: string[] = []
          if (config.integrations?.sonarqube) {
            const sonar = config.integrations.sonarqube
            integrationsLines.push(`${formatBold('SonarQube:')} ${sonar.enabled ? 'Enabled' : 'Disabled'}`)
            if (sonar.url) {
              integrationsLines.push(`${formatBold('URL:')} ${sonar.url}`)
            }
            if (sonar.projectKey) {
              integrationsLines.push(`${formatBold('Project Key:')} ${sonar.projectKey}`)
            }
            if (sonar.branch) {
              integrationsLines.push(`${formatBold('Branch:')} ${sonar.branch}`)
            }
          }
          output += integrationsLines.length > 0
            ? `${formatList(integrationsLines)}\n\n`
            : `${formatList(['None configured'])}\n\n`

          output += formatHeader(3, 'Preferences') + '\n'
          const preferencesLines: string[] = []
          if (config.preferences?.autoAdvance !== undefined) {
            preferencesLines.push(`${formatBold('Auto Advance:')} ${config.preferences.autoAdvance}`)
          }
          if (config.preferences?.parallelization !== undefined) {
            preferencesLines.push(`${formatBold('Parallelization:')} ${config.preferences.parallelization}`)
          }
          if (config.preferences?.verbose !== undefined) {
            preferencesLines.push(`${formatBold('Verbose:')} ${config.preferences.verbose}`)
          }
          output += preferencesLines.length > 0
            ? `${formatList(preferencesLines)}\n\n`
            : `${formatList(['None configured'])}\n\n`

          return output
        }

        case 'get': {
          if (!key) {
            return `Error: --key required for get action. Allowed top-level keys: ${allowedTopLevel}.`
          }

          if (!existsSync(join(configDir, 'config.md'))) {
            return 'Error: Config not initialized. Run `/openpaul:config action=init` first.'
          }

          const configManager = new ConfigManager(context.directory)
          configManager.assertAllowedKey(key)
          const config = configManager.resolveEffectiveConfig()
          const missingRequired = configManager.validateRequired(config)
          if (missingRequired.length > 0) {
            return formatHeader(2, '❌ Config Error') + '\n\n' +
              `${ConfigManager.formatMissingRequired(missingRequired)}\n\n` +
              'Edit `.openpaul/config.md` to add the required keys.'
          }
          const value = getValueFromConfig(config, key)

          if (value === undefined) {
            return `Config key "${key}" is not set. Allowed top-level keys: ${allowedTopLevel}.`
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
          configManager.assertAllowedKey(key)
          
          let parsedValue: unknown = value
          try {
            parsedValue = JSON.parse(value)
          } catch {
            parsedValue = value
          }

          const overrides = buildOverrides(key, parsedValue)
          const effectiveConfig = configManager.resolveEffectiveConfig({ overrides })
          const missingRequired = configManager.validateRequired(effectiveConfig)
          if (missingRequired.length > 0) {
            return formatHeader(2, '❌ Config Error') + '\n\n' +
              `${ConfigManager.formatMissingRequired(missingRequired)}\n\n` +
              'Edit `.openpaul/config.md` to add the required keys.'
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
