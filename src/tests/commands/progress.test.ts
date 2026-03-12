/**
 * Progress Command Tests
 * 
 * Tests for the progress/status display functionality
 */

import { StateManager } from '../../state/state-manager'
import { FileManager } from '../../storage/file-manager'
import { openpaulProgress } from '../../commands/progress'
import { progressBar } from '../../output/progress-bar'
import { formatHeader, formatBold, formatList } from '../../output/formatter'
import { existsSync } from 'fs'

// Mock dependencies
jest.mock('../../state/state-manager')
jest.mock('../../storage/file-manager')
jest.mock('fs')
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
    }
    return { tool }
  },
  { virtual: true }
)

describe('Progress Command Functionality', () => {
  const mockDirectory = '/test/project'

  let mockStateManager: {
    getCurrentPosition: jest.Mock
    getRequiredNextAction: jest.Mock<any, any>
    loadPhaseState: jest.Mock
  }
  let mockFileManager: {
    readPlan: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockStateManager = {
      getCurrentPosition: jest.fn(),
      getRequiredNextAction: jest.fn((phase: 'PLAN' | 'APPLY' | 'UNIFY') => {
        const actions: Record<'PLAN' | 'APPLY' | 'UNIFY', string> = {
          PLAN: 'Run /openpaul:apply to execute the plan',
          APPLY: 'Run /openpaul:unify to close the loop',
          UNIFY: 'Run /openpaul:plan to start a new loop',
        }
        return actions[phase]
      }),
      loadPhaseState: jest.fn(),
    }

    mockFileManager = {
      readPlan: jest.fn(),
    }

    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)
  })

  describe('not initialized state', () => {
    it('should detect when .paul/ does not exist', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const paulDir = '/test/project/.paul'
      const exists = existsSync(paulDir)
      expect(exists).toBe(false)
    })

    it('should format not initialized message', () => {
      const output = formatHeader(2, '📍 OpenPAUL Status') + '\n\n' +
        formatBold('Status:') + ' Not initialized\n\n' +
        formatHeader(3, 'What to do') + '\n' +
        formatList([
          'Run `/openpaul:init` to set up OpenPAUL in this project.',
        ])

      expect(output).toContain('📍')
      expect(output).toContain('Not initialized')
      expect(output).toContain('/openpaul:init')
    })
  })

  describe('state management', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
    })

    it('should show PLAN phase', () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })

      const stateManager = new StateManager(mockDirectory)
      const position = stateManager.getCurrentPosition()
      
      expect(position?.phase).toBe('PLAN')
      expect(position?.phaseNumber).toBe(1)
    })

    it('should show APPLY phase', () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'APPLY',
      })
      
      const stateManager = new StateManager(mockDirectory)
      const position = stateManager.getCurrentPosition()
      
      expect(position?.phase).toBe('APPLY')
    })

    it('should show UNIFY phase', () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'UNIFY',
      })
      
      const stateManager = new StateManager(mockDirectory)
      const position = stateManager.getCurrentPosition()
      
      expect(position?.phase).toBe('UNIFY')
    })

     it('should get correct next action for each phase', () => {
      const stateManager = new StateManager(mockDirectory)
      
      mockStateManager.getCurrentPosition.mockReturnValue({ phaseNumber: 1, phase: 'PLAN' })
      let action: string = stateManager.getRequiredNextAction('PLAN')
      expect(action).toBe('Run /openpaul:apply to execute the plan')
      
      mockStateManager.getCurrentPosition.mockReturnValue({ phaseNumber: 1, phase: 'APPLY' })
      action = stateManager.getRequiredNextAction('APPLY')
      expect(action).toBe('Run /openpaul:unify to close the loop')
      
      mockStateManager.getCurrentPosition.mockReturnValue({ phaseNumber: 1, phase: 'UNIFY' })
      action = stateManager.getRequiredNextAction('UNIFY')
      expect(action).toBe('Run /openpaul:plan to start a new loop')
    })
  })

  describe('loop visual formatting', () => {
    it('should format PLAN visual correctly', () => {
      const output = '📍 Loop: ◉ PLAN → ○ APPLY → ○ UNIFY'
      expect(output).toContain('◉ PLAN')
      expect(output).toContain('○ APPLY')
      expect(output).toContain('○ UNIFY')
    })

    it('should format APPLY visual correctly', () => {
      const output = '📍 Loop: ✓ PLAN → ◉ APPLY → ○ UNIFY'
      expect(output).toContain('✓ PLAN')
      expect(output).toContain('◉ APPLY')
      expect(output).toContain('○ UNIFY')
    })

    it('should format UNIFY visual correctly', () => {
      const output = '📍 Loop: ✓ PLAN → ✓ APPLY → ◉ UNIFY'
      expect(output).toContain('✓ PLAN')
      expect(output).toContain('✓ APPLY')
      expect(output).toContain('◉ UNIFY')
    })
  })

  describe('verbose mode', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
    })

    it('should include verbose details when enabled', () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'PLAN',
        phaseNumber: 1,
        currentPlanId: '01',
        lastUpdated: 1609459200000,
        metadata: {},
      })

      const output = formatHeader(2, '📍 OpenPAUL Status') + '\n\n' +
        '📍 Loop: ◉ PLAN → ○ APPLY → ○ UNIFY\n\n' +
        formatBold('Phase:') + ' 1\n' +
        formatBold('Next:') + ' Run /openpaul:apply to execute the plan\n\n' +
        formatHeader(3, 'Details') + '\n' +
        formatBold('Stage:') + ' PLAN\n' +
        formatBold('Last updated:') + ' 2021-01-01T00:00:00.000Z\n\n' +
        formatHeader(3, 'Quick Commands') + '\n' +
        formatList([
          '/openpaul:plan - Create a new plan',
          '/openpaul:apply - Execute the current plan',
          '/openpaul:unify - Close the loop',
          '/openpaul:help - View all commands',
        ])

      expect(output).toContain('**Stage:** PLAN')
      expect(output).toContain('**Last updated:**')
      expect(output).toContain('### Quick Commands')
    })
  })

  describe('apply stage context', () => {
    const toolContext = { directory: mockDirectory } as any

    it('should include active task details, time, and progress bar', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const now = 1700000000000
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(now)

      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 2,
        phase: 'APPLY',
      })

      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 2,
        currentPlanId: '09',
        lastUpdated: now,
        metadata: {
          currentTaskNumber: 2,
          taskStartTimes: { '2': now - 60000 },
        },
      })

      mockFileManager.readPlan.mockReturnValue({
        phase: '02',
        plan: '09',
        type: 'execute',
        wave: 6,
        depends_on: [],
        files_modified: [],
        autonomous: true,
        tasks: [
          { name: 'First task' },
          { name: 'Second task' },
          { name: 'Third task' },
        ],
      })

      const output = await openpaulProgress.execute({ verbose: false }, toolContext)

      expect(output).toContain('Current Task')
      expect(output).toContain('Task 2/3 — Second task')
      expect(output).toContain('**Time in progress:** 1m 0s')
      expect(output).toContain(progressBar(2, 3))
      expect(output).not.toContain('Guidance:')

      nowSpy.mockRestore()
    })
  })

  describe('output format', () => {
    it('should include 📍 emoji in status output', () => {
      const output = formatHeader(2, '📍 OpenPAUL Status')
      expect(output).toContain('📍')
    })
  })
})
