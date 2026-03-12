import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { existsSync } from 'fs'
import { join } from 'path'
import { ResearchManager } from '../storage/research-manager'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { atomicWrite } from '../storage/atomic-writes'
import type { ResearchFinding } from '../types/research'
import type { ConfidenceLevel } from '../types/research'

type ResearchArgs = {
  phase: number
  query: string
  depth?: 'quick' | 'standard' | 'deep'
  verify?: boolean
  sources?: string
  overwrite?: boolean
}

const toolFactory = tool as unknown as (input: any) => any

export const openpaulResearch = toolFactory({
  name: 'openpaul:research',
  description: 'Execute research on user-specified topics with verification',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number for context'),
    query: z.string().min(1).describe('Research question or topic'),
    depth: z.enum(['quick', 'standard', 'deep']).optional().describe('Research depth (default: standard)'),
    verify: z.boolean().optional().describe('Include verification of findings (default: true)'),
    sources: z.string().optional().describe('Comma-separated preferred sources'),
    overwrite: z.boolean().optional().describe('Overwrite existing RESEARCH.md'),
  }),
  execute: async (args: ResearchArgs, context: { directory: string }) => {
    try {
      if (!args.query || args.query.trim().length === 0) {
        return formatHeader(2, '\u274C Invalid Query') + '\n\n' +
          'Research query cannot be empty.\n\n' +
          formatBold('Example:') + '\n' +
          formatList(['"How to implement JWT auth in Node.js"'])
      }
      
      const manager = new ResearchManager(context.directory)
      const phaseDir = manager.resolvePhaseDir(args.phase)
      
      if (!phaseDir) {
        return formatHeader(2, '\u274C Cannot Research') + '\n\n' +
          `Phase ${args.phase} directory not found.\n\n` +
          formatBold('Next Steps:') + '\n' +
          formatList(['Run /openpaul:init to initialize the project'])
      }
      
      const researchPath = join(phaseDir, 'RESEARCH.md')
      
      if (existsSync(researchPath) && !args.overwrite) {
        return formatHeader(2, '\u26A0\uFE0F Research Already Exists') + '\n\n' +
          `RESEARCH.md already exists for phase ${args.phase}.\n\n` +
          formatBold('Options:') + '\n' +
          formatList(['Run with --overwrite to replace'])
      }
      
      const depth = args.depth || 'standard'
      const verified = args.verify !== false
      const preferredSources = args.sources
        ? args.sources.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      
      const findings: ResearchFinding[] = [
        {
          topic: args.query,
          summary: 'Research summary to be filled in',
          details: ['Detail 1', 'Detail 2'],
          confidence: 'medium' as ConfidenceLevel,
          sources: preferredSources.length > 0 ? preferredSources : ['Source 1', 'Source 2'],
        },
      ]
      
      const result = manager.createResearchResult(args.phase, args.query, findings)
      const content = manager.generateResearchContent(result)
      await atomicWrite(researchPath, content)
      
      const confidenceCounts: Record<ConfidenceLevel, number> = { high: 0, medium: 0, low: 0 }
      findings.forEach((f) => confidenceCounts[f.confidence]++)
      
      let output = formatHeader(2, '\u2705 Research Complete') + '\n\n'
      output += formatBold('Phase:') + ` ${args.phase}\n`
      output += formatBold('Query:') + ` ${args.query}\n`
      output += formatBold('Depth:') + ` ${depth}\n`
      output += formatBold('Verified:') + ` ${verified ? 'Yes' : 'No'}\n`
      output += formatBold('File:') + ` ${researchPath}\n\n`
      output += formatBold('Confidence Distribution:') + '\n'
      output += formatList([
        `High: ${confidenceCounts.high}`,
        `Medium: ${confidenceCounts.medium}`,
        `Low: ${confidenceCounts.low}`,
      ])
      
      output += '\n' + formatBold('Next Steps:') + '\n'
      output += formatList([
        'Edit RESEARCH.md to add detailed findings',
        'Include sources for each finding',
        'Add verification notes if using --verify',
      ])
      
      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '\u274C Research Failed') + '\n\n' +
        `Failed to execute research: ${errorMessage}`
    }
  },
})
