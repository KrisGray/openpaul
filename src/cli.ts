#!/usr/bin/env node
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = join(__dirname, '../package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

const program = new Command()

program
  .name('openpaul')
  .description('Initialize OpenPAUL in your project')
  .version(pkg.version, '-v, --version', 'output the current version')
  .helpOption('-h, --help', 'display help for command')
  .option('-p, --path <path>', 'target directory', '.')
  .option('-n, --name <name>', 'project name (defaults to directory name)')
  .option('-i, --interactive', 'force interactive mode')
  .option('--verbose', 'enable verbose output')
  .addHelpText('after', `
Examples:
  $ npx openpaul                    # Interactive mode
  $ npx openpaul --name my-project  # Skip name prompt
  $ npx openpaul --path ./app       # Target directory
  $ npx openpaul -n my-project -p ./app  # Combined options
`)
  .action(async (options) => {
    // Options available: options.path, options.name, options.interactive, options.verbose
    // For now, just log that we received the command
    // Phase 16 will implement actual scaffolding
    console.log('OpenPAUL CLI initialized')
    console.log(`Path: ${options.path}`)
    if (options.name) {
      console.log(`Name: ${options.name}`)
    }
  })

program.parseAsync().catch(() => {
  process.exit(1)
})
