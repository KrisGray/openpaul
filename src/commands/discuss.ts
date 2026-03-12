import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { existsSync } from 'fs'
import { join } from 'path'
import { PrePlanningManager } from '../storage/pre-planning-manager'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { atomicWrite } from '../storage/atomic-writes'
import type { DecisionEntry } from '../types/pre-planning'
import type { ContextParams } from '../types/pre-planning'

type DiscussArgs = {
  phase: number
  domain?: string
  decisions?: string
  specifics?: string
  deferred?: string
  overwrite?: boolean
}

const toolFactory = tool as unknown as (input: any) => any

export const openpaulDiscuss = toolFactory({
  name: 'openpaul:discuss',
  description: 'Explore phase goals and capture planning context',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number to discuss'),
    domain: z.string().optional().describe('Phase boundary description'),
    decisions: z.string().optional().describe('Comma-separated decision titles'),
    specifics: z.string().optional().describe('Comma-separated specific ideas'),
    deferred: z.string().optional().describe('Comma-separated deferred ideas'),
    overwrite: z.boolean().optional().describe('Overwrite existing CONTEXT.md'),
  }),
  execute: async (args: DiscussArgs, context: { directory: string }) => {
    try {
      const manager = new PrePlanningManager(context.directory)
      const phaseDir = manager.resolvePhaseDir(args.phase)
      
      if (!phaseDir) {
        return formatHeader(2, '\u274C Cannot Discuss Phase') + '\n\n' +
          `Phase ${args.phase} directory not found.\n\n` +
          formatBold('Next Steps:') + '\n' +
          formatList([
            'Run /openpaul:init to initialize the project',
            'Check that the phase number is correct',
          ])
      }
      
      const contextPath = join(phaseDir, 'CONTEXT.md')
      
      if (existsSync(contextPath) && !args.overwrite) {
        return formatHeader(2, '\u26A0\uFE0F Context Already Exists') + '\n\n' +
          `CONTEXT.md already exists for phase ${args.phase}.\n\n` +
          formatBold('Options:') + '\n' +
          formatList([
            'Run with --overwrite to replace the existing context',
            'Review the existing CONTEXT.md',
          ])
      }
      
      const decisions: DecisionEntry[] = args.decisions
        ? args.decisions.split(',').map((d, i) => {
            const parts = d.trim().split(':')
            return {
              title: parts[0]?.trim() || `Decision ${i + 1}`,
              description: parts.slice(1).join(':').trim() || d.trim(),
            }
          })
        : []
      
      const specifics = args.specifics
        ? args.specifics.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      
      const deferred = args.deferred
        ? args.deferred.split(',').map((d) => d.trim()).filter(Boolean)
        : []
      
      const params: ContextParams = {
        domain: args.domain,
        decisions,
        specifics,
        deferred,
      }
      
      const content = manager.createContext(args.phase, params)
      await atomicWrite(contextPath, content)
      
      let output = formatHeader(2, '\u2705 Context Created') + '\n\n'
      output += formatBold('Phase:') + ` ${args.phase}\n`
      output += formatBold('File:') + ` ${contextPath}\n\n`
      output += formatBold('Key Sections:') + '\n'
      output += formatList([
        'Domain: Phase boundary defined',
        decisions.length > 0 ? `Decisions: ${decisions.length} items` : 'Decisions: None yet',
        specifics.length > 0 ? `Specifics: ${specifics.length} items` : 'Specifics: None yet',
        deferred.length > 0 ? `Deferred: ${deferred.length} items` : 'Deferred: None',
      ])
      
      output += '\n' + formatBold('Next Steps:') + '\n'
      output += formatList([
        'Review and edit CONTEXT.md to add more details',
        'Use /openpaul:assumptions to capture assumptions',
        'Use /openpaul:discover to research technical options',
      ])
      
      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '\u274C Context Creation Failed') + '\n\n' +
        `Failed to create context: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure OpenPAUL is initialized with /openpaul:init',
          'Check that the phase directory exists',
          'Verify file permissions',
        ])
    }
  },
})
