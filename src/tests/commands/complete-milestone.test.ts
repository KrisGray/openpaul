/**
 * Complete Milestone Command Tests
 * 
 * Tests for the complete-milestone command functionality
 */

import { RoadmapManager } from '../../roadmap/roadmap-manager'
import { MilestoneManager } from '../../storage/milestone-manager'
import { openpaulCompleteMilestone } from '../../commands/complete-milestone'
import { formatHeader, formatBold, formatList } from '../../output/formatter'
import type { Milestone, MilestoneProgress, MilestoneArchiveEntry } from '../../types/milestone'

// Mock dependencies
jest.mock('../../roadmap/roadmap-manager')
jest.mock('../../storage/milestone-manager')
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

describe('Complete Milestone Command', () => {
  const mockDirectory = '/test/project'

  let mockRoadmapManager: {
    resolveRoadmapPath: jest.Mock
    parsePhases: jest.Mock
  }

  let mockMilestoneManager: {
    getMilestone: jest.Mock
    getActiveMilestone: jest.Mock
    getMilestoneProgress: jest.Mock
    completeMilestone: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockRoadmapManager = {
      resolveRoadmapPath: jest.fn(),
      parsePhases: jest.fn(),
    }

    mockMilestoneManager = {
      getMilestone: jest.fn(),
      getActiveMilestone: jest.fn(),
      getMilestoneProgress: jest.fn(),
      completeMilestone: jest.fn(),
    }

    ;(RoadmapManager as jest.Mock).mockImplementation(() => mockRoadmapManager)
    ;(MilestoneManager as jest.Mock).mockImplementation(() => mockMilestoneManager)
  })

  const mockMilestone: Milestone = {
    name: 'v1.1 Full Command Implementation',
    scope: 'Complete all milestone and session commands',
    phases: [3, 4, 5],
    theme: null,
    status: 'in-progress',
    startedAt: '2026-03-01T00:00:00Z',
    completedAt: null,
    createdAt: '2026-03-01T00:00:00Z',
  }

  const mockProgress: MilestoneProgress = {
    milestoneName: 'v1.1 Full Command Implementation',
    phasesCompleted: 3,
    phasesTotal: 3,
    percentage: 100,
    phaseStatus: [
      { number: 3, status: 'complete' },
      { number: 4, status: 'complete' },
      { number: 5, status: 'complete' },
    ],
  }

  const mockArchiveEntry: MilestoneArchiveEntry = {
    name: 'v1.1 Full Command Implementation',
    scope: 'Complete all milestone and session commands',
    phases: [3, 4, 5],
    startedAt: '2026-03-01T00:00:00Z',
    completedAt: '2026-03-11T15:00:00Z',
    plansCompleted: 15,
    totalPlans: 15,
    executionTime: '10 days',
    requirementsAddressed: ['MILE-01', 'MILE-02', 'SESS-01'],
  }

  describe('success cases', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(mockProgress)
      mockMilestoneManager.completeMilestone.mockReturnValue(mockArchiveEntry)
    })

    it('should show summary and prompt for confirmation without --confirm', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(mockMilestoneManager.getActiveMilestone).toHaveBeenCalled()
      expect(mockMilestoneManager.getMilestoneProgress).toHaveBeenCalledWith(mockMilestone.name)
      expect(mockMilestoneManager.completeMilestone).not.toHaveBeenCalled()
      expect(result).toContain('Completing Milestone')
      expect(result).toContain(mockMilestone.name)
      expect(result).toContain('Confirm?')
      expect(result).toContain('--confirm')
    })

    it('should complete milestone with --confirm flag', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(mockMilestoneManager.completeMilestone).toHaveBeenCalledWith(mockMilestone.name)
      expect(result).toContain('Milestone Completed')
      expect(result).toContain(mockArchiveEntry.name)
    })

    it('should use specified milestone name', async () => {
      mockMilestoneManager.getMilestone.mockReturnValue(mockMilestone)
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ 
        name: 'v1.1 Full Command Implementation',
        confirm: true,
      }, toolContext)

      expect(mockMilestoneManager.getMilestone).toHaveBeenCalledWith('v1.1 Full Command Implementation')
      expect(mockMilestoneManager.completeMilestone).toHaveBeenCalled()
    })

    it('should show metrics in summary before confirmation', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('Phases:')
      expect(result).toContain('3/3')
      expect(result).toContain('100%')
    })

    it('should include archive location in success output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('MILESTONE-ARCHIVE.md')
    })

    it('should include what will happen in confirmation prompt', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('Archive milestone')
      expect(result).toContain('Collapse phases')
      expect(result).toContain('Update progress tracking')
    })

    it('should show verbose phase breakdown with --verbose flag', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ verbose: true }, toolContext)

      expect(result).toContain('Phase Details')
      expect(result).toContain('Phase 3')
      expect(result).toContain('Phase 4')
      expect(result).toContain('Phase 5')
    })
  })

  describe('error: ROADMAP.md not found', () => {
    it('should return error when ROADMAP.md does not exist', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue(null)
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('Cannot Complete Milestone')
      expect(result).toContain('ROADMAP.md not found')
      expect(result).toContain('/openpaul:init')
      expect(mockMilestoneManager.getActiveMilestone).not.toHaveBeenCalled()
    })
  })

  describe('error: milestone not found', () => {
    it('should return error when specified milestone not found', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getMilestone.mockReturnValue(null)
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ 
        name: 'Non-existent Milestone',
      }, toolContext)

      expect(result).toContain('Milestone Not Found')
      expect(result).toContain('Non-existent Milestone')
    })

    it('should show active milestone in error when available', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getMilestone.mockReturnValue(null)
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ 
        name: 'Non-existent Milestone',
      }, toolContext)

      expect(result).toContain('Active milestone')
      expect(result).toContain(mockMilestone.name)
    })
  })

  describe('error: no active milestone', () => {
    it('should return error when no active milestone found', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('No Active Milestone')
      expect(result).toContain('/openpaul:milestone')
    })
  })

  describe('error: already completed', () => {
    it('should return error when milestone already completed', async () => {
      const completedMilestone: Milestone = { ...mockMilestone, status: 'completed' }
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(completedMilestone)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('Already Completed')
      expect(result).toContain('MILESTONE-ARCHIVE.md')
    })
  })

  describe('warning: incomplete phases', () => {
    it('should show warning when phases are incomplete', async () => {
      const incompleteProgress: MilestoneProgress = {
        ...mockProgress,
        phasesCompleted: 2,
        phasesTotal: 3,
        percentage: 67,
        phaseStatus: [
          { number: 3, status: 'complete' },
          { number: 4, status: 'complete' },
          { number: 5, status: 'in-progress' },
        ],
      }
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(incompleteProgress)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('Warning')
      expect(result).toContain('Incomplete Phases')
      expect(result).toContain('Phase 5')
      expect(result).toContain('in-progress')
    })

    it('should still allow completion with incomplete phases and --confirm', async () => {
      const incompleteProgress: MilestoneProgress = {
        ...mockProgress,
        phasesCompleted: 2,
        phasesTotal: 3,
        percentage: 67,
        phaseStatus: [
          { number: 3, status: 'complete' },
          { number: 4, status: 'complete' },
          { number: 5, status: 'pending' },
        ],
      }
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(incompleteProgress)
      mockMilestoneManager.completeMilestone.mockReturnValue(mockArchiveEntry)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(mockMilestoneManager.completeMilestone).toHaveBeenCalled()
      expect(result).toContain('Milestone Completed')
    })
  })

  describe('error: progress calculation failed', () => {
    it('should return error when progress cannot be calculated', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('Error Calculating Progress')
    })
  })

  describe('error: completeMilestone throws error', () => {
    it('should handle already completed error', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(mockProgress)
      mockMilestoneManager.completeMilestone.mockImplementation(() => {
        throw new Error('Milestone "v1.1" is already completed')
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Already Completed')
    })

    it('should handle not found error', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(mockProgress)
      mockMilestoneManager.completeMilestone.mockImplementation(() => {
        throw new Error('Milestone not found')
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Milestone Not Found')
    })

    it('should handle unexpected errors gracefully', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(mockProgress)
      mockMilestoneManager.completeMilestone.mockImplementation(() => {
        throw new Error('Unexpected filesystem error')
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Completion Failed')
      expect(result).toContain('Unexpected filesystem error')
    })

    it('should handle non-Error exceptions', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(mockProgress)
      mockMilestoneManager.completeMilestone.mockImplementation(() => {
        throw 'String error'
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Completion Failed')
      expect(result).toContain('Unknown error')
    })
  })

  describe('output formatting', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockMilestoneManager.getActiveMilestone.mockReturnValue(mockMilestone)
      mockMilestoneManager.getMilestoneProgress.mockReturnValue(mockProgress)
      mockMilestoneManager.completeMilestone.mockReturnValue(mockArchiveEntry)
    })

    it('should include plans completed in success output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Plans Completed')
      expect(result).toContain('15/15')
    })

    it('should include execution time in success output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Execution Time')
      expect(result).toContain('10 days')
    })

    it('should include requirements addressed count', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Requirements Addressed')
      expect(result).toContain('3')
    })

    it('should include next steps after completion', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({ confirm: true }, toolContext)

      expect(result).toContain('Next Steps')
      expect(result).toContain('/openpaul:status')
    })

    it('should include scope in summary display', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulCompleteMilestone.execute({}, toolContext)

      expect(result).toContain('Scope:')
      expect(result).toContain(mockMilestone.scope)
    })
  })
})
