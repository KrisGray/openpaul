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
      path: 'agents/.gitkeep',
      content: ''
    },
    {
      path: 'commands/.gitkeep',
      content: ''
    },
    {
      path: 'rules/.gitkeep',
      content: ''
    },
    {
      path: 'skills/.gitkeep',
      content: ''
    }
  ]
}
