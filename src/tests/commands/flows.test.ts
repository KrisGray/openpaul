/**
 * Flows Command Tests
 *
 * Tests for /openpaul:flows command functionality
 */

import { join } from 'path'
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { openpaulFlows } from '../../commands/flows'
import { FlowsManager } from '../../storage/flows-manager'

jest.mock(
  '@opencode-ai/plugin',
  () => {
    const chainable = {
      optional: () => chainable,
      describe: () => chainable,
    }
    const tool = (input: any) => input
    tool.schema = {
      enum: () => chainable,
      string: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('Flows Command', () => {
  const tempDir = join(__dirname, 'temp-flows-command-test')
  const flowsPath = join(tempDir, '.openpaul', 'SPECIAL-FLOWS.md')

  const writeFlowsFile = (content: string): void => {
    const flowsDir = join(tempDir, '.openpaul')
    mkdirSync(flowsDir, { recursive: true })
    writeFileSync(flowsPath, content, 'utf-8')
  }

  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should warn when listing before init', async () => {
    const toolContext = { directory: tempDir } as any

    const result = await openpaulFlows.execute({ action: 'list' }, toolContext)

    expect(result).toContain('Not initialized')
    expect(result).toContain('/openpaul:flows')
  })

  it('should create SPECIAL-FLOWS.md on init', async () => {
    const toolContext = { directory: tempDir } as any

    const result = await openpaulFlows.execute({ action: 'init' }, toolContext)

    expect(result).toContain('Flows Initialized')
    expect(existsSync(flowsPath)).toBe(true)
    const content = readFileSync(flowsPath, 'utf-8')
    expect(content).toContain('enabled:')
    expect(content).toContain('disabled:')
  })

  it('should list enabled and disabled flows', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulFlows.execute({ action: 'init' }, toolContext)

    const result = await openpaulFlows.execute({ action: 'list' }, toolContext)

    expect(result).toContain('Enabled:')
    expect(result).toContain('Disabled:')
    expect(result).toContain('security-review')
  })

  it('should enable a flow and move it to enabled array', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulFlows.execute({ action: 'init' }, toolContext)

    await openpaulFlows.execute({ action: 'enable', name: 'security-review' }, toolContext)

    const state = new FlowsManager(tempDir).list()
    expect(state.enabled).toContain('security-review')
    expect(state.disabled).not.toContain('security-review')
  })

  it('should disable a flow and move it to disabled array', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulFlows.execute({ action: 'init' }, toolContext)
    await openpaulFlows.execute({ action: 'enable', name: 'docs-refresh' }, toolContext)

    await openpaulFlows.execute({ action: 'disable', name: 'docs-refresh' }, toolContext)

    const state = new FlowsManager(tempDir).list()
    expect(state.disabled).toContain('docs-refresh')
    expect(state.enabled).not.toContain('docs-refresh')
  })

  it('should surface unknown flow errors', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulFlows.execute({ action: 'init' }, toolContext)

    const result = await openpaulFlows.execute({ action: 'enable', name: 'unknown-flow' }, toolContext)

    expect(result).toContain('Unknown flow ID')
    expect(result).toContain('Valid flow IDs')
  })

  it('should report conflicts between enabled and disabled arrays', async () => {
    writeFlowsFile(`---
enabled:
  - security-review
disabled:
  - security-review
---
`)
    const toolContext = { directory: tempDir } as any

    const result = await openpaulFlows.execute({ action: 'list' }, toolContext)

    expect(result).toContain('Conflicting flow IDs')
  })
})
