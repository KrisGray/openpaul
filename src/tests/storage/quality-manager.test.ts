/**
 * QualityManager Tests
 * 
 * Tests for the QualityManager class functionality
 */

import { existsSync, mkdirSync, writeFileSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'
import { QualityManager } from '../../storage/quality-manager'

// Mock dependencies
jest.mock('../../storage/pre-planning-manager', () => ({
  PrePlanningManager: jest.fn().mockImplementation(() => ({
    resolvePhaseDir: jest.fn().mockReturnValue(null),
  })),
}))

describe('QualityManager', () => {
  const testDir = '/tmp/quality-manager-test'
  let qualityManager: QualityManager

  beforeEach(() => {
    // Create temp directory structure
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
    mkdirSync(testDir, { recursive: true })
    mkdirSync(join(testDir, '.planning', 'phases', '07-quality'), { recursive: true })

    qualityManager = new QualityManager(testDir)
  })

  afterEach(() => {
    // Cleanup
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  describe('resolvePhaseDir', () => {
    it('should return path for existing phase directory', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const result = qualityManager.resolvePhaseDir(7)
      expect(result).toBe(phaseDir)
    })

    it('should return null for non-existent phase', () => {
      const result = qualityManager.resolvePhaseDir(999)
      expect(result).toBeNull()
    })
  })

  describe('summaryExists', () => {
    it('should return true when SUMMARY.md exists', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      writeFileSync(join(phaseDir, '07-01-SUMMARY.md'), '# Summary\n\nContent')

      const result = qualityManager.summaryExists(phaseDir)
      expect(result).toBe(true)
    })

    it('should return false when no SUMMARY.md exists', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const result = qualityManager.summaryExists(phaseDir)
      expect(result).toBe(false)
    })

    it('should return false when phase directory does not exist', () => {
      const result = qualityManager.summaryExists('/non/existent/path')
      expect(result).toBe(false)
    })
  })

  describe('parseSummaryMustHaves', () => {
    it('should extract truths from frontmatter', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const summaryContent = `---
phase: 07-quality
plan: "01"
must_haves:
  truths:
    - Truth one
    - Truth two
    - Truth three
---

# Summary
`
      writeFileSync(join(phaseDir, '07-01-SUMMARY.md'), summaryContent)

      const result = qualityManager.parseSummaryMustHaves(phaseDir)

      expect(result).not.toBeNull()
      expect(result?.truths).toEqual(['Truth one', 'Truth two', 'Truth three'])
      expect(result?.sourcePlanId).toBe('07-01')
    })

    it('should return empty truths for invalid file', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      writeFileSync(join(phaseDir, '07-01-SUMMARY.md'), 'Invalid content')

      const result = qualityManager.parseSummaryMustHaves(phaseDir)

      // Returns empty truths object, not null
      expect(result).not.toBeNull()
      expect(result?.truths).toEqual([])
      expect(result?.sourcePlanId).toBe('07-01')
    })

    it('should return empty truths when no truths in frontmatter', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const summaryContent = `---
phase: 07-quality
plan: "01"
---

# Summary
`
      writeFileSync(join(phaseDir, '07-01-SUMMARY.md'), summaryContent)

      const result = qualityManager.parseSummaryMustHaves(phaseDir)

      expect(result).not.toBeNull()
      expect(result?.truths).toEqual([])
    })

    it('should return null when no SUMMARY.md exists', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const result = qualityManager.parseSummaryMustHaves(phaseDir)
      expect(result).toBeNull()
    })
  })

  describe('readUAT', () => {
    it('should return parsed UAT data', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const uatContent = `# UAT Results

\`\`\`json
{
  "phaseNumber": 7,
  "planId": "07-01",
  "testedAt": 1699999999000,
  "status": "complete",
  "items": [
    { "id": 1, "description": "Test", "result": "pass" }
  ],
  "summary": { "passed": 1, "failed": 0, "skipped": 0, "total": 1 }
}
\`\`\`
`
      writeFileSync(join(phaseDir, 'UAT.md'), uatContent)

      const result = qualityManager.readUAT(phaseDir)

      expect(result).not.toBeNull()
      expect(result?.phaseNumber).toBe(7)
      expect(result?.planId).toBe('07-01')
      expect(result?.items).toHaveLength(1)
    })

    it('should return null for missing file', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const result = qualityManager.readUAT(phaseDir)
      expect(result).toBeNull()
    })

    it('should return null for invalid JSON', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      writeFileSync(join(phaseDir, 'UAT.md'), '# UAT Results\n\n```json\ninvalid\n```')

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const result = qualityManager.readUAT(phaseDir)

      consoleErrorSpy.mockRestore()
      expect(result).toBeNull()
    })
  })

  describe('writeUAT', () => {
    it('should create file with correct format', async () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const uat = {
        phaseNumber: 7,
        planId: '07-01',
        testedAt: 1699999999000,
        status: 'complete' as const,
        items: [
          { id: 1, description: 'Test', result: 'pass' as const },
        ],
        summary: { passed: 1, failed: 0, skipped: 0, total: 1 },
      }

      await qualityManager.writeUAT(phaseDir, uat)

      const result = qualityManager.readUAT(phaseDir)
      expect(result).not.toBeNull()
      expect(result?.phaseNumber).toBe(7)
    })
  })

  describe('readUATIssues', () => {
    it('should return parsed issues data', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const issuesContent = `# UAT Issues

\`\`\`json
{
  "phaseNumber": 7,
  "sourcePlanId": "07-01",
  "createdAt": 1699999999000,
  "issues": [
    {
      "id": 1,
      "itemDescription": "Test",
      "status": "open",
      "severity": "major",
      "category": "functional",
      "description": "Issue",
      "sourcePlanId": "07-01",
      "createdAt": 1699999999000
    }
  ]
}
\`\`\`
`
      writeFileSync(join(phaseDir, 'UAT-ISSUES.md'), issuesContent)

      const result = qualityManager.readUATIssues(phaseDir)

      expect(result).not.toBeNull()
      expect(result?.phaseNumber).toBe(7)
      expect(result?.issues).toHaveLength(1)
    })

    it('should return null for missing file', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const result = qualityManager.readUATIssues(phaseDir)
      expect(result).toBeNull()
    })
  })

  describe('writeUATIssues', () => {
    it('should create file with table format', async () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const issues = {
        phaseNumber: 7,
        sourcePlanId: '07-01',
        createdAt: 1699999999000,
        issues: [
          {
            id: 1,
            itemDescription: 'Test item',
            status: 'open' as const,
            severity: 'major' as const,
            category: 'functional' as const,
            description: 'Issue description',
            sourcePlanId: '07-01',
            createdAt: 1699999999000,
          },
        ],
      }

      await qualityManager.writeUATIssues(phaseDir, issues)

      const result = qualityManager.readUATIssues(phaseDir)
      expect(result).not.toBeNull()
      expect(result?.issues).toHaveLength(1)
    })
  })

  describe('getNextAlphaPlanId', () => {
    it('should return "a" suffix for new plan', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      const result = qualityManager.getNextAlphaPlanId(phaseDir, '07-01')
      expect(result).toBe('07-01a')
    })

    it('should return next letter for existing suffix', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      // Create existing plan file
      writeFileSync(join(phaseDir, '07-01-PLAN.md'), '# Plan')
      writeFileSync(join(phaseDir, '07-01a-PLAN.md'), '# Plan')

      const result = qualityManager.getNextAlphaPlanId(phaseDir, '07-01')
      expect(result).toBe('07-01b')
    })

    it('should handle multiple existing plans', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      writeFileSync(join(phaseDir, '07-01-PLAN.md'), '# Plan')
      writeFileSync(join(phaseDir, '07-01a-PLAN.md'), '# Plan')
      writeFileSync(join(phaseDir, '07-01b-PLAN.md'), '# Plan')

      const result = qualityManager.getNextAlphaPlanId(phaseDir, '07-01')
      expect(result).toBe('07-01c')
    })

    it('should return next letter after highest', () => {
      const phaseDir = join(testDir, '.planning', 'phases', '07-quality')
      writeFileSync(join(phaseDir, '07-01-PLAN.md'), '# Plan')
      writeFileSync(join(phaseDir, '07-01a-PLAN.md'), '# Plan')
      writeFileSync(join(phaseDir, '07-01c-PLAN.md'), '# Plan')

      const result = qualityManager.getNextAlphaPlanId(phaseDir, '07-01')
      // After a and c, next should be d (not b, to avoid confusion)
      expect(result).toBe('07-01d')
    })

    it('should handle non-existent directory', () => {
      const result = qualityManager.getNextAlphaPlanId('/non/existent', '07-01')
      expect(result).toBe('07-01a')
    })
  })

  describe('createEmptyUAT', () => {
    it('should create empty UAT with correct structure', () => {
      const uat = qualityManager.createEmptyUAT(7, '07-01')

      expect(uat.phaseNumber).toBe(7)
      expect(uat.planId).toBe('07-01')
      expect(uat.status).toBe('in-progress')
      expect(uat.items).toEqual([])
      expect(uat.summary.passed).toBe(0)
      expect(uat.summary.failed).toBe(0)
      expect(uat.summary.skipped).toBe(0)
      expect(uat.summary.total).toBe(0)
      expect(uat.testedAt).toBeGreaterThan(0)
    })
  })

  describe('createEmptyUATIssues', () => {
    it('should create empty UATIssues with correct structure', () => {
      const issues = qualityManager.createEmptyUATIssues(7, '07-01')

      expect(issues.phaseNumber).toBe(7)
      expect(issues.sourcePlanId).toBe('07-01')
      expect(issues.issues).toEqual([])
      expect(issues.createdAt).toBeGreaterThan(0)
    })
  })

  describe('calculateSummary', () => {
    it('should calculate correct summary', () => {
      const items = [
        { id: 1, description: 'Test 1', result: 'pass' as const },
        { id: 2, description: 'Test 2', result: 'fail' as const },
        { id: 3, description: 'Test 3', result: 'pass' as const },
        { id: 4, description: 'Test 4', result: 'skip' as const },
      ]

      const summary = qualityManager.calculateSummary(items)

      expect(summary.passed).toBe(2)
      expect(summary.failed).toBe(1)
      expect(summary.skipped).toBe(1)
      expect(summary.total).toBe(4)
    })

    it('should handle empty items', () => {
      const summary = qualityManager.calculateSummary([])

      expect(summary.passed).toBe(0)
      expect(summary.failed).toBe(0)
      expect(summary.skipped).toBe(0)
      expect(summary.total).toBe(0)
    })
  })
})
