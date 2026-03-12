import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { existsSync } from 'fs'
import { join } from 'path'
import { PrePlanningManager } from '../storage/pre-planning-manager'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { atomicWrite } from '../storage/atomic-writes'
import type { IssueEntry } from '../types/pre-planning'
import type { IssueSeverity } from '../types/pre-planning'

type ConsiderIssuesArgs = {
  phase: number
  issues: string
  severities?: string
  areas?: string
  mitigations?: string
  append?: boolean
  overwrite?: boolean
}

const toolFactory = tool as unknown as (input: any) => any

export const openpaulConsiderIssues = toolFactory({
  name: 'openpaul:consider-issues',
  description: 'Identify potential blockers and risks',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number'),
    issues: z.string().min(1).describe('Comma-separated issue descriptions'),
    severities: z.string().optional().describe('Comma-separated severity levels (default: medium)'),
    areas: z.string().optional().describe('Comma-separated affected areas (pipe-separated for multiple per issue)'),
    mitigations: z.string().optional().describe('Comma-separated mitigation strategies'),
    append: z.boolean().optional().describe('Append to existing file'),
    overwrite: z.boolean().optional().describe('Overwrite existing file'),
  }),
  execute: async (args: ConsiderIssuesArgs, context: { directory: string }) => {
    try {
      const manager = new PrePlanningManager(context.directory)
      const phaseDir = manager.resolvePhaseDir(args.phase)
      
      if (!phaseDir) {
        return formatHeader(2, '\u274C Cannot Create Issues') + '\n\n' +
          `Phase ${args.phase} directory not found.\n\n` +
          formatBold('Next Steps:') + '\n' +
          formatList(['Run /openpaul:init to initialize the project'])
      }
      
      const issuesPath = join(phaseDir, 'ISSUES.md')
      
      if (existsSync(issuesPath) && !args.overwrite && !args.append) {
        return formatHeader(2, '\u26A0\uFE0F Issues Already Exist') + '\n\n' +
          `ISSUES.md already exists for phase ${args.phase}.\n\n` +
          formatBold('Options:') + '\n' +
          formatList([
            'Run with --overwrite to replace',
            'Run with --append to add more',
          ])
      }
      
      const validSeverities: IssueSeverity[] = ['critical', 'high', 'medium', 'low']
      const issueDescriptions = args.issues.split(',').map((i) => i.trim()).filter(Boolean)
      const severityValues = args.severities
        ? args.severities.split(',').map((s) => s.trim().toLowerCase() as IssueSeverity)
        : []
      const areasValues = args.areas
        ? args.areas.split(',').map((a) => a.trim())
        : []
      const mitigationValues = args.mitigations
        ? args.mitigations.split(',').map((m) => m.trim())
        : []
      
      for (const sev of severityValues) {
        if (!validSeverities.includes(sev)) {
          return formatHeader(2, '\u274C Invalid Severity') + '\n\n' +
            `Invalid severity value: ${sev}\n\n` +
            formatBold('Valid values:') + '\n' +
            formatList(['critical', 'high', 'medium', 'low'])
        }
      }
      
      const entries: IssueEntry[] = issueDescriptions.map((description, i) => ({
        description,
        severity: severityValues[i] && validSeverities.includes(severityValues[i])
          ? severityValues[i]
          : 'medium',
        affectedAreas: areasValues[i] ? areasValues[i].split('|').map((a) => a.trim()) : ['Unspecified'],
        mitigation: mitigationValues[i] || 'To be determined',
      }))
      
      const content = manager.createIssues(args.phase, entries)
      await atomicWrite(issuesPath, content)
      
      const severityCounts: Record<IssueSeverity, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      }
      entries.forEach((e) => severityCounts[e.severity]++)
      
      let output = formatHeader(2, '\u2705 Issues Identified') + '\n\n'
      output += formatBold('Phase:') + ` ${args.phase}\n`
      output += formatBold('File:') + ` ${issuesPath}\n`
      output += formatBold('Count:') + ` ${entries.length} issues\n\n`
      output += formatBold('By Severity:') + '\n'
      output += formatList([
        `Critical: ${severityCounts.critical}`,
        `High: ${severityCounts.high}`,
        `Medium: ${severityCounts.medium}`,
        `Low: ${severityCounts.low}`,
      ])
      
      const criticalAndHigh = entries.filter((e) => e.severity === 'critical' || e.severity === 'high')
      if (criticalAndHigh.length > 0) {
        output += '\n' + formatBold('\u26A0\uFE0F Critical/High Issues:') + '\n'
        output += formatList(criticalAndHigh.map((e) => e.description.slice(0, 50) + (e.description.length > 50 ? '...' : '')))
      }
      
      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '\u274C Issues Creation Failed') + '\n\n' +
        `Failed to create issues: ${errorMessage}\n\n` +
        formatBold('Valid severities:') + '\n' +
        formatList(['critical', 'high', 'medium', 'low'])
    }
  },
})
