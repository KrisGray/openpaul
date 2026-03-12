/**
 * Config Command Tests
 *
 * Tests for /openpaul:config command functionality
 */

import { join } from 'path'
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { openpaulConfig } from '../../commands/config'

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

describe('Config Command', () => {
  const tempDir = join(__dirname, 'temp-config-command-test')
  const configPath = join(tempDir, '.openpaul', 'config.md')

  const writeConfig = (frontmatter: string, body: string = '# Config\n'): void => {
    const configDir = join(tempDir, '.openpaul')
    mkdirSync(configDir, { recursive: true })
    const content = `---\n${frontmatter.trim()}\n---\n${body}`
    writeFileSync(configPath, content, 'utf-8')
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

  it('should create .openpaul/config.md on init', async () => {
    const toolContext = { directory: tempDir } as any
    const result = await openpaulConfig.execute({ action: 'init' }, toolContext)

    expect(result).toContain('Config Initialized')
    expect(existsSync(configPath)).toBe(true)
    const content = readFileSync(configPath, 'utf-8')
    expect(content.startsWith('---')).toBe(true)
    expect(content).toContain('project:')
  })

  it('should show project, integrations, and preferences on list', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulConfig.execute({ action: 'init' }, toolContext)

    const result = await openpaulConfig.execute({ action: 'list' }, toolContext)

    expect(result).toContain('Configuration')
    expect(result).toContain('Project')
    expect(result).toContain('Integrations')
    expect(result).toContain('Preferences')
  })

  it('should return value for known key with get', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulConfig.execute({ action: 'init' }, toolContext)
    await openpaulConfig.execute({ action: 'set', key: 'project.name', value: 'Sample Project' }, toolContext)

    const result = await openpaulConfig.execute({ action: 'get', key: 'project.name' }, toolContext)

    expect(result).toContain('project.name')
    expect(result).toContain('Sample Project')
  })

  it('should return error for missing key with get', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulConfig.execute({ action: 'init' }, toolContext)

    const result = await openpaulConfig.execute({ action: 'get', key: 'project.version' }, toolContext)

    expect(result).toContain('not set')
    expect(result).toContain('project.version')
  })

  it('should update frontmatter values on set', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulConfig.execute({ action: 'init' }, toolContext)

    await openpaulConfig.execute({ action: 'set', key: 'project.name', value: 'Updated Name' }, toolContext)

    const content = readFileSync(configPath, 'utf-8')
    expect(content).toContain('name: Updated Name')
  })

  it('should reject unknown keys on set', async () => {
    const toolContext = { directory: tempDir } as any
    await openpaulConfig.execute({ action: 'init' }, toolContext)

    const result = await openpaulConfig.execute(
      { action: 'set', key: 'project.unknown', value: 'nope' },
      toolContext
    )

    expect(result).toContain('Unknown config key')
  })

  it('should surface missing required keys during list', async () => {
    writeConfig(`project:\n  name: ""\nintegrations:\n  sonarqube:\n    enabled: true`)
    const toolContext = { directory: tempDir } as any

    const result = await openpaulConfig.execute({ action: 'list' }, toolContext)

    expect(result).toContain('Missing required config keys')
    expect(result).toContain('project.name')
    expect(result).toContain('integrations.sonarqube.projectKey')
    expect(result).toContain('integrations.sonarqube.url')
  })

  it('should warn when listing before init', async () => {
    const toolContext = { directory: tempDir } as any

    const result = await openpaulConfig.execute({ action: 'list' }, toolContext)

    expect(result).toContain('Not initialized')
    expect(result).toContain('/openpaul:config')
  })
})
