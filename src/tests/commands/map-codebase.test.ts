/**
 * Map-Codebase Command Tests
 *
 * Tests for /openpaul:map-codebase command functionality
 */

import { join } from 'path'
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, utimesSync } from 'fs'
import { openpaulMapCodebase } from '../../commands/map-codebase'

jest.mock(
  '@opencode-ai/plugin',
  () => {
    const chainable = {
      optional: () => chainable,
      describe: () => chainable,
    }
    const tool = (input: any) => input
    tool.schema = {
      boolean: () => chainable,
      number: () => chainable,
      string: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('Map-Codebase Command', () => {
  const tempDir = join(__dirname, 'temp-map-codebase-test')

  const setupSampleRepo = (): void => {
    mkdirSync(tempDir, { recursive: true })
    writeFileSync(
      join(tempDir, 'package.json'),
      JSON.stringify(
        {
          name: 'sample-project',
          version: '0.1.0',
          dependencies: { '@opencode-ai/plugin': '^1.2.0' },
          devDependencies: { jest: '^29.0.0', typescript: '^5.0.0' },
        },
        null,
        2
      ),
      'utf-8'
    )

    mkdirSync(join(tempDir, 'src', 'commands'), { recursive: true })
    mkdirSync(join(tempDir, 'src', 'components', 'button'), { recursive: true })
    mkdirSync(join(tempDir, 'docs'), { recursive: true })
    mkdirSync(join(tempDir, 'tests'), { recursive: true })
    mkdirSync(join(tempDir, 'node_modules'), { recursive: true })

    writeFileSync(join(tempDir, 'src', 'commands', 'index.ts'), 'export {}\n', 'utf-8')
    writeFileSync(join(tempDir, 'src', 'components', 'button', 'index.ts'), 'export {}\n', 'utf-8')
    writeFileSync(join(tempDir, 'docs', 'README.md'), '# Docs\n', 'utf-8')
    writeFileSync(join(tempDir, 'tests', 'sample.test.ts'), 'describe("x", () => {})\n', 'utf-8')
    writeFileSync(join(tempDir, 'node_modules', 'ignore.js'), 'console.log("ignore")\n', 'utf-8')
  }

  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    setupSampleRepo()
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should generate CODEBASE.md with required sections', async () => {
    const toolContext = { directory: tempDir } as any

    await openpaulMapCodebase.execute({ output: 'CODEBASE.md', maxDepth: 3 }, toolContext)

    const outputPath = join(tempDir, 'CODEBASE.md')
    expect(existsSync(outputPath)).toBe(true)
    const content = readFileSync(outputPath, 'utf-8')
    expect(content).toContain('# Codebase Map')
    expect(content).toContain('## Structure')
    expect(content).toContain('## Stack')
    expect(content).toContain('## Conventions')
    expect(content).toContain('## Concerns')
    expect(content).toContain('## Integrations')
    expect(content).toContain('## Architecture')
    expect(content).toContain('sample-project')
  })

  it('should respect maxDepth and exclude directories', async () => {
    const toolContext = { directory: tempDir } as any

    await openpaulMapCodebase.execute({ output: 'CODEBASE-depth1.md', maxDepth: 1 }, toolContext)

    const outputPath = join(tempDir, 'CODEBASE-depth1.md')
    const content = readFileSync(outputPath, 'utf-8')
    expect(content).toContain('no subdirectories detected')
    expect(content).not.toContain('node_modules')
  })

  it('should use cache when valid and bypass it with --force', async () => {
    const toolContext = { directory: tempDir } as any
    const outputPath = join(tempDir, 'CODEBASE.md')
    const cachePath = join(tempDir, '.openpaul', '.codebase-cache.json')

    await openpaulMapCodebase.execute({ output: 'CODEBASE.md', maxDepth: 2 }, toolContext)

    expect(existsSync(cachePath)).toBe(true)
    const cache = JSON.parse(readFileSync(cachePath, 'utf-8')) as { timestamp: number; entries: unknown[] }
    expect(cache.entries.length).toBeGreaterThan(0)

    const updatedTime = new Date(cache.timestamp + 1000)
    utimesSync(outputPath, updatedTime, updatedTime)

    const cachedResult = await openpaulMapCodebase.execute({ output: 'CODEBASE.md', maxDepth: 2 }, toolContext)
    expect(cachedResult).toContain('Codebase Cached')
    expect(cachedResult).toContain('Using cached result')

    const forcedResult = await openpaulMapCodebase.execute(
      { output: 'CODEBASE.md', maxDepth: 2, force: true },
      toolContext
    )
    expect(forcedResult).toContain('Codebase Mapped')
    expect(forcedResult).not.toContain('Using cached result')
  })
})
