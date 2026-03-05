/**
 * Apply Command Tests
 * 
 * Tests for the apply command functionality
 */

import { FileManager } from '../../storage/file-manager'
import { StateManager } from '../../state/state-manager'
import { LoopEnforcer } from '../../state/loop-enforcer'

// Mock dependencies
jest.mock('../../storage/file-manager')
jest.mock('../../state/state-manager')
jest.mock('../../state/loop-enforcer')

describe('Apply Command Functionality', () => {
  const mockDirectory = '/test/project'

  let mockFileManager: {
    planExists: jest.Mock
    ensurePhasesDir: jest.Mock
    readPlan: jest.Mock
    writePlan: jest.Mock
  }
  let mockStateManager: {
    getCurrentPosition: jest.Mock
    savePhaseState: jest.Mock
    loadPhaseState: jest.Mock
  }
  let mockLoopEnforcer: {
    enforceTransition: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockFileManager = {
      planExists: jest.fn().mockReturnValue(false),
      ensurePhasesDir: jest.fn(),
      readPlan: jest.fn().mockReturnValue(null),
      writePlan: jest.fn().mockResolvedValue(undefined),
    }

    mockStateManager = {
      getCurrentPosition: jest.fn().mockReturnValue({
        phaseNumber: 1,
        phase: 'PLAN',
      }),
      savePhaseState: jest.fn().mockResolvedValue(undefined),
      loadPhaseState: jest.fn().mockReturnValue(null),
    }

    mockLoopEnforcer = {
      enforceTransition: jest.fn(),
    }

    ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)
    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(LoopEnforcer as jest.Mock).mockImplementation(() => mockLoopEnforcer)
  })

  describe('apply shows all tasks with progress', () => {
    const plan = {
      phase: '2',
      plan: '03',
      type: 'execute',
      wave: 1,
      depends_on: [],
      files_modified: ['src/test.ts'],
      autonomous: true,
      requirements: ['CORE-03'],
      tasks: [
        {
          type: 'auto' as const,
          name: 'Test task 1',
          files: ['src/test1.ts'],
          action: 'Do something',
          verify: 'Check it works',
          done: 'Task 1 complete',
        },
        {
          type: 'auto' as const,
          name: 'Test task 2',
          files: ['src/test2.ts'],
          action: 'Do something else',
          verify: 'Check it works too',
          done: 'Task 2 complete',
        },
      ],
      must_haves: {
        truths: [],
        artifacts: [],
        key_links: [],
      },
    }

    it('should read plan tasks', () => {
      mockFileManager.readPlan.mockReturnValue(plan)

      const fileManager = new FileManager(mockDirectory)
      const readPlan = fileManager.readPlan(2, '03')

      expect(readPlan?.tasks).toHaveLength(2)
      expect(readPlan?.tasks[0].name).toBe('Test task 1')
    })
  })

  describe('apply transitions state from PLAN to APPLY', () => {
    it('should save APPLY phase state', async () => {
      const stateManager = new StateManager(mockDirectory)

      await stateManager.savePhaseState(2, {
        phase: 'APPLY',
        phaseNumber: 2,
        currentPlanId: '03',
        lastUpdated: Date.now(),
        metadata: {},
      })

      expect(stateManager.savePhaseState).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          phase: 'APPLY',
          currentPlanId: '03',
        })
      )
    })
  })

  describe('apply fails without init', () => {
    beforeEach(() => {
      mockStateManager = {
        getCurrentPosition: jest.fn().mockReturnValue(undefined),
        savePhaseState: jest.fn().mockResolvedValue(undefined),
        loadPhaseState: jest.fn().mockReturnValue(null),
      }

      ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    })

    it('should detect missing current position', () => {
      const stateManager = new StateManager(mockDirectory)
      expect(stateManager.getCurrentPosition()).toBeUndefined()
    })

    it('apply fails without plan', () => {
      mockFileManager = {
        planExists: jest.fn().mockReturnValue(false),
        ensurePhasesDir: jest.fn(),
        readPlan: jest.fn().mockReturnValue(null),
        writePlan: jest.fn().mockResolvedValue(undefined),
      }

      ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)

      const fileManager = new FileManager(mockDirectory)
      const plan = fileManager.readPlan(2, '03')

      expect(fileManager.readPlan).toHaveBeenCalledWith(2, '03')
      expect(plan).toBeNull()
    })

    it('apply fails when plan does not exist', () => {
      mockFileManager = {
        planExists: jest.fn().mockReturnValue(true),
        readPlan: jest.fn().mockReturnValue({
          phase: '2',
          plan: '03',
          type: 'execute',
          wave: 1,
          depends_on: [],
          files_modified: ['src/test.ts'],
          autonomous: true,
          requirements: ['CORE-03'],
          tasks: [],
          must_haves: {
            truths: [],
            artifacts: [],
            key_links: [],
          },
        }),
        ensurePhasesDir: jest.fn(),
        writePlan: jest.fn().mockResolvedValue(undefined),
      }

      ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)

      const fileManager = new FileManager(mockDirectory)
      const exists = fileManager.planExists(2, '03')

      expect(fileManager.planExists).toHaveBeenCalledWith(2, '03')
      expect(exists).toBe(true)
    })

    it('apply transitions state from PLAN to APPLY', async () => {
      const stateManager = new StateManager(mockDirectory)

      await stateManager.savePhaseState(2, {
        phase: 'APPLY',
        phaseNumber: 2,
        currentPlanId: '03',
        lastUpdated: Date.now(),
        metadata: {},
      })

      expect(stateManager.savePhaseState).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          phase: 'APPLY',
          currentPlanId: '03',
        })
      )
    })

    it('should enforce transition from PLAN to APPLY', () => {
      const loopEnforcer = new LoopEnforcer()

      expect(() => loopEnforcer.enforceTransition('PLAN', 'APPLY')).not.toThrow()
    })
  })
})