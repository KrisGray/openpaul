/**
 * Handoff Command Tests
 * 
 * Tests for the handoff command functionality
 */

import { StateManager } from '../../state/state-manager'
import { SessionManager } from '../../storage/session-manager'
import { openpaulHandoff } from '../../commands/handoff'
import { formatHeader, formatBold, formatList } from '../../output/formatter'
import { readFileSync, existsSync, mkdirSync } from 'fs'
import { atomicWrite } from '../../storage/atomic-writes'

// Mock dependencies
jest.mock('../../state/state-manager')
jest.mock('../../storage/session-manager')
jest.mock('fs')
jest.mock('../../storage/atomic-writes')
jest.mock(
  '@opencode-ai/plugin',
  () => ({
    tool: (input: any) => input,
  }),
  { virtual: true }
)

describe('Handoff Command Functionality', () => {
  const mockDirectory = '/test/project'

  let mockStateManager: {
    getCurrentPosition: jest.Mock
    getRequiredNextAction: jest.Mock<any, any>
    loadPhaseState: jest.Mock
  }
  let mockSessionManager: {
    loadCurrentSession: jest.Mock
    generateSessionId: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockStateManager = {
      getCurrentPosition: jest.fn(),
      getRequiredNextAction: jest.fn().mockReturnValue('Run /openpaul:apply to execute the plan'),
      loadPhaseState: jest.fn().mockReturnValue({
        currentPlanId: '01',
        completedPlans: [],
        plans: [],
      }),
    }

    mockSessionManager = {
      loadCurrentSession: jest.fn(),
      generateSessionId: jest.fn().mockReturnValue('session-test-123'),
    }

    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(SessionManager as jest.Mock).mockImplementation(() => mockSessionManager)
    ;(existsSync as jest.Mock).mockReturnValue(true)
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('not initialized state', () => {
    it('should return error if no active state (not initialized)', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue(undefined)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulHandoff.execute({}, toolContext)

      expect(result).toContain('Cannot Create Handoff')
      expect(result).toContain('not been initialized')
      expect(result).toContain('/paul:init')
    })
  })

  describe('with paused session', () => {
    beforeEach(() => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'APPLY',
      })
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'paused-session-456',
        createdAt: Date.now() - 3600000,
        pausedAt: Date.now() - 1800000,
        phase: 'APPLY',
        phaseNumber: 1,
        currentPlanId: '01',
        workInProgress: ['Task in progress'],
        nextSteps: ['Complete task'],
        metadata: {},
        fileChecksums: {},
      })
    })

    it('should work with paused session (loads existing session)', async () => {
      const templateContent = '# HANDOFF\nSession: {{session_id}}\nStatus: {{status}}'
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulHandoff.execute({}, toolContext)

      expect(result).toContain('Handoff Created')
      expect(result).toContain('paused-session-456')
      expect(result).toContain('paused')
    })

    it('should include correct session ID and timestamp', async () => {
      const templateContent = 'Session: {{session_id}}\nTimestamp: {{timestamp}}'
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)

      const toolContext = { directory: mockDirectory } as any
      await openpaulHandoff.execute({}, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('paused-session-456')
      expect(writtenContent).toMatch(/\d{4}-\d{2}-\d{2}T/) // ISO timestamp format
    })
  })

  describe('without paused session', () => {
    beforeEach(() => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
    })

    it('should work without paused session (creates temporary session)', async () => {
      const templateContent = 'Session: {{session_id}}\nStatus: {{status}}'
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulHandoff.execute({}, toolContext)

      expect(result).toContain('Handoff Created')
      expect(mockSessionManager.generateSessionId).toHaveBeenCalled()
      
      // Verify that the generated session ID was used
      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      expect(writtenContent).toContain('session-test-123')
      expect(writtenContent).toContain('active') // Temporary session status
    })
  })

  describe('template replacement', () => {
    beforeEach(() => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'APPLY',
      })
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'test-session-789',
        createdAt: Date.now() - 3600000,
        pausedAt: Date.now() - 1800000,
        phase: 'APPLY',
        phaseNumber: 1,
        currentPlanId: 'plan-01',
        workInProgress: ['Working on feature X'],
        nextSteps: ['Complete feature X', 'Test feature X'],
        metadata: {},
        fileChecksums: {},
      })
    })

    it('should replace all template variables correctly', async () => {
      const templateContent = `
Session: {{session_id}}
Status: {{status}}
Phase: {{phase_number}}
Plan: {{plan_id}}
Next: {{next_action}}
      `.trim()
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)

      const toolContext = { directory: mockDirectory } as any
      await openpaulHandoff.execute({}, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      // Check that all variables were replaced
      expect(writtenContent).toContain('test-session-789')
      expect(writtenContent).toContain('paused')
      expect(writtenContent).toContain('1')
      expect(writtenContent).toContain('plan-01')
      expect(writtenContent).not.toContain('{{') // No unreplaced variables
      expect(writtenContent).not.toContain('}}')
    })

    it('should include correct loop position markers', async () => {
      const templateContent = 'PLAN: {{plan_mark}} APPLY: {{apply_mark}} UNIFY: {{unify_mark}}'
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)

      const toolContext = { directory: mockDirectory } as any
      await openpaulHandoff.execute({}, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      // APPLY phase: PLAN=○, APPLY=●, UNIFY=○
      expect(writtenContent).toContain('PLAN: ○')
      expect(writtenContent).toContain('APPLY: ●')
      expect(writtenContent).toContain('UNIFY: ○')
    })

    it('should generate HANDOFF.md from template', async () => {
      const templateContent = '# HANDOFF Document\n\nSession: {{session_id}}'
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)

      const toolContext = { directory: mockDirectory } as any
      await openpaulHandoff.execute({}, toolContext)

      expect(readFileSync).toHaveBeenCalled()
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('file generation', () => {
    beforeEach(() => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
      const templateContent = 'Session: {{session_id}}'
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)
    })

    it('should write HANDOFF.md to .openpaul/ directory', async () => {
      const toolContext = { directory: mockDirectory } as any
      await openpaulHandoff.execute({}, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenPath = writeCall[0]
      
      expect(writtenPath).toContain('.openpaul')
      expect(writtenPath).toContain('HANDOFF.md')
    })

    it('should return formatted success message', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulHandoff.execute({}, toolContext)

      expect(result).toContain('✅ Handoff Created')
      expect(result).toContain('HANDOFF.md')
      expect(result).toContain('Session ID:')
      expect(result).toContain('Instructions:')
    })

    it('should create .openpaul directory if it doesn\'t exist', async () => {
      // Mock sequence: first existsSync is for template (true), second is for .openpaul (false)
      let callCount = 0
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        callCount++
        if (path.includes('HANDOFF.md') && callCount === 1) {
          return true // Template exists
        }
        if (path.includes('.openpaul')) {
          return false // .openpaul doesn't exist
        }
        return true
      })

      const toolContext = { directory: mockDirectory } as any
      await openpaulHandoff.execute({}, toolContext)

      expect(mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.openpaul'),
        { recursive: true }
      )
    })
  })

  describe('error handling', () => {
    it('should return formatted error on file write failure', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      })
      mockSessionManager.loadCurrentSession.mockReturnValue(undefined)
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))
      
      const templateContent = 'Session: {{session_id}}'
      ;(readFileSync as jest.Mock).mockReturnValue(templateContent)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulHandoff.execute({}, toolContext)

      expect(result).toContain('Handoff Failed')
      expect(result).toContain('Write failed')
      expect(result).toContain('Troubleshooting')
    })
  })
})
