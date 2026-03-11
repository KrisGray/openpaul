import { existsSync } from 'fs'
import { join } from 'path'
import { atomicWrite } from './atomic-writes'
import type {
  ResearchResult,
  ResearchPhaseResult,
  ResearchFinding,
  AgentStatus,
  AgentDashboard,
  ConfidenceLevel,
} from '../types/research'

export class ResearchManager {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  getPlanningDir(): string {
    const primary = join(this.projectRoot, '.paul')
    if (existsSync(primary)) {
      return primary
    }
    return join(this.projectRoot, '.openpaul')
  }

  resolvePhaseDir(phaseNumber: number): string | null {
    const primaryPhases = join(this.projectRoot, '.paul', 'phases')
    const primaryPhaseDir = join(primaryPhases, this.formatPhaseDirName(phaseNumber))
    if (existsSync(primaryPhaseDir)) {
      return primaryPhaseDir
    }

    const fallbackPhases = join(this.projectRoot, '.planning', 'phases')
    const fallbackPhaseDir = join(fallbackPhases, this.formatPhaseDirName(phaseNumber))
    if (existsSync(fallbackPhaseDir)) {
      return fallbackPhaseDir
    }

    return null
  }

  private formatPhaseDirName(phaseNumber: number): string {
    return `${phaseNumber.toString().padStart(2, '0')}-phase-${phaseNumber}`
  }

  resolveResearchPath(phaseNumber: number): string | null {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) return null

    const researchPath = join(phaseDir, 'RESEARCH.md')
    if (existsSync(researchPath)) {
      return researchPath
    }
    return null
  }

  createResearchResult(
    phaseNumber: number,
    query: string,
    findings: ResearchFinding[]
  ): ResearchResult {
    const now = new Date().toISOString()
    return {
      phase: phaseNumber,
      query,
      findings,
      confidence: this.calculateOverallConfidence(findings),
      verified: false,
      createdAt: now,
    }
  }

  private calculateOverallConfidence(findings: ResearchFinding[]): ConfidenceLevel {
    if (findings.length === 0) return 'low'

    const confidenceScores: Record<ConfidenceLevel, number> = {
      high: 3,
      medium: 2,
      low: 1,
    }

    const totalScore = findings.reduce(
      (sum, f) => sum + confidenceScores[f.confidence],
      0
    )
    const avgScore = totalScore / findings.length

    if (avgScore >= 2.5) return 'high'
    if (avgScore >= 1.5) return 'medium'
    return 'low'
  }

  aggregateAgentResults(agentResults: AgentStatus[]): ResearchPhaseResult {
    const now = new Date().toISOString()
    const completedAgents = agentResults.filter((a) => a.status === 'complete')
    const failedAgents = agentResults.filter((a) => a.status === 'failed')

    const findings: ResearchFinding[] = completedAgents
      .filter((a) => a.summary)
      .map((a) => ({
        topic: a.topic,
        summary: a.summary!,
        details: [],
        confidence: 'medium' as ConfidenceLevel,
        sources: [],
      }))

    const themes = this.extractThemes(findings)

    return {
      phase: 0,
      agentsSpawned: agentResults.length,
      agentsCompleted: completedAgents.length,
      agentsFailed: failedAgents.length,
      findings,
      themes,
      createdAt: now,
    }
  }

  private extractThemes(findings: ResearchFinding[]): string[] {
    const themeSet = new Set<string>()
    for (const finding of findings) {
      const words = finding.topic.toLowerCase().split(/\s+/)
      for (const word of words) {
        if (word.length > 4) {
          themeSet.add(word)
        }
      }
    }
    return Array.from(themeSet).slice(0, 5)
  }

  organizeByTheme(findings: ResearchFinding[]): Map<string, ResearchFinding[]> {
    const byTheme = new Map<string, ResearchFinding[]>()

    for (const finding of findings) {
      const theme = this.extractPrimaryTheme(finding)
      if (!byTheme.has(theme)) {
        byTheme.set(theme, [])
      }
      byTheme.get(theme)!.push(finding)
    }

    return byTheme
  }

  private extractPrimaryTheme(finding: ResearchFinding): string {
    const words = finding.topic.toLowerCase().split(/\s+/)
    for (const word of words) {
      if (word.length > 4) {
        return word
      }
    }
    return 'general'
  }

  formatAgentStatus(agent: AgentStatus): string {
    const statusEmoji: Record<string, string> = {
      spawning: '⏳',
      running: '🔄',
      complete: '✅',
      failed: '❌',
    }

    const emoji = statusEmoji[agent.status] || '❓'
    let line = `${emoji} **${agent.topic}** — ${agent.status}`

    if (agent.summary) {
      line += `\n   ${agent.summary}`
    }

    if (agent.error) {
      line += `\n   Error: ${agent.error}`
    }

    return line
  }

  formatAgentDashboard(dashboard: AgentDashboard): string {
    const lines: string[] = ['## Research Progress', '']

    for (const agent of dashboard.agents) {
      lines.push(this.formatAgentStatus(agent))
    }

    lines.push('')
    lines.push(`**Progress:** ${dashboard.completed}/${dashboard.total} agents complete`)

    return lines.join('\n')
  }

  generateResearchContent(result: ResearchResult): string {
    const lines: string[] = [
      `# Phase ${result.phase}: Research - ${result.query}`,
      '',
      `**Depth:** standard`,
      `**Verified:** ${result.verified ? 'yes' : 'no'}`,
      `**Created:** ${result.createdAt}`,
      `**Confidence:** ${result.confidence.toUpperCase()}`,
      '',
      '## Summary',
      '',
      result.query,
      '',
      '## Findings',
      '',
    ]

    const byTheme = this.organizeByTheme(result.findings)

    for (const [theme, findings] of byTheme) {
      lines.push(`### ${this.capitalizeFirst(theme)}`)
      lines.push('')

      for (const finding of findings) {
        lines.push(`- **Finding:** ${finding.summary}`)
        lines.push(`- **Confidence:** ${finding.confidence.toUpperCase()}`)
        if (finding.sources.length > 0) {
          lines.push(`- **Source:** ${finding.sources[0]}`)
        }
        lines.push('')
      }
    }

    lines.push('## Confidence Breakdown')
    lines.push('')
    lines.push('| Level | Count | Topics |')
    lines.push('|-------|-------|--------|')

    const byConfidence: Record<ConfidenceLevel, string[]> = {
      high: [],
      medium: [],
      low: [],
    }

    for (const f of result.findings) {
      byConfidence[f.confidence].push(f.topic)
    }

    for (const level of ['high', 'medium', 'low'] as ConfidenceLevel[]) {
      const topics = byConfidence[level].join(', ').slice(0, 50)
      lines.push(`| ${level.toUpperCase()} | ${byConfidence[level].length} | ${topics} |`)
    }

    lines.push('')

    const allSources = new Set<string>()
    for (const f of result.findings) {
      for (const s of f.sources) {
        allSources.add(s)
      }
    }

    if (allSources.size > 0) {
      lines.push('## Sources')
      lines.push('')
      for (const source of allSources) {
        lines.push(`- ${source}`)
      }
      lines.push('')
    }

    lines.push('## Recommendations')
    lines.push('')
    lines.push('(Add actionable recommendations based on findings)')
    lines.push('')

    return lines.join('\n')
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  generateResearchPhaseContent(
    phaseNumber: number,
    result: ResearchPhaseResult,
    findings: ResearchFinding[],
    themes: string[]
  ): string {
    const lines: string[] = [
      `# Phase ${phaseNumber}: Phase Research`,
      '',
      `**Topics Researched:** ${result.agentsSpawned}`,
      `**Agents Spawned:** ${result.agentsSpawned}`,
      `**Completed:** ${result.agentsCompleted} successful, ${result.agentsFailed} failed`,
      `**Created:** ${result.createdAt}`,
      '',
      '## Research Summary',
      '',
      `Researched ${result.findings.length} topics across ${result.agentsSpawned} agents.`,
      '',
      '## Agent Results',
      '',
      '| Topic | Status | Confidence | Key Finding |',
      '|-------|--------|------------|-------------|',
    ]

    for (const finding of result.findings) {
      lines.push(
        `| ${finding.topic} | ✅ Complete | ${finding.confidence.toUpperCase()} | ${finding.summary.slice(0, 50)} |`
      )
    }

    lines.push('')

    if (result.themes.length > 0) {
      lines.push('## Findings by Theme')
      lines.push('')

      const byTheme = this.organizeByTheme(result.findings)
      for (const theme of result.themes) {
        const themeFindings = byTheme.get(theme) || []
        if (themeFindings.length > 0) {
          lines.push(`### Theme: ${this.capitalizeFirst(theme)}`)
          lines.push('')
          lines.push(
            `**From:** ${themeFindings.map((f) => f.topic).join(', ')}`
          )
          lines.push('')

          for (const finding of themeFindings) {
            lines.push(`- ${finding.summary}`)
          }
          lines.push('')
        }
      }
    }

    if (result.agentsFailed > 0) {
      lines.push('## Failed Agents')
      lines.push('')
      lines.push('Some agents failed to complete. Manual research may be required.')
      lines.push('')
    }

    lines.push('## Recommendations')
    lines.push('')
    lines.push('(Add consolidated recommendations for phase planning)')
    lines.push('')

    return lines.join('\n')
  }

  async writeResearch(
    phaseNumber: number,
    query: string,
    findings: ResearchFinding[]
  ): Promise<string> {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) {
      throw new Error(`Phase ${phaseNumber} directory not found`)
    }

    const result = this.createResearchResult(phaseNumber, query, findings)
    const content = this.generateResearchContent(result)
    const researchPath = join(phaseDir, 'RESEARCH.md')
    await atomicWrite(researchPath, content)
    return researchPath
  }

  async writeResearchPhaseResult(
    phaseNumber: number,
    result: ResearchPhaseResult,
    findings: ResearchFinding[],
    themes: string[]
  ): Promise<string> {
    const phaseDir = this.resolvePhaseDir(phaseNumber)
    if (!phaseDir) {
      throw new Error(`Phase ${phaseNumber} directory not found`)
    }

    const content = this.generateResearchPhaseContent(phaseNumber, result, findings, themes)
    const researchPath = join(phaseDir, 'RESEARCH.md')
    await atomicWrite(researchPath, content)
    return researchPath
  }
}
