import { z } from 'zod'
import type { LoopPhase } from './loop'
import { LoopPhaseSchema } from './loop'

/**
 * State - Current position in the OpenPAUL loop
 * 
 * Per-phase state files (state-phase-N.json) track:
 * - Current loop position (PLAN/APPLY/UNIFY)
 * - Current plan being executed
 * - Timestamp of last state change
 * - Phase-specific metadata
 */
export interface State {
  phase: LoopPhase
  phaseNumber: number
  currentPlanId?: string
  lastUpdated: number
  metadata: Record<string, unknown>
}

/**
 * Zod schema for State validation
 */
export const StateSchema = z.object({
  phase: LoopPhaseSchema,
  phaseNumber: z.number().int().positive(),
  currentPlanId: z.string().optional(),
  lastUpdated: z.number(),
  metadata: z.record(z.string(), z.unknown()),
})

/**
 * Plan Reference - Lightweight reference to a plan in a phase
 */
export interface PlanReference {
  id: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  created: number
}

export const PlanReferenceSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
  created: z.number(),
})

/**
 * Phase State - State specific to a phase (stored in state-phase-N.json)
 */
export interface PhaseState extends State {
  phaseNumber: number
  plans: PlanReference[]
  completedPlans: string[]
}

export const PhaseStateSchema = StateSchema.extend({
  plans: z.array(PlanReferenceSchema),
  completedPlans: z.array(z.string()),
})
