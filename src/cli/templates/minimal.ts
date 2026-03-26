import type { Preset } from '../presets.js'

/**
 * Minimal preset for OpenCode configuration
 *
 * Provides essential OpenCode configuration with:
 * - Basic opencode.json schema reference
 * - Empty directory structure with .gitkeep files
 */
export const minimalPreset: Preset = {
  name: 'minimal',
  description: 'Essential OpenCode configuration with empty directory structure',
  files: [
    {
      path: 'opencode.json',
      content: JSON.stringify({ $schema: 'https://opencode.ai/config.json' }, null, 2)
    },
    {
      path: '.opencode/agents/.gitkeep',
      content: ''
    },
    {
      path: '.opencode/commands/.gitkeep',
      content: ''
    },
    {
      path: '.opencode/rules/.gitkeep',
      content: ''
    },
    {
      path: '.opencode/skills/.gitkeep',
      content: ''
    }
  ]
}
