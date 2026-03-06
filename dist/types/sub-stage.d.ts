import { z } from 'zod';
import type { LoopPhase } from './loop';
/**
 * Sub-stage - Three stages per PAUL loop phase
 *
 * PLAN phases: plan-research, plan-blueprint, plan-critique
 * APPLY phases: apply-slicing, apply-codegen, apply-debug
 * UNIFY phases: unify-diff-analysis, unify-verification, unify-documentation
 */
export type SubStage = 'plan-research' | 'plan-blueprint' | 'plan-critique' | 'apply-slicing' | 'apply-codegen' | 'apply-debug' | 'unify-diff-analysis' | 'unify-verification' | 'unify-documentation';
/**
 * Zod schema for SubStage validation
 */
export declare const SubStageSchema: z.ZodEnum<["plan-research", "plan-blueprint", "plan-critique", "apply-slicing", "apply-codegen", "apply-debug", "unify-diff-analysis", "unify-verification", "unify-documentation"]>;
/**
 * Helper: Sub-stages grouped by parent phase
 */
export declare const SUB_STAGES_BY_PHASE: {
    readonly PLAN: readonly ["plan-research", "plan-blueprint", "plan-critique"];
    readonly APPLY: readonly ["apply-slicing", "apply-codegen", "apply-debug"];
    readonly UNIFY: readonly ["unify-diff-analysis", "unify-verification", "unify-documentation"];
};
/**
 * Helper: Get parent phase from sub-stage
 *
 * Extracts the phase prefix and returns the corresponding LoopPhase.
 *
 * @param subStage - The sub-stage to get the parent phase for
 * @returns The parent LoopPhase (PLAN, APPLY, or UNIFY)
 */
export declare function getParentPhase(subStage: SubStage): LoopPhase;
//# sourceMappingURL=sub-stage.d.ts.map