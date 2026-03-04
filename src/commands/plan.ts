import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { FileManager } from '../storage/file-manager'
import { StateManager } from '../state/state-manager'
import { LoopEnforcer } from '../state/loop-enforcer'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import type { Plan, Task } from '../types/plan'

/**
 * /paul:plan command
 * 
 * Creates an executable plan with tasks, criteria, and boundaries.
 * Plans are stored in .paul/phases/{phase}-{plan}-PLAN.json
 */
export const paulPlan = tool({
  name: 'paul:plan',
  description: 'Create an executable plan with tasks, criteria, and boundaries',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number'),
    plan: z.string().describe('Plan identifier (e.g., "01", "02")'),
    tasks: z.array(z.object({
      name: z.string().describe('Task name'),
      files: z.array(z.string()).optional().describe('Files to create/modify'),
      action: z.string().describe('Implementation instructions'),
      verify: z.string().describe('How to test completion'),
      done: z.string().describe('Acceptance criteria'),
    })).min(1).max(5).describe('Tasks to add (1-5 tasks per plan)'),
    verbose: z.boolean().optional().describe('Show full task details'),
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
      
      // Enforce that we can start a new loop
      try {
        loopEnforcer.enforceCanStartNewLoop(currentPosition.phase)
      } catch (error) {
        return `${formatHeader(1, '❌ Cannot Create Plan')}

${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      
      // Check if plan already exists
      if (fileManager.planExists(args.phase, args.plan)) {
        return `${formatHeader(1, '❌ Plan Already Exists')}

${formatBold('Error:')} Plan ${args.phase}-${args.plan} already exists.
Use a different plan ID or delete the existing plan first.`
      }
      
      // Build tasks array
      const tasks: Task[] = args.tasks.map((task) => ({
        type: 'auto' as const,
        name: task.name,
        files: task.files,
        action: task.action,
        verify: task.verify,
        done: task.done,
      }))
      
      // Flatten all task files
      const filesModified: string[] = tasks
        .filter((t) => t.files)
        .flatMap((t) => t.files!)
      
      // Build Plan object
      const planObject: Plan = {
        phase: `${args.phase}`,
        plan: args.plan.padStart(2, '0'),
        type: 'execute',
        wave: 1,
        depends_on: [],
        files_modified: filesModified,
        autonomous: true,
        requirements: [],
        tasks,
        must_haves: {
          truths: [],
          artifacts: [],
          key_links: [],
        },
      }
      
      // Ensure phases directory exists
      fileManager.ensurePhasesDir()
      
      // Write plan
      await fileManager.writePlan(args.phase, args.plan, planObject)
      
      // Update state to PLAN phase
      await stateManager.savePhaseState(args.phase, {
        phase: 'PLAN',
        phaseNumber: args.phase,
        currentPlanId: args.plan,
        lastUpdated: Date.now(),
        metadata: {},
      })
      
      // Format output
      const planId = `${args.phase}-${args.plan.padStart(2, '0')}`
      const output = [
        formatHeader(1, `📋 Plan: ${planId}`),
        '',
        formatBold('Type:') + ' execute | ' + 
        formatBold('Wave:') + ' 1 | ' + 
        formatBold('Tasks:') + ` ${tasks.length}`,
        '',
      ]
      
      if (args.verbose) {
        // Verbose view: full task details
        output.push(formatHeader(2, 'Tasks'))
        tasks.forEach((task, index) => {
          output.push('')
          output.push(formatBold(`${index + 1}. ${task.name}`))
          if (task.files && task.files.length > 0) {
            output.push(`   Files: ${task.files.join(', ')}`)
          }
          output.push(`   Action: ${task.action}`)
          output.push(`   Verify: ${task.verify}`)
          output.push(`   Done: ${task.done}`)
        })
      } else {
        // Default view: numbered task list
        output.push(formatHeader(2, 'Tasks'))
        output.push('')
        const taskList = tasks.map((task, index) => `${task.name}: ${task.done}`)
        output.push(formatList(taskList, true))
      }
      
      output.push('')
      output.push(formatBold('Status:') + ' ✅ Plan created successfully')
      output.push(formatBold('Location:') + ` .paul/phases/${planId}-PLAN.json`)
      output.push('')
      output.push(formatBold('Next action:') + ' Run /paul:apply to execute the plan')
      
      return output.join('\n')
      
    } catch (error) {
      return `${formatHeader(1, '❌ Error Creating Plan')}

${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}

Please check your inputs and try again.`
    }
  },
})
