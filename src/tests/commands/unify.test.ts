import { FileManager } from '../../storage/file-manager'
import { StateManager } from '../../state/state-manager'
import { LoopEnforcer } from '../../state/loop-enforcer'
import { openpaulUnify } from '../../commands/unify'
import { readFileSync } from 'fs'
import { join } from 'path'

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

describe('openpaulUnify command', () => {
  const mockDirectory = '/test/project'
  const toolContext = { directory: mockDirectory } as any

  let mockFileManager: {
    readPlan: jest.Mock
    writeSummary: jest.Mock
    ensurePhasesDir: jest.Mock
  }
  let mockStateManager: {
    getCurrentPosition: jest.Mock
    loadPhaseState: jest.Mock
    savePhaseState: jest.Mock
  }
  let mockLoopEnforcer: {
    enforceTransition: jest.Mock
    getRequiredNextAction: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockFileManager = {
      readPlan: jest.fn().mockReturnValue(null),
      writeSummary: jest.fn().mockResolvedValue(undefined),
      ensurePhasesDir: jest.fn(),
    }

    mockStateManager = {
      getCurrentPosition: jest.fn().mockReturnValue({ phaseNumber: 2, phase: 'APPLY' }),
      loadPhaseState: jest.fn().mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 2,
        currentPlanId: '02-03',
        lastUpdated: Date.now(),
        metadata: {},
      }),
      savePhaseState: jest.fn().mockResolvedValue(undefined),
    }

    mockLoopEnforcer = {
      enforceTransition: jest.fn(),
      getRequiredNextAction: jest.fn().mockReturnValue('Run /openpaul:apply to execute the plan'),
    }

    ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)
    ;(StateManager as jest.Mock).mockImplementation(() => mockStateManager)
    ;(LoopEnforcer as jest.Mock).mockImplementation(() => mockLoopEnforcer)
  })

  it('registers openpaul:unify in the plugin tool map', () => {
    const pluginPath = join(__dirname, '../../index.ts')
    const pluginSource = readFileSync(pluginPath, 'utf-8')

    expect(pluginSource).toContain("'openpaul:unify'")
  })

  describe('error handling', () => {
    it('should return error without init', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue(undefined)

      const result = await openpaulUnify.execute({}, toolContext)

      expect(result).toContain('❌ Not Initialized')
      expect(result).toContain('Run /openpaul:init first')
    })

    it('should return error if not in APPLY phase', async () => {
      mockStateManager.getCurrentPosition.mockReturnValue({ phaseNumber: 2, phase: 'PLAN' })

      const result = await openpaulUnify.execute({}, toolContext)

      expect(result).toContain('❌ Invalid State')
      expect(result).toContain('Must be in APPLY phase')
    })

    it('should return error if no current plan is found', async () => {
      mockStateManager.loadPhaseState.mockReturnValue({
        phase: 'APPLY',
        phaseNumber: 2,
        currentPlanId: '',
        lastUpdated: Date.now(),
        metadata: {},
      })

      const result = await openpaulUnify.execute({}, toolContext)

      expect(result).toContain('❌ No Plan Found')
      expect(result).toContain('No current plan found')
    })
  })

  describe('summary creation and state transitions', () => {
    const plan = {
      phase: '02',
      plan: '03',
      type: 'execute',
      tasks: [
        { name: 'Task 1', type: 'auto', action: 'Test', done: 'Done' },
        { name: 'Task 2', type: 'auto', action: 'Test', done: 'Done' },
      ],
      must_haves: {
        truths: ['Test truth'],
        artifacts: [
          {
            path: 'src/test.ts',
            provides: 'Test artifact',
          },
        ],
        key_links: [],
      },
      autonomous: true,
      requirements: ['TEST-01'],
    }

    it('should create summary and transition to APPLY → UNIFY → UNIFY', async () => {
      mockFileManager.readPlan.mockReturnValue(plan)

      const result = await openpaulUnify.execute({}, toolContext)

      expect(result).toContain('🔗 Loop Closed: 02-03')
      expect(result).toContain('## Summary')
      expect(result).toContain('Tasks Completed')
      expect(result).toContain('success')

      expect(mockFileManager.writeSummary).toHaveBeenCalledWith(
        2,
        '02-03',
        expect.objectContaining({
          phaseNumber: 2,
          planId: '02-03',
          completed: 2,
          total: 2,
          status: 'success',
          tasks: expect.arrayContaining([
            expect.objectContaining({ name: 'Task 1', status: 'completed' }),
            expect.objectContaining({ name: 'Task 2', status: 'completed' }),
          ]),
          createdAt: expect.any(Number),
        })
      )

      expect(mockStateManager.savePhaseState).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          phase: 'UNIFY',
          phaseNumber: 2,
          currentPlanId: '02-03',
        })
      )

      expect(mockStateManager.savePhaseState).toHaveBeenCalledWith(
        3,
        expect.objectContaining({
          phase: 'UNIFY',
          phaseNumber: 3,
        })
      )

      expect(mockFileManager.ensurePhasesDir).toHaveBeenCalled()
    })

    it('should handle output format with emojis', async () => {
      mockFileManager.readPlan.mockReturnValue(plan)

      const result = await openpaulUnify.execute({}, toolContext)

      expect(result).toContain('🔗 Loop Closed: 02-03')
      expect(result).toContain('✅')
    })

    it('should support partial status flag', async () => {
      mockFileManager.readPlan.mockReturnValue(plan)

      const result = await openpaulUnify.execute({ status: 'partial' }, toolContext)

      expect(result).toContain('⚠️ partial')
      expect(mockFileManager.writeSummary).toHaveBeenCalledWith(
        2,
        '02-03',
        expect.objectContaining({
          status: 'partial',
        })
      )
    })

    it('should include reconciliation and criteria results when provided', async () => {
      mockFileManager.readPlan.mockReturnValue(plan)

      const result = await openpaulUnify.execute(
        {
          actuals: ['Task 1', { name: 'Extra Task', status: 'completed' }],
          criteriaResults: [
            { criteria: 'Test truth', status: 'pass' },
            { criteria: 'Second criteria', status: 'fail', notes: 'Missing evidence' },
          ],
        },
        toolContext
      )

      expect(result).toContain('Reconciliation')
      expect(result).toContain('Plan vs Actual')
      expect(result).toContain('Missing tasks')
      expect(result).toContain('Extra tasks')
      expect(result).toContain('Criteria Results')
      expect(result).toContain('✅ Test truth')
      expect(result).toContain('❌ Second criteria')
    })
  })
})
