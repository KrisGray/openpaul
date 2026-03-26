/**
 * E2E Tutorial Workflow Test
 *
 * Tests the complete workflow described in the tutorial against a real
 * temporary directory on disk. The only mock is @opencode-ai/plugin's
 * `tool()` wrapper, which is stripped so execute() can be called directly.
 *
 * Everything else — FileManager, StateManager, LoopEnforcer, file I/O —
 * runs against the real filesystem. If any step fails, the tutorial is wrong
 * or the code is broken.
 *
 * Steps mirrored from the tutorial:
 *   1. npx openpaul       → .openpaul/state.json + opencode.json
 *   2. /openpaul:init     → model-config.json + state-phase-1.json
 *   3. /openpaul:plan     → .openpaul/phases/1-01-PLAN.json
 *   4. /openpaul:apply    → task list output
 *   5. /openpaul:unify    → .openpaul/phases/1-01-SUMMARY.json
 */

import { execSync } from 'child_process'
import { existsSync, mkdtempSync, rmSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { tmpdir } from 'os'

// Strip tool() wrapper so execute() is directly callable.
// tool.schema is stubbed with a chainable proxy so module-load-time
// schema definitions (e.g. tool.schema.boolean().optional().describe())
// don't crash. This is the ONLY mock in this test suite.
jest.mock(
  '@opencode-ai/plugin',
  () => {
    // Returns a proxy that chains infinitely: .foo().bar().baz() all work.
    const chainable = (): any => {
      const fn: any = () => chainable()
      return new Proxy(fn, { get: () => chainable() })
    }
    const tool: any = (input: any) => input
    tool.schema = chainable()
    return { tool, z: require('zod') }
  },
  { virtual: true }
)

// Imports are resolved after the mock above is hoisted by jest.
import { openpaulInit } from '../src/commands/init'
import { openpaulPlan } from '../src/commands/plan'
import { openpaulApply } from '../src/commands/apply'
import { openpaulUnify } from '../src/commands/unify'

const CLI_PATH = resolve(__dirname, '../dist/cli.js')

/**
 * Minimal ToolContext stub — commands only use context.directory at runtime.
 * Other fields satisfy TypeScript but are never accessed.
 */
function makeContext(dir: string): any {
  return {
    directory: dir,
    worktree: dir,
    sessionID: 'test-session',
    messageID: 'test-message',
    agent: 'build',
    serverUrl: new URL('http://localhost:4096'),
    $: {},
  }
}

/** Run npx openpaul in a directory */
function scaffold(dir: string, name = 'tutorial-test'): void {
  execSync(`node "${CLI_PATH}" --force --name "${name}"`, {
    cwd: dir,
    encoding: 'utf-8',
    env: { ...process.env, FORCE_COLOR: '0' },
  })
}

// ─── Tutorial task list (matches tutorial exactly) ─────────────────────────

const TUTORIAL_TASKS = [
  {
    name: 'Write failing test for HGNC fetch',
    files: ['tests/test_hgnc_client.py'],
    action: 'Create TestHGNCClient class using mocker fixture to patch requests.get',
    verify: 'pytest tests/test_hgnc_client.py -v',
    done: 'Test file exists and test fails',
  },
  {
    name: 'Implement HGNCClient',
    files: ['src/hgnc_client.py'],
    action: 'Implement fetch_by_hgnc_id with proper headers, timeout, and error handling',
    verify: 'pytest tests/test_hgnc_client.py -v',
    done: 'AC-1 and AC-2 satisfied',
  },
  {
    name: 'Add edge case tests',
    files: ['tests/test_hgnc_client.py'],
    action: 'Test not-found (empty docs), network timeout, and malformed response',
    verify: 'pytest tests/test_hgnc_client.py --cov=src -v',
    done: 'AC-3 satisfied — 100% coverage',
  },
]

const TUTORIAL_CRITERIA = [
  'fetch_by_hgnc_id returns gene data dict with symbol, name, entrez_id',
  'network errors raise RequestException with context',
  'all tests pass with 100% coverage of client code',
]

// ───────────────────────────────────────────────────────────────────────────

describe('Tutorial Workflow E2E', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'openpaul-tutorial-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  // ── Step 1: npx openpaul ────────────────────────────────────────────────

  describe('Step 1: npx openpaul creates scaffold', () => {
    it('creates .openpaul/state.json with project name', () => {
      scaffold(dir, 'gene-api-client')
      const statePath = join(dir, '.openpaul', 'state.json')
      expect(existsSync(statePath)).toBe(true)
      const state = JSON.parse(readFileSync(statePath, 'utf-8'))
      expect(state.name).toBe('gene-api-client')
    })

    it('creates opencode.json', () => {
      scaffold(dir)
      expect(existsSync(join(dir, 'opencode.json'))).toBe(true)
    })

    it('does NOT create PROJECT.md, ROADMAP.md, or STATE.md', () => {
      scaffold(dir)
      expect(existsSync(join(dir, '.openpaul', 'PROJECT.md'))).toBe(false)
      expect(existsSync(join(dir, '.openpaul', 'ROADMAP.md'))).toBe(false)
      expect(existsSync(join(dir, '.openpaul', 'STATE.md'))).toBe(false)
    })

    it('does NOT create phases/ directory', () => {
      scaffold(dir)
      expect(existsSync(join(dir, '.openpaul', 'phases'))).toBe(false)
    })
  })

  // ── Step 2: /openpaul:init ───────────────────────────────────────────────

  describe('Step 2: /openpaul:init initializes loop state', () => {
    beforeEach(() => scaffold(dir))

    it('returns success message', async () => {
      const result = await openpaulInit.execute({}, makeContext(dir))
      expect(result).toContain('✅ OpenPAUL Initialized')
    })

    it('creates model-config.json', async () => {
      await openpaulInit.execute({}, makeContext(dir))
      expect(existsSync(join(dir, '.openpaul', 'model-config.json'))).toBe(true)
    })

    it('creates state-phase-1.json', async () => {
      await openpaulInit.execute({}, makeContext(dir))
      const inOpenPaul = existsSync(join(dir, '.openpaul', 'state-phase-1.json'))
      const inPaul = existsSync(join(dir, '.paul', 'state-phase-1.json'))
      expect(inOpenPaul || inPaul).toBe(true)
    })

    it('does not reinitialize without --force', async () => {
      await openpaulInit.execute({}, makeContext(dir))
      const result = await openpaulInit.execute({}, makeContext(dir))
      expect(result).toContain('Already Initialized')
    })
  })

  // ── Step 3: /openpaul:plan ────────────────────────────────────────────────

  describe('Step 3: /openpaul:plan creates JSON plan', () => {
    beforeEach(async () => {
      scaffold(dir)
      await openpaulInit.execute({}, makeContext(dir))
    })

    it('returns success message with location', async () => {
      const result = await openpaulPlan.execute(
        { phase: 1, plan: '01', criteria: TUTORIAL_CRITERIA, tasks: TUTORIAL_TASKS },
        makeContext(dir)
      )
      expect(result).toContain('✅ Plan created successfully')
      expect(result).toContain('.openpaul/phases/1-01-PLAN.json')
    })

    it('creates 1-01-PLAN.json on disk', async () => {
      await openpaulPlan.execute(
        { phase: 1, plan: '01', criteria: TUTORIAL_CRITERIA, tasks: TUTORIAL_TASKS },
        makeContext(dir)
      )
      expect(existsSync(join(dir, '.openpaul', 'phases', '1-01-PLAN.json'))).toBe(true)
    })

    it('plan JSON has correct phase, plan, criteria, and tasks', async () => {
      await openpaulPlan.execute(
        { phase: 1, plan: '01', criteria: TUTORIAL_CRITERIA, tasks: TUTORIAL_TASKS },
        makeContext(dir)
      )
      const plan = JSON.parse(
        readFileSync(join(dir, '.openpaul', 'phases', '1-01-PLAN.json'), 'utf-8')
      )
      expect(plan.phase).toBe('1')
      expect(plan.plan).toBe('01')
      expect(plan.criteria).toEqual(TUTORIAL_CRITERIA)
      expect(plan.tasks).toHaveLength(3)
      expect(plan.tasks[0].name).toBe('Write failing test for HGNC fetch')
      expect(plan.tasks[1].name).toBe('Implement HGNCClient')
      expect(plan.tasks[2].name).toBe('Add edge case tests')
    })

    it('plan JSON has valid executionGraph', async () => {
      await openpaulPlan.execute(
        { phase: 1, plan: '01', criteria: TUTORIAL_CRITERIA, tasks: TUTORIAL_TASKS },
        makeContext(dir)
      )
      const plan = JSON.parse(
        readFileSync(join(dir, '.openpaul', 'phases', '1-01-PLAN.json'), 'utf-8')
      )
      expect(Array.isArray(plan.executionGraph)).toBe(true)
      expect(plan.executionGraph.length).toBeGreaterThan(0)
    })
  })

  // ── Step 4: /openpaul:apply ───────────────────────────────────────────────

  describe('Step 4: /openpaul:apply returns task list', () => {
    beforeEach(async () => {
      scaffold(dir)
      await openpaulInit.execute({}, makeContext(dir))
      await openpaulPlan.execute(
        { phase: 1, plan: '01', criteria: TUTORIAL_CRITERIA, tasks: TUTORIAL_TASKS },
        makeContext(dir)
      )
    })

    it('returns apply phase header', async () => {
      const result = await openpaulApply.execute({}, makeContext(dir))
      expect(result).toContain('🚀 Starting Apply Phase')
    })

    it('output contains all three task names', async () => {
      const result = await openpaulApply.execute({}, makeContext(dir))
      expect(result).toContain('Write failing test for HGNC fetch')
      expect(result).toContain('Implement HGNCClient')
      expect(result).toContain('Add edge case tests')
    })

    it('output instructs to run /openpaul:unify', async () => {
      const result = await openpaulApply.execute({}, makeContext(dir))
      expect(result).toContain('/openpaul:unify')
    })
  })

  // ── Step 5: /openpaul:unify ───────────────────────────────────────────────

  describe('Step 5: /openpaul:unify closes the loop', () => {
    const actuals = TUTORIAL_TASKS.map(t => ({ name: t.name, status: 'completed' as const }))

    beforeEach(async () => {
      scaffold(dir)
      await openpaulInit.execute({}, makeContext(dir))
      await openpaulPlan.execute(
        { phase: 1, plan: '01', criteria: TUTORIAL_CRITERIA, tasks: TUTORIAL_TASKS },
        makeContext(dir)
      )
      await openpaulApply.execute({}, makeContext(dir))
    })

    it('returns loop closed message', async () => {
      const result = await openpaulUnify.execute({ status: 'success', actuals }, makeContext(dir))
      expect(result).toContain('🔗 Loop Closed: 1-01')
    })

    it('creates 1-01-SUMMARY.json on disk', async () => {
      await openpaulUnify.execute({ status: 'success', actuals }, makeContext(dir))
      expect(existsSync(join(dir, '.openpaul', 'phases', '1-01-SUMMARY.json'))).toBe(true)
    })

    it('SUMMARY.json records status, completed, and total', async () => {
      await openpaulUnify.execute({ status: 'success', actuals }, makeContext(dir))
      const summary = JSON.parse(
        readFileSync(join(dir, '.openpaul', 'phases', '1-01-SUMMARY.json'), 'utf-8')
      )
      expect(summary.status).toBe('success')
      expect(summary.completed).toBe(3)
      expect(summary.total).toBe(3)
    })

    it('SUMMARY.json contains all task names as completed', async () => {
      await openpaulUnify.execute({ status: 'success', actuals }, makeContext(dir))
      const summary = JSON.parse(
        readFileSync(join(dir, '.openpaul', 'phases', '1-01-SUMMARY.json'), 'utf-8')
      )
      for (const task of TUTORIAL_TASKS) {
        const found = summary.tasks.find((t: any) => t.name === task.name)
        expect(found).toBeDefined()
        expect(found.status).toBe('completed')
      }
    })

    it('output instructs to run next /openpaul:plan', async () => {
      const result = await openpaulUnify.execute({ status: 'success', actuals }, makeContext(dir))
      expect(result).toContain('/openpaul:plan')
    })
  })

  // ── Full loop end-to-end ──────────────────────────────────────────────────

  describe('Full loop: scaffold → init → plan → apply → unify', () => {
    it('completes without error and leaves both PLAN.json and SUMMARY.json on disk', async () => {
      scaffold(dir, 'gene-api-client')

      const initResult = await openpaulInit.execute({}, makeContext(dir))
      expect(initResult).toContain('✅')

      const planResult = await openpaulPlan.execute(
        { phase: 1, plan: '01', criteria: TUTORIAL_CRITERIA, tasks: TUTORIAL_TASKS },
        makeContext(dir)
      )
      expect(planResult).toContain('✅ Plan created successfully')

      const applyResult = await openpaulApply.execute({}, makeContext(dir))
      expect(applyResult).toContain('🚀 Starting Apply Phase')

      const unifyResult = await openpaulUnify.execute(
        {
          status: 'success',
          actuals: TUTORIAL_TASKS.map(t => ({ name: t.name, status: 'completed' as const })),
        },
        makeContext(dir)
      )
      expect(unifyResult).toContain('🔗 Loop Closed: 1-01')

      expect(existsSync(join(dir, '.openpaul', 'phases', '1-01-PLAN.json'))).toBe(true)
      expect(existsSync(join(dir, '.openpaul', 'phases', '1-01-SUMMARY.json'))).toBe(true)
    })
  })
})
