/**
 * Pause Command Tests
 * 
 * Tests for /paul:pause command functionality
 */

import { paulPause } from '../../commands/pause'
import { StateManager } from '../../state/state-manager'
import { SessionManager } from '../../storage/session-manager'
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync } from 'fs'

// Mock dependencies
jest.mock('../../state/state-manager')
jest.mock('../../storage/session-manager')
jest.mock('../../storage/atomic-writes')
jest.mock('fs')
jest.mock(
  '@opencode-ai/plugin',
  () => ({
    tool: (input: any) => input,
  }),
  { virtual: true }
)

describe('paulPause command', () => {
  const mockDirectory = '/test/project'
  const toolContext = { directory: mockDirectory } as any

  let mockStateManager: {
    getCurrentPosition: jest.Mock
    getRequiredNextAction: jest.Mock
    loadPhaseState: jest.Mock
  }
  let mockSessionManager: {
    getCurrentSessionId: jest.Mock
    loadCurrentSession: jest.Mock
    generateSessionId: jest.Mock
    saveSession: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockStateManager = {
      getCurrentPosition: jest.fn().mockReturnValue({
        phase: 'PLAN',
        phaseNumber: 2,
      }),
      getRequiredNextAction: jest.fn().mockReturnValue('Run /paul:apply'),
      loadPhaseState: jest.fn().mockReturnValue({
        currentPlanId: '02',
        completedPlans: [],
        plans: [],
      }),
    }

    mockSessionManager = {
      getCurrentSessionId: jest.fn().mockReturnValue(null),
      loadCurrentSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-123'),
      saveSession: jest.fn().mockResolvedValue(undefined),
    }

    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(SessionManager as jest.Mock).mockImplementation(() => mockSessionManager)

    // Mock file system operations
    ;(existsSync as jest.Mock).mockReturnValue(true)
    ;(readFileSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('model-config.json')) {
        return JSON.stringify({ projectName: 'Test Project' })
      }
      if (path.includes('ROADMAP.md')) {
        return '# Roadmap\n\n### Phase 2: Test Phase'
      }
      return ''
    })
    ;(readdirSync as jest.Mock).mockReturnValue([])
    ;(statSync as jest.Mock).mockReturnValue({ isFile: () => false, isDirectory: () => true })
    ;(mkdirSync as jest.Mock).mockReturnValue(undefined)
  })

  describe('successful pause', () => {
    it('should create session state with correct fields', async () => {
      await paulPause.execute({}, toolContext)

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          phase: 'PLAN',
          phaseNumber: 2,
          createdAt: expect.any(Number),
          pausedAt: expect.any(Number),
          nextSteps: expect.arrayContaining(['Run /paul:apply']),
          fileChecksums: expect.any(Object),
        })
      )
    })

    it('should save session via SessionManager.saveSession', async () => {
      await paulPause.execute({}, toolContext)

      expect(mockSessionManager.saveSession).toHaveBeenCalled()
    })

    it('should return formatted success message', async () => {
      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('✅ Session Paused')
      expect(result).toContain('session-123')
      expect(result).toContain('Current phase')
      expect(result).toContain('Loop position')
      expect(result).toContain('HANDOFF.md')
    })

    it('should include next steps in output', async () => {
      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('Next Steps')
      expect(result).toContain('/paul:resume')
      expect(result).toContain('/paul:status')
    })

    it('should capture correct loop position (phase, phaseNumber)', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 3,
      })

      await paulPause.execute({}, toolContext)

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'APPLY',
          phaseNumber: 3,
        })
      )
    })

    it('should include correct next steps in session state', async () => {
      mockStateManager.getRequiredNextAction.mockReturnValue('Custom next action')

      await paulPause.execute({}, toolContext)

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          nextSteps: ['Custom next action'],
        })
      )
    })
  })

  describe('warning scenarios', () => {
    it('should warn about overwriting recent session (< 24 hours)', async () => {
      const recentTime = Date.now() - 12 * 60 * 60 * 1000 // 12 hours ago

      mockSessionManager.getCurrentSessionId.mockReturnValue('old-session')
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'old-session',
        pausedAt: recentTime,
      })

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('⚠️ Recent Session Exists')
      expect(result).toContain('12 hours ago')
      expect(result).toContain('/paul:resume')
    })

    it('should not warn for old sessions (> 24 hours)', async () => {
      const oldTime = Date.now() - 48 * 60 * 60 * 1000 // 48 hours ago

      mockSessionManager.getCurrentSessionId.mockReturnValue('old-session')
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'old-session',
        pausedAt: oldTime,
      })

      await paulPause.execute({}, toolContext)

      expect(mockSessionManager.saveSession).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should return error if no active state (not initialized)', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue(undefined)

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('❌ Cannot Pause')
      expect(result).toContain('not been initialized')
      expect(result).toContain('/paul:init')
    })

    it('should return formatted error on file write failure', async () => {
      mockSessionManager.saveSession.mockRejectedValue(new Error('Write failed'))

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('❌ Pause Failed')
      expect(result).toContain('Write failed')
      expect(result).toContain('Troubleshooting')
    })
  })
})
