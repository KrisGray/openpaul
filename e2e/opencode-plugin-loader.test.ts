/**
 * OpenCode Plugin Loader Integration Test
 *
 * This test verifies that OpenCode can load the OpenPAUL plugin via opencode.json.
 * This requires an OpenCode binary and network access to install npm plugins.
 */

import { spawnSync } from 'child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'

const CLI_PATH = resolve(__dirname, '../dist/cli.js')
const OPENCODE_BIN = process.env.OPENCODE_BIN ?? 'opencode'

function run(command: string, cwd: string, env: Record<string, string | undefined>): string {
  const result = spawnSync(command, {
    cwd,
    encoding: 'utf-8',
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      OPENCODE_DISABLE_AUTOUPDATE: '1',
      OPENCODE_DISABLE_MODELS_FETCH: '1',
      ...env,
    },
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    const error = new Error(result.stderr || `Command failed: ${command}`)
    ;(error as typeof error & { stdout?: string; stderr?: string }).stdout = result.stdout
    ;(error as typeof error & { stdout?: string; stderr?: string }).stderr = result.stderr
    throw error
  }

  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}

describe('OpenCode plugin loader (npm)', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'openpaul-opencode-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('loads openpaul tools from opencode.json', async () => {
    run(`node "${CLI_PATH}" --force --name "openpaul-plugin-test"`, dir, {})

    const configPath = join(dir, 'opencode.json')
    if (!existsSync(configPath)) {
      throw new Error('opencode.json was not created by scaffold')
    }

    const base = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>
    base.plugin = ['openpaul']
    writeFileSync(configPath, JSON.stringify(base, null, 2))

    const configOutput = run(`${OPENCODE_BIN} debug config`, dir, { OPENCODE_CONFIG: configPath })

    const expectedTools = [
      'openpaul:init',
      'openpaul:plan',
      'openpaul:apply',
      'openpaul:unify',
      'openpaul:progress',
      'openpaul:status',
      'openpaul:help',
      'openpaul:pause',
      'openpaul:resume',
      'openpaul:handoff',
      'openpaul:milestone',
      'openpaul:complete-milestone',
      'openpaul:discuss-milestone',
      'openpaul:discuss',
      'openpaul:assumptions',
      'openpaul:discover',
      'openpaul:consider-issues',
      'openpaul:research',
      'openpaul:research-phase',
      'openpaul:config',
      'openpaul:flows',
      'openpaul:map-codebase',
      'openpaul:add-phase',
      'openpaul:remove-phase',
      'openpaul:verify',
      'openpaul:plan-fix',
    ]
    const expectedSet = new Set(expectedTools)

    const cleanedConfigOutput = stripAnsi(configOutput)
    expect(cleanedConfigOutput).toContain('openpaul')

    const distIndex = readFileSync(resolve(__dirname, '../dist/index.js'), 'utf-8')
    const matches = distIndex.match(/'openpaul:[^']+'/g) ?? []
    const foundTools = new Set<string>(matches.map(match => match.slice(1, -1)))

    const missing = expectedTools.filter(toolName => !foundTools.has(toolName))
    const unexpected = Array.from(foundTools).filter(toolName => !expectedSet.has(toolName))

    if (missing.length > 0 || unexpected.length > 0) {
      const message = [
        'OpenPAUL tool list mismatch.',
        missing.length > 0 ? `Missing: ${missing.sort().join(', ')}` : '',
        unexpected.length > 0 ? `Unexpected: ${unexpected.sort().join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' ')

      throw new Error(message)
    }
  })
})

function stripAnsi(value: string): string {
  return value.replace(/\x1b\[[0-9;]*m/g, '')
}
