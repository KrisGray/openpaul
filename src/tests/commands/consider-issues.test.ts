/**
 * Consider Issues Command Tests
 * 
 * Tests for /openpaul:consider-issues command functionality
 */

import { openpaulConsiderIssues } from '../../commands/consider-issues'
import { existsSync } from 'fs'
import { atomicWrite } from '../../storage/atomic-writes'
import { PrePlanningManager } from '../../storage/pre-planning-manager'

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../storage/pre-planning-manager')

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

describe('openpaulConsiderIssues', () => {
  const mockDirectory = '/test/project'
  const mockContext = { directory: mockDirectory }
  const mockPhaseDir = '/test/project/.planning/phases/06-test-phase'

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock behavior
    ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
      resolvePhaseDir: jest.fn().mockReturnValue(mockPhaseDir),
      createIssues: jest.fn().mockReturnValue('# Issues\n\n## Critical\n\n- Issue 1\n\n## High\n\n- Issue 2'),
    }))
    ;(existsSync as jest.Mock).mockReturnValue(false)
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('successful issues creation', () => {
    it('should create ISSUES.md with severity categories', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Database migration fails',
        severities: 'critical',
      }, mockContext)

      expect(result).toContain('Issues Identified')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should sort issues by severity (critical → low)', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Low issue, Critical issue, High issue',
        severities: 'low, critical, high',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createIssues).toHaveBeenCalledWith(6, expect.arrayContaining([
        expect.objectContaining({ severity: 'low' }),
        expect.objectContaining({ severity: 'critical' }),
        expect.objectContaining({ severity: 'high' }),
      ]))
    })

    it('should include table summary', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue 1, Issue 2',
        severities: 'critical, high',
      }, mockContext)

      expect(result).toContain('By Severity:')
      expect(result).toContain('Critical:')
      expect(result).toContain('High:')
      expect(result).toContain('Medium:')
      expect(result).toContain('Low:')
    })

    it('should return formatted output with severity counts', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue 1, Issue 2, Issue 3',
        severities: 'critical, critical, low',
      }, mockContext)

      expect(result).toContain('Issues Identified')
      expect(result).toContain('3 issues')
      expect(result).toContain('Critical: 2')
      expect(result).toContain('Low: 1')
    })

    it('should include issue count in output', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue A, Issue B, Issue C',
      }, mockContext)

      expect(result).toContain('3 issues')
    })
  })

  describe('severity handling', () => {
    it('should validate severity values', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue 1',
        severities: 'invalid-severity',
      }, mockContext)

      expect(result).toContain('Invalid Severity')
      expect(result).toContain('invalid-severity')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should show valid severity values in error', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue 1',
        severities: 'invalid',
      }, mockContext)

      expect(result).toContain('critical')
      expect(result).toContain('high')
      expect(result).toContain('medium')
      expect(result).toContain('low')
    })

    it('should organize output by severity sections', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Critical issue, High issue',
        severities: 'critical, high',
      }, mockContext)

      expect(result).toContain('Critical: 1')
      expect(result).toContain('High: 1')
    })

    it('should parse pipe-separated areas correctly', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Database issue',
        areas: 'API|Database|Auth',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createIssues).toHaveBeenCalledWith(6, [
        expect.objectContaining({
          affectedAreas: ['API', 'Database', 'Auth'],
        }),
      ])
    })

    it('should use default severity when not specified', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue without severity',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createIssues).toHaveBeenCalledWith(6, [
        expect.objectContaining({ severity: 'medium' }),
      ])
    })

    it('should use default areas when not specified', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue without areas',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createIssues).toHaveBeenCalledWith(6, [
        expect.objectContaining({ affectedAreas: ['Unspecified'] }),
      ])
    })

    it('should use default mitigation when not specified', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue without mitigation',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createIssues).toHaveBeenCalledWith(6, [
        expect.objectContaining({ mitigation: 'To be determined' }),
      ])
    })
  })

  describe('critical/high issues warning', () => {
    it('should show warning for critical issues', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Critical blocker here',
        severities: 'critical',
      }, mockContext)

      expect(result).toContain('Critical/High Issues')
      expect(result).toContain('Critical blocker here')
    })

    it('should show warning for high issues', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'High priority issue here',
        severities: 'high',
      }, mockContext)

      expect(result).toContain('Critical/High Issues')
    })

    it('should NOT show warning for only medium/low issues', async () => {
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Medium issue, Low issue',
        severities: 'medium, low',
      }, mockContext)

      expect(result).not.toContain('Critical/High Issues')
    })

    it('should truncate long issue descriptions in warning', async () => {
      const longDescription = 'This is a very long issue description that should be truncated in the warning output'
      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: longDescription,
        severities: 'critical',
      }, mockContext)

      expect(result).toContain('...')
    })
  })

  describe('existing file handling', () => {
    it('should prompt to overwrite when file exists without --overwrite or --append', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Test issue',
      }, mockContext)

      expect(result).toContain('Issues Already Exist')
      expect(result).toContain('--overwrite')
      expect(result).toContain('--append')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should overwrite with --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Test issue',
        overwrite: true,
      }, mockContext)

      expect(result).toContain('Issues Identified')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should allow append with --append flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Test issue',
        append: true,
      }, mockContext)

      expect(result).toContain('Issues Identified')
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should return error when phase directory not found', async () => {
      ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
        resolvePhaseDir: jest.fn().mockReturnValue(null),
      }))

      const result = await (openpaulConsiderIssues as any).execute({
        phase: 99,
        issues: 'Test issue',
      }, mockContext)

      expect(result).toContain('Cannot Create Issues')
      expect(result).toContain('not found')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should return formatted error on file write failure', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))

      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Test issue',
      }, mockContext)

      expect(result).toContain('Issues Creation Failed')
      expect(result).toContain('Write failed')
    })

    it('should handle unknown errors gracefully', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue('Unknown error string')

      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Test issue',
      }, mockContext)

      expect(result).toContain('Issues Creation Failed')
      expect(result).toContain('Unknown error occurred')
    })

    it('should show valid severities in error output', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Some error'))

      const result = await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Test issue',
      }, mockContext)

      expect(result).toContain('Valid severities:')
      expect(result).toContain('critical')
      expect(result).toContain('high')
      expect(result).toContain('medium')
      expect(result).toContain('low')
    })
  })

  describe('input parsing', () => {
    it('should parse comma-separated issues correctly', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'Issue A, Issue B, Issue C',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createIssues).toHaveBeenCalledWith(6, expect.arrayContaining([
        expect.objectContaining({ description: 'Issue A' }),
        expect.objectContaining({ description: 'Issue B' }),
        expect.objectContaining({ description: 'Issue C' }),
      ]))
    })

    it('should parse comma-separated severities correctly', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'A, B',
        severities: 'critical, high',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const entries = managerInstance.createIssues.mock.calls[0][1]

      expect(entries[0].severity).toBe('critical')
      expect(entries[1].severity).toBe('high')
    })

    it('should parse comma-separated mitigations correctly', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'A, B',
        mitigations: 'Fix A, Fix B',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const entries = managerInstance.createIssues.mock.calls[0][1]

      expect(entries[0].mitigation).toBe('Fix A')
      expect(entries[1].mitigation).toBe('Fix B')
    })

    it('should handle mismatched array lengths (severities)', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'A, B, C',
        severities: 'critical', // Only one severity
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const entries = managerInstance.createIssues.mock.calls[0][1]

      expect(entries[0].severity).toBe('critical')
      expect(entries[1].severity).toBe('medium') // default
      expect(entries[2].severity).toBe('medium') // default
    })

    it('should handle mismatched array lengths (areas)', async () => {
      await (openpaulConsiderIssues as any).execute({
        phase: 6,
        issues: 'A, B',
        areas: 'API', // Only one area
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const entries = managerInstance.createIssues.mock.calls[0][1]

      expect(entries[0].affectedAreas).toEqual(['API'])
      expect(entries[1].affectedAreas).toEqual(['Unspecified']) // default
    })
  })
})
