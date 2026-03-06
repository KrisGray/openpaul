/**
 * Resume Command Tests
 * 
 * Tests for /paul:resume command functionality
 */

import { paulResume } from '../../commands/resume'
import { StateManager } from '../../state/state-manager'
import { SessionManager } from '../../storage/session-manager'
import { existsSync, readFileSync } from 'fs'

// Mock dependencies
jest.mock('../../state/state-manager')
jest.mock('../../storage/session-manager')
jest.mock('fs')
jest.mock(
  '@opencode-ai/plugin',
  () => ({
    tool: (input: any) => input,
  }),
  { virtual: true }
)

describe('paulResume command', () => {
  const mockDirectory = '/test/project'
  const toolContext = { directory: mockDirectory } as any

  let mockStateManager: {
    getRequiredNextAction: jest.Mock
  }
  let mockSessionManager: {
    loadCurrentSession: jest.Mock
    validateSessionState: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockStateManager = {
      getRequiredNextAction: jest.fn().mockReturnValue('Run /paul:apply'),
    }

    mockSessionManager = {
      loadCurrentSession: jest.fn().mockReturnValue({
        sessionId: 'session-123',
        createdAt: Date.now() - 24 * 60 * 60 * 1000,
        pausedAt: Date.now() - 12 * 60 * 60 * 1000,
        phase: 'PLAN',
        phaseNumber: 2,
        currentPlanId: '01',
        workInProgress: ['Task 1 in progress'],
        nextSteps: ['Run /paul:apply'],
        metadata: {},
        fileChecksums: {},
      }),
      validateSessionState: jest.fn().mockReturnValue({ valid: true, errors: [] }),
    }

    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(SessionManager as jest.Mock).mockImplementation(() => mockSessionManager)

    // Mock file system operations
    ;(existsSync as jest.Mock).mockReturnValue(true)
    ;(readFileSync as jest.Mock).mockImplementation((path: string) => {
      return 'test content'
    })
  })

  describe('successful resume', () => {
    it('should load session from SessionManager.loadCurrentSession', async () => {
      await paulResume.execute({}, toolContext)

      expect(mockSessionManager.loadCurrentSession).toHaveBeenCalled()
    })

    it('should validate session state', async () => {
      await paulResume.execute({}, toolContext)

      expect(mockSessionManager.validateSessionState).toHaveBeenCalledWith('session-123')
    })

    it('should show session summary with loop position', async () => {
      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('📋 Session Resume')
      expect(result).toContain('session-123')
      expect(result).toContain('Current Phase')
      expect(result).toContain('Loop:')
    })

    it('should return formatted success message', async () => {
      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('Session ID')
      expect(result).toContain('Paused')
      expect(result).toContain('Work in Progress')
      expect(result).toContain('Next Steps')
    })

    it('should show next action based on current phase', async () => {
      mockStateManager.getRequiredNextAction = jest.fn().mockReturnValue('Run custom action')

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('Next Action')
      expect(result).toContain('Run custom action')
    })

    it('should format work in progress and next steps correctly', async () => {
      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('Work in Progress')
      expect(result).toContain('Task 1 in progress')
      expect(result).toContain('Next Steps')
      expect(result).toContain('Run /paul:apply')
    })

    it('should handle metadata parsing correctly', async () => {
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'session-456',
        createdAt: Date.now() - 48 * 60 * 60 * 1000,
        pausedAt: Date.now() - 48 * 60 * 60 * 1000,
        phase: 'APPLY',
        phaseNumber: 3,
        currentPlanId: '02',
        workInProgress: [],
        nextSteps: [],
        metadata: { customKey: 'customValue' },
        fileChecksums: {},
      })

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('session-456')
      expect(result).toContain('APPLY')
    })
  })

  describe('staleness warning', () => {
    it('should show staleness warning for old sessions (> 24 hours)', async () => {
      const oldTime = Date.now() - 30 * 60 * 60 * 1000 // 30 hours ago

      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'session-old',
        createdAt: oldTime,
        pausedAt: oldTime,
        phase: 'PLAN',
        phaseNumber: 2,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {},
      })

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('⚠️')
      expect(result).toContain('hours ago')
    })

    it('should not show staleness warning for fresh sessions (< 24 hours)', async () => {
      const recentTime = Date.now() - 10 * 60 * 60 * 1000 // 10 hours ago

      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'session-fresh',
        createdAt: recentTime,
        pausedAt: recentTime,
        phase: 'PLAN',
        phaseNumber: 2,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {},
      })

      const result = await paulResume.execute({}, toolContext)

      expect(result).not.toContain('⚠️')
    })
  })

  describe('error handling', () => {
    it('should return error if no session found', async () => {
      mockSessionManager.loadCurrentSession.mockReturnValue(null)

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('📋 Session Resume')
      expect(result).toContain('No paused session found')
      expect(result).toContain('/paul:init')
      expect(result).toContain('/paul:progress')
    })

    it('should return error if session validation fails', async () => {
      mockSessionManager.validateSessionState.mockReturnValue({
        valid: false,
        errors: ['Invalid session structure', 'Missing required fields'],
      })

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('❌ Session Validation Failed')
      expect(result).toContain('Errors')
      expect(result).toContain('Invalid session structure')
      expect(result).toContain('Missing required fields')
    })

    it('should handle file system errors gracefully', async () => {
      mockSessionManager.loadCurrentSession.mockImplementation(() => {
        throw new Error('Failed to read session file')
      })

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('❌ Resume Failed')
      expect(result).toContain('Failed to read session file')
      expect(result).toContain('Troubleshooting')
    })
  })

  describe('file changes detection', () => {
    it('should detect and show file changes', async () => {
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'session-changes',
        createdAt: Date.now(),
        pausedAt: Date.now(),
        phase: 'PLAN',
        phaseNumber: 2,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {
          'package.json': 'old-checksum',
        },
      })

      ;(readFileSync as jest.Mock).mockImplementation((path: string) => {
        return 'new content'
      })

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('Changes since pause')
    })

    it('should show no changes when files unchanged', async () => {
      const checksum = 'abc123'

      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'session-unchanged',
        createdAt: Date.now(),
        pausedAt: Date.now(),
        phase: 'PLAN',
        phaseNumber: 2,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {},
      })

      const result = await paulResume.execute({}, toolContext)

      expect(result).toContain('No changes since pause')
    })
  })
})
