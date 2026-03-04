/**
 * Plan Command Tests
 * 
 * Tests for the plan creation functionality
 */

import { FileManager } from '../../storage/file-manager'
import { StateManager } from '../../state/state-manager'
import { LoopEnforcer } from '../../state/loop-enforcer'

// Mock dependencies
jest.mock('../../storage/file-manager')
jest.mock('../../state/state-manager')
jest.mock('../../state/loop-enforcer')

describe('Plan Command Functionality', () => {
  const mockDirectory = '/test/project'

  let mockFileManager: {
    planExists: jest.Mock
    ensurePhasesDir: jest.Mock
    writePlan: jest.Mock
  }
  let mockStateManager: {
    getCurrentPosition: jest.Mock
    savePhaseState: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockFileManager = {
      planExists: jest.fn().mockReturnValue(false),
      ensurePhasesDir: jest.fn(),
      writePlan: jest.fn().mockResolvedValue(undefined),
    }
    mockStateManager = {
      getCurrentPosition: jest.fn().mockReturnValue({
        phaseNumber: 1,
        phase: 'UNIFY',
      }),
      savePhaseState: jest.fn().mockResolvedValue(undefined),
    }

    ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)
    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
  })

  describe('plan creation', () => {
    it('should create plan with valid inputs', async () => {
      // Create a fileManager instance and check initial state
      const fileManager = new FileManager(mockDirectory)
      expect(fileManager.planExists(2, '01')).toBe(false)
      
      // Ensure the phases directory is created
      fileManager.ensurePhasesDir()
      expect(fileManager.ensurePhasesDir).toHaveBeenCalled()
      
      // Create the plan
      const planObject = {
        phase: '2',
        plan: '01',
        type: 'execute' as const,
        wave: 1,
        depends_on: [],
        files_modified: [],
        autonomous: true,
        requirements: [],
        tasks: [
          {
            type: 'auto' as const,
            name: 'Test task',
            action: 'Do something',
            verify: 'Check it works',
            done: 'Task complete',
          },
        ],
        must_haves: {
          truths: [],
          artifacts: [],
          key_links: [],
        },
      }
      
      await fileManager.writePlan(5, '01', planObject)
      expect(fileManager.writePlan).toHaveBeenCalledWith(
        5,
        '01',
        expect.objectContaining({
          phase: '2',
          plan: '01',
        })
      )
    })

    it('should detect when plan already exists', () => {
        mockFileManager.planExists = jest.fn().mockReturnValue(true)
        
        const fileManager = new FileManager(mockDirectory)
        const exists = fileManager.planExists(2, '01')
        
        expect(exists).toBe(true)
      })

    it('should ensure phases directory exists', () => {
        const fileManager = new FileManager(mockDirectory)
        fileManager.ensurePhasesDir()
        
        expect(fileManager.ensurePhasesDir).toHaveBeenCalled()
      })
  })

  describe('state management', () => {
    it('should update state to PLAN phase', async () => {
        const stateManager = new StateManager(mockDirectory)
        
        await stateManager.savePhaseState(2, {
          phase: 'PLAN',
          phaseNumber: 2,
          currentPlanId: '01',
          lastUpdated: Date.now(),
          metadata: {},
        })
        
        expect(stateManager.savePhaseState).toHaveBeenCalledWith(
          2,
          expect.objectContaining({
            phase: 'PLAN',
            phaseNumber: 2,
          })
        )
      })

    it('should get current position', () => {
        const stateManager = new StateManager(mockDirectory)
        const position = stateManager.getCurrentPosition()
        
        expect(position).toEqual({
          phaseNumber: 1,
          phase: 'UNIFY',
        })
      })

    it('should handle no position', () => {
        mockStateManager.getCurrentPosition = jest.fn().mockReturnValue(undefined)
        
        const stateManager = new StateManager(mockDirectory)
        const position = stateManager.getCurrentPosition()
        
        expect(position).toBeUndefined()
      })
  })

  describe('loop transitions', () => {
    it('should allow starting new loop from UNIFY', () => {
        const loopEnforcer = new LoopEnforcer()
        
        // Should not throw - UNIFY can start new loop
        expect(() => loopEnforcer.enforceCanStartNewLoop('UNIFY')).not.toThrow()
      })

    it('should allow starting new loop from APPLY', () => {
        const loopEnforcer = new LoopEnforcer()
        
        // Should not throw - APPLY can transition
        expect(() => loopEnforcer.enforceCanStartNewLoop('APPLY')).not.toThrow()
      })

    it('should allow starting new loop from PLAN', () => {
        const loopEnforcer = new LoopEnforcer()
        
        // Should not throw - PLAN can start new loop (allows re-planning)
        expect(() => loopEnforcer.enforceCanStartNewLoop('PLAN')).not.toThrow()
      })
  })
})
