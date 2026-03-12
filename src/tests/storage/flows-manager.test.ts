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
    it('should return empty array when no flows file exists', () => {
      const flows = flowsManager.load()
      
      expect(flows).toEqual([])
    })

    it('should load flows from .openpaul/SPECIAL-FLOWS.md', () => {
      const flowsDir = join(tempDir, '.openpaul')
      mkdirSync(flowsDir, { recursive: true })
      const flowsContent = `# Special Flows

| Name | Enabled | Trigger |
|------|---------|---------|
| security-review | true | ./**/*.spec.ts |
| docs-update | false | docs/** |
`
      writeFileSync(join(flowsDir, 'SPECIAL-FLOWS.md'), flowsContent)

      const manager = new FlowsManager(tempDir)
      const flows = manager.load()

      expect(flows.length).toBeGreaterThan(0)
    })
  })

  describe('list', () => {
    it('should return empty array when no flows file exists', () => {
      const flows = flowsManager.list()
      
      expect(flows).toEqual([])
    })
  })

  describe('enable/disable', () => {
    it('should enable a flow', () => {
      const flowsDir = join(tempDir, '.openpaul')
      mkdirSync(flowsDir, { recursive: true })
      writeFileSync(join(flowsDir, 'SPECIAL-FLOWS.md'), `# Special Flows

| Name | Enabled | Trigger |
|------|---------|---------|
| test-flow | false | - |
`)

      const manager = new FlowsManager(tempDir)
      const success = manager.enable('test-flow')
      
      expect(success).toBe(true)
    })

    it('should disable a flow', () => {
      const flowsDir = join(tempDir, '.openpaul')
      mkdirSync(flowsDir, { recursive: true })
      writeFileSync(join(flowsDir, 'SPECIAL-FLOWS.md'), `# Special Flows

| Name | Enabled | Trigger |
|------|---------|---------|
| test-flow | true | - |
`)

      const manager = new FlowsManager(tempDir)
      const success = manager.disable('test-flow')
      
      expect(success).toBe(true)
    })

    it('should return false for non-existent flow', () => {
      const success = flowsManager.enable('nonexistent')
      
      expect(success).toBe(false)
    })
  })

  describe('init', () => {
    it('should create flows file at .openpaul/SPECIAL-FLOWS.md', () => {
      const flowsPath = FlowsManager.init(tempDir)
      
      expect(existsSync(flowsPath)).toBe(true)
      const content = readFileSync(flowsPath, 'utf-8')
      expect(content).toContain('Special Flows')
    })
  })
})
