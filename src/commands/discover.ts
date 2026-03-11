import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { existsSync } from 'fs'
import { join } from 'path'
import { PrePlanningManager } from '../storage/pre-planning-manager'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { atomicWrite } from '../storage/atomic-writes'
import type { DiscoveryParams } from '../types/pre-planning'
import type { DiscoveryDepth } from '../types/pre-planning'

type DiscoverArgs = {
  phase: number
  topic: string
  quick?: boolean
  deep?: boolean
  confirm?: boolean
  overwrite?: boolean
}

const toolFactory = tool as unknown as (input: any) => any

export const paulDiscover = toolFactory({
  name: 'openpaul:discover',
  description: 'Research technical options with configurable depth',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number'),
    topic: z.string().min(1).describe('Research topic/question'),
    quick: z.boolean().optional().describe('Quick mode (verbal, 2-5 min, no file)'),
    deep: z.boolean().optional().describe('Deep mode (comprehensive, 1+ hr, requires confirm)'),
    confirm: z.boolean().optional().describe('Confirmation for deep mode'),
    overwrite: z.boolean().optional().describe('Overwrite existing DISCOVERY.md'),
  }),
  execute: async (args: DiscoverArgs, context: { directory: string }) => {
    try {
      if (args.quick && args.deep) {
        return formatHeader(2, '\u274C Conflicting Options') + '\n\n' +
          'Cannot use both --quick and --deep flags together.\n\n' +
          formatBold('Choose one mode:') + '\n' +
          formatList([
            '--quick: Quick verbal response, no file created',
            '--deep: Comprehensive research, file created (requires --confirm)',
            '(default): Standard research, file created',
          ])
      }
      
      if (args.quick) {
        let output = formatHeader(2, '\U0001F50D Quick Discovery') + '\n\n'
        output += formatBold('Topic:') + ` ${args.topic}\n\n`
        output += '**Quick Mode:** No file created, verbal response only.\n\n'
        output += '**Estimated time:** 2-5 minutes\n\n'
        output += 'Please research the topic and provide a verbal summary of findings.'
        return output
      }
      
      const manager = new PrePlanningManager(context.directory)
      const phaseDir = manager.resolvePhaseDir(args.phase)
      
      if (!phaseDir) {
        return formatHeader(2, '\u274C Cannot Discover') + '\n\n' +
          `Phase ${args.phase} directory not found.\n\n` +
          formatBold('Next Steps:') + '\n' +
          formatList(['Run /openpaul:init to initialize the project'])
      }
      
      const discoveryPath = join(phaseDir, 'DISCOVERY.md')
      
      if (existsSync(discoveryPath) && !args.overwrite) {
        return formatHeader(2, '\u26A0\uFE0F Discovery Already Exists') + '\n\n' +
          `DISCOVERY.md already exists for phase ${args.phase}.\n\n` +
          formatBold('Options:') + '\n' +
          formatList(['Run with --overwrite to replace'])
      }
      
      if (args.deep) {
        if (!args.confirm) {
          return formatHeader(2, '\u26A0\uFE0F Deep Mode Confirmation Required') + '\n\n' +
            'Deep research may take 30-60 minutes.\n\n' +
            formatBold('Run with --confirm to proceed with deep research.')
        }
      }
      
      const depth: DiscoveryDepth = args.deep ? 'deep' : 'standard'
      const estimatedTime = depth === 'deep' ? '30-60 minutes' : '15-30 minutes'
      
      const params: DiscoveryParams = {
        topic: args.topic,
        depth,
        summary: 'Research summary to be filled in',
        findings: ['Finding 1', 'Finding 2'],
        optionsConsidered: depth === 'deep' 
          ? ['Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5']
          : ['Option 1', 'Option 2', 'Option 3'],
        recommendation: 'Primary recommendation',
        references: ['Reference 1', 'Reference 2'],
      }
      
      const content = manager.createDiscovery(args.phase, params)
      await atomicWrite(discoveryPath, content)
      
      let output = formatHeader(2, '\u2705 Discovery Created') + '\n\n'
      output += formatBold('Phase:') + ` ${args.phase}\n`
      output += formatBold('Topic:') + ` ${args.topic}\n`
      output += formatBold('Depth:') + ` ${depth}\n`
      output += formatBold('File:') + ` ${discoveryPath}\n`
      output += formatBold('Estimated Time:') + ` ${estimatedTime}\n\n`
      output += formatBold('Next Steps:') + '\n'
      output += formatList([
        'Edit DISCOVERY.md to add detailed findings',
        'Add pros/cons for each option',
        'Include sources and references',
      ])
      
      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '\u274C Discovery Creation Failed') + '\n\n' +
        `Failed to create discovery: ${errorMessage}`
    }
  },
})
