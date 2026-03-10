/**
 * Remove Phase Command Tests
 * 
 * Tests for the remove-phase command functionality
 */

import { existsSync } from 'fs'
import { RoadmapManager } from '../../roadmap/roadmap-manager'
import { paulRemovePhase } from '../../commands/remove-phase'
import { formatHeader, from '../../output/formatter'
import type { RoadmapValidationResult, RemovePhaseResult, PhaseEntry } from '../../types/roadmap'

import { PhaseEntrySchema } from '../../types/roadmap'

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))
jest.mock('../../roadmap/roadmap-manager')
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

describe('Remove Phase Command', () => {
  const mockDirectory = '/test/project'

  let mockRoadmapManager: {
    resolveRoadmapPath: jest.Mock,
    canRemovePhase: jest.Mock
    removePhase: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockRoadmapManager = {
      resolveRoadmapPath: jest.fn(),
      canRemovePhase: jest.fn(),
      removePhase: jest.fn(),
    }

    ;(RoadmapManager as jest.Mock).mockImplementation(() => mockRoadmapManager)
    ;(existsSync as jest.Mock).mockReturnValue(true)
  const mockPhaseEntry: PhaseEntry = {
    number: 3,
    name: 'Phase to Remove',
    status: 'pending',
    directoryName: '03-phase-to-remove',
  }

  describe('success cases', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: true,
        errors: [],
      } as RoadmapValidationResult)
      mockRoadmapManager.removePhase.mockReturnValue({
        success: true,
        removedPhase: mockPhaseEntry,
        renumberedPhases: [4, 5],
      } as RemovePhaseResult)
    })

    it('should remove phase and return confirmation', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)

      expect(mockRoadmapManager.canRemovePhase).toHaveBeenCalledWith(3, expect.any(String))
      expect(mockRoadmapManager.removePhase).toHaveBeenCalledWith(3)
      expect(result).toContain('Phase Removed')
      expect(result).toContain('3')
    })

    it('should show renumbered phases in output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('2 subsequent phases renumbered')
    })
    it('should show next steps after removal', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Next steps')
      expect(result).toContain('Review ROADMAP.md')
    })
    it('should handle removal without renumbering (last phase)', async () => {
      mockRoadmapManager.removePhase.mockReturnValue({
        success: true,
        removedPhase: mockPhaseEntry,
        renumberedPhases: [],
      } as RemovePhaseResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Phase Removed')
      expect(result).not.toContain('subnumbered')
    })
  })
  describe('error: ROADMAP.md not found', () => {
    it('should return error when ROADMAP.md does not exist', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue(null)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Cannot Remove Phase')
      expect(result).toContain('ROADMAP.md not found')
      expect(result).toContain('/openpaul:init')
      expect(mockRoadmapManager.canRemovePhase).not.toHaveBeenCalled()
      expect(mockRoadmapManager.removePhase).not.toHaveBeenCalled()
    })
  })
  describe('error: phase does not exist', () => {
    it('should return error when validation fails for non-existent phase', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: false,
        errors: ['Phase 99 does not exist.'],
      } as RoadmapValidationResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 99 }, toolContext)
      expect(result).toContain('Cannot Remove Phase')
      expect(result).toContain('Phase 99 does not exist')
      expect(mockRoadmapManager.removePhase).not.toHaveBeenCalled()
    })
  })
  describe('error: cannot remove completed phase', () => {
    it('should return error when phase is completed', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: false,
        errors: ['Cannot remove completed phase 3.'],
      } as RoadmapValidationResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Cannot Remove Phase')
      expect(result).toContain('completed phase')
      expect(result).toContain('Why this is blocked')
    })
  })
  describe('error: cannot remove current phase', () => {
    it('should return error when phase is current (from STATE.md)', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: false,
        errors: ['Cannot remove current phase 3 (currently in progress).'],
      } as RoadmapValidationResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Cannot Remove Phase')
      expect(result).toContain('Cannot remove current phase')
      expect(result).toContain('currently in progress')
    })
  })
  describe('error: cannot remove phase with in-progress plans', () => {
    it('should return error when phase has in-progress plans', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: false,
        errors: ['Cannot remove phase 3: has in-progress plans.'],
      } as RoadmapValidationResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Cannot Remove Phase')
      expect(result).toContain('in-progress plans')
    })
  })
  describe('error: multiple validation errors', () => {
    it('should display all validation errors clearly', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: false,
        errors: [
          'Cannot remove completed phase 3.',
          'Cannot remove current phase 3.',
        ],
      } as RoadmapValidationResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Cannot Remove Phase')
      expect(result).toContain('completed phase')
      expect(result).toContain('current phase')
    })
  })
  describe('error: removal failed', () => {
    it('should return error when removePhase returns failure', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: true,
        errors: [],
      } as RoadmapValidationResult)
      mockRoadmapManager.removePhase.mockReturnValue({
        success: false,
        removedPhase: null,
        renumberedPhases: [],
      } as RemovePhaseResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Removal Failed')
      expect(result).toContain('Troubleshooting')
    })
  })
  describe('error: unexpected exception', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockImplementation(() => {
        throw new Error('Unexpected filesystem error')
      })
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Removal Failed')
      expect(result).toContain('Unexpected filesystem error')
      expect(result).toContain('Troubleshooting')
    })
    it('should handle non-Error exceptions', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockImplementation(() => {
        throw 'String error'
      })
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(result).toContain('Removal Failed')
      expect(result).toContain('Unknown error')
    })
  })
  describe('STATE.md path resolution', () => {
    it('should use .paul/STATE.md when it exists', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.endsWith('.paul/STATE.md')) return true
        if (path.endsWith('.paul/ROADMAP.md')) return true
        return false
      })
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: true,
        errors: [],
      } as RoadmapValidationResult)
      mockRoadmapManager.removePhase.mockReturnValue({
        success: true,
        removedPhase: mockPhaseEntry,
        renumberedPhases: [],
      } as RemovePhaseResult)
      const toolContext = { directory: mockDirectory } as any
      await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(mockRoadmapManager.canRemovePhase).toHaveBeenCalledWith(3, '/test/project/.paul/STATE.md')
    })
    it('should use .openpaul/STATE.md as fallback', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.endsWith('.openpaul/STATE.md')) return true
        if (path.endsWith('.openpaul/ROADMAP.md')) return true
        return false
      })
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.openpaul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: true,
        errors: [],
      } as RoadmapValidationResult)
      mockRoadmapManager.removePhase.mockReturnValue({
        success: true,
        removedPhase: mockPhaseEntry,
        renumberedPhases: [],
      } as RemovePhaseResult)
      const toolContext = { directory: mockDirectory } as any
      await paulRemovePhase.execute({ phase: 3 }, toolContext)
      expect(mockRoadmapManager.canRemovePhase).toHaveBeenCalledWith(3, '/test/project/.openpaul/STATE.md')
    })
  })
  describe('output formatting', () => {
    it('should include phase number in output', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: true,
        errors: [],
      } as RoadmapValidationResult)
      mockRoadmapManager.removePhase.mockReturnValue({
        success: true,
        removedPhase: mockPhaseEntry,
        renumberedPhases: [4, 5, 6, 7, 8],
      } as RemovePhaseResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 5 }, toolContext)
      expect(result).toContain('5')
    })
    it('should include renumbered count when applicable', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: true,
        errors: [],
      } as RoadmapValidationResult)
      const removedPhaseWith5: PhaseEntry = { ...mockPhaseEntry, number: 5 }
      mockRoadmapManager.removePhase.mockReturnValue({
        success: true,
        removedPhase: removedPhaseWith5,
        renumberedPhases: [6, 7, 8, 9, 10],
      } as RemovePhaseResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 5 }, toolContext)
      expect(result).toContain('5 subsequent phases renumbered')
    })
    it('should suggest next actions', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.canRemovePhase.mockReturnValue({
        valid: true,
        errors: [],
      } as RoadmapValidationResult)
      mockRoadmapManager.removePhase.mockReturnValue({
        success: true,
        removedPhase: mockPhaseEntry,
        renumberedPhases: [6],
      } as RemovePhaseResult)
      const toolContext = { directory: mockDirectory } as any
      const result = await paulRemovePhase.execute({ phase: 6 }, toolContext)
      expect(result).toContain('/openpaul:status')
      expect(result).toContain('ROADMAP.md')
    })
  })
})
