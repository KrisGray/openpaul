import { existsSync } from 'fs'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { tool, type ToolContext, type ToolDefinition } from '@opencode-ai/plugin'
import { FileManager } from '../storage/file-manager'
import { StateManager } from '../state/state-manager'
import { LoopEnforcer } from '../state/loop-enforcer'
import { formatGuidedError } from '../output/error-formatter'
import { formatHeader, formatBold, formatList, formatExecutionGraph } from '../output/formatter'
import type { ExecutionGraph, Plan, Task, TaskDependencies } from '../types/plan'

/**
 * /openpaul:plan command
 * 
 * Creates an executable plan with tasks, criteria, and boundaries.
 * Plans are stored in .openpaul/phases/{phase}-{plan}-PLAN.json
 */
type PlanArgs = {
  phase: number
  plan: string
  criteria?: string | string[]
  boundaries?: string | string[]
  requirements?: string[]
  mustHaves?: {
    truths?: string[]
    artifacts?: Array<{
      path: string
      provides: string
      must_contain?: string[]
      min_lines?: number
    }>
    key_links?: Array<{
      from: string
      to: string
      via: string
      pattern: string
    }>
  }
  tasks: Array<{
    name: string
    files?: string[]
    action: string
    verify: string
    done: string
  }>
  verbose?: boolean
}
export const openpaulPlan: ToolDefinition = tool({
  description: 'Create an executable plan with tasks, criteria, and boundaries',
  args: {
    phase: tool.schema.number().int().positive().describe('Phase number'),
    plan: tool.schema.string().describe('Plan identifier (e.g., "01", "02")'),
    criteria: tool.schema.union([tool.schema.string(), tool.schema.array(tool.schema.string())]).optional().describe('Acceptance criteria for the plan'),
    boundaries: tool.schema.union([tool.schema.string(), tool.schema.array(tool.schema.string())]).optional().describe('Boundaries and exclusions for the plan'),
    requirements: tool.schema.array(tool.schema.string()).optional().describe('Requirement IDs satisfied by this plan'),
    mustHaves: tool.schema.object({
      truths: tool.schema.array(tool.schema.string()).optional(),
      artifacts: tool.schema.array(tool.schema.object({
        path: tool.schema.string(),
        provides: tool.schema.string(),
        must_contain: tool.schema.array(tool.schema.string()).optional(),
        min_lines: tool.schema.number().int().positive().optional(),
      })).optional(),
      key_links: tool.schema.array(tool.schema.object({
        from: tool.schema.string(),
        to: tool.schema.string(),
        via: tool.schema.string(),
        pattern: tool.schema.string(),
      })).optional(),
    }).optional().describe('Must-have validation criteria for goal-backward verification'),
    tasks: tool.schema.array(tool.schema.object({
      name: tool.schema.string().describe('Task name'),
      files: tool.schema.array(tool.schema.string()).optional().describe('Files to create/modify'),
      action: tool.schema.string().describe('Implementation instructions'),
      verify: tool.schema.string().describe('How to test completion'),
      done: tool.schema.string().describe('Acceptance criteria'),
    })).min(1).max(5).describe('Tasks to add (1-5 tasks per plan)'),
    verbose: tool.schema.boolean().optional().describe('Show full task details'),
  },
  execute: async (args: PlanArgs, context: ToolContext) => {
    try {
      if (!args || typeof args.phase !== 'number' || !args.plan || !Array.isArray(args.tasks) || args.tasks.length === 0) {
        return formatPlanWizard()
      }

      const fileManager = new FileManager(context.directory)
      const stateManager = new StateManager(context.directory)
      const loopEnforcer = new LoopEnforcer()
      
      // Get current position
      const currentPosition = stateManager.getCurrentPosition()
      
      // Check if initialized
      if (!currentPosition) {
        return formatGuidedError({
          title: 'Not Initialized',
          message: 'OpenPAUL has not been initialized for this project.',
          context: `Project directory: ${context.directory}`,
          suggestedFix: 'Run /openpaul:init to create the .openpaul/ directory and initial state.',
          nextSteps: [
            'Run /openpaul:init',
            'Re-run /openpaul:plan once initialization completes',
          ],
        })
      }
      
      // Enforce that we can start a new loop
      try {
        loopEnforcer.enforceCanStartNewLoop(currentPosition.phase)
      } catch (error) {
        return formatGuidedError({
          title: 'Cannot Create Plan',
          message: error instanceof Error ? error.message : 'Unknown error preventing plan creation.',
          context: `Current loop phase: ${currentPosition.phase}`,
          suggestedFix: 'Complete the current loop phase before starting a new plan.',
          nextSteps: [
            `Run ${loopEnforcer.getRequiredNextAction(currentPosition.phase)}`,
            'Re-run /openpaul:plan after the loop is ready for planning',
          ],
        })
      }
      
      // Check if plan already exists
      const planId = args.plan.padStart(2, '0')
      if (fileManager.planExists(args.phase, planId)) {
        return formatGuidedError({
          title: 'Plan Already Exists',
          message: `Plan ${args.phase}-${planId} already exists.`,
          context: 'Plan files are stored in .openpaul/phases/',
          suggestedFix: 'Use a different plan ID or remove the existing plan file.',
          nextSteps: [
            'Choose a new plan ID (e.g., 02, 03)',
            'Or delete the existing plan file from .openpaul/phases/',
          ],
        })
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

      const criteria = normalizeStringList(args.criteria)
      const boundaries = normalizeStringList(args.boundaries)
      const requirements = args.requirements ?? []
      const mustHaves = {
        truths: args.mustHaves?.truths ?? [],
        artifacts: args.mustHaves?.artifacts ?? [],
        key_links: args.mustHaves?.key_links ?? [],
      }
      
      // Flatten all task files
      const filesModified: string[] = tasks
        .filter((t) => t.files)
        .flatMap((t) => t.files!)
      
      // Build Plan object
      const taskDependencies = buildTaskDependencies(tasks)
      const executionGraph = buildExecutionGraph(taskDependencies, tasks.length)

      const planObject: Plan = {
        phase: `${args.phase}`,
        plan: planId,
        type: 'execute',
        wave: 1,
        depends_on: [],
        files_modified: filesModified,
        autonomous: true,
        requirements,
        criteria,
        boundaries,
        tasks,
        must_haves: mustHaves,
        taskDependencies,
        executionGraph,
      }
      
      // Ensure phases directory exists
      fileManager.ensurePhasesDir()

      const planPath = join(context.directory, '.openpaul', 'phases', `${args.phase}-${planId}-PLAN.json`)
      const planMarkdownPath = join(context.directory, '.openpaul', 'phases', `${args.phase}-${planId}-PLAN.md`)
      let planWritten = false
      let markdownWritten = false

      try {
        await retryWithBackoff(() => fileManager.writePlan(args.phase, planId, planObject))
        planWritten = true
        const planMarkdown = formatPlanMarkdown({
          planIdLabel: `${args.phase}-${planId}`,
          criteria,
          tasks,
          structureLabel: getStructureLabel(tasks.length),
        })
        await retryWithBackoff(() => fileManager.writePlanMarkdown(args.phase, planId, planMarkdown))
        markdownWritten = true
        await retryWithBackoff(() => stateManager.savePhaseState(args.phase, {
          phase: 'PLAN',
          phaseNumber: args.phase,
          currentPlanId: planId,
          lastUpdated: Date.now(),
          metadata: {},
        }))
      } catch (error) {
        if (planWritten) {
          await rollbackPlanFile(planPath)
        }
        if (markdownWritten) {
          await rollbackPlanFile(planMarkdownPath)
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown filesystem error'
        return formatGuidedError({
          title: 'Plan Write Failed',
          message: errorMessage,
          context: `Plan path: ${planPath}`,
          suggestedFix: 'Check file permissions and ensure the .openpaul/ directory is writable.',
          nextSteps: [
            'Verify .openpaul/ directory permissions',
            'Retry /openpaul:plan after resolving filesystem issues',
          ],
        })
      }
      
      // Format output
      const planIdLabel = `${args.phase}-${planId}`
      const structureLabel = getStructureLabel(tasks.length)
      const output = [
        formatHeader(1, `📋 Plan: ${planIdLabel}`),
        '',
        formatBold('Type:') + ' execute | ' + 
        formatBold('Wave:') + ' 1 | ' + 
        formatBold('Tasks:') + ` ${tasks.length}`,
        formatBold('Structure:') + ` ${structureLabel}`,
        '',
      ]

      if (criteria.length > 0) {
        output.push(formatHeader(2, 'Criteria'))
        output.push('')
        output.push(formatList(criteria))
        output.push('')
      }

      if (boundaries.length > 0) {
        output.push(formatHeader(2, 'Boundaries'))
        output.push('')
        output.push(formatList(boundaries))
        output.push('')
      }

      output.push(formatHeader(2, 'Execution Graph'))
      output.push('')
      output.push(formatExecutionGraph(executionGraph))
      output.push('')
      
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
        const taskList = tasks.map((task, index) => formatTaskSummary(task, index, tasks.length))
        output.push(formatList(taskList, true))
        if (structureLabel === 'complex') {
          output.push('')
          output.push(`${formatBold('Note:')} Use /openpaul:plan --verbose for full task details.`)
        }
      }
      
      output.push('')
      output.push(formatBold('Status:') + ' ✅ Plan created successfully')
      output.push(formatBold('Location:') + ` .openpaul/phases/${planIdLabel}-PLAN.json`)
      output.push(formatBold('Markdown:') + ` .openpaul/phases/${planIdLabel}-PLAN.md`)
      output.push('')
      output.push(formatBold('Next action:') + ' Run /openpaul:apply to execute the plan')
      
      return output.join('\n')
      
    } catch (error) {
      return formatGuidedError({
        title: 'Error Creating Plan',
        message: error instanceof Error ? error.message : 'Unknown error creating the plan.',
        context: 'An unexpected error occurred while building the plan output.',
        suggestedFix: 'Review your inputs and retry the command.',
        nextSteps: [
          'Verify plan parameters (phase, plan ID, tasks)',
          'Run /openpaul:plan again after correcting inputs',
        ],
      })
    }
  },
})

function normalizeStringList(input?: string | string[]): string[] {
  if (!input) return []
  if (Array.isArray(input)) {
    return input.map(item => item.trim()).filter(Boolean)
  }
  const trimmed = input.trim()
  return trimmed ? [trimmed] : []
}

function buildTaskDependencies(tasks: Task[]): TaskDependencies {
  const dependencies: TaskDependencies = {}

  tasks.forEach((task, index) => {
    const taskFiles = new Set(task.files ?? [])
    const deps: number[] = []

    if (taskFiles.size > 0) {
      for (let i = 0; i < index; i += 1) {
        const priorFiles = tasks[i].files ?? []
        if (priorFiles.some(file => taskFiles.has(file))) {
          deps.push(i + 1)
        }
      }
    }

    dependencies[String(index + 1)] = deps
  })

  return dependencies
}

function buildExecutionGraph(taskDependencies: TaskDependencies, taskCount: number): ExecutionGraph {
  const remaining = new Set<number>()
  const resolved = new Set<number>()
  const graph: ExecutionGraph = []

  for (let i = 1; i <= taskCount; i += 1) {
    remaining.add(i)
  }

  while (remaining.size > 0) {
    const wave: number[] = []
    const remainingSorted = Array.from(remaining).sort((a, b) => a - b)

    remainingSorted.forEach((taskNumber) => {
      const deps = taskDependencies[String(taskNumber)] ?? []
      if (deps.every(dep => resolved.has(dep))) {
        wave.push(taskNumber)
      }
    })

    if (wave.length === 0) {
      graph.push(remainingSorted)
      break
    }

    wave.forEach((taskNumber) => {
      remaining.delete(taskNumber)
      resolved.add(taskNumber)
    })

    graph.push(wave)
  }

  return graph
}

function getStructureLabel(taskCount: number): 'simple' | 'medium' | 'complex' {
  if (taskCount <= 3) return 'simple'
  if (taskCount <= 10) return 'medium'
  return 'complex'
}

function formatTaskSummary(task: Task, index: number, total: number): string {
  const label = task.name
  if (total <= 3) {
    return `${label}: ${task.done}`
  }
  if (total <= 10) {
    return `${label}: ${truncateText(task.done, 80)}`
  }
  return label
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1)}…`
}

function formatPlanMarkdown({
  planIdLabel,
  criteria,
  tasks,
  structureLabel,
}: {
  planIdLabel: string
  criteria: string[]
  tasks: Task[]
  structureLabel: string
}): string {
  const lines: string[] = [
    `# 📋 Plan: ${planIdLabel}`,
    '',
    `Type: execute | Wave: 1 | Tasks: ${tasks.length}`,
    `Structure: ${structureLabel}`,
    '',
  ]

  if (criteria.length > 0) {
    lines.push('## Criteria', '')
    criteria.forEach((item) => {
      lines.push(`- ${item}`)
    })
    lines.push('')
  }

  lines.push('## Tasks')
  tasks.forEach((task, index) => {
    const summary = formatTaskSummary(task, index, tasks.length)
    lines.push(`${index + 1}. ${summary}`)
  })

  lines.push('')

  return lines.join('\n')
}

function formatPlanWizard(): string {
  const output: string[] = [
    formatHeader(2, 'Plan Wizard (TDD)'),
    '',
    'To create a plan, provide the missing inputs in this order:',
    '',
    formatList([
      'Phase number (e.g., 1)',
      'Plan ID (e.g., 01)',
      'Acceptance criteria (1-5 bullet points)',
      'Tasks (1-5) in TDD order: failing test -> implementation -> edge/coverage tests',
    ]),
    '',
    formatBold('TDD task template:'),
    '',
    formatList([
      'Write failing test: test file exists and fails for the new behavior',
      'Implement feature: behavior passes and errors handled',
      'Add edge tests: not-found, error paths, malformed responses',
    ]),
    '',
    formatBold('Example call:'),
    '',
    '/openpaul:plan',
  ]

  return output.join('\n')
}

const TRANSIENT_ERROR_CODES = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'EIO', 'ETIMEDOUT'])

function isTransientFsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  return typeof code === 'string' && TRANSIENT_ERROR_CODES.has(code)
}

async function retryWithBackoff<T>(operation: () => Promise<T>, retries = 3, baseDelayMs = 100): Promise<T> {
  let attempt = 0

  while (attempt <= retries) {
    try {
      return await operation()
    } catch (error) {
      if (!isTransientFsError(error) || attempt === retries) {
        throw error
      }
      const delayMs = baseDelayMs * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delayMs))
      attempt += 1
    }
  }

  throw new Error('Retry limit exceeded while writing plan')
}

async function rollbackPlanFile(planPath: string): Promise<void> {
  if (!existsSync(planPath)) return
  try {
    await unlink(planPath)
  } catch {
    // Ignore rollback errors to avoid masking the original failure
  }
}
