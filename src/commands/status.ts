import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { StateManager } from '../state/state-manager'
import { FileManager } from '../storage/file-manager'
import { SessionManager } from '../storage/session-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import { progressBar } from '../output/progress-bar'
import type { LoopPhase } from '../types/loop'

import { existsSync } from 'fs'
import { join } from 'path'

/**
 * /openpaul:status Command
 * 
 * View current project status and loop position
 * 
 * From PLAN.md:
 * - Displays PAUL loop with position markers (◉ ✓ ○)
 * - Shows current phase and plan completion status
 * - Shows session info if paused
 * - Detects and warns about stale sessions
 */
export const paulStatus: ToolDefinition = tool({
  description: 'View current project status and loop position',
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
            'Run `/openpaul:init` to set up OpenPAUL in this project.',
          ])
      }

      const stateManager = new StateManager(context.directory)
      const fileManager = new FileManager(context.directory)
      const sessionManager = new SessionManager(context.directory)

      // Get current position
      const position = stateManager.getCurrentPosition()

      if (!position) {
        return formatHeader(2, '📍 OpenPAUL Status') + '\n\n' +
          formatBold('Status:') + ' No active state\n\n' +
          formatHeader(3, 'What to do') + '\n' +
          formatList([
            'Run `/openpaul:init` to set up OpenPAUL in this project.',
          ])
      }

      const { phaseNumber, phase } = position
      const nextAction = normalizeNextAction(stateManager.getRequiredNextAction(phase))
      const phaseState = stateManager.loadPhaseState(phaseNumber)

      // Format loop visual
      const loopVisual = formatLoopVisual(phase)

      // Build status output
      let output = formatHeader(2, '📍 OpenPAUL Status') + '\n\n'
      output += loopVisual + '\n\n'
      output += formatBold('Phase:') + ` ${phaseNumber}\n`
      output += formatBold('Current Stage:') + ` ${phase}\n`

      // Show timestamp in verbose mode
      if (verbose && phaseState?.lastUpdated) {
        const timestamp = new Date(phaseState.lastUpdated).toLocaleString()
        output += formatBold('Last updated:') + ` ${timestamp}\n`
      }

      // Load current session
      const session = sessionManager.loadCurrentSession()

      // Show session info
      output += '\n' + formatHeader(3, 'Session Info') + '\n'
      if (session) {
        // Calculate hours since pause
        const hoursAgo = (Date.now() - session.pausedAt) / (1000 * 60 * 60)
        const roundedHours = Math.round(hoursAgo)
        
        // Show staleness warning if > 24 hours
        if (hoursAgo > 24) {
          output += `⚠️ ${roundedHours}h old\n`
        }
        
        output += formatBold('Session ID:') + ` ${session.sessionId}\n`
        output += formatBold('Paused:') + ` ${new Date(session.pausedAt).toLocaleString()}\n`
      } else {
        output += 'No active session\n'
      }

      // Show plan progress if in APPLY phase
      if (phase === 'APPLY') {
        output += '\n' + formatHeader(3, 'Plan Progress') + '\n'

        if (phaseState?.currentPlanId) {
          const plan = fileManager.readPlan(phaseNumber, phaseState.currentPlanId)

          if (plan) {
            const totalTasks = plan.tasks.length
            const completedTasks = getCompletedTaskCount(phaseState.metadata)
            const progress = progressBar(completedTasks, totalTasks)

            output += progress + '\n'
          } else {
            output += 'No active plan\n'
          }
        } else {
          output += 'No active plan\n'
        }

        const planCounts = resolvePlanCounts(phaseState)
        if (planCounts) {
          output += formatBold('Plans complete:') + ` ${planCounts.completed}/${planCounts.total}\n`
        }
      }

      // Show next action
      output += '\n' + formatHeader(3, 'Next Action') + '\n'
      output += nextAction + '\n'

      // Verbose output adds more details
      if (verbose) {
        output += '\n' + formatHeader(3, 'Details') + '\n'
        output += formatBold('Current timestamp:') + ` ${new Date().toISOString()}\n`
        output += formatBold('File paths:') + '\n'
        output += formatList([
          `.paul/STATE.md - Project state`,
          `.paul/ROADMAP.md - Project roadmap`,
        ])
        output += '\n' + formatHeader(3, 'Quick Commands') + '\n'
        output += formatList([
          '/openpaul:plan - Create a new plan',
          '/openpaul:apply - Execute the current plan',
          '/openpaul:unify - Close the loop',
          '/openpaul:pause - Pause current session',
          '/openpaul:resume - Resume paused session',
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
          'Try running /openpaul:init if not initialized',
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
}

/**
 * Get completed task count from metadata
 * 
 * Checks various metadata fields that might track task completion
 */
function getCompletedTaskCount(metadata?: Record<string, unknown>): number {
  if (!metadata) {
    return 0
  }

  // Try different metadata field names that might track completed tasks
  const value = metadata.completedTasks ?? 
                metadata.completedTaskCount ?? 
                metadata.tasksCompleted ?? 
                0

  return typeof value === 'number' ? value : 0
}

function resolvePlanCounts(
  phaseState: { metadata?: Record<string, unknown> } | null | undefined
): { completed: number; total: number } | null {
  if (!phaseState) {
    return null
  }

  const metadata = phaseState.metadata ?? {}
  const totalPlans = getNumberValue(metadata.totalPlans)
  const completedPlans = getNumberValue(
    metadata.completedPlans,
    metadata.plansCompleted,
    metadata.completedPlanCount
  )

  if (totalPlans !== null && completedPlans !== null) {
    return { completed: completedPlans, total: totalPlans }
  }

  const plans = (phaseState as { plans?: unknown }).plans
  const completedPlanIds = (phaseState as { completedPlans?: unknown }).completedPlans

  if (Array.isArray(plans)) {
    const completed = Array.isArray(completedPlanIds) ? completedPlanIds.length : 0
    return { completed, total: plans.length }
  }

  return null
}

function getNumberValue(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return null
}

function normalizeNextAction(action: string): string {
  return action.replace(/\/paul:/g, '/openpaul:')
}
