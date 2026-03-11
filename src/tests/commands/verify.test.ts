/**
 * Verify Command Tests
 * 
 * Tests for the /openpaul:verify command functionality
 */

import { QualityManager } from '../../storage/quality-manager'
import { paulVerify } from '../../commands/verify'

// Mock dependencies
jest.mock('../../storage/quality-manager')
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

describe('Verify Command', () => {
  const mockDirectory = '/test/project'

  let mockQualityManager: {
    resolvePhaseDir: jest.Mock
    summaryExists: jest.Mock
    parseSummaryMustHaves: jest.Mock
    readUAT: jest.Mock
    createEmptyUAT: jest.Mock
    readUATIssues: jest.Mock
    createEmptyUATIssues: jest.Mock
    writeUAT: jest.Mock
    writeUATIssues: jest.Mock
    calculateSummary: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockQualityManager = {
      resolvePhaseDir: jest.fn(),
      summaryExists: jest.fn(),
      parseSummaryMustHaves: jest.fn(),
      readUAT: jest.fn(),
      createEmptyUAT: jest.fn(),
      readUATIssues: jest.fn(),
      createEmptyUATIssues: jest.fn(),
      writeUAT: jest.fn(),
      writeUATIssues: jest.fn(),
      calculateSummary: jest.fn(),
    }

    ;(QualityManager as jest.Mock).mockImplementation(() => mockQualityManager)
  })

  describe('error: phase directory not found', () => {
    it('should show error when SUMMARY.md not found', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7 }, toolContext)

      expect(result).toContain('Cannot Verify')
      expect(result).toContain('directory not found')
    })
  })

  describe('error: no SUMMARY.md', () => {
    it('should show error when SUMMARY.md does not exist', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(false)

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7 }, toolContext)

      expect(result).toContain('Cannot Verify')
      expect(result).toContain('SUMMARY.md not found')
    })
  })

  describe('error: parse failure', () => {
    it('should show error when cannot parse SUMMARY.md', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7 }, toolContext)

      expect(result).toContain('Cannot Verify')
      expect(result).toContain('Could not parse SUMMARY.md')
    })
  })

  describe('error: no test items', () => {
    it('should show message when no truths found', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({ truths: [], sourcePlanId: '07-01' })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7 }, toolContext)

      expect(result).toContain('No Test Items')
    })
  })

  describe('checklist display', () => {
    it('should show checklist when no --item flag', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one', 'Truth two', 'Truth three'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)
      mockQualityManager.createEmptyUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7 }, toolContext)

      expect(result).toContain('UAT Checklist')
      expect(result).toContain('Truth one')
      expect(result).toContain('Truth two')
      expect(result).toContain('Truth three')
      expect(result).toContain('/openpaul:verify')
    })

    it('should show progress with partial completion', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one', 'Truth two', 'Truth three'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'partial',
        items: [
          { id: 1, description: 'Truth one', result: 'pass' },
        ],
        summary: { passed: 1, failed: 0, skipped: 0, total: 1 },
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7 }, toolContext)

      expect(result).toContain('Progress:')
      expect(result).toContain('1/3 tested')
      expect(result).toContain('Passed:')
    })

    it('should show item details when item specified but no result', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one', 'Truth two'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7, item: 1 }, toolContext)

      expect(result).toContain('Item 1')
      expect(result).toContain('Truth one')
      expect(result).toContain('--result pass')
    })

    it('should show current status for already tested item', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'partial',
        items: [
          { id: 1, description: 'Truth one', result: 'fail', notes: 'Found issue' },
        ],
        summary: { passed: 0, failed: 1, skipped: 0, total: 1 },
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7, item: 1 }, toolContext)

      expect(result).toContain('Current status:')
      expect(result).toContain('fail')
      expect(result).toContain('Found issue')
    })

    it('should show error for invalid item number', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute({ phase: 7, item: 99 }, toolContext)

      expect(result).toContain('Invalid Item')
      expect(result).toContain('out of range')
    })
  })

  describe('recording results', () => {
    it('should mark item as passed with --result pass', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one', 'Truth two'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)
      mockQualityManager.createEmptyUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      })
      mockQualityManager.calculateSummary.mockReturnValue({
        passed: 1,
        failed: 0,
        skipped: 0,
        total: 2,
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'pass' },
        toolContext
      )

      expect(mockQualityManager.writeUAT).toHaveBeenCalled()
      expect(result).toContain('Result Recorded')
      expect(result).toContain('pass')
      expect(result).toContain('Progress:')
    })

    it('should mark item as failed with --result fail', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)
      mockQualityManager.createEmptyUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      })
      mockQualityManager.readUATIssues.mockReturnValue(null)
      mockQualityManager.createEmptyUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 0,
        issues: [],
      })
      mockQualityManager.calculateSummary.mockReturnValue({
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'fail', severity: 'major', category: 'functional', notes: 'Issue found' },
        toolContext
      )

      expect(mockQualityManager.writeUAT).toHaveBeenCalled()
      expect(mockQualityManager.writeUATIssues).toHaveBeenCalled()
      expect(result).toContain('Result Recorded')
      expect(result).toContain('fail')
      expect(result).toContain('UAT-ISSUES.md')
    })

    it('should mark item as skipped with --result skip', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)
      mockQualityManager.createEmptyUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      })
      mockQualityManager.calculateSummary.mockReturnValue({
        passed: 0,
        failed: 0,
        skipped: 1,
        total: 1,
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'skip' },
        toolContext
      )

      expect(mockQualityManager.writeUAT).toHaveBeenCalled()
      expect(result).toContain('Result Recorded')
      expect(result).toContain('skip')
    })

    it('should prompt for notes on failure without severity', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'fail' },
        toolContext
      )

      expect(result).toContain('Missing Information')
      expect(result).toContain('--severity')
      expect(result).toContain('--category')
    })

    it('should prompt for notes on failure without notes', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'fail', severity: 'major', category: 'functional' },
        toolContext
      )

      expect(result).toContain('Missing Notes')
      expect(result).toContain('--notes')
    })
  })

  describe('completion', () => {
    it('should show summary on completion', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'complete',
        items: [
          { id: 1, description: 'Truth one', result: 'pass' },
        ],
        summary: { passed: 1, failed: 0, skipped: 0, total: 1 },
      })
      mockQualityManager.writeUAT.mockResolvedValue(undefined)
      mockQualityManager.calculateSummary.mockReturnValue({
        passed: 1,
        failed: 0,
        skipped: 0,
        total: 1,
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'pass' },
        toolContext
      )

      expect(result).toContain('Verification Complete')
      expect(result).toContain('Summary:')
    })

    it('should show UAT-ISSUES.md on completion with failures', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)
      mockQualityManager.createEmptyUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      })
      mockQualityManager.readUATIssues.mockReturnValue(null)
      mockQualityManager.createEmptyUATIssues.mockReturnValue({
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 0,
        issues: [],
      })
      mockQualityManager.calculateSummary.mockReturnValue({
        passed: 0,
        failed: 1,
        skipped: 0,
        total: 1,
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'fail', severity: 'major', category: 'functional', notes: 'Issue' },
        toolContext
      )

      expect(result).toContain('Verification Complete')
      expect(result).toContain('UAT-ISSUES.md')
    })

    it('should show all tests passed when no failures', async () => {
      mockQualityManager.resolvePhaseDir.mockReturnValue('/test/.planning/phases/07-quality')
      mockQualityManager.summaryExists.mockReturnValue(true)
      mockQualityManager.parseSummaryMustHaves.mockReturnValue({
        truths: ['Truth one'],
        sourcePlanId: '07-01',
      })
      mockQualityManager.readUAT.mockReturnValue(null)
      mockQualityManager.createEmptyUAT.mockReturnValue({
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 0,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      })
      mockQualityManager.calculateSummary.mockReturnValue({
        passed: 1,
        failed: 0,
        skipped: 0,
        total: 1,
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await paulVerify.execute(
        { phase: 7, item: 1, result: 'pass' },
        toolContext
      )

      expect(result).toContain('All tests passed!')
    })
  })
})
