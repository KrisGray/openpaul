import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { FileManager } from '../storage/file-manager';
import { StateManager } from '../state/state-manager';
import { LoopEnforcer } from '../state/loop-enforcer';
import { formatGuidedError } from '../output/error-formatter';
import { formatHeader, formatBold, formatList, formatExecutionGraph } from '../output/formatter';
const toolFactory = tool;
export const paulPlan = toolFactory({
    name: 'paul:plan',
    description: 'Create an executable plan with tasks, criteria, and boundaries',
    parameters: z.object({
        phase: z.number().int().positive().describe('Phase number'),
        plan: z.string().describe('Plan identifier (e.g., "01", "02")'),
        criteria: z.union([z.string(), z.array(z.string())]).optional().describe('Acceptance criteria for the plan'),
        boundaries: z.union([z.string(), z.array(z.string())]).optional().describe('Boundaries and exclusions for the plan'),
        requirements: z.array(z.string()).optional().describe('Requirement IDs satisfied by this plan'),
        mustHaves: z.object({
            truths: z.array(z.string()).optional(),
            artifacts: z.array(z.object({
                path: z.string(),
                provides: z.string(),
                must_contain: z.array(z.string()).optional(),
                min_lines: z.number().int().positive().optional(),
            })).optional(),
            key_links: z.array(z.object({
                from: z.string(),
                to: z.string(),
                via: z.string(),
                pattern: z.string(),
            })).optional(),
        }).optional().describe('Must-have validation criteria for goal-backward verification'),
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
            const fileManager = new FileManager(context.directory);
            const stateManager = new StateManager(context.directory);
            const loopEnforcer = new LoopEnforcer();
            // Get current position
            const currentPosition = stateManager.getCurrentPosition();
            // Check if initialized
            if (!currentPosition) {
                return formatGuidedError({
                    title: 'Not Initialized',
                    message: 'PAUL has not been initialized for this project.',
                    context: `Project directory: ${context.directory}`,
                    suggestedFix: 'Run /paul:init to create the .paul/ directory and initial state.',
                    nextSteps: [
                        'Run /paul:init',
                        'Re-run /paul:plan once initialization completes',
                    ],
                });
            }
            // Enforce that we can start a new loop
            try {
                loopEnforcer.enforceCanStartNewLoop(currentPosition.phase);
            }
            catch (error) {
                return formatGuidedError({
                    title: 'Cannot Create Plan',
                    message: error instanceof Error ? error.message : 'Unknown error preventing plan creation.',
                    context: `Current loop phase: ${currentPosition.phase}`,
                    suggestedFix: 'Complete the current loop phase before starting a new plan.',
                    nextSteps: [
                        `Run ${loopEnforcer.getRequiredNextAction(currentPosition.phase)}`,
                        'Re-run /paul:plan after the loop is ready for planning',
                    ],
                });
            }
            // Check if plan already exists
            const planId = args.plan.padStart(2, '0');
            if (fileManager.planExists(args.phase, planId)) {
                return formatGuidedError({
                    title: 'Plan Already Exists',
                    message: `Plan ${args.phase}-${planId} already exists.`,
                    context: 'Plan files are stored in .paul/phases/',
                    suggestedFix: 'Use a different plan ID or remove the existing plan file.',
                    nextSteps: [
                        'Choose a new plan ID (e.g., 02, 03)',
                        'Or delete the existing plan file from .paul/phases/',
                    ],
                });
            }
            // Build tasks array
            const tasks = args.tasks.map((task) => ({
                type: 'auto',
                name: task.name,
                files: task.files,
                action: task.action,
                verify: task.verify,
                done: task.done,
            }));
            const criteria = normalizeStringList(args.criteria);
            const boundaries = normalizeStringList(args.boundaries);
            const requirements = args.requirements ?? [];
            const mustHaves = {
                truths: args.mustHaves?.truths ?? [],
                artifacts: args.mustHaves?.artifacts ?? [],
                key_links: args.mustHaves?.key_links ?? [],
            };
            // Flatten all task files
            const filesModified = tasks
                .filter((t) => t.files)
                .flatMap((t) => t.files);
            // Build Plan object
            const taskDependencies = buildTaskDependencies(tasks);
            const executionGraph = buildExecutionGraph(taskDependencies, tasks.length);
            const planObject = {
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
            };
            // Ensure phases directory exists
            fileManager.ensurePhasesDir();
            const planPath = join(context.directory, '.paul', 'phases', `${args.phase}-${planId}-PLAN.json`);
            let planWritten = false;
            try {
                await retryWithBackoff(() => fileManager.writePlan(args.phase, planId, planObject));
                planWritten = true;
                await retryWithBackoff(() => stateManager.savePhaseState(args.phase, {
                    phase: 'PLAN',
                    phaseNumber: args.phase,
                    currentPlanId: planId,
                    lastUpdated: Date.now(),
                    metadata: {},
                }));
            }
            catch (error) {
                if (planWritten) {
                    await rollbackPlanFile(planPath);
                }
                const errorMessage = error instanceof Error ? error.message : 'Unknown filesystem error';
                return formatGuidedError({
                    title: 'Plan Write Failed',
                    message: errorMessage,
                    context: `Plan path: ${planPath}`,
                    suggestedFix: 'Check file permissions and ensure the .paul/ directory is writable.',
                    nextSteps: [
                        'Verify .paul/ directory permissions',
                        'Retry /paul:plan after resolving filesystem issues',
                    ],
                });
            }
            // Format output
            const planIdLabel = `${args.phase}-${planId}`;
            const structureLabel = getStructureLabel(tasks.length);
            const output = [
                formatHeader(1, `📋 Plan: ${planIdLabel}`),
                '',
                formatBold('Type:') + ' execute | ' +
                    formatBold('Wave:') + ' 1 | ' +
                    formatBold('Tasks:') + ` ${tasks.length}`,
                formatBold('Structure:') + ` ${structureLabel}`,
                '',
            ];
            if (criteria.length > 0) {
                output.push(formatHeader(2, 'Criteria'));
                output.push('');
                output.push(formatList(criteria));
                output.push('');
            }
            if (boundaries.length > 0) {
                output.push(formatHeader(2, 'Boundaries'));
                output.push('');
                output.push(formatList(boundaries));
                output.push('');
            }
            output.push(formatHeader(2, 'Execution Graph'));
            output.push('');
            output.push(formatExecutionGraph(executionGraph));
            output.push('');
            if (args.verbose) {
                // Verbose view: full task details
                output.push(formatHeader(2, 'Tasks'));
                tasks.forEach((task, index) => {
                    output.push('');
                    output.push(formatBold(`${index + 1}. ${task.name}`));
                    if (task.files && task.files.length > 0) {
                        output.push(`   Files: ${task.files.join(', ')}`);
                    }
                    output.push(`   Action: ${task.action}`);
                    output.push(`   Verify: ${task.verify}`);
                    output.push(`   Done: ${task.done}`);
                });
            }
            else {
                // Default view: numbered task list
                output.push(formatHeader(2, 'Tasks'));
                output.push('');
                const taskList = tasks.map((task, index) => formatTaskSummary(task, index, tasks.length));
                output.push(formatList(taskList, true));
                if (structureLabel === 'complex') {
                    output.push('');
                    output.push(`${formatBold('Note:')} Use /paul:plan --verbose for full task details.`);
                }
            }
            output.push('');
            output.push(formatBold('Status:') + ' ✅ Plan created successfully');
            output.push(formatBold('Location:') + ` .paul/phases/${planIdLabel}-PLAN.json`);
            output.push('');
            output.push(formatBold('Next action:') + ' Run /paul:apply to execute the plan');
            return output.join('\n');
        }
        catch (error) {
            return formatGuidedError({
                title: 'Error Creating Plan',
                message: error instanceof Error ? error.message : 'Unknown error creating the plan.',
                context: 'An unexpected error occurred while building the plan output.',
                suggestedFix: 'Review your inputs and retry the command.',
                nextSteps: [
                    'Verify plan parameters (phase, plan ID, tasks)',
                    'Run /paul:plan again after correcting inputs',
                ],
            });
        }
    },
});
function normalizeStringList(input) {
    if (!input)
        return [];
    if (Array.isArray(input)) {
        return input.map(item => item.trim()).filter(Boolean);
    }
    const trimmed = input.trim();
    return trimmed ? [trimmed] : [];
}
function buildTaskDependencies(tasks) {
    const dependencies = {};
    tasks.forEach((task, index) => {
        const taskFiles = new Set(task.files ?? []);
        const deps = [];
        if (taskFiles.size > 0) {
            for (let i = 0; i < index; i += 1) {
                const priorFiles = tasks[i].files ?? [];
                if (priorFiles.some(file => taskFiles.has(file))) {
                    deps.push(i + 1);
                }
            }
        }
        dependencies[String(index + 1)] = deps;
    });
    return dependencies;
}
function buildExecutionGraph(taskDependencies, taskCount) {
    const remaining = new Set();
    const resolved = new Set();
    const graph = [];
    for (let i = 1; i <= taskCount; i += 1) {
        remaining.add(i);
    }
    while (remaining.size > 0) {
        const wave = [];
        const remainingSorted = Array.from(remaining).sort((a, b) => a - b);
        remainingSorted.forEach((taskNumber) => {
            const deps = taskDependencies[String(taskNumber)] ?? [];
            if (deps.every(dep => resolved.has(dep))) {
                wave.push(taskNumber);
            }
        });
        if (wave.length === 0) {
            graph.push(remainingSorted);
            break;
        }
        wave.forEach((taskNumber) => {
            remaining.delete(taskNumber);
            resolved.add(taskNumber);
        });
        graph.push(wave);
    }
    return graph;
}
function getStructureLabel(taskCount) {
    if (taskCount <= 3)
        return 'simple';
    if (taskCount <= 10)
        return 'medium';
    return 'complex';
}
function formatTaskSummary(task, index, total) {
    const label = task.name;
    if (total <= 3) {
        return `${label}: ${task.done}`;
    }
    if (total <= 10) {
        return `${label}: ${truncateText(task.done, 80)}`;
    }
    return label;
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return `${text.slice(0, maxLength - 1)}…`;
}
const TRANSIENT_ERROR_CODES = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'EIO', 'ETIMEDOUT']);
function isTransientFsError(error) {
    if (!error || typeof error !== 'object')
        return false;
    const code = error.code;
    return typeof code === 'string' && TRANSIENT_ERROR_CODES.has(code);
}
async function retryWithBackoff(operation, retries = 3, baseDelayMs = 100) {
    let attempt = 0;
    while (attempt <= retries) {
        try {
            return await operation();
        }
        catch (error) {
            if (!isTransientFsError(error) || attempt === retries) {
                throw error;
            }
            const delayMs = baseDelayMs * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            attempt += 1;
        }
    }
    throw new Error('Retry limit exceeded while writing plan');
}
async function rollbackPlanFile(planPath) {
    if (!existsSync(planPath))
        return;
    try {
        await unlink(planPath);
    }
    catch {
        // Ignore rollback errors to avoid masking the original failure
    }
}
//# sourceMappingURL=plan.js.map