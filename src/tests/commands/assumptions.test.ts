/**
 * Assumptions Command Tests
 * 
 * Tests for /openpaul:assumptions command functionality
 */

import { openpaulAssumptions } from '../../commands/assumptions'
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

describe('openpaulAssumptions', () => {
  const mockDirectory = '/test/project'
  const mockContext = { directory: mockDirectory }
  const mockPhaseDir = '/test/project/.planning/phases/06-test-phase'

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock behavior
    ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
      resolvePhaseDir: jest.fn().mockReturnValue(mockPhaseDir),
      createAssumptions: jest.fn().mockReturnValue('# Assumptions\n\n| Statement | Status | Confidence | Impact |'),
    }))
    ;(existsSync as jest.Mock).mockReturnValue(false)
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('successful assumptions creation', () => {
    it('should create ASSUMPTIONS.md with table format', async () => {
      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Users will have email addresses',
      }, mockContext)

      expect(result).toContain('Assumptions Captured')
      expect(result).toContain('6')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should parse comma-separated assumptions correctly', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Assumption A, Assumption B, Assumption C',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createAssumptions).toHaveBeenCalledWith(6, expect.arrayContaining([
        expect.objectContaining({ statement: 'Assumption A' }),
        expect.objectContaining({ statement: 'Assumption B' }),
        expect.objectContaining({ statement: 'Assumption C' }),
      ]))
    })

    it('should assign validation_status from statuses parameter', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Assumption A, Assumption B',
        statuses: 'validated, unvalidated',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createAssumptions).toHaveBeenCalledWith(6, expect.arrayContaining([
        expect.objectContaining({ statement: 'Assumption A', validation_status: 'validated' }),
        expect.objectContaining({ statement: 'Assumption B', validation_status: 'unvalidated' }),
      ]))
    })

    it('should assign confidence from confidences parameter', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Assumption A, Assumption B',
        confidences: 'high, low',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createAssumptions).toHaveBeenCalledWith(6, expect.arrayContaining([
        expect.objectContaining({ statement: 'Assumption A', confidence: 'high' }),
        expect.objectContaining({ statement: 'Assumption B', confidence: 'low' }),
      ]))
    })

    it('should assign impact from impacts parameter', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Assumption A, Assumption B',
        impacts: 'High impact on UX, Blocks deployment',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createAssumptions).toHaveBeenCalledWith(6, expect.arrayContaining([
        expect.objectContaining({ statement: 'Assumption A', impact: 'High impact on UX' }),
        expect.objectContaining({ statement: 'Assumption B', impact: 'Blocks deployment' }),
      ]))
    })

    it('should return formatted output with counts', async () => {
      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Assumption A, Assumption B, Assumption C',
        statuses: 'validated, unvalidated, invalidated',
      }, mockContext)

      expect(result).toContain('Assumptions Captured')
      expect(result).toContain('3 assumptions')
      expect(result).toContain('By Status:')
    })
  })

  describe('input parsing', () => {
    it('should use parallel arrays for status/confidence/impact', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'First, Second, Third',
        statuses: 'validated, unvalidated, invalidated',
        confidences: 'high, medium, low',
        impacts: 'Impact 1, Impact 2, Impact 3',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const call = managerInstance.createAssumptions.mock.calls[0]
      const entries = call[1]

      expect(entries[0]).toEqual({
        statement: 'First',
        validation_status: 'validated',
        confidence: 'high',
        impact: 'Impact 1',
      })
      expect(entries[1]).toEqual({
        statement: 'Second',
        validation_status: 'unvalidated',
        confidence: 'medium',
        impact: 'Impact 2',
      })
      expect(entries[2]).toEqual({
        statement: 'Third',
        validation_status: 'invalidated',
        confidence: 'low',
        impact: 'Impact 3',
      })
    })

    it('should use default values for missing fields', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test assumption',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createAssumptions).toHaveBeenCalledWith(6, [
        expect.objectContaining({
          statement: 'Test assumption',
          validation_status: 'unvalidated',
          confidence: 'medium',
          impact: 'Impact not specified',
        }),
      ])
    })

    it('should handle mismatched array lengths (statuses)', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'A, B, C',
        statuses: 'validated', // Only one status
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const entries = managerInstance.createAssumptions.mock.calls[0][1]

      expect(entries[0].validation_status).toBe('validated')
      expect(entries[1].validation_status).toBe('unvalidated') // default
      expect(entries[2].validation_status).toBe('unvalidated') // default
    })

    it('should handle mismatched array lengths (confidences)', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'A, B',
        confidences: 'high', // Only one confidence
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const entries = managerInstance.createAssumptions.mock.calls[0][1]

      expect(entries[0].confidence).toBe('high')
      expect(entries[1].confidence).toBe('medium') // default
    })

    it('should handle mismatched array lengths (impacts)', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'A, B',
        impacts: 'Impact A', // Only one impact
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      const entries = managerInstance.createAssumptions.mock.calls[0][1]

      expect(entries[0].impact).toBe('Impact A')
      expect(entries[1].impact).toBe('Impact not specified') // default
    })
  })

  describe('existing file handling', () => {
    it('should prompt to overwrite when file exists without --overwrite or --append', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test assumption',
      }, mockContext)

      expect(result).toContain('Assumptions Already Exist')
      expect(result).toContain('--overwrite')
      expect(result).toContain('--append')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should overwrite with --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test assumption',
        overwrite: true,
      }, mockContext)

      expect(result).toContain('Assumptions Captured')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should allow append with --append flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test assumption',
        append: true,
      }, mockContext)

      expect(result).toContain('Assumptions Captured')
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('validation handling', () => {
    it('should use default for invalid validation status', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test',
        statuses: 'invalid-status',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createAssumptions).toHaveBeenCalledWith(6, [
        expect.objectContaining({ validation_status: 'unvalidated' }),
      ])
    })

    it('should use default for invalid confidence level', async () => {
      await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test',
        confidences: 'invalid-confidence',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createAssumptions).toHaveBeenCalledWith(6, [
        expect.objectContaining({ confidence: 'medium' }),
      ])
    })
  })

  describe('error handling', () => {
    it('should return error when phase directory not found', async () => {
      ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
        resolvePhaseDir: jest.fn().mockReturnValue(null),
      }))

      const result = await (openpaulAssumptions as any).execute({
        phase: 99,
        assumptions: 'Test assumption',
      }, mockContext)

      expect(result).toContain('Cannot Create Assumptions')
      expect(result).toContain('not found')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should return formatted error on file write failure', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))

      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test assumption',
      }, mockContext)

      expect(result).toContain('Assumptions Creation Failed')
      expect(result).toContain('Write failed')
    })

    it('should handle unknown errors gracefully', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue('Unknown error string')

      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'Test assumption',
      }, mockContext)

      expect(result).toContain('Assumptions Creation Failed')
      expect(result).toContain('Unknown error occurred')
    })
  })

  describe('status counts in output', () => {
    it('should show status counts correctly', async () => {
      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'A, B, C',
        statuses: 'validated, unvalidated, validated',
      }, mockContext)

      expect(result).toContain('Unvalidated: 1')
      expect(result).toContain('Validated: 2')
      expect(result).toContain('Invalidated: 0')
    })

    it('should show all zero counts when none provided', async () => {
      const result = await (openpaulAssumptions as any).execute({
        phase: 6,
        assumptions: 'A',
      }, mockContext)

      expect(result).toContain('Unvalidated: 1')
      expect(result).toContain('Validated: 0')
      expect(result).toContain('Invalidated: 0')
    })
  })
})
