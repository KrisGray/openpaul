import type { Preset } from '../presets.js'

/**
 * Full preset for OpenCode configuration
 *
 * Provides complete OpenCode configuration with:
 * - Basic opencode.json and tui.json schema references
 * - Example command and rule files
 * - Empty directory structure with .gitkeep files
 */
export const fullPreset: Preset = {
  name: 'full',
  description: 'Complete OpenCode configuration with example command and rule',
  files: [
    {
      path: 'opencode.json',
      content: JSON.stringify({ $schema: 'https://opencode.ai/config.json' }, null, 2)
    },
    {
      path: 'tui.json',
      content: JSON.stringify({ $schema: 'https://opencode.ai/tui.json' }, null, 2)
    },
    {
      path: '.opencode/commands/example.md',
      content: `---
description: Example custom command
agent: build
---

This is an example command. Customize it for your project needs.
`
    },
    {
      path: '.opencode/rules/example.md',
      content: `# Example Rule

This is an example rule file. Add your project-specific guidelines here.
`
    },
    {
      path: '.opencode/agents/.gitkeep',
      content: ''
    },
    {
      path: '.opencode/skills/.gitkeep',
      content: ''
    }
  ]
}
