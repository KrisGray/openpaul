import { tool } from '@opencode-ai/plugin'
import { StateManager } from '../state/state-manager'
import { FileManager } from '../storage/file-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import { progressBar } from '../output/progress-bar'
import type { LoopPhase } from '../types/loop'
import type { Plan } from '../types/plan'

import { existsSync } from 'fs'
import { join } from 'path'

/**
 * /openpaul:progress Command
 * 
 * View current loop status and next action
 * 
 * From CONTEXT.md:
 * - Compact + contextual one-line summary: `📍 Loop: PLAN → APPLY (Task 2/5) → UNIFY`
 * - Shows position, active task name, and next action
 * - Quick visual scan + actionable context
 */
export const openpaulProgress = tool({
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
            'Run `/openpaul:init` to set up OpenPAUL in this project.',
          ])
      }

      const stateManager = new StateManager(context.directory)
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
      const nextAction = stateManager.getRequiredNextAction(phase)
      const phaseState = stateManager.loadPhaseState(phaseNumber)

      // Format loop visual based on current phase
      const loopVisual = formatLoopVisual(phase)

      // Default output (compact)
      let output = formatHeader(2, '📍 OpenPAUL Status') + '\n\n'
      output += loopVisual + '\n\n'
      output += formatBold('Phase:') + ` ${phaseNumber}\n`
      output += formatBold('Next:') + ` ${nextAction}\n`

      if (phase === 'APPLY') {
        const fileManager = new FileManager(context.directory)
        const planId = phaseState?.currentPlanId
        const plan = planId ? fileManager.readPlan(phaseNumber, planId) : null
        const applyContext = getApplyTaskContext(plan, phaseState?.metadata)

        output += '\n' + formatHeader(3, 'Current Task') + '\n'
        output += formatBold('Active task:') + ` ${applyContext.activeTask}\n`
        output += formatBold('Time in progress:') + ` ${applyContext.timeInProgress}\n`
        output += formatBold('Progress:') + ` ${applyContext.progress}\n`

        if (applyContext.guidance) {
          output += formatBold('Guidance:') + ` ${applyContext.guidance}\n`
        }
      }

      // Verbose output adds more details
      if (verbose) {
        if (!phaseState) {
          return output
        }

        const timestamp = phaseState.lastUpdated
          ? new Date(phaseState.lastUpdated).toISOString()
          : 'Unknown'

        output += '\n' + formatHeader(3, 'Details') + '\n'
        output += formatBold('Stage:') + ` ${phase}\n`
        output += formatBold('Last updated:') + ` ${timestamp}\n`
        output += '\n' + formatHeader(3, 'Quick Commands') + '\n'
        output += formatList([
          '/openpaul:plan - Create a new plan',
          '/openpaul:apply - Execute the current plan',
          '/openpaul:unify - Close the loop',
          '/openpaul:help - View all commands',
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

type ApplyTaskContext = {
  activeTask: string
  timeInProgress: string
  progress: string
  guidance?: string
}

function getApplyTaskContext(
  plan: Plan | null,
  metadata?: Record<string, unknown>
): ApplyTaskContext {
  const totalTasks = plan?.tasks.length ?? 0
  const activeTaskIndex = resolveActiveTaskIndex(metadata, totalTasks)
  const activeTaskName = resolveActiveTaskName(plan, metadata, activeTaskIndex)
  const timeInfo = resolveTimeInProgress(metadata, activeTaskIndex)

  const activeTask = activeTaskName && activeTaskIndex !== null && totalTasks > 0
    ? `Task ${activeTaskIndex + 1}/${totalTasks} — ${activeTaskName}`
    : (activeTaskName ?? 'unknown (active task not recorded yet)')

  const progress = totalTasks > 0
    ? progressBar(activeTaskIndex !== null ? activeTaskIndex + 1 : 0, totalTasks)
    : 'unknown (plan unavailable)'

  const guidance = buildApplyGuidance({
    planAvailable: Boolean(plan),
    hasActiveTask: Boolean(activeTaskName),
    hasStartTime: timeInfo.hasStartTime,
  })

  return {
    activeTask,
    timeInProgress: timeInfo.label,
    progress,
    guidance,
  }
}

function resolveActiveTaskIndex(
  metadata: Record<string, unknown> | undefined,
  totalTasks: number
): number | null {
  if (!metadata) {
    return null
  }

  const rawIndex = getNumberValue(
    metadata.currentTaskIndex,
    metadata.activeTaskIndex,
    metadata.taskIndex,
    metadata.currentTaskNumber,
    metadata.activeTaskNumber
  )

  if (rawIndex === null) {
    return null
  }

  if (rawIndex >= 1 && rawIndex <= totalTasks) {
    return rawIndex - 1
  }

  if (rawIndex >= 0 && rawIndex < totalTasks) {
    return rawIndex
  }

  return null
}

function resolveActiveTaskName(
  plan: Plan | null,
  metadata: Record<string, unknown> | undefined,
  activeTaskIndex: number | null
): string | null {
  const metadataName = getStringValue(metadata?.currentTaskName, metadata?.activeTaskName)

  if (metadataName) {
    return metadataName
  }

  if (plan && activeTaskIndex !== null && activeTaskIndex >= 0 && activeTaskIndex < plan.tasks.length) {
    return plan.tasks[activeTaskIndex]?.name ?? null
  }

  return null
}

function resolveTimeInProgress(
  metadata: Record<string, unknown> | undefined,
  activeTaskIndex: number | null
): { label: string; hasStartTime: boolean } {
  const startTime = resolveTaskStartTime(metadata, activeTaskIndex)

  if (startTime === null) {
    return { label: 'unknown (start time not recorded yet)', hasStartTime: false }
  }

  const durationMs = Date.now() - startTime
  return { label: formatDuration(durationMs), hasStartTime: true }
}

function resolveTaskStartTime(
  metadata: Record<string, unknown> | undefined,
  activeTaskIndex: number | null
): number | null {
  if (!metadata) {
    return null
  }

  const directTime = getNumberValue(
    metadata.currentTaskStartedAt,
    metadata.activeTaskStartedAt,
    metadata.taskStartedAt
  )

  if (directTime !== null) {
    return directTime
  }

  const startTimes = metadata.taskStartTimes ?? metadata.taskStartTimestamps

  if (activeTaskIndex === null || !startTimes) {
    return null
  }

  if (Array.isArray(startTimes)) {
    const value = startTimes[activeTaskIndex]
    return typeof value === 'number' ? value : null
  }

  if (typeof startTimes === 'object') {
    const record = startTimes as Record<string, unknown>
    const oneBasedKey = String(activeTaskIndex + 1)
    const zeroBasedKey = String(activeTaskIndex)
    const rawValue = record[oneBasedKey] ?? record[zeroBasedKey]
    return typeof rawValue === 'number' ? rawValue : null
  }

  return null
}

function formatDuration(durationMs: number): string {
  if (!Number.isFinite(durationMs) || durationMs < 0) {
    return 'unknown'
  }

  const totalSeconds = Math.floor(durationMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${seconds}s`
}

function buildApplyGuidance(options: {
  planAvailable: boolean
  hasActiveTask: boolean
  hasStartTime: boolean
}): string | undefined {
  if (!options.planAvailable) {
    return 'Plan data is missing. Run /openpaul:plan or check .paul/phases for the current plan.'
  }

  if (!options.hasActiveTask || !options.hasStartTime) {
    return 'Task metadata is incomplete. Resume /openpaul:apply to refresh task context.'
  }

  return undefined
}

function getNumberValue(...values: Array<unknown>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
  }

  return null
}

function getStringValue(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value
    }
  }

  return null
}
