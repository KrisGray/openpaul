import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { FileManager } from '../storage/file-manager'
import { StateManager } from '../state/state-manager'
import { LoopEnforcer } from '../state/loop-enforcer'
import { formatHeader, formatBold, formatList, formatStatus } from '../output/formatter'
import { progressBar } from '../output/progress-bar'
import type { Plan, Task } from '../types/plan'

/**
 * /paul:apply command
 * 
 * Executes approved plans sequentially with task verification.
 * This command is informational — it displays plan tasks for the user/assistant to execute.
 * The actual task execution is done by the assistant reading the plan output.
 */
export const paulApply = tool({
  name: 'paul:apply',
  description: 'Execute an approved plan with task-by-task progress tracking',
  parameters: z.object({
    phase: z.number().int().positive().optional().describe('Phase number (defaults to current)'),
    plan: z.string().optional().describe('Plan identifier (defaults to current plan)'),
    task: z.number().int().positive().optional().describe('Start from specific task'),
    dryRun: z.boolean().optional().describe('Show tasks without executing'),
  }),
  execute: async (args, context) => {
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
      const phaseNumber = args.phase || currentPosition.phaseNumber
      let planId = args.plan || ''
      
      // If no plan specified, try to get current plan from state
      if (!planId) {
        const phaseState = stateManager.loadPhaseState(phaseNumber)
        if (!phaseState || !phaseState.currentPlanId) {
          return `${formatHeader(1, '❌ No Plan Found')}

${formatBold('Error:')} No current plan found.
Run /paul:plan first to create a plan.`
        }
        planId = phaseState.currentPlanId
      }
      
      // Load plan
      const plan = fileManager.readPlan(phaseNumber, planId)
      
      if (!plan) {
        return `${formatHeader(1, '❌ No Plan Found')}

${formatBold('Error:')} No plan found for phase ${phaseNumber}, plan ${planId}.
Run /paul:plan first to create a plan.`
      }
      
      // Check for dry run mode
      if (args.dryRun) {
        return formatDryRunOutput(plan)
      }
      
      // Enforce loop transition if currently in PLAN
      const currentPhase = currentPosition.phase
      if (currentPhase === 'PLAN') {
        try {
          loopEnforcer.enforceTransition('PLAN', 'APPLY')
        } catch (error) {
          return `${formatHeader(1, '❌ Invalid State Transition')}

${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}`
        }
        
        // Update state to APPLY
        await stateManager.savePhaseState(phaseNumber, {
          phase: 'APPLY',
          phaseNumber,
          currentPlanId: planId,
          lastUpdated: Date.now(),
          metadata: {},
        })
      }
      
      // Determine starting task
      const startTask = args.task ? args.task - 1 : 0 // Convert to 0-indexed
      const tasksToExecute = plan.tasks.slice(startTask)
      
      // Format output
      return formatApplyOutput(plan, tasksToExecute, startTask)
      
    } catch (error) {
      return `${formatHeader(1, '❌ Error Executing Plan')}

${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}

${formatBold('Next steps:')}
- Check that the plan exists
- Verify your current state with /paul:progress
- Try again with valid parameters`
    }
  },
})

/**
 * Format the apply output with task details and progress
 */
function formatApplyOutput(plan: Plan, tasks: Task[], startIndex: number): string {
  const totalTasks = plan.tasks.length
  const planId = `${plan.phase}-${plan.plan}`
  
  const output: string[] = [
    formatHeader(1, '🚀 Starting Apply Phase'),
    '',
    `${formatBold('Plan:')} ${planId}`,
    `${formatBold('Type:')} ${plan.type}`,
    `${formatBold('Tasks:')} ${totalTasks}`,
    '',
    formatHeader(2, 'Tasks'),
    '',
  ]
  
  // Add each task with details
  tasks.forEach((task, index) => {
    const taskNumber = startIndex + index + 1
    const status = index === 0 ? 'in-progress' : 'pending'
    
    output.push(formatHeader(3, `Task ${taskNumber}/${totalTasks}: ${task.name}`))
    output.push('')
    
    if (task.files && task.files.length > 0) {
      output.push(`${formatBold('Files:')}`)
      output.push(formatList(task.files))
      output.push('')
    }
    
    output.push(`${formatBold('Action:')}`)
    output.push(task.action)
    output.push('')
    
    output.push(`${formatBold('Verify:')}`)
    output.push(task.verify)
    output.push('')
    
    output.push(`${formatBold('Done criteria:')}`)
    output.push(task.done)
    output.push('')
    
    // Progress bar
    output.push(`${progressBar(taskNumber, totalTasks)} tasks`)
    output.push('')
    
    // Status indicator
    const statusEmoji = status === 'in-progress' ? formatStatus('in-progress') : '⏸️'
    output.push(`${formatBold('Status:')} ${statusEmoji} ${status}`)
    output.push('')
    output.push('---')
    output.push('')
  })
  
  // Summary
  output.push(formatHeader(2, 'Summary'))
  output.push('')
  output.push(`${formatBold('Total tasks:')} ${totalTasks}`)
  output.push(`${formatBold('Remaining:')} ${totalTasks - startIndex}`)
  output.push('')
  output.push(`${formatBold('Next action:')} Execute tasks sequentially, verify each task`)
  output.push(`${formatBold('After completion:')} Run /paul:unify to close the loop`)
  
  return output.join('\n')
}

/**
 * Format dry run output - shows tasks without executing
 */
function formatDryRunOutput(plan: Plan): string {
  const totalTasks = plan.tasks.length
  const planId = `${plan.phase}-${plan.plan}`
  
  const output: string[] = [
    formatHeader(1, '🔍 Dry Run: Plan Preview'),
    '',
    `${formatBold('Plan:')} ${planId}`,
    `${formatBold('Type:')} ${plan.type}`,
    `${formatBold('Tasks:')} ${totalTasks}`,
    '',
    formatHeader(2, 'Tasks'),
    '',
  ]
  
  // Add each task
  plan.tasks.forEach((task, index) => {
    const taskNumber = index + 1
    
    output.push(formatHeader(3, `Task ${taskNumber}/${totalTasks}: ${task.name}`))
    output.push('')
    
    if (task.files && task.files.length > 0) {
      output.push(`${formatBold('Files:')}`)
      output.push(formatList(task.files))
      output.push('')
    }
    
    output.push(`${formatBold('Action:')}`)
    output.push(task.action)
    output.push('')
    
    output.push(`${formatBold('Verify:')}`)
    output.push(task.verify)
    output.push('')
    
    output.push(`${formatBold('Done criteria:')}`)
    output.push(task.done)
    output.push('')
    
    // Progress bar
    output.push(`${progressBar(taskNumber, totalTasks)} tasks`)
    output.push('')
    output.push('---')
    output.push('')
  })
  
  // Footer
  output.push(formatBold('⚠️ Dry run - no changes made'))
  output.push('')
  output.push(`${formatBold('To execute:')} Run /paul:apply without --dryRun flag`)
  
  return output.join('\n')
}
