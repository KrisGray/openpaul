#!/usr/bin/env node
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { success, step, info, setVerbosity } from './cli/output.js'
import { handleCliError } from './cli/errors.js'

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
  .addHelpText('after', `
Examples:
  $ npx openpaul                    # Interactive mode
  $ npx openpaul --name my-project  # Skip name prompt
  $ npx openpaul --path ./app       # Target directory
  $ npx openpaul -n my-project -p ./app  # Combined options
`)
  .action(async (options) => {
    setVerbosity(options.verbose)

    info(`Target directory: ${options.path}`)

    if (options.name) {
      info(`Project name: ${options.name}`)
    }

    // Phase 16 will implement actual scaffolding here
    step('CLI initialized')
    success('OpenPAUL ready for scaffolding')
  })

program.parseAsync().catch(handleCliError)
