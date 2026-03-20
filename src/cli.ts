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

program.parseAsync().catch(() => {
  process.exit(1)
})
