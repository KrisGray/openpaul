/**
 * FlowsManager Tests
 *
 * Tests for FlowsManager class
 */

import { join } from 'path'
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { FlowsManager } from '../../storage/flows-manager'

describe('FlowsManager class', () => {
  const tempDir = join(__dirname, 'temp-flows-test')
  let flowsManager: FlowsManager

  const writeFlowsFile = (content: string): void => {
    const flowsDir = join(tempDir, '.openpaul')
    mkdirSync(flowsDir, { recursive: true })
    writeFileSync(join(flowsDir, 'SPECIAL-FLOWS.md'), content, 'utf-8')
  }

  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirSync(tempDir, { recursive: true })
    flowsManager = new FlowsManager(tempDir)
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('load', () => {
    it('should return empty enabled/disabled arrays when no flows file exists', () => {
      const flows = flowsManager.load()

      expect(flows).toEqual({ enabled: [], disabled: [] })
    })

    it('should parse YAML frontmatter and normalize flow IDs', () => {
      writeFlowsFile(`---
enabled:
  - SECURITY-REVIEW
  - docs-refresh
  - "  "
disabled:
  - release-audit
---
# Special Flows
`)

      const flows = flowsManager.load()

      expect(flows.enabled).toEqual(['security-review', 'docs-refresh'])
      expect(flows.disabled).toEqual(['release-audit'])
    })

    it('should throw when frontmatter is missing', () => {
      writeFlowsFile(`# Special Flows\nNo frontmatter here\n`)

      expect(() => flowsManager.load()).toThrow('missing YAML frontmatter')
    })

    it('should throw for unknown flow IDs', () => {
      writeFlowsFile(`---
enabled:
  - unknown-flow
disabled: []
---
`)

      expect(() => flowsManager.load()).toThrow('Unknown flow ID')
    })

    it('should throw for conflicts between enabled and disabled arrays', () => {
      writeFlowsFile(`---
enabled:
  - security-review
disabled:
  - security-review
---
`)

      expect(() => flowsManager.load()).toThrow('Conflicting flow IDs')
    })
  })

  describe('enable/disable', () => {
    it('should enable a flow and remove it from disabled', () => {
      writeFlowsFile(`---
enabled: []
disabled:
  - security-review
---
`)

      flowsManager.enable('security-review')

      const updated = new FlowsManager(tempDir).list()
      expect(updated.enabled).toContain('security-review')
      expect(updated.disabled).not.toContain('security-review')
    })

    it('should disable a flow and remove it from enabled', () => {
      writeFlowsFile(`---
enabled:
  - docs-refresh
disabled: []
---
`)

      flowsManager.disable('docs-refresh')

      const updated = new FlowsManager(tempDir).list()
      expect(updated.disabled).toContain('docs-refresh')
      expect(updated.enabled).not.toContain('docs-refresh')
    })
  })

  describe('init', () => {
    it('should create flows file at .openpaul/SPECIAL-FLOWS.md with frontmatter', () => {
      const flowsPath = FlowsManager.init(tempDir)

      expect(existsSync(flowsPath)).toBe(true)
      const content = readFileSync(flowsPath, 'utf-8')
      expect(content).toContain('enabled:')
      expect(content).toContain('disabled:')
      expect(content).toContain('Specialized Flows')
    })
  })
})
