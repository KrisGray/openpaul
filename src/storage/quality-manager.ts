import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { atomicWrite } from './atomic-writes'
import { PrePlanningManager } from './pre-planning-manager'
import type { UAT, UATIssues, UATItem, UATSummary } from '../types/quality'
import { UATSchema, UATIssuesSchema } from '../types/quality'

/**
 * Quality Manager
 * 
 * Manages UAT (User Acceptance Testing) file operations and plan ID generation
 * for the quality verification workflow.
 */
export class QualityManager {
  private projectRoot: string
  private prePlanningManager: PrePlanningManager

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.prePlanningManager = new PrePlanningManager(projectRoot)
  }

  /**
   * Resolve phase directory using PrePlanningManager pattern
   */
  resolvePhaseDir(phaseNumber: number): string | null {
    // Use the pre-planning manager's method
    const phaseDir = this.prePlanningManager.resolvePhaseDir(phaseNumber)
    
    if (phaseDir && existsSync(phaseDir)) {
      return phaseDir
    }

    // Fallback: try direct .planning/phases/{phaseNumber}-* pattern
    const planningPhases = join(this.projectRoot, '.planning', 'phases')
    if (!existsSync(planningPhases)) {
      return null
    }

    const phaseDirs = readdirSync(planningPhases)
    const matchingDir = phaseDirs.find(dir => 
      dir.startsWith(`${phaseNumber.toString().padStart(2, '0')}-`)
    )

    if (matchingDir) {
      const phasePath = join(planningPhases, matchingDir)
      if (existsSync(phasePath)) {
        return phasePath
      }
    }

    return null
  }

  /**
   * Check if any SUMMARY.md file exists in phase directory
   */
  summaryExists(phaseDir: string): boolean {
    if (!existsSync(phaseDir)) {
      return false
    }

    const files = readdirSync(phaseDir)
    return files.some(file => file.endsWith('-SUMMARY.md'))
  }

  /**
   * Parse SUMMARY.md frontmatter to extract must_haves truths
   */
  parseSummaryMustHaves(phaseDir: string): { truths: string[]; sourcePlanId: string } | null {
    if (!existsSync(phaseDir)) {
      return null
    }

    const files = readdirSync(phaseDir)
    const summaryFiles = files
      .filter(file => file.endsWith('-SUMMARY.md'))
      .sort()
      .reverse() // Most recent first

    if (summaryFiles.length === 0) {
      return null
    }

    const latestSummary = summaryFiles[0]
    const summaryPath = join(phaseDir, latestSummary)
    
    // Extract plan ID from filename (e.g., "07-01-SUMMARY.md" -> "07-01")
    const sourcePlanId = latestSummary.replace('-SUMMARY.md', '')

    try {
      const content = readFileSync(summaryPath, 'utf-8')
      
      // Parse YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
      if (!frontmatterMatch) {
        return { truths: [], sourcePlanId }
      }

      const frontmatter = frontmatterMatch[1]
      
      // Extract must_haves.truths from frontmatter
      const truthsMatch = frontmatter.match(/must_haves:\s*truths:\s*\n((?:\s*-\s*.+\n?)+)/)
      if (!truthsMatch) {
        return { truths: [], sourcePlanId }
      }

      const truths: string[] = []
      const truthsLines = truthsMatch[1].trim().split('\n')
      for (const line of truthsLines) {
        const match = line.match(/^\s*-\s*(.+)$/)
        if (match) {
          truths.push(match[1].trim())
        }
      }

      return { truths, sourcePlanId }
    } catch (error) {
      console.error('Error parsing summary:', error)
      return { truths: [], sourcePlanId }
    }
  }

  /**
   * Read UAT.md from phase directory
   */
  readUAT(phaseDir: string): UAT | null {
    const uatPath = join(phaseDir, 'UAT.md')
    
    if (!existsSync(uatPath)) {
      return null
    }

    try {
      const content = readFileSync(uatPath, 'utf-8')
      
      // Parse JSON from markdown code block
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (!jsonMatch) {
        return null
      }

      const data = JSON.parse(jsonMatch[1])
      return UATSchema.parse(data) as UAT
    } catch (error) {
      console.error('Error reading UAT:', error)
      return null
    }
  }

  /**
   * Write UAT.md to phase directory
   */
  async writeUAT(phaseDir: string, uat: UAT): Promise<void> {
    const validated = UATSchema.parse(uat) as UAT
    const uatPath = join(phaseDir, 'UAT.md')
    
    // Generate markdown content
    const content = this.generateUATMarkdown(validated)
    
    await atomicWrite(uatPath, content)
  }

  /**
   * Generate UAT markdown content
   */
  private generateUATMarkdown(uat: UAT): string {
    const lines: string[] = [
      '# UAT Results',
      '',
      `**Phase:** ${uat.phaseNumber}`,
      `**Plan:** ${uat.planId}`,
      `**Tested:** ${new Date(uat.testedAt).toISOString()}`,
      `**Status:** ${uat.status}`,
      '',
      '## Summary',
      '',
      `| Passed | Failed | Skipped | Total |`,
      `|--------|--------|---------|-------|`,
      `| ${uat.summary.passed} | ${uat.summary.failed} | ${uat.summary.skipped} | ${uat.summary.total} |`,
      '',
      '## Test Items',
      '',
    ]

    // Generate table rows
    if (uat.items.length > 0) {
      lines.push('| ID | Description | Result | Notes |')
      lines.push('|----|-------------|--------|-------|')
      
      for (const item of uat.items) {
        const notes = item.notes || ''
        lines.push(`| ${item.id} | ${item.description} | ${item.result} | ${notes} |`)
      }
    } else {
      lines.push('_No test items recorded._')
    }

    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push('```json')
    lines.push(JSON.stringify(uat, null, 2))
    lines.push('```')
    lines.push('')

    return lines.join('\n')
  }

  /**
   * Read UAT-ISSUES.md from phase directory
   */
  readUATIssues(phaseDir: string): UATIssues | null {
    const issuesPath = join(phaseDir, 'UAT-ISSUES.md')
    
    if (!existsSync(issuesPath)) {
      return null
    }

    try {
      const content = readFileSync(issuesPath, 'utf-8')
      
      // Parse JSON from markdown code block
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
      if (!jsonMatch) {
        return null
      }

      const data = JSON.parse(jsonMatch[1])
      return UATIssuesSchema.parse(data) as UATIssues
    } catch (error) {
      console.error('Error reading UAT-ISSUES:', error)
      return null
    }
  }

  /**
   * Write UAT-ISSUES.md to phase directory
   */
  async writeUATIssues(phaseDir: string, issues: UATIssues): Promise<void> {
    const validated = UATIssuesSchema.parse(issues) as UATIssues
    const issuesPath = join(phaseDir, 'UAT-ISSUES.md')
    
    // Generate markdown content
    const content = this.generateUATIssuesMarkdown(validated)
    
    await atomicWrite(issuesPath, content)
  }

  /**
   * Generate UAT-ISSUES markdown content
   */
  private generateUATIssuesMarkdown(issues: UATIssues): string {
    const lines: string[] = [
      '# UAT Issues',
      '',
      `**Phase:** ${issues.phaseNumber}`,
      `**Source Plan:** ${issues.sourcePlanId}`,
      `**Created:** ${new Date(issues.createdAt).toISOString()}`,
      '',
    ]

    // Generate issues table
    if (issues.issues.length > 0) {
      lines.push('## Issues')
      lines.push('')
      lines.push('| ID | Description | Severity | Category | Status |')
      lines.push('|----|-------------|----------|----------|--------|')
      
      for (const issue of issues.issues) {
        lines.push(`| ${issue.id} | ${issue.description} | ${issue.severity} | ${issue.category} | ${issue.status} |`)
      }
      lines.push('')

      // Add details section
      lines.push('## Issue Details')
      lines.push('')
      
      for (const issue of issues.issues) {
        lines.push(`### ${issue.id}: ${issue.description}`)
        lines.push(`- **Item:** ${issue.itemDescription}`)
        lines.push(`- **Severity:** ${issue.severity}`)
        lines.push(`- **Category:** ${issue.category}`)
        lines.push(`- **Status:** ${issue.status}`)
        
        if (issue.suggestedFix) {
          lines.push(`- **Suggested Fix:** ${issue.suggestedFix}`)
        }
        
        if (issue.fixPlanId) {
          lines.push(`- **Fix Plan:** ${issue.fixPlanId}`)
        }
        
        lines.push(`- **Created:** ${new Date(issue.createdAt).toISOString()}`)
        lines.push('')
      }
    } else {
      lines.push('_No issues recorded._')
      lines.push('')
    }

    lines.push('---')
    lines.push('')
    lines.push('```json')
    lines.push(JSON.stringify(issues, null, 2))
    lines.push('```')
    lines.push('')

    return lines.join('\n')
  }

  /**
   * Get next alpha-suffix plan ID
   * 
   * Scans phase directory for existing {phase}-{base}[a-z]*-PLAN.md files
   * Returns next alpha suffix (e.g., '01' -> '01a', '01a' -> '01b')
   */
  getNextAlphaPlanId(phaseDir: string, basePlanId: string): string {
    if (!existsSync(phaseDir)) {
      return `${basePlanId}a`
    }

    const files = readdirSync(phaseDir)
    
    // Find all matching plan files
    // Pattern: {phase}-{base}[a-z]*-PLAN.md (e.g., 07-01-PLAN.md, 07-01a-PLAN.md, 07-01b-PLAN.md)
    const baseRegex = new RegExp(`^${basePlanId}([a-z]*)-PLAN\\.md$`, 'i')
    const existingSuffixes: string[] = []

    for (const file of files) {
      const match = file.match(baseRegex)
      if (match) {
        // If match[1] is empty, it's the base plan (suffix ''), otherwise it's 'a', 'b', etc.
        existingSuffixes.push(match[1])
      }
    }

    if (existingSuffixes.length === 0) {
      return `${basePlanId}a`
    }

    // Find the highest suffix
    let highestChar = 96 // 'a' - 1
    for (const suffix of existingSuffixes) {
      if (suffix.length === 1) {
        const charCode = suffix.charCodeAt(0)
        if (charCode > highestChar) {
          highestChar = charCode
        }
      }
    }

    // Next letter
    const nextChar = String.fromCharCode(highestChar + 1)
    return `${basePlanId}${nextChar}`
  }

  /**
   * Create a new UAT object with empty items
   */
  createEmptyUAT(phaseNumber: number, planId: string): UAT {
    return {
      phaseNumber,
      planId,
      testedAt: Date.now(),
      status: 'in-progress',
      items: [],
      summary: {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
      },
    }
  }

  /**
   * Create a new UATIssues object
   */
  createEmptyUATIssues(phaseNumber: number, sourcePlanId: string): UATIssues {
    return {
      phaseNumber,
      sourcePlanId,
      createdAt: Date.now(),
      issues: [],
    }
  }

  /**
   * Calculate UAT summary from items
   */
  calculateSummary(items: UATItem[]): UATSummary {
    const passed = items.filter(item => item.result === 'pass').length
    const failed = items.filter(item => item.result === 'fail').length
    const skipped = items.filter(item => item.result === 'skip').length
    
    return {
      passed,
      failed,
      skipped,
      total: items.length,
    }
  }
}
