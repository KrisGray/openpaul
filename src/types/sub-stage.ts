import { z } from 'zod'
import type { LoopPhase } from './loop'

/**
 * Sub-stage - Three stages per OpenPAUL loop phase
 * 
 * PLAN phases: plan-research, plan-blueprint, plan-critique
 * APPLY phases: apply-slicing, apply-codegen, apply-debug
 * UNIFY phases: unify-diff-analysis, unify-verification, unify-documentation
 */
export type SubStage = 
  // PLAN sub-stages
  | 'plan-research'
  | 'plan-blueprint'
  | 'plan-critique'
  // APPLY sub-stages
  | 'apply-slicing'
  | 'apply-codegen'
  | 'apply-debug'
  // UNIFY sub-stages
  | 'unify-diff-analysis'
  | 'unify-verification'
  | 'unify-documentation'

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
])

/**
 * Helper: Sub-stages grouped by parent phase
 */
export const SUB_STAGES_BY_PHASE = {
  PLAN: ['plan-research', 'plan-blueprint', 'plan-critique'] as const,
  APPLY: ['apply-slicing', 'apply-codegen', 'apply-debug'] as const,
  UNIFY: ['unify-diff-analysis', 'unify-verification', 'unify-documentation'] as const,
} as const

/**
 * Helper: Get parent phase from sub-stage
 * 
 * Extracts the phase prefix and returns the corresponding LoopPhase.
 * 
 * @param subStage - The sub-stage to get the parent phase for
 * @returns The parent LoopPhase (PLAN, APPLY, or UNIFY)
 */
export function getParentPhase(subStage: SubStage): LoopPhase {
  const prefix = subStage.split('-')[0].toUpperCase() as LoopPhase
  return prefix
}
