import { z } from 'zod';
/**
 * Zod schema for SubStage validation
 */
export const SubStageSchema = z.enum([
    'plan-research',
    'plan-blueprint',
    'plan-critique',
    'apply-slicing',
    'apply-codegen',
    'apply-debug',
    'unify-diff-analysis',
    'unify-verification',
    'unify-documentation',
]);
/**
 * Helper: Sub-stages grouped by parent phase
 */
export const SUB_STAGES_BY_PHASE = {
    PLAN: ['plan-research', 'plan-blueprint', 'plan-critique'],
    APPLY: ['apply-slicing', 'apply-codegen', 'apply-debug'],
    UNIFY: ['unify-diff-analysis', 'unify-verification', 'unify-documentation'],
};
/**
 * Helper: Get parent phase from sub-stage
 *
 * Extracts the phase prefix and returns the corresponding LoopPhase.
 *
 * @param subStage - The sub-stage to get the parent phase for
 * @returns The parent LoopPhase (PLAN, APPLY, or UNIFY)
 */
export function getParentPhase(subStage) {
    const prefix = subStage.split('-')[0].toUpperCase();
    return prefix;
}
//# sourceMappingURL=sub-stage.js.map