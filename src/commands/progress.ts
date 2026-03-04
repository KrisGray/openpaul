import { tool } from '@opencode-ai/plugin'
import { StateManager } from '../state/state-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import type { LoopPhase } from '../types/loop'

import { existsSync } from 'fs'
import { join } from 'path'

/**
 * /paul:progress Command
 * 
 * View current loop status and next action
 * 
 * From CONTEXT.md:
 * - Compact + contextual one-line summary: `📍 Loop: PLAN → APPLY (Task 2/5) → UNIFY`
 * - Shows position, active task name, and next action
 * - Quick visual scan + actionable context
 */
export const paulProgress = tool({
  description: 'View current loop status and next action',
  args: {
    verbose: tool.schema.boolean().optional().describe('Show detailed status'),
  },
  execute: async ({ verbose }, context) => {
    try {
      const paulDir = join(context.directory, '.paul')
      
      // Check if initialized
      if (!existsSync(paulDir)) {
        return formatHeader(2, '📍 OpenPAUL Status') + '\n\n' +
          formatBold('Status:') + ' Not initialized\n\n' +
          formatHeader(3, 'What to do') + '\n' +
          formatList([
            'Run `/paul:init` to set up OpenPAUL in this project.',
          ])
      }

      const stateManager = new StateManager(context.directory)
      const position = stateManager.getCurrentPosition()

      if (!position) {
        return formatHeader(2, '📍 OpenPAUL Status') + '\n\n' +
          formatBold('Status:') + ' No active state\n\n' +
          formatHeader(3, 'What to do') + '\n' +
          formatList([
            'Run `/paul:init` to set up OpenPAUL in this project.',
          ])
      }

      const { phaseNumber, phase } = position
      const nextAction = stateManager.getRequiredNextAction(phase)

      // Format loop visual based on current phase
      const loopVisual = formatLoopVisual(phase)

      // Default output (compact)
      let output = formatHeader(2, '📍 OpenPAUL Status') + '\n\n'
      output += loopVisual + '\n\n'
      output += formatBold('Phase:') + ` ${phaseNumber}\n`
      output += formatBold('Next:') + ` ${nextAction}\n`

      // Verbose output adds more details
      if (verbose) {
        const state = stateManager.loadPhaseState(phaseNumber)
        if (!state) {
          return output
        }

        const timestamp = state.lastUpdated
          ? new Date(state.lastUpdated).toISOString()
          : 'Unknown'

        output += '\n' + formatHeader(3, 'Details') + '\n'
        output += formatBold('Stage:') + ` ${phase}\n`
        output += formatBold('Last updated:') + ` ${timestamp}\n`
        output += '\n' + formatHeader(3, 'Quick Commands') + '\n'
        output += formatList([
          '/paul:plan - Create a new plan',
          '/paul:apply - Execute the current plan',
          '/paul:unify - Close the loop',
          '/paul:help - View all commands',
        ])
      }

      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Status Check Failed') + '\n\n' +
        `Failed to get current status: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure .paul/ directory exists and is readable',
          'Check if state files are valid JSON',
          'Try running /paul:init if not initialized',
        ])
    }
  },
})

/**
 * Format the loop visual indicator
 * 
 * Shows the PLAN → APPLY → UNIFY loop with current position highlighted
 */
function formatLoopVisual(currentPhase: LoopPhase): string {
  const phases: LoopPhase[] = ['PLAN', 'APPLY', 'UNIFY']
  
  const formattedPhases = phases.map(phase => {
    if (phase === currentPhase) {
      // Current phase: ◉
      return `◉ ${phase}`
    }
    
    // Check if phase is before current (completed)
    const currentIndex = phases.indexOf(currentPhase)
    const phaseIndex = phases.indexOf(phase)
    
    if (phaseIndex < currentIndex) {
      // Completed phase: ✓
      return `✓ ${phase}`
    }
    
    // Future phase: ○
    return `○ ${phase}`
  })
  
  return `📍 Loop: ${formattedPhases.join(' → ')}`
