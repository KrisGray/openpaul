/**
 * OpenCode Plugin Loader Integration Test
 *
 * This test verifies that OpenCode can load the OpenPAUL plugin via opencode.json.
 * This requires an OpenCode binary and network access to install npm plugins.
 */

import { execSync } from 'child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'

const CLI_PATH = resolve(__dirname, '../dist/cli.js')
const OPENCODE_BIN = process.env.OPENCODE_BIN ?? 'opencode'

function run(command: string, cwd: string, env: Record<string, string | undefined>): string {
  return execSync(command, {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      OPENCODE_DISABLE_AUTOUPDATE: '1',
      OPENCODE_DISABLE_MODELS_FETCH: '1',
      ...env,
    },
  })
}

describe('OpenCode plugin loader (npm)', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'openpaul-opencode-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('loads openpaul tools from opencode.json', () => {
    run(`node "${CLI_PATH}" --force --name "openpaul-plugin-test"`, dir, {})

    const configPath = join(dir, 'opencode.json')
    if (!existsSync(configPath)) {
      throw new Error('opencode.json was not created by scaffold')
    }

    const base = JSON.parse(readFileSync(configPath, 'utf-8')) as Record<string, unknown>
    base.plugin = ['openpaul']
    writeFileSync(configPath, JSON.stringify(base, null, 2))

    const output = run(
      `${OPENCODE_BIN} run --command openpaul:help --format json`,
      dir,
      { OPENCODE_CONFIG: configPath }
    )

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

    const events = parseJsonOutput(output)
    const foundTools = new Set<string>()
    for (const event of events) {
      collectOpenpaulTools(event, foundTools)
    }

    expect(foundTools.size).toBeGreaterThan(0)

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

function parseJsonOutput(output: string): unknown[] {
  const trimmed = output.trim()
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    const lines = trimmed.split('\n').filter(Boolean)
    const events: unknown[] = []
    for (const line of lines) {
      try {
        events.push(JSON.parse(line))
      } catch {
        // ignore non-JSON lines
      }
    }
    return events
  }
}

function collectOpenpaulTools(value: unknown, tools: Set<string>): void {
  if (typeof value === 'string') {
    if (value.startsWith('openpaul:')) {
      tools.add(value)
    }
    return
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectOpenpaulTools(item, tools)
    }
    return
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      collectOpenpaulTools(item, tools)
    }
  }
}
