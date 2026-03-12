/**
 * Plan-fix Command Tests
 * 
 * Tests for the /openpaul:plan-fix command functionality
 */

import { QualityManager } from '../../storage/quality-manager'
import { FileManager } from '../../storage/file-manager'
import { openpaulpaulPlanFix } from '../../commands/plan-fix'

// Mock dependencies
jest.mock('../../storage/quality-manager')
jest.mock('../../storage/file-manager')
jest.mock('../../storage/atomic-writes')
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
      number: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('Plan-fix Command', () => {
  const mockDirectory = '/test/project'

  let mockQualityManager: {
    resolvePhaseDir: jest.Mock
    readUATIssues: jest.Mock
    getNextAlphaPlanId: jest.Mock
  }

  let mockFileManager: {
    readPlan: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockQualityManager = {
      resolvePhaseDir: jest.fn(),
      readUATIssues: jest.fn(),
      getNextAlphaPlanId: jest.fn(),
    }

    mockFileManager = {
      readPlan: jest.fn(),
    }

    ;(QualityManager as jest.Mock).mockImplementation(() => mockQualityManager)
    ;(FileManager as jest.Mock).mockImplementation(() => mockFileManager)
  })

  describe('error: phase directory not found', () => {
    it('should show error when phase directory not found', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7 }, toolContext)

      expect(result).toContain('Cannot Create Fix Plan')
      expect(result).toContain('directory not found')
    })
  })

  describe('error: UAT-ISSUES.md not found', () => {
    it('should show error when UAT-ISSUES.md not found', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7 }, toolContext)

      expect(result).toContain('No Issues Found')
      expect(result).toContain('UAT-ISSUES.md not found')
    })
  })

  describe('error: no open issues', () => {
    it('should show message when no open issues', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test',
            status: 'fixed',
            severity: 'major',
            category: 'functional',
            description: 'Issue was fixed',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7 }, toolContext)

      expect(result).toContain('No Open Issues')
    })
  })

  describe('issue list display', () => {
    it('should show issue list when no --issue flag', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'critical',
            category: 'functional',
            description: 'Critical issue found',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
          {
            id: 2,
            itemDescription: 'Another test',
            status: 'open',
            severity: 'minor',
            category: 'visual',
            description: 'Minor visual issue',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7 }, toolContext)

      expect(result).toContain('Open Issues')
      expect(result).toContain('1.')
      expect(result).toContain('Critical issue found')
      expect(result).toContain('2.')
      expect(result).toContain('Minor visual issue')
      expect(result).toContain('--issue')
    })

    it('should show error for invalid issue number', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue found',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 99 }, toolContext)

      expect(result).toContain('Invalid Issue')
      expect(result).toContain('not found or already fixed')
    })
  })

  describe('fix plan creation', () => {
    it('should create fix plan with alpha suffix', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue to fix',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-01a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 2,
        requirements: ['QUAL-01'],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1 }, toolContext)

      expect(result).toContain('Fix Plan Created')
      expect(result).toContain('07-01a')
      expect(result).toContain('Issue to fix')
    })

    it('should inherit parent wave from parent plan', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue to fix',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-01a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 3,
        requirements: ['QUAL-01', 'QUAL-02'],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1 }, toolContext)

      expect(result).toContain('Wave: 3')
    })

    it('should set depends_on to parent plan', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-02',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue to fix',
            sourcePlanId: '07-02',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-02a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 1,
        requirements: [],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1 }, toolContext)

      expect(result).toContain('Parent plan:')
      expect(result).toContain('07-02')
    })

    it('should show location of created plan', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue to fix',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-01a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 1,
        requirements: [],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1 }, toolContext)

      expect(result).toContain('Location:')
      expect(result).toContain('07-01a-PLAN.md')
    })

    it('should show issue details including severity and category', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'critical',
            category: 'performance',
            description: 'Performance issue',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-01a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 1,
        requirements: [],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1 }, toolContext)

      expect(result).toContain('Severity:')
      expect(result).toContain('critical')
      expect(result).toContain('Category:')
      expect(result).toContain('performance')
    })

    it('should show execute option with --execute flag', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue to fix',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-01a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 1,
        requirements: [],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1, execute: true }, toolContext)

      expect(result).toContain('/gsd-execute-phase')
    })

    it('should show suggestion to run execute without --execute flag', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue to fix',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-01a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 1,
        requirements: [],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1 }, toolContext)

      expect(result).toContain('/gsd-execute-phase')
      expect(result).toContain('--execute')
    })
  })

  describe('with suggested fix', () => {
    it('should create fix plan including issue details', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.readUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open',
            severity: 'major',
            category: 'functional',
            description: 'Issue to fix',
            suggestedFix: 'Update the component',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      })
      mockQualityManager.getNextAlphaPlanId.mockReturnValue('07-01a')
      mockFileManager.readPlan.mockReturnValue({
        wave: 1,
        requirements: [],
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulpaulPlanFix.execute({ phase: 7, issue: 1 }, toolContext)

      // Fix plan is created successfully with issue info
      expect(result).toContain('Fix Plan Created')
      expect(result).toContain('07-01a')
    })
  })
})
