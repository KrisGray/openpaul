import { paulPause } from '../../commands/pause'
import { StateManager } from '../../state/state-manager'
import { SessionManager } from '../../storage/session-manager'
import { existsSync, readFileSync, readdirSync, statSync, mkdirSync } from 'fs'
import * as changeDetector from '../../utils/change-detector'

jest.mock('../../state/state-manager')
jest.mock('../../storage/session-manager')
jest.mock('../../storage/atomic-writes')
jest.mock('fs')
jest.mock('../../utils/change-detector')
jest.mock(
  '@opencode-ai/plugin',
  () => ({
    tool: (input: any) => input,
  }),
  { virtual: true }
)

describe('paulPause command - change detection', () => {
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

    ;(changeDetector.detectUncommittedChanges as jest.Mock).mockResolvedValue({
      hasChanges: false,
      files: [],
    })
    ;(changeDetector.detectModifiedFiles as jest.Mock).mockResolvedValue({
      hasModifications: false,
      files: [],
    })
  })

  describe('change detection warnings', () => {
    it('should show warning when git has uncommitted changes', async () => {
      ;(changeDetector.detectUncommittedChanges as jest.Mock).mockResolvedValue({
        hasChanges: true,
        files: [{ path: 'src/test.ts', status: 'modified' }],
      })

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('Unsaved Changes Detected')
      expect(result).toContain('Git changes: 1 modified')
      expect(result).toContain('src/test.ts')
      expect(result).toContain('onUnsavedChanges="commit"')
      expect(mockSessionManager.saveSession).not.toHaveBeenCalled()
    })

    it('should show warning when tracked files are modified', async () => {
      ;(changeDetector.detectModifiedFiles as jest.Mock).mockResolvedValue({
        hasModifications: true,
        files: [{ path: 'src/test.ts', oldChecksum: 'old', newChecksum: 'new' }],
      })

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('Unsaved Changes Detected')
      expect(result).toContain('Modified files: 1 file(s) changed')
      expect(result).toContain('src/test.ts')
      expect(result).toContain('onUnsavedChanges="save"')
      expect(mockSessionManager.saveSession).not.toHaveBeenCalled()
    })

    it('should allow pause when no changes detected and no recent session', async () => {
      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('Session Paused')
      expect(mockSessionManager.saveSession).toHaveBeenCalled()
    })

    it('should call change detection with correct directory', async () => {
      await paulPause.execute({}, toolContext)

      expect(changeDetector.detectUncommittedChanges).toHaveBeenCalledWith(mockDirectory)
      expect(changeDetector.detectModifiedFiles).toHaveBeenCalled()
    })

    it('should show actionable options in warning', async () => {
      ;(changeDetector.detectUncommittedChanges as jest.Mock).mockResolvedValue({
        hasChanges: true,
        files: [{ path: 'src/test.ts', status: 'modified' }],
      })

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('onUnsavedChanges="commit"')
      expect(result).toContain('onUnsavedChanges="save"')
      expect(result).toContain('onUnsavedChanges="discard"')
      expect(result).toContain('onUnsavedChanges="abort"')
    })

    it('should handle both git and file changes simultaneously', async () => {
      ;(changeDetector.detectUncommittedChanges as jest.Mock).mockResolvedValue({
        hasChanges: true,
        files: [
          { path: 'src/test.ts', status: 'modified' },
          { path: 'src/new.ts', status: 'added' },
        ],
      })
      ;(changeDetector.detectModifiedFiles as jest.Mock).mockResolvedValue({
        hasModifications: true,
        files: [{ path: 'config.json', oldChecksum: 'old', newChecksum: 'new' }],
      })

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('Git changes: 1 modified, 1 added')
      expect(result).toContain('Modified files: 1 file(s) changed')
    })

    it('should proceed when onUnsavedChanges is provided', async () => {
      ;(changeDetector.detectUncommittedChanges as jest.Mock).mockResolvedValue({
        hasChanges: true,
        files: [{ path: 'src/test.ts', status: 'modified' }],
      })

      await paulPause.execute({ onUnsavedChanges: 'save' }, toolContext)

      expect(mockSessionManager.saveSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            unsavedChangesAction: 'save',
          }),
        })
      )
    })

    it('should abort when onUnsavedChanges is abort', async () => {
      ;(changeDetector.detectUncommittedChanges as jest.Mock).mockResolvedValue({
        hasChanges: true,
        files: [{ path: 'src/test.ts', status: 'modified' }],
      })

      const result = await paulPause.execute({ onUnsavedChanges: 'abort' }, toolContext)

      expect(result).toContain('Pause Aborted')
      expect(mockSessionManager.saveSession).not.toHaveBeenCalled()
    })

    it('should limit file list display to 10 files', async () => {
      const manyFiles = Array.from({ length: 15 }, (_, i) => ({
        path: `src/file${i}.ts`,
        status: 'modified',
      }))
      ;(changeDetector.detectUncommittedChanges as jest.Mock).mockResolvedValue({
        hasChanges: true,
        files: manyFiles,
      })

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('... and 5 more')
    })

    it('should show recent session warning before change detection', async () => {
      mockSessionManager.getCurrentSessionId.mockReturnValue('old-session')
      mockSessionManager.loadCurrentSession.mockReturnValue({
        sessionId: 'old-session',
        pausedAt: Date.now() - 1000 * 60 * 60 * 2,
      })

      const result = await paulPause.execute({}, toolContext)

      expect(result).toContain('Recent Session Exists')
      expect(changeDetector.detectUncommittedChanges).not.toHaveBeenCalled()
    })
  })
})
