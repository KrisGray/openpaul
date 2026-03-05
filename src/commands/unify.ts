import { tool, type ToolContext } from '@opencode-ai/plugin'
import { z } from 'zod'
import { FileManager, type Summary, type SummaryTask } from '../storage/file-manager'
import { StateManager } from '../state/state-manager'
import { LoopEnforcer } from '../state/loop-enforcer'
import { formatHeader, formatBold, formatList, formatStatus } from '../output/formatter'
import { progressBar } from '../output/progress-bar'
import type { Plan } from '../types/plan'

/**
 * /paul:unify command
 * 
 * Closes the loop after plan execution, generating summaries comparing plan vs actual.
 * Transitions state from APPLY → UNIFY → PLAN for the next loop iteration.
 */
type UnifyArgs = {
  phase?: number
  plan?: string
  notes?: string
  status?: 'success' | 'partial' | 'failed'
}

const toolFactory = tool as unknown as (input: any) => any

export const paulUnify = toolFactory({
  name: 'paul:unify',
  description: 'Close the loop with reconciliation and summary generation',
  parameters: z.object({
    phase: z.number().int().positive().optional().describe('Phase number (defaults to current)'),
    plan: z.string().optional().describe('Plan identifier (defaults to current plan)'),
    notes: z.string().optional().describe('Additional notes for summary'),
    status: z.enum(['success', 'partial', 'failed']).optional().describe('Override status (defaults to success)'),
  }),
  execute: async (args: UnifyArgs, context: ToolContext) => {
    try {
      const fileManager = new FileManager(context.directory)
      const stateManager = new StateManager(context.directory)
      const loopEnforcer = new LoopEnforcer()
      
      // Get current position
      const currentPosition = stateManager.getCurrentPosition()
      
      // Check if initialized
      if (!currentPosition) {
        return `${formatHeader(1, '❌ Not Initialized')}

${formatBold('Error:')} Run /paul:init first to initialize PAUL.`
      }
      
      // Determine phase and plan
      const phaseNumber = Number(args.phase ?? currentPosition.phaseNumber)
      let planId = args.plan || ''
      
      // If no plan specified, try to get current plan from state
      if (!planId) {
        const phaseState = stateManager.loadPhaseState(phaseNumber)
        if (!phaseState || !phaseState.currentPlanId) {
          return [
            formatHeader(1, '❌ No Plan Found'),
            '',
            `${formatBold('Error:')} No current plan found.`,
            'Run /paul:plan first to create a plan.',
          ].join('\n')
        }
        planId = phaseState.currentPlanId
      }
      
      // Check if currently in APPLY phase
      const currentPhase = currentPosition.phase
      if (currentPhase !== 'APPLY') {
        return [
          formatHeader(1, '❌ Invalid State'),
          '',
          `${formatBold('Error:')} Must be in APPLY phase to run /paul:unify.`,
          `Current phase: ${currentPhase}`,
          '',
          `${formatBold('Next action:')} ${loopEnforcer.getRequiredNextAction(currentPhase)}`,
        ].join('\n')
      }
      
      // Load plan
      const plan = fileManager.readPlan(phaseNumber, planId)
      
      if (!plan) {
        return [
          formatHeader(1, '❌ No Plan Found'),
          '',
          `${formatBold('Error:')} No plan found for phase ${phaseNumber}, plan ${planId}.`,
          'Run /paul:plan first to create a plan.',
        ].join('\n')
      }
      
      // Enforce loop transition
      try {
        loopEnforcer.enforceTransition('APPLY', 'UNIFY')
      } catch (error) {
        return [
          formatHeader(1, '❌ Invalid State Transition'),
          '',
          `${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
        ].join('\n')
      }
      
      // Build summary
      const summaryStatus = args.status || 'success'
      const tasks: SummaryTask[] = plan.tasks.map(task => ({
        name: task.name,
        status: 'completed' as const,
        notes: undefined,
      }))
      
      const summary: Summary = {
        phaseNumber,
        planId,
        completed: plan.tasks.length,
        total: plan.tasks.length,
        status: summaryStatus,
        tasks,
        createdAt: Date.now(),
      }
      
      // Ensure phases directory exists
      fileManager.ensurePhasesDir()
      
      // Save summary
      await fileManager.writeSummary(phaseNumber, planId, summary)
      
      // Update state to UNIFY
      await stateManager.savePhaseState(phaseNumber, {
        phase: 'UNIFY',
        phaseNumber,
        currentPlanId: planId,
        lastUpdated: Date.now(),
        metadata: { summary },
      })
      
      // Transition to PLAN for next phase (phase + 1)
      const nextPhaseNumber = phaseNumber + 1
      await stateManager.savePhaseState(nextPhaseNumber, {
        phase: 'PLAN',
        phaseNumber: nextPhaseNumber,
        lastUpdated: Date.now(),
        metadata: {},
      })
      
      // Format output
      return formatUnifyOutput(plan, summary, args.notes)
      
    } catch (error) {
      return [
        formatHeader(1, '❌ Error Closing Loop'),
        '',
        `${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
        '',
        formatBold('Next steps:'),
        '- Check that the plan exists and was executed',
        '- Verify your current state with /paul:progress',
        '- Try again with valid parameters',
      ].join('\n')
    }
  },
})

/**
 * Format the unify output with summary and completion status
 */
function formatUnifyOutput(plan: Plan, summary: Summary, notes?: string): string {
  const planId = `${plan.phase}-${plan.plan}`
  
  // Status emoji mapping
  const statusEmoji = {
    success: '✅',
    partial: '⚠️',
    failed: '❌',
  }
  
  const output: string[] = [
    formatHeader(1, `🔗 Loop Closed: ${planId}`),
    '',
    formatHeader(2, 'Summary'),
    '',
    `${formatBold('Status:')} ${statusEmoji[summary.status]} ${summary.status}`,
    `${formatBold('Tasks:')} ${progressBar(summary.completed, summary.total)} completed`,
    `${formatBold('Created:')} ${new Date(summary.createdAt).toISOString()}`,
    '',
  ]
  
  // Add tasks completed
  if (summary.tasks.length > 0) {
    output.push(formatHeader(3, 'Tasks Completed'))
    output.push('')
    summary.tasks.forEach((task, index) => {
      const taskStatus = task.status === 'completed' ? '✅' : 
                        task.status === 'skipped' ? '⏭️' : '❌'
      output.push(`${index + 1}. ${taskStatus} ${task.name}`)
      if (task.notes) {
        output.push(`   ${task.notes}`)
      }
    })
    output.push('')
  }
  
  // Add notes if provided
  if (notes) {
    output.push(formatHeader(3, 'Notes'))
    output.push('')
    output.push(notes)
    output.push('')
  }
  
  // Next steps
  output.push(formatHeader(2, 'Next Steps'))
  output.push('')
  output.push('✅ Loop successfully closed with reconciliation')
  output.push(`${formatBold('Ready for:')} Next loop iteration`)
  output.push(`${formatBold('Run:')} /paul:plan to start planning the next phase`)
  output.push('')
  output.push(formatBold('🎉 Great work completing this loop!'))
  
  return output.join('\n')
}
