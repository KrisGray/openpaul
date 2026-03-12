import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { FileManager } from '../storage/file-manager';
import { StateManager } from '../state/state-manager';
import { LoopEnforcer } from '../state/loop-enforcer';
import { formatHeader, formatBold, formatComparisonItems, formatCriteriaResults, } from '../output/formatter';
import { progressBar } from '../output/progress-bar';
const toolFactory = tool;
export const openpaulUnify = toolFactory({
    name: 'openpaul:unify',
    description: 'Close the loop with reconciliation and summary generation',
    parameters: z.object({
        phase: z.number().int().positive().optional().describe('Phase number (defaults to current)'),
        plan: z.string().optional().describe('Plan identifier (defaults to current plan)'),
        notes: z.string().optional().describe('Additional notes for summary'),
        status: z.enum(['success', 'partial', 'failed']).optional().describe('Override status (defaults to success)'),
        actuals: z
            .array(z.union([
            z.string(),
            z.object({
                name: z.string().min(1),
                status: z.enum(['completed', 'skipped', 'failed']).optional(),
                notes: z.string().optional(),
            }),
        ]))
            .optional()
            .describe('Actual tasks executed (string names or {name,status,notes})'),
        criteriaResults: z
            .array(z.union([
            z.string(),
            z.object({
                criteria: z.string().min(1),
                status: z.enum(['pass', 'fail']).optional(),
                notes: z.string().optional(),
            }),
        ]))
            .optional()
            .describe('Criteria results (string criteria or {criteria,status,notes})'),
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
                return `${formatHeader(1, '❌ Not Initialized')}

${formatBold('Error:')} Run /openpaul:init first to initialize PAUL.`;
            }
            // Determine phase and plan
            const phaseNumber = Number(args.phase ?? currentPosition.phaseNumber);
            let planId = args.plan || '';
            // If no plan specified, try to get current plan from state
            if (!planId) {
                const phaseState = stateManager.loadPhaseState(phaseNumber);
                if (!phaseState || !phaseState.currentPlanId) {
                    return [
                        formatHeader(1, '❌ No Plan Found'),
                        '',
                        `${formatBold('Error:')} No current plan found.`,
                        'Run /openpaul:plan first to create a plan.',
                    ].join('\n');
                }
                planId = phaseState.currentPlanId;
            }
            // Check if currently in APPLY phase
            const currentPhase = currentPosition.phase;
            if (currentPhase !== 'APPLY') {
                return [
                    formatHeader(1, '❌ Invalid State'),
                    '',
                    `${formatBold('Error:')} Must be in APPLY phase to run /openpaul:unify.`,
                    `Current phase: ${currentPhase}`,
                    '',
                    `${formatBold('Next action:')} ${loopEnforcer.getRequiredNextAction(currentPhase)}`,
                ].join('\n');
            }
            // Load plan
            const plan = fileManager.readPlan(phaseNumber, planId);
            if (!plan) {
                return [
                    formatHeader(1, '❌ No Plan Found'),
                    '',
                    `${formatBold('Error:')} No plan found for phase ${phaseNumber}, plan ${planId}.`,
                    'Run /openpaul:plan first to create a plan.',
                ].join('\n');
            }
            // Enforce loop transition
            try {
                loopEnforcer.enforceTransition('APPLY', 'UNIFY');
            }
            catch (error) {
                return [
                    formatHeader(1, '❌ Invalid State Transition'),
                    '',
                    `${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
                ].join('\n');
            }
            const parsedActuals = parseActuals(args.actuals);
            if (parsedActuals.error) {
                return formatArgumentError('actuals', parsedActuals.error);
            }
            const parsedCriteriaResults = parseCriteriaResults(args.criteriaResults);
            if (parsedCriteriaResults.error) {
                return formatArgumentError('criteriaResults', parsedCriteriaResults.error);
            }
            const hasActuals = parsedActuals.items.length > 0;
            // Build summary
            const tasks = hasActuals
                ? buildSummaryTasks(plan, parsedActuals.items)
                : plan.tasks.map(task => ({
                    name: task.name,
                    status: 'completed',
                    notes: undefined,
                }));
            const summaryStatus = args.status || deriveSummaryStatus(tasks, hasActuals);
            const completedTasks = tasks.filter(task => task.status === 'completed').length;
            const summary = {
                phaseNumber,
                planId,
                completed: completedTasks,
                total: plan.tasks.length,
                status: summaryStatus,
                tasks,
                createdAt: Date.now(),
            };
            // Ensure phases directory exists
            fileManager.ensurePhasesDir();
            // Save summary
            await fileManager.writeSummary(phaseNumber, planId, summary);
            // Update state to UNIFY
            await stateManager.savePhaseState(phaseNumber, {
                phase: 'UNIFY',
                phaseNumber,
                currentPlanId: planId,
                lastUpdated: Date.now(),
                metadata: { summary },
            });
            // Transition to PLAN for next phase (phase + 1)
            const nextPhaseNumber = phaseNumber + 1;
            await stateManager.savePhaseState(nextPhaseNumber, {
                phase: 'PLAN',
                phaseNumber: nextPhaseNumber,
                lastUpdated: Date.now(),
                metadata: {},
            });
            // Format output
            return formatUnifyOutput(plan, summary, args.notes, parsedActuals.items, parsedCriteriaResults.items);
        }
        catch (error) {
            return [
                formatHeader(1, '❌ Error Closing Loop'),
                '',
                `${formatBold('Error:')} ${error instanceof Error ? error.message : 'Unknown error'}`,
                '',
                formatBold('Next steps:'),
                '- Check that the plan exists and was executed',
                '- Verify your current state with /openpaul:progress',
                '- Try again with valid parameters',
            ].join('\n');
        }
    },
});
/**
 * Format the unify output with summary and completion status
 */
function formatUnifyOutput(plan, summary, notes, actuals, criteriaResults) {
    const planId = `${plan.phase}-${plan.plan}`;
    // Status emoji mapping
    const statusEmoji = {
        success: '✅',
        partial: '⚠️',
        failed: '❌',
    };
    const output = [
        formatHeader(1, `🔗 Loop Closed: ${planId}`),
        '',
        formatHeader(2, 'Summary'),
        '',
        `${formatBold('Status:')} ${statusEmoji[summary.status]} ${summary.status}`,
        `${formatBold('Tasks:')} ${progressBar(summary.completed, summary.total)} completed`,
        `${formatBold('Created:')} ${new Date(summary.createdAt).toISOString()}`,
        '',
    ];
    // Add tasks completed
    if (summary.tasks.length > 0) {
        output.push(formatHeader(3, 'Tasks Completed'));
        output.push('');
        summary.tasks.forEach((task, index) => {
            const taskStatus = task.status === 'completed' ? '✅' :
                task.status === 'skipped' ? '⏭️' : '❌';
            output.push(`${index + 1}. ${taskStatus} ${task.name}`);
            if (task.notes) {
                output.push(`   ${task.notes}`);
            }
        });
        output.push('');
    }
    // Add notes if provided
    if (notes) {
        output.push(formatHeader(3, 'Notes'));
        output.push('');
        output.push(notes);
        output.push('');
    }
    const shouldShowReconciliation = actuals.length > 0 || criteriaResults.length > 0;
    if (shouldShowReconciliation) {
        const reconciliation = buildReconciliation(plan, actuals);
        output.push(formatHeader(2, 'Reconciliation'));
        output.push('');
        if (actuals.length > 0) {
            output.push(formatHeader(3, 'Plan vs Actual'));
            output.push('');
            output.push(`${formatBold('Missing tasks:')}`);
            output.push(formatComparisonItems(reconciliation.missing, 'None'));
            output.push('');
            output.push(`${formatBold('Extra tasks:')}`);
            output.push(formatComparisonItems(reconciliation.extra, 'None'));
            output.push('');
            output.push(`${formatBold('Status overrides:')}`);
            output.push(formatComparisonItems(reconciliation.overrides, 'None'));
            output.push('');
        }
        if (criteriaResults.length > 0) {
            output.push(formatHeader(3, 'Criteria Results'));
            output.push('');
            output.push(formatCriteriaResults(criteriaResults));
            output.push('');
        }
    }
    // Next steps
    output.push(formatHeader(2, 'Next Steps'));
    output.push('');
    output.push('✅ Loop successfully closed with reconciliation');
    output.push(`${formatBold('Ready for:')} Next loop iteration`);
    output.push(`${formatBold('Run:')} /openpaul:plan to start planning the next phase`);
    output.push('');
    output.push(formatBold('🎉 Great work completing this loop!'));
    return output.join('\n');
}
function normalizeTaskName(name) {
    return name.trim().toLowerCase();
}
function parseActuals(actuals) {
    if (!actuals) {
        return { items: [] };
    }
    if (!Array.isArray(actuals)) {
        return { items: [], error: 'Expected an array of actual tasks.' };
    }
    const items = [];
    for (const entry of actuals) {
        if (typeof entry === 'string') {
            const trimmed = entry.trim();
            if (!trimmed) {
                return { items: [], error: 'Actual task names must be non-empty strings.' };
            }
            items.push({ name: trimmed, status: 'completed' });
            continue;
        }
        if (entry && typeof entry === 'object') {
            const name = typeof entry.name === 'string' ? entry.name.trim() : '';
            if (!name) {
                return { items: [], error: 'Actual task objects must include a non-empty name.' };
            }
            const status = entry.status ?? 'completed';
            if (!['completed', 'skipped', 'failed'].includes(status)) {
                return { items: [], error: 'Actual task status must be completed, skipped, or failed.' };
            }
            if (entry.notes && typeof entry.notes !== 'string') {
                return { items: [], error: 'Actual task notes must be a string.' };
            }
            items.push({ name, status, notes: entry.notes });
            continue;
        }
        return { items: [], error: 'Actuals must be strings or objects with name/status.' };
    }
    return { items };
}
function parseCriteriaResults(criteriaResults) {
    if (!criteriaResults) {
        return { items: [] };
    }
    if (!Array.isArray(criteriaResults)) {
        return { items: [], error: 'Expected an array of criteria results.' };
    }
    const items = [];
    for (const entry of criteriaResults) {
        if (typeof entry === 'string') {
            const trimmed = entry.trim();
            if (!trimmed) {
                return { items: [], error: 'Criteria result strings must be non-empty.' };
            }
            items.push({ criteria: trimmed, status: 'pass' });
            continue;
        }
        if (entry && typeof entry === 'object') {
            const criteria = typeof entry.criteria === 'string' ? entry.criteria.trim() : '';
            if (!criteria) {
                return { items: [], error: 'Criteria result objects must include a non-empty criteria.' };
            }
            const status = entry.status ?? 'pass';
            if (!['pass', 'fail'].includes(status)) {
                return { items: [], error: 'Criteria result status must be pass or fail.' };
            }
            if (entry.notes && typeof entry.notes !== 'string') {
                return { items: [], error: 'Criteria result notes must be a string.' };
            }
            items.push({ criteria, status, notes: entry.notes });
            continue;
        }
        return { items: [], error: 'Criteria results must be strings or objects with criteria/status.' };
    }
    return { items };
}
function buildSummaryTasks(plan, actuals) {
    const actualMap = new Map();
    actuals.forEach(actual => {
        actualMap.set(normalizeTaskName(actual.name), actual);
    });
    return plan.tasks.map(task => {
        const actual = actualMap.get(normalizeTaskName(task.name));
        if (!actual) {
            return {
                name: task.name,
                status: 'skipped',
                notes: 'Not reported in actuals',
            };
        }
        return {
            name: task.name,
            status: actual.status,
            notes: actual.notes,
        };
    });
}
function deriveSummaryStatus(tasks, hasActuals) {
    if (!hasActuals) {
        return 'success';
    }
    if (tasks.some(task => task.status === 'failed')) {
        return 'failed';
    }
    if (tasks.some(task => task.status === 'skipped')) {
        return 'partial';
    }
    return 'success';
}
function buildReconciliation(plan, actuals) {
    const planMap = new Map();
    plan.tasks.forEach(task => {
        planMap.set(normalizeTaskName(task.name), task.name);
    });
    const actualMap = new Map();
    actuals.forEach(actual => {
        actualMap.set(normalizeTaskName(actual.name), actual);
    });
    const missing = plan.tasks
        .filter(task => !actualMap.has(normalizeTaskName(task.name)))
        .map(task => task.name);
    const extra = actuals
        .filter(actual => !planMap.has(normalizeTaskName(actual.name)))
        .map(actual => actual.name);
    const overrides = actuals
        .filter(actual => planMap.has(normalizeTaskName(actual.name)))
        .filter(actual => actual.status !== 'completed' || Boolean(actual.notes))
        .map(actual => {
        const notes = actual.notes ? ` — ${actual.notes}` : '';
        return `${actual.name} (${actual.status})${notes}`;
    });
    return { missing, extra, overrides };
}
function formatArgumentError(argumentName, errorMessage) {
    return [
        formatHeader(1, '❌ Invalid Arguments'),
        '',
        `${formatBold('Argument:')} ${argumentName}`,
        `${formatBold('Issue:')} ${errorMessage}`,
    ].join('\n');
}
//# sourceMappingURL=unify.js.map