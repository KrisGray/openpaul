import { existsSync } from 'fs'
import { join } from 'path'
import { atomicWrite } from './atomic-writes'
import type {
  ContextArtifact,
  AssumptionsArtifact,
  IssuesArtifact,
  DiscoveryArtifact,
  AssumptionEntry,
  IssueEntry,
  ContextParams,
  DiscoveryParams,
  IssueSeverity,
} from '../types/pre-planning'

export class PrePlanningManager {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  /**
   * Get the planning directory path (.openpaul or .paul)
   * Uses .openpaul as primary, falls back to .paul for migration compatibility.
   * Defaults to .openpaul if neither exists.
   */
  private getPlanningDir(): string {
    const primary = join(this.projectRoot, '.openpaul')
    if (existsSync(primary)) {
      return primary
    }
    const fallback = join(this.projectRoot, '.paul')
    if (existsSync(fallback)) {
      return fallback
    }
    return primary // Default to .openpaul
  }

  /**
   * Resolve phase directory path
   * Checks .openpaul/phases first, then falls back to .paul/phases and .planning/phases
   */
  resolvePhaseDir(phaseNumber: number): string | null {
    // Check .openpaul/phases first (primary)
    const primaryPhases = join(this.projectRoot, '.openpaul', 'phases')
    const primaryPhaseDir = join(primaryPhases, this.formatPhaseDirName(phaseNumber))
    if (existsSync(primaryPhaseDir)) {
      return primaryPhaseDir
    }

    // Fall back to .paul/phases for migration compatibility
    const fallbackPhases = join(this.projectRoot, '.paul', 'phases')
    const fallbackPhaseDir = join(fallbackPhases, this.formatPhaseDirName(phaseNumber))
    if (existsSync(fallbackPhaseDir)) {
      return fallbackPhaseDir
    }

    // Final fallback to .planning/phases
    const planningPhases = join(this.projectRoot, '.planning', 'phases')
    const planningPhaseDir = join(planningPhases, this.formatPhaseDirName(phaseNumber))
    if (existsSync(planningPhaseDir)) {
      return planningPhaseDir
    }

    return null
  }

  private formatPhaseDirName(phaseNumber: number): string {
    return `${phaseNumber.toString().padStart(2, '0')}-phase-${phaseNumber}`
  }

  resolveContextPath(phaseNumber: number): string | null {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) return null

    const contextPath = join(phaseDir, 'CONTEXT.md')
    if (existsSync(contextPath)) {
      return contextPath
    }
    return null
  }

  resolveAssumptionsPath(phaseNumber: number): string | null {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) return null

    const assumptionsPath = join(phaseDir, 'ASSUMPTIONS.md')
    if (existsSync(assumptionsPath)) {
      return assumptionsPath
    }
    return null
  }

  resolveIssuesPath(phaseNumber: number): string | null {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) return null

    const issuesPath = join(phaseDir, 'ISSUES.md')
    if (existsSync(issuesPath)) {
      return issuesPath
    }
    return null
  }

  resolveDiscoveryPath(phaseNumber: number): string | null {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) return null

    const discoveryPath = join(phaseDir, 'DISCOVERY.md')
    if (existsSync(discoveryPath)) {
      return discoveryPath
    }
    return null
  }

  createContext(phaseNumber: number, params: ContextParams): string {
    const now = new Date().toISOString()
    const artifact: ContextArtifact = {
      phase: phaseNumber,
      gathered: now,
      status: 'Ready for planning',
      domain: params.domain || '',
      decisions: params.decisions || [],
      specifics: params.specifics || [],
      deferred: params.deferred || [],
    }
    return this.generateContextContent(artifact)
  }

  private generateContextContent(artifact: ContextArtifact): string {
    const lines: string[] = [
      `# Phase ${artifact.phase}: Context`,
      '',
      `**Gathered:** ${artifact.gathered}`,
      `**Status:** ${artifact.status}`,
      '',
      '<domain>',
      '## Phase Boundary',
      artifact.domain || 'To be defined',
      '</domain>',
      '',
      '<decisions>',
      '## Implementation Decisions',
    ]

    if (artifact.decisions.length > 0) {
      for (const decision of artifact.decisions) {
        lines.push(`- **${decision.title}:** ${decision.description}`)
      }
    } else {
      lines.push('- None yet')
    }

    lines.push('</decisions>')
    lines.push('')
    lines.push('<specifics>')
    lines.push('## Specific Ideas')

    if (artifact.specifics.length > 0) {
      for (const idea of artifact.specifics) {
        lines.push(`- ${idea}`)
      }
    } else {
      lines.push('- None yet')
    }

    lines.push('</specifics>')
    lines.push('')
    lines.push('<deferred>')
    lines.push('## Deferred Ideas')

    if (artifact.deferred.length > 0) {
      for (const item of artifact.deferred) {
        lines.push(`- ${item}`)
      }
    } else {
      lines.push('None — discussion stayed within phase scope.')
    }

    lines.push('</deferred>')
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push(`*Phase ${artifact.phase} context gathered ${artifact.gathered}*`)
    lines.push('')

    return lines.join('\n')
  }

  createAssumptions(phaseNumber: number, assumptions: AssumptionEntry[]): string {
    const now = new Date().toISOString()
    const artifact: AssumptionsArtifact = {
      phase: phaseNumber,
      assumptions,
      createdAt: now,
      updatedAt: now,
    }
    return this.generateAssumptionsContent(artifact)
  }

  private generateAssumptionsContent(artifact: AssumptionsArtifact): string {
    const lines: string[] = [
      `# Phase ${artifact.phase}: Assumptions`,
      '',
      `**Created:** ${artifact.createdAt}`,
      `**Updated:** ${artifact.updatedAt}`,
      '',
      '## Assumptions',
      '',
      '| Statement | Status | Confidence | Impact |',
      '|-----------|--------|------------|--------|',
    ]

    for (const assumption of artifact.assumptions) {
      lines.push(
        `| ${assumption.statement} | ${assumption.validation_status} | ${assumption.confidence} | ${assumption.impact} |`
      )
    }

    lines.push('')
    lines.push('## Validation Notes')
    lines.push('')
    lines.push('(Empty section for user to add validation notes)')
    lines.push('')

    return lines.join('\n')
  }

  createIssues(phaseNumber: number, issues: IssueEntry[]): string {
    const now = new Date().toISOString()
    const artifact: IssuesArtifact = {
      phase: phaseNumber,
      issues: this.sortIssuesBySeverity(issues),
      createdAt: now,
    }
    return this.generateIssuesContent(artifact)
  }

  private sortIssuesBySeverity(issues: IssueEntry[]): IssueEntry[] {
    const severityOrder: Record<IssueSeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    }
    return [...issues].sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    )
  }

  private generateIssuesContent(artifact: IssuesArtifact): string {
    const lines: string[] = [
      `# Phase ${artifact.phase}: Issues and Risks`,
      '',
      `**Created:** ${artifact.createdAt}`,
      '**Status:** Open',
      '',
    ]

    const groupedIssues = this.groupIssuesBySeverity(artifact.issues)

    for (const severity of ['critical', 'high', 'medium', 'low'] as IssueSeverity[]) {
      const issuesForSeverity = groupedIssues[severity] || []
      if (issuesForSeverity.length > 0) {
        lines.push(`## ${this.capitalizeFirst(severity)} Priority Issues`)
        lines.push('')

        for (const issue of issuesForSeverity) {
          lines.push(`### ${issue.description}`)
          lines.push(`- **Severity:** ${this.capitalizeFirst(issue.severity)}`)
          lines.push(`- **Affected Areas:** ${issue.affectedAreas.join(', ')}`)
          lines.push(`- **Mitigation:** ${issue.mitigation}`)
          lines.push('')
        }
      }
    }

    lines.push('## Summary')
    lines.push('')
    lines.push('| Severity | Count |')
    lines.push('|----------|-------|')

    const counts: Record<IssueSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }
    for (const issue of artifact.issues) {
      counts[issue.severity]++
    }

    for (const severity of ['critical', 'high', 'medium', 'low'] as IssueSeverity[]) {
      lines.push(`| ${this.capitalizeFirst(severity)} | ${counts[severity]} |`)
    }

    lines.push('')

    return lines.join('\n')
  }

  private groupIssuesBySeverity(
    issues: IssueEntry[]
  ): Record<IssueSeverity, IssueEntry[]> {
    const grouped: Record<IssueSeverity, IssueEntry[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    }
    for (const issue of issues) {
      grouped[issue.severity].push(issue)
    }
    return grouped
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  createDiscovery(phaseNumber: number, params: DiscoveryParams): string {
    const now = new Date().toISOString()
    const artifact: DiscoveryArtifact = {
      phase: phaseNumber,
      depth: params.depth,
      summary: params.summary,
      findings: params.findings,
      optionsConsidered: params.optionsConsidered,
      recommendation: params.recommendation,
      references: params.references,
      createdAt: now,
    }
    return this.generateDiscoveryContent(artifact, params.topic)
  }

  private generateDiscoveryContent(artifact: DiscoveryArtifact, topic: string): string {
    const lines: string[] = [
      `# Phase ${artifact.phase}: Discovery - ${topic}`,
      '',
      `**Depth:** ${artifact.depth}`,
      `**Created:** ${artifact.createdAt}`,
      '',
      '## Summary',
      '',
      artifact.summary,
      '',
      '## Findings',
      '',
    ]

    for (const finding of artifact.findings) {
      lines.push(`- ${finding}`)
    }

    lines.push('')
    lines.push('## Options Considered')
    lines.push('')

    for (let i = 0; i < artifact.optionsConsidered.length; i++) {
      lines.push(`### Option ${i + 1}: ${artifact.optionsConsidered[i]}`)
      lines.push('')
    }

    lines.push('## Recommendation')
    lines.push('')
    lines.push(artifact.recommendation)
    lines.push('')

    if (artifact.references.length > 0) {
      lines.push('## References')
      lines.push('')
      for (const ref of artifact.references) {
        lines.push(`- ${ref}`)
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  async writeContext(phaseNumber: number, params: ContextParams): Promise<string> {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) {
      throw new Error(`Phase ${phaseNumber} directory not found`)
    }

    const content = this.createContext(phaseNumber, params)
    const contextPath = join(phaseDir, 'CONTEXT.md')
    await atomicWrite(contextPath, content)
    return contextPath
  }

  async writeAssumptions(
    phaseNumber: number,
    assumptions: AssumptionEntry[]
  ): Promise<string> {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) {
      throw new Error(`Phase ${phaseNumber} directory not found`)
    }

    const content = this.createAssumptions(phaseNumber, assumptions)
    const assumptionsPath = join(phaseDir, 'ASSUMPTIONS.md')
    await atomicWrite(assumptionsPath, content)
    return assumptionsPath
  }

  async writeIssues(phaseNumber: number, issues: IssueEntry[]): Promise<string> {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) {
      throw new Error(`Phase ${phaseNumber} directory not found`)
    }

    const content = this.createIssues(phaseNumber, issues)
    const issuesPath = join(phaseDir, 'ISSUES.md')
    await atomicWrite(issuesPath, content)
    return issuesPath
  }

  async writeDiscovery(
    phaseNumber: number,
    params: DiscoveryParams
  ): Promise<string> {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) {
      throw new Error(`Phase ${phaseNumber} directory not found`)
    }

    const content = this.createDiscovery(phaseNumber, params)
    const discoveryPath = join(phaseDir, 'DISCOVERY.md')
    await atomicWrite(discoveryPath, content)
    return discoveryPath
  }
}
