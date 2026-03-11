/**
 * Quality Types Tests
 * 
 * Tests for UAT (User Acceptance Testing) types and Zod schemas
 */

import {
  UATResultSchema,
  UATSeveritySchema,
  UATCategorySchema,
  UATItemSchema,
  UATIssueSchema,
  UATSummarySchema,
  UATSchema,
  UATIssuesSchema,
} from '../../types/quality'

describe('Quality Types', () => {
  describe('UATResultSchema', () => {
    it('should validate "pass" result', () => {
      expect(() => UATResultSchema.parse('pass')).not.toThrow()
      expect(UATResultSchema.parse('pass')).toBe('pass')
    })

    it('should validate "fail" result', () => {
      expect(() => UATResultSchema.parse('fail')).not.toThrow()
      expect(UATResultSchema.parse('fail')).toBe('fail')
    })

    it('should validate "skip" result', () => {
      expect(() => UATResultSchema.parse('skip')).not.toThrow()
      expect(UATResultSchema.parse('skip')).toBe('skip')
    })

    it('should reject invalid result values', () => {
      expect(() => UATResultSchema.parse('passed')).toThrow()
      expect(() => UATResultSchema.parse('failed')).toThrow()
      expect(() => UATResultSchema.parse('')).toThrow()
      expect(() => UATResultSchema.parse(123)).toThrow()
    })
  })

  describe('UATSeveritySchema', () => {
    it('should validate "critical" severity', () => {
      expect(() => UATSeveritySchema.parse('critical')).not.toThrow()
      expect(UATSeveritySchema.parse('critical')).toBe('critical')
    })

    it('should validate "major" severity', () => {
      expect(() => UATSeveritySchema.parse('major')).not.toThrow()
      expect(UATSeveritySchema.parse('major')).toBe('major')
    })

    it('should validate "minor" severity', () => {
      expect(() => UATSeveritySchema.parse('minor')).not.toThrow()
      expect(UATSeveritySchema.parse('minor')).toBe('minor')
    })

    it('should reject invalid severity values', () => {
      expect(() => UATSeveritySchema.parse('critical!')).toThrow()
      expect(() => UATSeveritySchema.parse('MAJOR')).toThrow()
      expect(() => UATSeveritySchema.parse('')).toThrow()
    })
  })

  describe('UATCategorySchema', () => {
    it('should validate "functional" category', () => {
      expect(() => UATCategorySchema.parse('functional')).not.toThrow()
      expect(UATCategorySchema.parse('functional')).toBe('functional')
    })

    it('should validate "visual" category', () => {
      expect(() => UATCategorySchema.parse('visual')).not.toThrow()
      expect(UATCategorySchema.parse('visual')).toBe('visual')
    })

    it('should validate "performance" category', () => {
      expect(() => UATCategorySchema.parse('performance')).not.toThrow()
      expect(UATCategorySchema.parse('performance')).toBe('performance')
    })

    it('should validate "configuration" category', () => {
      expect(() => UATCategorySchema.parse('configuration')).not.toThrow()
      expect(UATCategorySchema.parse('configuration')).toBe('configuration')
    })

    it('should reject invalid category values', () => {
      expect(() => UATCategorySchema.parse('func')).toThrow()
      expect(() => UATCategorySchema.parse('VISUAL')).toThrow()
      expect(() => UATCategorySchema.parse('')).toThrow()
    })
  })

  describe('UATItemSchema', () => {
    it('should validate a valid UAT item', () => {
      const validItem = {
        id: 1,
        description: 'Quality types have comprehensive test coverage',
        result: 'pass',
      }

      expect(() => UATItemSchema.parse(validItem)).not.toThrow()
      const parsed = UATItemSchema.parse(validItem)
      expect(parsed.id).toBe(1)
      expect(parsed.description).toBe('Quality types have comprehensive test coverage')
      expect(parsed.result).toBe('pass')
    })

    it('should validate item with optional fields', () => {
      const itemWithOptional = {
        id: 2,
        description: 'Test item',
        result: 'fail',
        notes: 'Some notes about the failure',
        testedAt: 1699999999000,
      }

      expect(() => UATItemSchema.parse(itemWithOptional)).not.toThrow()
      const parsed = UATItemSchema.parse(itemWithOptional)
      expect(parsed.notes).toBe('Some notes about the failure')
      expect(parsed.testedAt).toBe(1699999999000)
    })

    it('should reject item with missing required fields', () => {
      expect(() => UATItemSchema.parse({ description: 'test' })).toThrow()
      expect(() => UATItemSchema.parse({ id: 1 })).toThrow()
      expect(() => UATItemSchema.parse({ id: 1, description: 'test' })).toThrow()
    })

    it('should reject item with invalid id', () => {
      expect(() => UATItemSchema.parse({ id: 0, description: 'test', result: 'pass' })).toThrow()
      expect(() => UATItemSchema.parse({ id: -1, description: 'test', result: 'pass' })).toThrow()
      expect(() => UATItemSchema.parse({ id: 1.5, description: 'test', result: 'pass' })).toThrow()
    })

    it('should reject item with empty description', () => {
      expect(() => UATItemSchema.parse({ id: 1, description: '', result: 'pass' })).toThrow()
    })

    it('should reject item with invalid result', () => {
      expect(() => UATItemSchema.parse({ id: 1, description: 'test', result: 'passed' })).toThrow()
    })
  })

  describe('UATIssueSchema', () => {
    it('should validate a valid UAT issue', () => {
      const validIssue = {
        id: 1,
        itemDescription: 'Test item',
        status: 'open',
        severity: 'major',
        category: 'functional',
        description: 'Button not responding to clicks',
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
      }

      expect(() => UATIssueSchema.parse(validIssue)).not.toThrow()
      const parsed = UATIssueSchema.parse(validIssue)
      expect(parsed.id).toBe(1)
      expect(parsed.status).toBe('open')
      expect(parsed.severity).toBe('major')
    })

    it('should validate issue with optional fixPlanId', () => {
      const issueWithFix = {
        id: 1,
        itemDescription: 'Test item',
        status: 'open',
        severity: 'critical',
        category: 'visual',
        description: 'Layout issue',
        sourcePlanId: '07-01',
        fixPlanId: '07-01a',
        suggestedFix: 'Update CSS',
        createdAt: 1699999999000,
      }

      expect(() => UATIssueSchema.parse(issueWithFix)).not.toThrow()
      const parsed = UATIssueSchema.parse(issueWithFix)
      expect(parsed.fixPlanId).toBe('07-01a')
      expect(parsed.suggestedFix).toBe('Update CSS')
    })

    it('should reject issue with missing required fields', () => {
      expect(() => UATIssueSchema.parse({ id: 1 })).toThrow()
      expect(() => UATIssueSchema.parse({ description: 'test' })).toThrow()
      expect(() => UATIssueSchema.parse({ id: 1, description: 'test' })).toThrow()
    })

    it('should reject issue with invalid status', () => {
      const issue = {
        id: 1,
        itemDescription: 'Test',
        status: 'resolved',
        severity: 'major',
        category: 'functional',
        description: 'Test',
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
      }
      expect(() => UATIssueSchema.parse(issue)).toThrow()
    })

    it('should reject issue with invalid severity', () => {
      const issue = {
        id: 1,
        itemDescription: 'Test',
        status: 'open',
        severity: 'high',
        category: 'functional',
        description: 'Test',
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
      }
      expect(() => UATIssueSchema.parse(issue)).toThrow()
    })

    it('should reject issue with invalid category', () => {
      const issue = {
        id: 1,
        itemDescription: 'Test',
        status: 'open',
        severity: 'major',
        category: 'security',
        description: 'Test',
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
      }
      expect(() => UATIssueSchema.parse(issue)).toThrow()
    })
  })

  describe('UATSummarySchema', () => {
    it('should validate a valid UAT summary', () => {
      const validSummary = {
        passed: 5,
        failed: 2,
        skipped: 1,
        total: 8,
      }

      expect(() => UATSummarySchema.parse(validSummary)).not.toThrow()
      const parsed = UATSummarySchema.parse(validSummary)
      expect(parsed.passed).toBe(5)
      expect(parsed.total).toBe(8)
    })

    it('should reject summary with negative counts', () => {
      expect(() => UATSummarySchema.parse({ passed: -1, failed: 0, skipped: 0, total: 0 })).toThrow()
    })

    it('should reject summary with non-integer values', () => {
      expect(() => UATSummarySchema.parse({ passed: 1.5, failed: 0, skipped: 0, total: 1 })).toThrow()
    })

    it('should reject summary with missing fields', () => {
      expect(() => UATSummarySchema.parse({ passed: 5, failed: 2 })).toThrow()
    })
  })

  describe('UATSchema', () => {
    it('should validate a valid UAT structure', () => {
      const validUAT = {
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 1699999999000,
        status: 'complete',
        items: [
          { id: 1, description: 'Test 1', result: 'pass' },
          { id: 2, description: 'Test 2', result: 'fail', notes: 'Issue found' },
        ],
        summary: {
          passed: 1,
          failed: 1,
          skipped: 0,
          total: 2,
        },
      }

      expect(() => UATSchema.parse(validUAT)).not.toThrow()
      const parsed = UATSchema.parse(validUAT)
      expect(parsed.phaseNumber).toBe(7)
      expect(parsed.items).toHaveLength(2)
    })

    it('should validate UAT with in-progress status', () => {
      const uatInProgress = {
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 1699999999000,
        status: 'in-progress',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      }

      expect(() => UATSchema.parse(uatInProgress)).not.toThrow()
    })

    it('should validate UAT with partial status', () => {
      const uatPartial = {
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 1699999999000,
        status: 'partial',
        items: [{ id: 1, description: 'Test', result: 'pass' }],
        summary: { passed: 1, failed: 0, skipped: 0, total: 1 },
      }

      expect(() => UATSchema.parse(uatPartial)).not.toThrow()
    })

    it('should reject UAT with invalid status', () => {
      const invalidUAT = {
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 1699999999000,
        status: 'finished',
        items: [],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      }

      expect(() => UATSchema.parse(invalidUAT)).toThrow()
    })

    it('should reject UAT with invalid items array', () => {
      const invalidUAT = {
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 1699999999000,
        status: 'complete',
        items: [{ id: 'invalid' }],
        summary: { passed: 0, failed: 0, skipped: 0, total: 0 },
      }

      expect(() => UATSchema.parse(invalidUAT)).toThrow()
    })
  })

  describe('UATIssuesSchema', () => {
    it('should validate a valid UATIssues structure', () => {
      const validIssues = {
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
            description: 'Issue description',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      }

      expect(() => UATIssuesSchema.parse(validIssues)).not.toThrow()
      const parsed = UATIssuesSchema.parse(validIssues)
      expect(parsed.issues).toHaveLength(1)
    })

    it('should validate UATIssues with empty issues array', () => {
      const emptyIssues = {
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [],
      }

      expect(() => UATIssuesSchema.parse(emptyIssues)).not.toThrow()
    })

    it('should reject UATIssues with invalid issue in array', () => {
      const invalidIssues = {
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [{ id: 'invalid' }],
      }

      expect(() => UATIssuesSchema.parse(invalidIssues)).toThrow()
    })

    it('should reject UATIssues with missing required fields', () => {
      expect(() => UATIssuesSchema.parse({ phaseNumber: 7 })).toThrow()
      expect(() => UATIssuesSchema.parse({ sourcePlanId: '07-01' })).toThrow()
    })
  })
})
