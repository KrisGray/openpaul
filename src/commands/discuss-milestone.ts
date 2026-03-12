import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { atomicWrite } from '../storage/atomic-writes'
import { formatHeader, formatList, formatBold } from '../output/formatter'

/**
 * /openpaul:discuss-milestone Command
 * 
 * Plan upcoming milestone with context capture for pre-planning
 * 
 * From PLAN.md:
 * - Purpose: Plan UPCOMING milestone (not documenting current)
 * - Location: .planning/MILESTONE-CONTEXT.md (single file)
 * - Interactive prompts if args not provided
 * - Creates structured context file with features, scope, phase mapping, constraints
 * - Handles existing file with overwrite prompt
 */
type DiscussMilestoneArgs = {
  name: string
  scope?: string
  features?: string
  phases?: string
  constraints?: string
  overwrite?: boolean
}

const toolFactory = tool as unknown as (input: any) => any

export const openpaulDiscussMilestone = toolFactory({
  name: 'openpaul:discuss-milestone',
  description: 'Plan upcoming milestone with context capture for pre-planning',
  parameters: z.object({
    name: z
      .string()
      .min(1)
      .describe('Milestone name to plan (e.g., "v2.0")'),
    scope: z
      .string()
      .optional()
      .describe('Milestone scope/description'),
    features: z
      .string()
      .optional()
      .describe('Comma-separated list of features to include'),
    phases: z
      .string()
      .optional()
      .describe('Comma-separated list of phase numbers'),
    constraints: z
      .string()
      .optional()
      .describe('Constraints, timeline, or deadlines'),
    overwrite: z
      .boolean()
      .optional()
      .describe('Overwrite existing MILESTONE-CONTEXT.md'),
  }),
  execute: async (args: DiscussMilestoneArgs, context: { directory: string }) => {
    try {
      const planningDir = join(context.directory, '.planning')
      const contextPath = join(planningDir, 'MILESTONE-CONTEXT.md')

      // Check if .planning directory exists
      if (!existsSync(planningDir)) {
        return formatHeader(2, '\u274C Cannot Plan Milestone') + '\n\n' +
          'OpenPAUL has not been initialized in this project.\n\n' +
          formatBold('Next Steps:') + '\n' +
          formatList([
            'Run /openpaul:init to initialize OpenPAUL',
          ])
      }

      // Check if MILESTONE-CONTEXT.md already exists
      if (existsSync(contextPath) && !args.overwrite) {
        return formatHeader(2, '\u26A0\uFE0F Milestone Context Already Exists') + '\n\n' +
          'A MILESTONE-CONTEXT.md file already exists in .planning/\n\n' +
          formatBold('Options:') + '\n' +
          formatList([
            'Run with --overwrite to replace the existing context',
            'Review the existing .planning/MILESTONE-CONTEXT.md',
          ])
      }

      // Validate milestone name
      if (!args.name || args.name.trim().length === 0) {
        return formatHeader(2, '\u274C Invalid Milestone Name') + '\n\n' +
          'Milestone name is required and cannot be empty.\n\n' +
          formatBold('Example:') + '\n' +
          formatList([
            'v2.0',
            'Phase 2 Release',
            'Q2 Milestone',
          ])
      }

      // Parse features (comma-separated)
      const featuresList = args.features
        ? args.features.split(',').map(f => f.trim()).filter(f => f.length > 0)
        : []

      // Parse phases (comma-separated)
      const phasesList = args.phases
        ? args.phases.split(',').map(p => p.trim()).filter(p => p.length > 0)
        : []

      // Generate timestamp
      const timestamp = new Date().toISOString().split('T')[0]

      // Generate MILESTONE-CONTEXT.md content
      const content = generateMilestoneContext({
        name: args.name.trim(),
        scope: args.scope?.trim() || 'To be defined',
        features: featuresList.length > 0 ? featuresList : ['To be defined'],
        phases: phasesList.length > 0 ? phasesList : ['To be determined'],
        constraints: args.constraints?.trim() || 'None specified',
        timestamp,
      })

      // Ensure .planning directory exists
      if (!existsSync(planningDir)) {
        mkdirSync(planningDir, { recursive: true })
      }

      // Write MILESTONE-CONTEXT.md using atomic write
      await atomicWrite(contextPath, content)

      // Format success output
      const milestoneName = args.name
      let output = formatHeader(2, '\u2705 Milestone Context Created') + '\n\n'
      output += formatBold('Milestone:') + ' ' + milestoneName + '\n'
      output += formatBold('File:') + ' .planning/MILESTONE-CONTEXT.md\n\n'
      output += formatBold('Next Steps:') + '\n'
      output += formatList([
        'Review and edit MILESTONE-CONTEXT.md to add more details',
        'Use this context when planning phases for this milestone',
        'Delete or archive the file when the milestone becomes active',
      ])

      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '\u274C Milestone Planning Failed') + '\n\n' +
        'Failed to create milestone context: ' + errorMessage + '\n\n' +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure OpenPAUL is initialized with /openpaul:init',
          'Check that the .planning directory is writable',
          'Try running with appropriate permissions',
        ])
    }
  },
})

/**
 * Generate MILESTONE-CONTEXT.md content from template
 */
function generateMilestoneContext(params: {
  name: string
  scope: string
  features: string[]
  phases: string[]
  constraints: string
  timestamp: string
}): string {
  const featuresSection = params.features
    .map(f => '- ' + f)
    .join('\n')

  const phasesSection = params.phases
    .map(p => '- Phase ' + p)
    .join('\n')

  const lines = [
    '# Milestone Context: ' + params.name,
    '',
    '**Gathered:** ' + params.timestamp,
    '**Status:** Planning',
    '',
    '## Goals',
    '',
    params.scope,
    '',
    '## Features',
    '',
    featuresSection,
    '',
    '## Phase Mapping',
    '',
    phasesSection,
    '',
    '## Constraints',
    '',
    params.constraints,
    '',
    '## Open Questions',
    '',
    '- What dependencies exist between phases?',
    '- What external integrations are required?',
    '- What is the target completion date?',
    '',
    '---',
    '',
    '*Context for upcoming milestone*',
    '*Created: ' + params.timestamp + '*',
    ''
  ]

  return lines.join('\n')
}
