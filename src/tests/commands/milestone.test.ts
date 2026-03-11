/**
 * Milestone Command Tests
 * 
 * Tests for the milestone command functionality
 */

import { RoadmapManager } from '../../roadmap/roadmap-manager'
import { MilestoneManager } from '../../storage/milestone-manager'
import { StateManager } from '../../state/state-manager'
import { paulMilestone } from '../../commands/milestone'
import { formatHeader, formatBold, formatList } from '../../output/formatter'
import type { PhaseEntry } from '../../types/roadmap'
import type { Milestone } from '../../types/milestone'

// Mock dependencies
jest.mock('../../roadmap/roadmap-manager')
jest.mock('../../storage/milestone-manager')
jest.mock('../../state/state-manager')
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

describe('Milestone Command', () => {
  const mockDirectory = '/test/project'

  let mockRoadmapManager: {
    resolveRoadmapPath: jest.Mock
    parsePhases: jest.Mock
  }

  let mockMilestoneManager: {
    createMilestone: jest.Mock
  }

  let mockStateManager: {
    getCurrentPosition: jest.Mock
  }

  const mockPhases: PhaseEntry[] = [
    { number: 3, name: 'Session Management', status: 'in-progress', directoryName: '03-session-management' },
    { number: 4, name: 'Roadmap Management', status: 'pending', directoryName: '04-roadmap-management' },
    { number: 5, name: 'Milestone Management', status: 'pending', directoryName: '05-milestone-management' },
    { number: 6, name: 'Pre-Planning', status: 'pending', directoryName: '06-pre-planning' },
  ]

  const mockMilestone: Milestone = {
    name: 'v1.1 Full Command Implementation',
    scope: 'Implement all remaining PAUL commands for complete structured development workflow',
    phases: [3, 4, 5, 6],
    theme: 'Full Feature Set',
    status: 'planned',
    startedAt: null,
    completedAt: null,
    createdAt: '2026-03-11T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockRoadmapManager = {
      resolveRoadmapPath: jest.fn(),
      parsePhases: jest.fn(),
    }

    mockMilestoneManager = {
      createMilestone: jest.fn(),
    }

    mockStateManager = {
      getCurrentPosition: jest.fn(),
    }

    ;(RoadmapManager as jest.Mock).mockImplementation(() => mockRoadmapManager)
    ;(MilestoneManager as jest.Mock).mockImplementation(() => mockMilestoneManager)
    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
  })

  describe('success cases', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.parsePhases.mockReturnValue(mockPhases)
      mockMilestoneManager.createMilestone.mockReturnValue(mockMilestone)
    })

    it('should create milestone with all required fields', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'v1.1 Full Command Implementation',
          scope: 'Implement all remaining PAUL commands',
          phases: '3,4,5,6',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(mockMilestoneManager.createMilestone).toHaveBeenCalledWith(
        'v1.1 Full Command Implementation',
        'Implement all remaining PAUL commands',
        [3, 4, 5, 6],
        undefined
      )
      expect(result).toContain('Milestone:')
      expect(result).toContain('v1.1 Full Command Implementation')
    })

    it('should create milestone with optional theme', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'v1.1 Features',
          scope: 'All commands',
          phases: '3,4',
          theme: 'Full Feature Set',
          updateState: undefined,
        },
        toolContext
      )

      expect(mockMilestoneManager.createMilestone).toHaveBeenCalledWith(
        'v1.1 Features',
        'All commands',
        [3, 4],
        'Full Feature Set'
      )
      expect(result).toContain('Theme:')
      expect(result).toContain('Full Feature Set')
    })

    it('should validate phase numbers exist', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test Milestone',
          scope: 'Test scope',
          phases: '3,4,99',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Invalid Phase Numbers')
      expect(result).toContain('99')
      expect(mockMilestoneManager.createMilestone).not.toHaveBeenCalled()
    })

    it('should prompt for STATE.md update in interactive mode', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'v1.1',
          scope: 'Commands',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Next step:')
      expect(result).toContain('Update STATE.md')
      expect(result).toContain('--updateState')
    })

    it('should skip STATE.md prompt with --updateState flag', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'v1.1',
          scope: 'Commands',
          phases: '3,4',
          theme: undefined,
          updateState: true,
        },
        toolContext
      )

      expect(result).toContain('STATE.md updated')
      expect(result).not.toContain('Next step:')
    })

    it('should trim whitespace from inputs', async () => {
      const toolContext = { directory: mockDirectory } as any
      await paulMilestone.execute(
        {
          name: '  v1.1 Features  ',
          scope: '  All commands  ',
          phases: ' 3 , 4 ',
          theme: '  Theme  ',
          updateState: undefined,
        },
        toolContext
      )

      expect(mockMilestoneManager.createMilestone).toHaveBeenCalledWith(
        'v1.1 Features',
        'All commands',
        [3, 4],
        'Theme'
      )
    })

    it('should return help message when no args provided', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: undefined,
          scope: undefined,
          phases: undefined,
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Create Milestone')
      expect(result).toContain('Required fields')
      expect(result).toContain('name')
      expect(result).toContain('scope')
      expect(result).toContain('phases')
      expect(mockMilestoneManager.createMilestone).not.toHaveBeenCalled()
    })
  })

  describe('error: ROADMAP.md not found', () => {
    it('should return error when ROADMAP.md does not exist', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('ROADMAP.md Not Found')
      expect(result).toContain('/openpaul:init')
      expect(mockMilestoneManager.createMilestone).not.toHaveBeenCalled()
    })
  })

  describe('error: invalid phase numbers', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.parsePhases.mockReturnValue(mockPhases)
    })

    it('should list valid phases when invalid phases provided', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '10,20',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Invalid Phase Numbers')
      expect(result).toContain('10, 20')
      expect(result).toContain('Valid phases')
      // formatList prefixes items with '- '
      expect(result).toContain('- Phase 3: Session Management')
    })
  })

  describe('error: missing required fields', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.parsePhases.mockReturnValue(mockPhases)
    })

    it('should return error when name is missing', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: undefined,
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('name is required')
      expect(mockMilestoneManager.createMilestone).not.toHaveBeenCalled()
    })

    it('should return error when scope is missing', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test Milestone',
          scope: undefined,
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('scope is required')
      expect(mockMilestoneManager.createMilestone).not.toHaveBeenCalled()
    })

    it('should return error when phases is missing', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test Milestone',
          scope: 'Test scope',
          phases: undefined,
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('phase number is required')
      expect(mockMilestoneManager.createMilestone).not.toHaveBeenCalled()
    })

    it('should return error when name is empty string', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: '',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('name is required')
    })

    it('should return error when name is whitespace only', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: '   ',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('name is required')
    })
  })

  describe('error: duplicate milestone', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.parsePhases.mockReturnValue(mockPhases)
      mockMilestoneManager.createMilestone.mockImplementation(() => {
        throw new Error('Milestone "v1.1" already exists')
      })
    })

    it('should handle duplicate milestone names', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'v1.1',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Duplicate Milestone')
      expect(result).toContain('already exists')
    })
  })

  describe('error: unexpected exception', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.parsePhases.mockReturnValue(mockPhases)
      mockMilestoneManager.createMilestone.mockImplementation(() => {
        throw new Error('Unexpected filesystem error')
      })
    })

    it('should handle unexpected errors gracefully', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Milestone Creation Failed')
      expect(result).toContain('Unexpected filesystem error')
      expect(result).toContain('Troubleshooting')
    })

    it('should handle non-Error exceptions', async () => {
      mockMilestoneManager.createMilestone.mockImplementation(() => {
        throw 'String error'
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Milestone Creation Failed')
      expect(result).toContain('Unknown error occurred')
    })
  })

  describe('output formatting', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.parsePhases.mockReturnValue(mockPhases)
      mockMilestoneManager.createMilestone.mockReturnValue(mockMilestone)
    })

    it('should format output with header + bullet list style', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'v1.1 Full Command Implementation',
          scope: 'Implement all commands',
          phases: '3,4,5,6',
          theme: 'Full Feature Set',
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('## Milestone:')
      expect(result).toContain('**Scope:**')
      expect(result).toContain('**Phases:**')
      expect(result).toContain('**Theme:**')
      expect(result).toContain('**Status:**')
    })

    it('should include milestone name in output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'v1.1 Features',
          scope: 'All commands',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('v1.1 Features')
    })

    it('should include phase numbers in output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,4,5,6',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Phases:')
      expect(result).toMatch(/3.*4.*5.*6/)
    })

    it('should include status in output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).toContain('Status:')
      expect(result).toContain('Planned')
    })

    it('should omit theme when not provided', async () => {
      mockMilestoneManager.createMilestone.mockReturnValue({
        ...mockMilestone,
        theme: null,
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(result).not.toContain('Theme:')
    })
  })

  describe('phase parsing', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.parsePhases.mockReturnValue(mockPhases)
      mockMilestoneManager.createMilestone.mockReturnValue(mockMilestone)
    })

    it('should parse comma-separated phase numbers', async () => {
      const toolContext = { directory: mockDirectory } as any
      await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,4,5,6',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(mockMilestoneManager.createMilestone).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        [3, 4, 5, 6],
        undefined
      )
    })

    it('should handle phases with spaces', async () => {
      const toolContext = { directory: mockDirectory } as any
      await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3, 4, 5',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(mockMilestoneManager.createMilestone).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        [3, 4, 5],
        undefined
      )
    })

    it('should filter out invalid phase numbers in input', async () => {
      const toolContext = { directory: mockDirectory } as any
      await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,abc,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(mockMilestoneManager.createMilestone).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        [3, 4],
        undefined
      )
    })

    it('should filter out negative phase numbers', async () => {
      const toolContext = { directory: mockDirectory } as any
      await paulMilestone.execute(
        {
          name: 'Test',
          scope: 'Test scope',
          phases: '3,-1,4',
          theme: undefined,
          updateState: undefined,
        },
        toolContext
      )

      expect(mockMilestoneManager.createMilestone).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        [3, 4],
        undefined
      )
    })
  })
})
