import { resolve, basename, join, dirname } from 'path'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { atomicWrite } from '../storage/atomic-writes.js'
import { step } from './output.js'
import type { StateFile } from '../types/state-file.js'
import type { Preset } from './presets.js'

/**
 * Get Default Project Name
 *
 * Derives the default project name from the target directory path.
 * Resolves the path first to handle edge cases like './app' and '.'.
 *
 * @param targetPath - The target directory path
 * @returns The directory basename as the default project name
 */
export function getDefaultProjectName(targetPath: string): string {
  const resolved = resolve(targetPath)
  return basename(resolved)
}

/**
 * Create OpenPAUL Directory
 *
 * Creates the .openpaul/ directory in the target path.
 * Uses recursive option to create parent directories if needed.
 *
 * @param targetPath - The target directory path
 * @returns The created .openpaul directory path
 */
export function createOpenPaulDir(targetPath: string): string {
  const openpaulDir = join(targetPath, '.openpaul')
  step('Creating .openpaul/ directory...')
  mkdirSync(openpaulDir, { recursive: true })
  return openpaulDir
}

/**
 * Generate State JSON
 *
 * Creates and writes the state.json file with project metadata.
 * Uses atomic write pattern to ensure data integrity.
 *
 * @param openpaulDir - The .openpaul directory path
 * @param projectName - The project name
 * @param cliVersion - The CLI version creating this file
 */
export async function generateStateJson(
  openpaulDir: string,
  projectName: string,
  cliVersion: string
): Promise<void> {
  const state: StateFile = {
    version: '1.0',
    cliVersion,
    name: projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  step('Creating state.json...')
  const statePath = join(openpaulDir, 'state.json')
  await atomicWrite(statePath, JSON.stringify(state, null, 2))
}

/**
 * Generate Preset Files
 *
 * Creates the .opencode/ directory structure with files from the selected preset.
 * Overwrites existing files without merging.
 *
 * @param targetPath - The target directory path (project root)
 * @param preset - The preset configuration to generate files from
 */
export function generatePresetFiles(targetPath: string, preset: Preset): void {
  for (const file of preset.files) {
    const filePath = join(targetPath, file.path)
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    writeFileSync(filePath, file.content)
  }
}
