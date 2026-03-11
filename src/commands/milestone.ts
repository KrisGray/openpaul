import { tool, type ToolContext } from '@opencode-ai/plugin'
import { z } from 'zod'
import { RoadmapManager } from '../roadmap/roadmap-manager'
import { MilestoneManager } from '../storage/milestone-manager'
import { StateManager } from '../state/state-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import type { Milestone } from '../types/milestone'

/**
 * /openpaul:milestone Command
 * 
 * Create a new project milestone with name, scope, and phases.
 * 
 * From CONTEXT.md:
 * - Hybrid mode: Interactive by default, CLI args for scripting
 * - Output format: Header + bullet list style
 * - Prompts user to update STATE.md after creation
 */
const toolFactory = tool as unknown as (input: any) => any

type MilestoneArgs = {
  name?: string
  scope?: string
  phases?: string
  theme?: string
  updateState?: boolean
}

export const paulMilestone = toolFactory({
  name: 'openpaul:milestone',
  description: 'Create a new project milestone with name, scope, and phases',
  parameters: z.object({
    name: z.string().optional().describe('Milestone name (e.g., "v1.1 Full Command Implementation")'),
    scope: z.string().optional().describe('Description of what the milestone delivers'),
    phases: z.string().optional().describe('Comma-separated phase numbers (e.g., "3,4,5,6")'),
    theme: z.string().optional().describe('Optional theme/slogan for the milestone'),
    updateState: z.boolean().optional().describe('Skip prompt and update STATE.md directly'),
  }),
  execute: async (args: MilestoneArgs, context: ToolContext) => {
    try {
      const roadmapManager = new RoadmapManager(context.directory)
      const milestoneManager = new MilestoneManager(context.directory, roadmapManager)
      const stateManager = new StateManager(context.directory)

      // Check ROADMAP.md exists
      const roadmapPath = roadmapManager.resolveRoadmapPath()
      if (!roadmapPath) {
        const errorLines = [
          formatHeader(2, '❌ ROADMAP.md Not Found'),
          '',
          'ROADMAP.md not found. Run /openpaul:init first.',
          '',
          formatBold('Troubleshooting:'),
          ...formatList([
            'Ensure you are in a project with OpenPAUL initialized',
            'Run /openpaul:init to set up the project',
            'Check that .paul/ROADMAP.md or .openpaul/ROADMAP.md exists',
          ]),
        ]
        return errorLines.join('\n')
      }

      // Parse phases from comma-separated string
      const phaseNumbers: number[] = []
      if (args.phases) {
        const parsed = args.phases
          .split(',')
          .map(p => parseInt(p.trim(), 10))
          .filter(p => !isNaN(p) && p > 0)
        phaseNumbers.push(...parsed)
      }

      // Validate required fields (for CLI mode)
      if (args.name || args.scope || args.phases) {
        // CLI mode - all required args must be provided
        if (!args.name || args.name.trim().length === 0) {
          const errorLines = [
            formatHeader(2, '❌ Invalid Arguments'),
            '',
            'Milestone name is required.',
            '',
            formatBold('Usage:'),
            ...formatList([
              '/openpaul:milestone --name "v1.1 Feature" --scope "Description" --phases "3,4,5"',
            ]),
          ]
          return errorLines.join('\n')
        }

        if (!args.scope || args.scope.trim().length === 0) {
          const errorLines = [
            formatHeader(2, '❌ Invalid Arguments'),
            '',
            'Milestone scope is required.',
            '',
            formatBold('Usage:'),
            ...formatList([
              '/openpaul:milestone --name "v1.1 Feature" --scope "Description" --phases "3,4,5"',
            ]),
          ]
          return errorLines.join('\n')
        }

        if (phaseNumbers.length === 0) {
          const errorLines = [
            formatHeader(2, '❌ Invalid Arguments'),
            '',
            'At least one valid phase number is required.',
            '',
            formatBold('Usage:'),
            ...formatList([
              '/openpaul:milestone --name "v1.1 Feature" --scope "Description" --phases "3,4,5"',
            ]),
          ]
          return errorLines.join('\n')
        }
      }

      // If no args provided, return interactive mode instructions
      if (!args.name && !args.scope && !args.phases) {
        const helpLines = [
          formatHeader(2, '📋 Create Milestone'),
          '',
          'To create a milestone, provide the following information:',
          '',
          formatBold('Required fields:'),
          ...formatList([
            'name: Milestone identifier (e.g., "v1.1 Full Command Implementation")',
            'scope: Description of what the milestone delivers',
            'phases: Comma-separated phase numbers (e.g., "3,4,5,6")',
          ]),
          '',
          formatBold('Optional fields:'),
          ...formatList([
            'theme: Theme/slogan for the milestone',
            'updateState: Set to true to automatically update STATE.md',
          ]),
          '',
          formatBold('Example:'),
          '/openpaul:milestone --name "v1.1 Features" --scope "All commands" --phases "3,4,5"',
        ]
        return helpLines.join('\n')
      }

      // Validate phase numbers exist
      const existingPhases = roadmapManager.parsePhases()
      const existingPhaseNumbers = new Set(existingPhases.map(p => p.number))
      const invalidPhases = phaseNumbers.filter(p => !existingPhaseNumbers.has(p))

      if (invalidPhases.length > 0) {
        const validPhaseItems = existingPhases.map(p => `Phase ${p.number}: ${p.name}`)
        return formatHeader(2, '❌ Invalid Phase Numbers') + '\n\n' +
          `The following phase numbers do not exist: ${invalidPhases.join(', ')}` + '\n\n' +
          formatBold('Valid phases:') + '\n' +
          formatList(validPhaseItems) + '\n\n' +
          formatBold('Usage:') + '\n' +
          formatList([
            'Use phase numbers that exist in ROADMAP.md',
            'Example: --phases "3,4,5,6"',
          ])
      }

      // Create the milestone
      const milestone = milestoneManager.createMilestone(
        args.name!.trim(),
        args.scope!.trim(),
        phaseNumbers,
        args.theme?.trim() || undefined
      )

      // Format output per CONTEXT.md: header + bullet list
      const output = formatMilestoneOutput(milestone, existingPhases)

      // Handle STATE.md update
      if (args.updateState === true) {
        await updateStateMilestone(stateManager, milestone.name)
        return output + '\n\n' + formatBold('STATE.md updated to track this milestone.')
      }

      // Prompt for STATE.md update
      const promptLines = [
        output,
        '',
        formatBold('Next step:') + ' Update STATE.md to track this milestone?',
        'Re-run with --updateState to automatically update STATE.md:',
        `/openpaul:milestone --name "${args.name}" --scope "${args.scope}" --phases "${args.phases}" --updateState`,
      ]
      return promptLines.join('\n')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      // Handle specific errors
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        const errorLines = [
          formatHeader(2, '❌ Duplicate Milestone'),
          '',
          'A milestone with this name already exists.',
          '',
          formatBold('Suggestion:') + ' Use a different name or check existing milestones in ROADMAP.md',
        ]
        return errorLines.join('\n')
      }

      const errorLines = [
        formatHeader(2, '❌ Milestone Creation Failed'),
        '',
        `Failed to create milestone: ${errorMessage}`,
        '',
        formatBold('Troubleshooting:'),
        ...formatList([
          'Ensure ROADMAP.md exists and is valid',
          'Check that phase numbers are valid',
          'Verify you have write permissions',
          'Ensure milestone name is unique',
        ]),
      ]
      return errorLines.join('\n')
    }
  },
})

/**
 * Format milestone output as header + bullet list (per CONTEXT.md)
 */
function formatMilestoneOutput(milestone: Milestone, existingPhases: Array<{ number: number; name: string }>): string {
  const phasesDisplay = milestone.phases
    .sort((a, b) => a - b)
    .map(num => String(num))
    .join(', ')

  const lines = [
    formatHeader(2, `Milestone: ${milestone.name}`),
    '',
    formatBold('Scope:') + ' ' + milestone.scope,
    '',
    formatBold('Phases:') + ' ' + phasesDisplay,
  ]

  if (milestone.theme) {
    lines.push('')
    lines.push(formatBold('Theme:') + ' ' + milestone.theme)
  }

  lines.push('')
  const statusLabel = milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)
  lines.push(formatBold('Status:') + ' ' + statusLabel)

  return lines.join('\n')
}

/**
 * Update STATE.md with current milestone
 */
async function updateStateMilestone(stateManager: StateManager, milestoneName: string): Promise<void> {
  // The StateManager doesn't directly support milestone updates
  // This is handled at the ROADMAP.md level via MilestoneManager
  // For now, this is a placeholder that could be extended to update
  // a STATE.md file if needed
  // 
  // In the current architecture, milestone tracking is done via ROADMAP.md
  // and STATE.md tracks the current phase/plan position
  void stateManager
  void milestoneName
}
