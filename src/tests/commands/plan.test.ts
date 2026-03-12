import { FileManager } from '../../storage/file-manager'
import { StateManager } from '../../state/state-manager'
import { LoopEnforcer } from '../../state/loop-enforcer'
import { openpaulPlan } from '../../commands/plan'

jest.mock('../../storage/file-manager')
jest.mock('../../state/state-manager')
jest.mock('../../state/loop-enforcer')
jest.mock(
  '@opencode-ai/plugin',
  () => ({
    tool: (input: any) => input,
  }),
  { virtual: true }
)

describe('openpaulPlan command', () => {
  const mockDirectory = '/test/project'
  const toolContext = { directory: mockDirectory } as any

  let mockFileManager: {
    planExists: jest.Mock
    ensurePhasesDir: jest.Mock
    writePlan: jest.Mock
  }
  let mockStateManager: {
    getCurrentPosition: jest.Mock
    savePhaseState: jest.Mock
  }
  let mockLoopEnforcer: {
    enforceCanStartNewLoop: jest.Mock
    getRequiredNextAction: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockFileManager = {
      planExists: jest.fn().mockReturnValue(false),
      ensurePhasesDir: jest.fn(),
      writePlan: jest.fn().mockResolvedValue(undefined),
    }

    mockStateManager = {
      getCurrentPosition: jest.fn().mockReturnValue({ phaseNumber: 2, phase: 'UNIFY' }),
      savePhaseState: jest.fn().mockResolvedValue(undefined),
    }

    mockLoopEnforcer = {
      enforceCanStartNewLoop: jest.fn(),
      getRequiredNextAction: jest.fn().mockReturnValue('Run /paul:apply to execute the plan'),
    }

    ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)
    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(LoopEnforcer as jest.Mock).mockImplementation(() => mockLoopEnforcer)
  })

  it('persists criteria, boundaries, and dependency graph', async () => {
    const result = await openpaulPlan.execute({
      phase: 2,
      plan: '01',
      criteria: ['Must include execution graph'],
      boundaries: 'Do not change unrelated commands',
      tasks: [
        {
          name: 'Task 1',
          files: ['src/alpha.ts'],
          action: 'Do task 1',
          verify: 'Verify task 1',
          done: 'Task 1 done',
        },
        {
          name: 'Task 2',
          files: ['src/alpha.ts', 'src/bravo.ts'],
          action: 'Do task 2',
          verify: 'Verify task 2',
          done: 'Task 2 done',
        },
        {
          name: 'Task 3',
          files: ['src/charlie.ts'],
          action: 'Do task 3',
          verify: 'Verify task 3',
          done: 'Task 3 done',
        },
      ],
    }, toolContext)

    expect(mockFileManager.writePlan).toHaveBeenCalledWith(
      2,
      '01',
      expect.objectContaining({
        criteria: ['Must include execution graph'],
        boundaries: ['Do not change unrelated commands'],
        taskDependencies: { '1': [], '2': [1], '3': [] },
        executionGraph: [[1, 3], [2]],
      })
    )

    expect(result).toContain('Execution Graph')
    expect(result).toContain('[1, 3] → [2]')
  })

  it('formats guided error when not initialized', async () => {
    mockStateManager.getCurrentPosition.mockReturnValue(undefined)

    const result = await openpaulPlan.execute({
      phase: 2,
      plan: '01',
      tasks: [
        {
          name: 'Task 1',
          action: 'Do task',
          verify: 'Verify task',
          done: 'Task done',
        },
      ],
    }, toolContext)

    expect(result).toContain('Suggested Fix')
    expect(result).toContain('Next Steps')
    expect(result).toContain('Not Initialized')
  })

  it('formats guided error on invalid loop state', async () => {
    mockLoopEnforcer.enforceCanStartNewLoop.mockImplementation(() => {
      throw new Error('Cannot start new loop from APPLY')
    })

    const result = await openpaulPlan.execute({
      phase: 2,
      plan: '02',
      tasks: [
        {
          name: 'Task 1',
          action: 'Do task',
          verify: 'Verify task',
          done: 'Task done',
        },
      ],
    }, toolContext)

    expect(result).toContain('Cannot Create Plan')
    expect(result).toContain('Suggested Fix')
    expect(result).toContain('Next Steps')
  })
})
