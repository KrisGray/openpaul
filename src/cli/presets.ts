import { select } from '@inquirer/prompts'
import { notice, info } from './output.js'

/**
 * Valid preset names for OpenCode configuration scaffolding
 */
export type PresetName = 'minimal' | 'full'

/**
 * A single file to be created as part of a preset
 */
export interface PresetFile {
  /** Relative path from project root */
  path: string
  /** File content (empty string for .gitkeep files) */
  content: string
}

/**
 * A preset configuration containing files to scaffold
 */
export interface Preset {
  /** Preset identifier */
  name: PresetName
  /** Brief description of what the preset includes */
  description: string
  /** Files to create when applying this preset */
  files: PresetFile[]
}

// Re-export presets from template files
export { minimalPreset } from './templates/minimal.js'
export { fullPreset } from './templates/full.js'

/**
 * All available presets indexed by name
 */
export const PRESETS: Record<PresetName, Preset> = {
  minimal: {
    name: 'minimal',
    description: 'Essential OpenCode configuration with empty directory structure',
    files: []
  },
  full: {
    name: 'full',
    description: 'Complete OpenCode configuration with example command and rule',
    files: []
  }
}

/**
 * Type guard to check if a string is a valid preset name
 *
 * @param value - The value to check
 * @returns True if value is a valid PresetName
 */
export function isValidPreset(value: string): value is PresetName {
  return value === 'minimal' || value === 'full'
}

/**
 * Resolve a preset based on CLI argument
 *
 * Behavior:
 * - undefined: Default to minimal preset with notice
 * - valid preset name: Return that preset with info message
 * - unknown preset: Prompt user to select from available presets
 *
 * @param presetArg - The preset argument from CLI (may be undefined)
 * @returns The resolved preset configuration
 */
export async function resolvePreset(presetArg: string | undefined): Promise<Preset> {
  // Import presets dynamically to avoid circular dependencies
  const { minimalPreset } = await import('./templates/minimal.js')
  const { fullPreset } = await import('./templates/full.js')

  // Update PRESETS with actual preset data
  PRESETS.minimal = minimalPreset
  PRESETS.full = fullPreset

  // Case 1: No preset specified - default to minimal
  if (presetArg === undefined) {
    notice('Defaulting to minimal')
    return minimalPreset
  }

  // Case 2: Valid preset name
  if (isValidPreset(presetArg)) {
    const preset = PRESETS[presetArg]
    info(`Preset: ${preset.name}`)
    info(preset.description)
    return preset
  }

  // Case 3: Unknown preset - prompt for selection
  notice(`Unknown preset "${presetArg}". Please select a preset:`)

  const selectedPreset = await select({
    message: 'Choose a preset',
    choices: [
      {
        name: `minimal - ${minimalPreset.description}`,
        value: 'minimal',
        description: minimalPreset.description
      },
      {
        name: `full - ${fullPreset.description}`,
        value: 'full',
        description: fullPreset.description
      }
    ]
  })

  return PRESETS[selectedPreset as PresetName]
}
