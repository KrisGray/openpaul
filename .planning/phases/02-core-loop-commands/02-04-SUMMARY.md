---
phase: 02-core-loop-commands
plan: "04"
type: execute
wave: 4
depends_on:
  - "03"
files_modified:
  - src/commands/unify.ts
  - src/storage/file-manager.ts
  - src/commands/index.ts
  - src/index.ts
  - src/tests/commands/unify.test.ts
autonomous: true
requirements:
  - CORE-04
must_haves:
  truths:
    - "User can close loops with /paul:unify"
    - "Summary is generated comparing plan vs actual"
    - "State transitions from APPLY to UNIFY and then to PLAN for new loop"
  artifacts:
    - path: "src/commands/unify.ts"
      provides: "Loop closure command"
      must_contain: ["export const paulUnify", "tool({", " name: 'paul:unify', " description: 'Close the loop with reconciliation and summary generation',
      parameters: z.object({
        phase: z.number().int().positive().optional().describe('Phase number (defaults to current)'),
        plan: z.string().optional().describe('Plan identifier (defaults to current plan)'),
        notes: z.string().optional().describe('Additional notes for summary'),
        status: z.enum(['success', 'partial', 'failed']).optional().describe('Override status (defaults to success)')
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
          const phaseState = stateManager.loadPhaseState(phaseNumber)
          if (!phaseState || !phaseState.currentPlanId) {
            planId = ''
          }
          
          // Load plan
          const plan = fileManager.readPlan(phaseNumber, planId)
          
          if (!plan) {
            return `${formatHeader(1, '❌ No Plan Found')}

${formatBold('Error:')} No plan found for phase ${phaseNumber}, plan ${planId}.
Run /paul:plan first to create a plan.`
          }
          
          // Enforce loop transition
          try {
            loopEnforcer.enforceTransition('APPLY', 'UNIFY')
          } catch (error) {
            return `${formatHeader(1, '❌ Invalid State Transition')}

${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}`
          }
          
          // Build summary
          const summaryStatus = args.status || 'success'
          const tasks: SummaryTask[] = plan.tasks.map(task => ({
            name: task.name,
            status: 'completed' as const
          }))
          
          const summary: Summary = {
            phaseNumber,
            planId,
            completed: plan.tasks.length,
            total: plan.tasks.length
            status: summaryStatus,
            tasks
            createdAt: Date.now()
          }
          
          // Ensure phases directory exists
          fileManager.ensurePhasesDir()
          
          // Save summary
          await fileManager.writeSummary(phaseNumber, planId, summary)
          
          // Update state to UNIFY
          await stateManager.savePhaseState(phaseNumber, {
            phase: 'UNIFY',
            phaseNumber
            currentPlanId: planId,
            lastUpdated: Date.now(),
            metadata: {},
          })
          
          // Then immediately transition to PLAN for next loop
          await stateManager.savePhaseState(phaseNumber + 1, {
            phase: 'PLAN',
            phaseNumber: phaseNumber + 1,
            currentPlanId: '',
            lastUpdated: Date.now(),
            metadata: {},
          })
          
          // Format output (from CONTEXT.md specification)
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
        ]
        ]
      })

      // Next steps
      output.push(formatHeader(2, 'Next Steps'))
      output.push('')
      output.push('✅ Loop successfully closed with reconciliation')
      output.push(`${formatBold('Ready for:')} next loop iteration')
      output.push(`${formatBold('Run:')} /paul:plan to start planning the next phase`)
      output.push('')

      return output.join('\n')
    } catch (error) {
      return `${formatHeader(1, '❌ Error Executing Plan')}

${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}
${formatBold('Next steps:')}
- Check that the plan exists
- Verify your current state with /paul:progress
- Try again with valid parameters`
${formatList(task.files)}`
${formatBold('Next steps:')}
${formatList([
        '- Check that the plan exists
        - Verify your current state with /paul:progress
        - Try again with valid parameters
      ])}
    }
  }
})