#!/usr/bin/env node
import { Command } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, resolve } from 'path'
import { input, confirm } from '@inquirer/prompts'
import { success, step, info, setVerbosity, showBanner, notice } from './cli/output.js'
import { handleCliError } from './cli/errors.js'
import { getDefaultProjectName, createOpenPaulDir, generateStateJson, generatePresetFiles } from './cli/scaffold.js'
import { resolvePreset } from './cli/presets.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = join(__dirname, '../package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

// Count -v occurrences for verbosity level (0=silent, 1=info, 2+=debug)
function countVerbosity(value: string, previous: number): number {
  return previous + 1
}

const program = new Command()

program
  .name('openpaul')
  .description('Initialize OpenPAUL in your project')
  .version(pkg.version, '--version', 'output the current version')
  .helpOption('-h, --help', 'display help for command')
  .option('-p, --path <path>', 'target directory', '.')
  .option('-n, --name <name>', 'project name (defaults to directory name)')
  .option('-i, --interactive', 'force interactive mode')
  .option('-v, --verbose', 'enable verbose output (use -vv for debug)', countVerbosity, 0)
  .option('-f, --force', 'skip prompts and overwrite existing files')
  .option('--preset <preset>', 'template preset (minimal|full)', 'minimal')
  .addHelpText('after', `
Examples:
  $ npx openpaul                    # Interactive mode
  $ npx openpaul --name my-project  # Skip name prompt
  $ npx openpaul --path ./app       # Target directory
  $ npx openpaul -n my-project -p ./app  # Combined options
`)
  .action(async (options) => {
    setVerbosity(options.verbose)
    showBanner(pkg.version)

    // Resolve target path
    const targetPath = resolve(options.path)
    const openpaulDir = join(targetPath, '.openpaul')

    info(`Target directory: ${targetPath}`)

    // Check for existing directory (skip if --force)
    if (existsSync(openpaulDir) && !options.force) {
      const shouldOverwrite = await confirm({
        message: '`.openpaul/` already exists. Overwrite?',
        default: false
      })
      if (!shouldOverwrite) {
        notice('Operation cancelled')
        process.exit(0)
      }
    }

    // Get project name (prompt only if --name not provided)
    let projectName = options.name
    if (!projectName) {
      const defaultName = getDefaultProjectName(targetPath)
      projectName = await input({
        message: 'Project name',
        default: defaultName,
        validate: (value: string) => {
          if (!value.trim()) return 'Project name cannot be empty'
          if (/[\/\\:]/.test(value)) return 'Project name cannot contain /, \\, or :'
          return true
        }
      })
    }

    info(`Project name: ${projectName}`)

    // Resolve preset (after project name, before confirmation)
    const preset = await resolvePreset(options.preset)

    // Confirmation prompt (skip if --force)
    if (!options.force) {
      const confirmed = await confirm({
        message: `Create OpenPAUL in '${targetPath}' with project name '${projectName}'?`,
        default: true
      })
      if (!confirmed) {
        notice('Operation cancelled')
        process.exit(0)
      }
    }

    // Execute scaffolding
    createOpenPaulDir(targetPath)
    await generateStateJson(openpaulDir, projectName, pkg.version)
    success('OpenPAUL initialized successfully!')
  })

program.parseAsync().catch(handleCliError)
