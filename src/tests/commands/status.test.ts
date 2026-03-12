/**
 * Status Command Tests
 * 
 * Tests for the status command functionality
 */

import { StateManager } from '../../state/state-manager'
import { FileManager } from '../../storage/file-manager'
import { SessionManager } from '../../storage/session-manager'
import { openpaulStatus } from '../../commands/status'
import { progressBar } from '../../output/progress-bar'
import { formatHeader, formatBold, formatList } from '../../output/formatter'
import { existsSync } from 'fs'

// Mock dependencies
jest.mock('../../state/state-manager')
jest.mock('../../storage/file-manager')
jest.mock('../../storage/session-manager')
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

describe('Status Command Functionality', () => {
  const mockDirectory = '/test/project'

  let mockStateManager: {
    getCurrentPosition: jest.Mock
    getRequiredNextAction: jest.Mock<any, any>
    loadPhaseState: jest.Mock
  }
  let mockFileManager: {
    readPlan: jest.Mock
  }
  let mockSessionManager: {
    loadCurrentSession: jest.Mock
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

    mockSessionManager = {
      loadCurrentSession: jest.fn(),
    }

    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)
    ;(SessionManager as jest.Mock).mockImplementation(() => mockSessionManager)
  })

  describe('not initialized state', () => {
    it('should return "Not initialized" if .openpaul/ doesn\'t exist', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('📍 OpenPAUL Status')
      expect(result).toContain('Not initialized')
      expect(result).toContain('/openpaul:init')
    })
  })

  describe('no active state', () => {
    it('should return error if no active state', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      mockStateManager.getCurrentPosition.mockReturnValue(undefined)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('No active state')
      expect(result).toContain('/openpaul:init')
    })
  })

  describe('loop visualization', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
    })

    it('should display loop visualization with correct markers', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'APPLY',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('📍 Loop:')
      expect(result).toContain('✓ PLAN')
      expect(result).toContain('◉ APPLY')
      expect(result).toContain('○ UNIFY')
    })

    it('should use correct loop markers (◉ ✓ ○)', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'PLAN',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      // Current phase should have ◉
      expect(result).toContain('◉ PLAN')
      // Future phases should have ○
      expect(result).toContain('○ APPLY')
      expect(result).toContain('○ UNIFY')
    })
  })

  describe('phase and stage display', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
    })

    it('should show current phase and stage', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 2,
        phase: 'APPLY',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 2,
        lastUpdated: Date.now(),
        metadata: {},
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('**Phase:** 2')
      expect(result).toContain('**Current Stage:** APPLY')
    })
  })

  describe('plan progress bar', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
    })

    it('should show plan progress bar when in APPLY phase', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 2,
        phase: 'APPLY',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 2,
        currentPlanId: '01',
        lastUpdated: Date.now(),
        metadata: {
          completedTasks: 2,
        },
      })
      mockFileManager.readPlan.mockReturnValue({
        tasks: [{ name: 'Task 1' }, { name: 'Task 2' }, { name: 'Task 3' }],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('Plan Progress')
      expect(result).toContain(progressBar(2, 3))
    })

    it('should format progress bar correctly', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 2,
        phase: 'APPLY',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 2,
        currentPlanId: '01',
        lastUpdated: Date.now(),
        metadata: {
          completedTasks: 1,
        },
      })
      mockFileManager.readPlan.mockReturnValue({
        tasks: [{ name: 'Task 1' }, { name: 'Task 2' }],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain(progressBar(1, 2))
    })
  })

  describe('session info', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
    })

    it('should show session info if paused', async () => {
      const pausedAt = Date.now() - 3600000 // 1 hour ago
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'APPLY',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'session-123',
        createdAt: pausedAt - 1000,
        pausedAt: pausedAt,
        phase: 'APPLY',
        phaseNumber: 1,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {},
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('Session Info')
      expect(result).toContain('session-123')
      expect(result).toContain('Paused:')
    })

    it('should show "No active session" if not paused', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'PLAN',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('No active session')
    })

    it('should show staleness warning for stale sessions', async () => {
      const pausedAt = Date.now() - (25 * 3600000) // 25 hours ago
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'APPLY',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'session-456',
        createdAt: pausedAt - 1000,
        pausedAt: pausedAt,
        phase: 'APPLY',
        phaseNumber: 1,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {},
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('⚠️')
      expect(result).toContain('h old')
    })
  })

  describe('next action', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
    })

    it('should show next action based on current phase', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'PLAN',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: false }, toolContext)

      expect(result).toContain('Next Action')
      expect(result).toContain('Run /openpaul:apply to execute the plan')
    })
  })

  describe('verbose mode', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
    })

    it('should show additional details in verbose mode', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'PLAN',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulStatus.execute({ verbose: true }, toolContext)

      expect(result).toContain('Details')
      expect(result).toContain('Current timestamp:')
      expect(result).toContain('File paths:')
      expect(result).toContain('.paul/STATE.md')
      expect(result).toContain('.paul/ROADMAP.md')
      expect(result).toContain('Quick Commands')
      expect(result).toContain('/openpaul:plan')
      expect(result).toContain('/openpaul:apply')
      expect(result).toContain('/openpaul:unify')
      expect(result).toContain('/openpaul:pause')
      expect(result).toContain('/openpaul:resume')
    })
  })
})
