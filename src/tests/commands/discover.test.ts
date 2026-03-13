/**
 * Discover Command Tests
 * 
 * Tests for /openpaul:discover command with depth modes
 */

import { openpaulDiscover } from '../../commands/discover'
import { existsSync } from 'fs'
import { atomicWrite } from '../../storage/atomic-writes'
import { PrePlanningManager } from '../../storage/pre-planning-manager'

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../storage/pre-planning-manager')

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
      string: () => chainable,
      number: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('openpaulDiscover', () => {
  const mockDirectory = '/test/project'
  const mockContext = { directory: mockDirectory }
  const mockPhaseDir = '/test/project/.planning/phases/06-test-phase'

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock behavior
    ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
      resolvePhaseDir: jest.fn().mockReturnValue(mockPhaseDir),
      createDiscovery: jest.fn().mockReturnValue('# Discovery\n\n## Options\n\n- Option 1\n- Option 2'),
    }))
    ;(existsSync as jest.Mock).mockReturnValue(false)
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('Quick mode (--quick flag)', () => {
    it('should return console output only (no file created)', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Which database to use?',
        quick: true,
      }, mockContext)

      expect(result).toContain('Quick Discovery')
      expect(result).toContain('No file created')
      expect(result).toContain('verbal response only')
    })

    it('should NOT call atomicWrite in quick mode', async () => {
      await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
        quick: true,
      }, mockContext)

      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should NOT call PrePlanningManager in quick mode', async () => {
      await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
        quick: true,
      }, mockContext)

      expect(PrePlanningManager).not.toHaveBeenCalled()
    })

    it('should include estimated time in quick mode', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
        quick: true,
      }, mockContext)

      expect(result).toContain('2-5 minutes')
    })

    it('should include topic in output', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Which auth provider?',
        quick: true,
      }, mockContext)

      expect(result).toContain('Which auth provider?')
    })
  })

  describe('Standard mode (default)', () => {
    it('should create DISCOVERY.md', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Database options',
      }, mockContext)

      expect(result).toContain('Discovery Created')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should include 2-3 options', async () => {
      await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Database options',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const call = managerInstance.createDiscovery.mock.calls[0]
      const params = call[1]

      expect(params.optionsConsidered.length).toBeGreaterThanOrEqual(2)
      expect(params.optionsConsidered.length).toBeLessThanOrEqual(3)
    })

    it('should return success message', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Database options',
      }, mockContext)

      expect(result).toContain('Discovery Created')
      expect(result).toContain('6')
    })

    it('should use standard depth', async () => {
      await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Database options',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createDiscovery).toHaveBeenCalledWith(6, expect.objectContaining({
        depth: 'standard',
      }))
    })

    it('should include estimated time in output', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Database options',
      }, mockContext)

      expect(result).toContain('15-30 minutes')
    })
  })

  describe('Deep mode (--deep flag)', () => {
    it('should show time estimate without --confirm', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Complex research topic',
        deep: true,
      }, mockContext)

      expect(result).toContain('Deep Mode Confirmation Required')
      expect(result).toContain('30-60 minutes')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should prompt for confirmation', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Complex research topic',
        deep: true,
      }, mockContext)

      expect(result).toContain('--confirm')
    })

    it('should create DISCOVERY.md with --confirm', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Complex research topic',
        deep: true,
        confirm: true,
      }, mockContext)

      expect(result).toContain('Discovery Created')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should include 5+ options in deep mode', async () => {
      await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Complex research topic',
        deep: true,
        confirm: true,
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const call = managerInstance.createDiscovery.mock.calls[0]
      const params = call[1]

      expect(params.optionsConsidered.length).toBeGreaterThanOrEqual(5)
    })

    it('should use deep depth', async () => {
      await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Complex research topic',
        deep: true,
        confirm: true,
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createDiscovery).toHaveBeenCalledWith(6, expect.objectContaining({
        depth: 'deep',
      }))
    })

    it('should include longer estimated time in output', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Complex research topic',
        deep: true,
        confirm: true,
      }, mockContext)

      expect(result).toContain('30-60 minutes')
    })
  })

  describe('Mode conflict', () => {
    it('should error when both --quick and --deep specified', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
        quick: true,
        deep: true,
      }, mockContext)

      expect(result).toContain('Conflicting Options')
      expect(result).toContain('--quick')
      expect(result).toContain('--deep')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should explain mode options in conflict error', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
        quick: true,
        deep: true,
      }, mockContext)

      expect(result).toContain('Quick verbal response')
      expect(result).toContain('Comprehensive research')
      expect(result).toContain('Standard research')
    })
  })

  describe('existing file handling', () => {
    it('should prompt to overwrite when file exists without --overwrite', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
      }, mockContext)

      expect(result).toContain('Discovery Already Exists')
      expect(result).toContain('--overwrite')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should overwrite with --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
        overwrite: true,
      }, mockContext)

      expect(result).toContain('Discovery Created')
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should return error when phase directory not found', async () => {
      ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
        resolvePhaseDir: jest.fn().mockReturnValue(null),
      }))

      const result = await (openpaulDiscover as any).execute({
        phase: 99,
        topic: 'Test topic',
      }, mockContext)

      expect(result).toContain('Cannot Discover')
      expect(result).toContain('not found')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should return formatted error on file write failure', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))

      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
      }, mockContext)

      expect(result).toContain('Discovery Creation Failed')
      expect(result).toContain('Write failed')
    })

    it('should handle unknown errors gracefully', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue('Unknown error string')

      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
      }, mockContext)

      expect(result).toContain('Discovery Creation Failed')
      expect(result).toContain('Unknown error occurred')
    })
  })

  describe('output formatting', () => {
    it('should include next steps in output', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
      }, mockContext)

      expect(result).toContain('Next Steps')
      expect(result).toContain('Edit DISCOVERY.md')
      expect(result).toContain('Add pros/cons')
      expect(result).toContain('Include sources')
    })

    it('should include topic in output', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Which database?',
      }, mockContext)

      expect(result).toContain('Which database?')
    })

    it('should include depth in output', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
      }, mockContext)

      expect(result).toContain('Depth')
      expect(result).toContain('standard')
    })

    it('should include file path in output', async () => {
      const result = await (openpaulDiscover as any).execute({
        phase: 6,
        topic: 'Test topic',
      }, mockContext)

      expect(result).toContain('DISCOVERY.md')
    })
  })
})
