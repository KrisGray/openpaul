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
import type { PlanWizardState, PlanWizardTaskDraft } from '../types/plan-wizard'

/**
 * /openpaul:plan command
 * 
 * Creates an executable plan with tasks, criteria, and boundaries.
 * Plans are stored in .openpaul/phases/{phase}-{plan}-PLAN.json
 */
type PlanTaskInput = {
  name: string
  files?: string[]
  action: string
  verify: string
  done: string
}

type PlanArgs = {
  phase?: number
  plan?: string
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
  tasks?: PlanTaskInput[]
  verbose?: boolean
  wizardInput?: string
  wizardReset?: boolean
}

type PlanCreateArgs = Omit<PlanArgs, 'phase' | 'plan' | 'tasks'> & {
  phase: number
  plan: string
  tasks: PlanTaskInput[]
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
    wizardInput: tool.schema.string().optional().describe('Wizard response input (interactive mode)'),
    wizardReset: tool.schema.boolean().optional().describe('Reset the plan wizard state'),
  },
  execute: async (args: PlanArgs, context: ToolContext) => {
    try {
      const fileManager = new FileManager(context.directory)
      const stateManager = new StateManager(context.directory)
      const loopEnforcer = new LoopEnforcer()
      const gateResult = ensurePlanningAllowed(stateManager, loopEnforcer, context.directory)
      if (gateResult) {
        return gateResult
      }

      if (!hasRequiredPlanArgs(args)) {
        return runPlanWizard(args, context, fileManager, stateManager)
      }

      const planResult = await createPlanFromArgs(args, context, fileManager, stateManager)
      return planResult.output
      
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

function hasRequiredPlanArgs(args?: PlanArgs): args is PlanCreateArgs {
  return !!args && typeof args.phase === 'number' && !!args.plan && Array.isArray(args.tasks) && args.tasks.length > 0
}

function ensurePlanningAllowed(
  stateManager: StateManager,
  loopEnforcer: LoopEnforcer,
  directory: string,
): string | null {
  const currentPosition = stateManager.getCurrentPosition()

  if (!currentPosition) {
    return formatGuidedError({
      title: 'Not Initialized',
      message: 'OpenPAUL has not been initialized for this project.',
      context: `Project directory: ${directory}`,
      suggestedFix: 'Run /openpaul:init to create the .openpaul/ directory and initial state.',
      nextSteps: [
        'Run /openpaul:init',
        'Re-run /openpaul:plan once initialization completes',
      ],
    })
  }

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

  return null
}

async function createPlanFromArgs(
  args: PlanCreateArgs,
  context: ToolContext,
  fileManager: FileManager,
  stateManager: StateManager,
): Promise<{ output: string; success: boolean }> {
  // Check if plan already exists
  const planId = args.plan.padStart(2, '0')
  if (fileManager.planExists(args.phase, planId)) {
    return {
      output: formatGuidedError({
        title: 'Plan Already Exists',
        message: `Plan ${args.phase}-${planId} already exists.`,
        context: 'Plan files are stored in .openpaul/phases/',
        suggestedFix: 'Use a different plan ID or remove the existing plan file.',
        nextSteps: [
          'Choose a new plan ID (e.g., 02, 03)',
          'Or delete the existing plan file from .openpaul/phases/',
        ],
      }),
      success: false,
    }
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
    return {
      output: formatGuidedError({
        title: 'Plan Write Failed',
        message: errorMessage,
        context: `Plan path: ${planPath}`,
        suggestedFix: 'Check file permissions and ensure the .openpaul/ directory is writable.',
        nextSteps: [
          'Verify .openpaul/ directory permissions',
          'Retry /openpaul:plan after resolving filesystem issues',
        ],
      }),
      success: false,
    }
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

  return { output: output.join('\n'), success: true }
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

async function runPlanWizard(
  args: PlanArgs,
  context: ToolContext,
  fileManager: FileManager,
  stateManager: StateManager,
): Promise<string> {
  if (args?.wizardReset) {
    await fileManager.clearPlanWizardState()
    const freshState = createDefaultWizardState()
    await fileManager.writePlanWizardState(freshState)
    return formatWizardPrompt(freshState)
  }

  let wizardState = fileManager.readPlanWizardState() ?? createDefaultWizardState()
  const input = typeof args?.wizardInput === 'string' ? args.wizardInput.trim() : undefined

  if (input !== undefined) {
    if (input.length === 0) {
      await fileManager.writePlanWizardState(wizardState)
      return formatWizardPrompt(wizardState, 'Input cannot be empty.')
    }
    const applied = applyWizardInput(wizardState, input)
    wizardState = applied.state
    if (!applied.ok) {
      await fileManager.writePlanWizardState(wizardState)
      return formatWizardPrompt(wizardState, applied.error)
    }
  }

  const now = Date.now()
  if (!wizardState.createdAt) {
    wizardState.createdAt = now
  }
  wizardState.updatedAt = now

  if (isWizardComplete(wizardState)) {
    const planArgs = buildPlanArgsFromWizard(wizardState)
    const planResult = await createPlanFromArgs(planArgs, context, fileManager, stateManager)
    if (planResult.success) {
      await fileManager.clearPlanWizardState()
    } else {
      await fileManager.writePlanWizardState(wizardState)
    }
    return planResult.output
  }

  await fileManager.writePlanWizardState(wizardState)
  return formatWizardPrompt(wizardState)
}

function createDefaultWizardState(): PlanWizardState {
  return {
    step: 'phase',
    tasks: [],
    currentTaskIndex: 0,
  }
}

function applyWizardInput(state: PlanWizardState, input: string): {
  ok: boolean
  state: PlanWizardState
  error?: string
} {
  const normalizedInput = input.trim()
  const taskIndex = state.currentTaskIndex ?? 0

  switch (state.step) {
    case 'phase': {
      const phase = parsePhaseNumber(normalizedInput)
      if (!phase) {
        return { ok: false, state, error: 'Phase must be a positive integer (e.g., 1).' }
      }
      return { ok: true, state: { ...state, phase, step: 'plan' } }
    }
    case 'plan': {
      const plan = normalizedInput
      if (!plan) {
        return { ok: false, state, error: 'Plan ID cannot be empty (e.g., 01).' }
      }
      return { ok: true, state: { ...state, plan, step: 'criteria' } }
    }
    case 'criteria': {
      const criteria = parseBulletList(normalizedInput)
      if (criteria.length === 0) {
        return { ok: false, state, error: 'Provide 1-5 acceptance criteria.' }
      }
      if (criteria.length > 5) {
        return { ok: false, state, error: 'Limit criteria to 1-5 items.' }
      }
      return { ok: true, state: { ...state, criteria, step: 'boundaries' } }
    }
    case 'boundaries': {
      const boundaries = parseOptionalList(normalizedInput)
      return { ok: true, state: { ...state, boundaries, step: 'taskCount' } }
    }
    case 'taskCount': {
      const taskCount = parseTaskCount(normalizedInput)
      if (!taskCount) {
        return { ok: false, state, error: 'Task count must be a number between 1 and 5.' }
      }
      const tasks = state.tasks.slice(0, taskCount)
      return {
        ok: true,
        state: {
          ...state,
          taskCount,
          tasks,
          currentTaskIndex: 0,
          step: 'taskName',
        },
      }
    }
    case 'taskName': {
      if (!normalizedInput) {
        return { ok: false, state, error: 'Task name cannot be empty.' }
      }
      const tasks = ensureTaskDraft(state.tasks, taskIndex)
      tasks[taskIndex].name = normalizedInput
      return { ok: true, state: { ...state, tasks, step: 'taskFiles' } }
    }
    case 'taskFiles': {
      const files = parseOptionalFiles(normalizedInput)
      const tasks = ensureTaskDraft(state.tasks, taskIndex)
      tasks[taskIndex].files = files
      return { ok: true, state: { ...state, tasks, step: 'taskAction' } }
    }
    case 'taskAction': {
      if (!normalizedInput) {
        return { ok: false, state, error: 'Task action cannot be empty.' }
      }
      const tasks = ensureTaskDraft(state.tasks, taskIndex)
      tasks[taskIndex].action = normalizedInput
      return { ok: true, state: { ...state, tasks, step: 'taskVerify' } }
    }
    case 'taskVerify': {
      if (!normalizedInput) {
        return { ok: false, state, error: 'Task verify step cannot be empty.' }
      }
      const tasks = ensureTaskDraft(state.tasks, taskIndex)
      tasks[taskIndex].verify = normalizedInput
      return { ok: true, state: { ...state, tasks, step: 'taskDone' } }
    }
    case 'taskDone': {
      if (!normalizedInput) {
        return { ok: false, state, error: 'Task acceptance criteria cannot be empty.' }
      }
      const tasks = ensureTaskDraft(state.tasks, taskIndex)
      tasks[taskIndex].done = normalizedInput
      const taskCount = state.taskCount ?? tasks.length
      const nextIndex = taskIndex + 1
      if (nextIndex < taskCount) {
        return {
          ok: true,
          state: {
            ...state,
            tasks,
            currentTaskIndex: nextIndex,
            step: 'taskName',
          },
        }
      }
      return { ok: true, state: { ...state, tasks } }
    }
    default:
      return { ok: false, state, error: 'Unknown wizard step.' }
  }
}

function ensureTaskDraft(tasks: PlanWizardTaskDraft[], index: number): PlanWizardTaskDraft[] {
  const updated = [...tasks]
  if (!updated[index]) {
    updated[index] = {}
  }
  return updated
}

function parsePhaseNumber(input: string): number | null {
  const parsed = parseInt(input, 10)
  if (Number.isNaN(parsed) || parsed <= 0) return null
  return parsed
}

function parseTaskCount(input: string): number | null {
  const parsed = parseInt(input, 10)
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 5) return null
  return parsed
}

function parseBulletList(input: string): string[] {
  return input
    .split(/[\n;]/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
}

function parseOptionalList(input: string): string[] {
  const normalized = input.trim().toLowerCase()
  if (['skip', 'none', 'n/a'].includes(normalized)) return []
  return parseBulletList(input)
}

function parseOptionalFiles(input: string): string[] | undefined {
  const normalized = input.trim().toLowerCase()
  if (['skip', 'none', 'n/a'].includes(normalized)) return undefined
  const files = input
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
  return files.length > 0 ? files : undefined
}

function isWizardComplete(state: PlanWizardState): boolean {
  if (!state.phase || !state.plan) return false
  if (!state.criteria || state.criteria.length === 0) return false
  if (!state.taskCount || state.taskCount < 1) return false
  if (state.tasks.length < state.taskCount) return false
  return state.tasks.slice(0, state.taskCount).every((task) => (
    !!task.name && !!task.action && !!task.verify && !!task.done
  ))
}

function buildPlanArgsFromWizard(state: PlanWizardState): PlanCreateArgs {
  const tasks = state.tasks.slice(0, state.taskCount ?? state.tasks.length).map((task) => ({
    name: task.name ?? '',
    files: task.files,
    action: task.action ?? '',
    verify: task.verify ?? '',
    done: task.done ?? '',
  }))

  return {
    phase: state.phase ?? 1,
    plan: state.plan ?? '01',
    criteria: state.criteria ?? [],
    boundaries: state.boundaries ?? [],
    tasks,
  }
}

function formatWizardPrompt(state: PlanWizardState, errorMessage?: string): string {
  const lines: string[] = [formatHeader(2, 'Plan Wizard (TDD)')]

  if (errorMessage) {
    lines.push('', formatBold('Issue:') + ` ${errorMessage}`)
  }

  const criteriaCount = state.criteria?.length ?? 0
  const taskCount = state.taskCount ?? '—'
  lines.push(
    '',
    formatBold('Progress:') + ` Phase ${state.phase ?? '—'} | Plan ${state.plan ?? '—'} | Criteria ${criteriaCount} | Tasks ${state.tasks.length}/${taskCount}`,
    ''
  )

  const stepCopy = getWizardStepCopy(state)
  lines.push(formatBold('Next:') + ` ${stepCopy.title}`)
  if (stepCopy.body.length > 0) {
    lines.push('', formatList(stepCopy.body))
  }
  if (stepCopy.example) {
    lines.push('', formatBold('Example:'), stepCopy.example)
  }
  lines.push('', formatBold('Reset:') + ' /openpaul:plan --wizardReset')

  return lines.join('\n')
}

function getWizardStepCopy(state: PlanWizardState): { title: string; body: string[]; example?: string } {
  const taskIndex = (state.currentTaskIndex ?? 0) + 1
  const taskTotal = state.taskCount ?? 1

  switch (state.step) {
    case 'phase':
      return {
        title: 'Phase number',
        body: ['Enter the phase number (e.g., 1).'],
        example: '1',
      }
    case 'plan':
      return {
        title: 'Plan ID',
        body: ['Enter the plan ID (e.g., 01).'],
        example: '01',
      }
    case 'criteria':
      return {
        title: 'Acceptance criteria',
        body: [
          'Provide 1-5 criteria (one per line or separated with semicolons).',
          'Use Given/When/Then if possible.',
        ],
        example: 'Given user is logged in; When they save; Then data persists',
      }
    case 'boundaries':
      return {
        title: 'Boundaries (optional)',
        body: [
          'List boundaries (one per line) or reply with "skip".',
          'Use to prevent scope creep (e.g., "Do not change database/migrations/*").',
        ],
        example: 'skip',
      }
    case 'taskCount':
      return {
        title: 'Task count',
        body: ['How many tasks? (1-5, in TDD order)'],
        example: '3',
      }
    case 'taskName':
      return {
        title: `Task ${taskIndex} name of ${taskTotal}`,
        body: ['Name the task. Keep TDD order: test -> implement -> edge/coverage.'],
        example: 'Write failing test for login response',
      }
    case 'taskFiles':
      return {
        title: `Task ${taskIndex} files (optional)`,
        body: ['List file paths (comma-separated) or reply with "skip".'],
        example: 'src/auth/login.ts, tests/auth/login.test.ts',
      }
    case 'taskAction':
      return {
        title: `Task ${taskIndex} action`,
        body: ['Describe the implementation work to do.'],
        example: 'Implement login handler with JWT response and error handling',
      }
    case 'taskVerify':
      return {
        title: `Task ${taskIndex} verify`,
        body: ['How will you verify completion? Provide the command or check.'],
        example: 'npm test -- tests/auth/login.test.ts',
      }
    case 'taskDone':
      return {
        title: `Task ${taskIndex} done criteria`,
        body: ['What does done look like? Tie it to acceptance criteria.'],
        example: 'AC-1 satisfied and tests pass',
      }
    default:
      return {
        title: 'Plan wizard',
        body: ['Continue the wizard by providing the next input.'],
      }
  }
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
