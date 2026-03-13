import { z } from 'zod'

/**
 * Loop Phase - The three stages of the OpenPAUL loop
 * 
 * PLAN: Create executable plan with tasks and acceptance criteria
 * APPLY: Execute the approved plan sequentially
 * UNIFY: Close the loop with reconciliation and state updates
 */
export type LoopPhase = 'PLAN' | 'APPLY' | 'UNIFY'

/**
 * Zod schema for LoopPhase validation
 */
export const LoopPhaseSchema = z.enum(['PLAN', 'APPLY', 'UNIFY'])

/**
 * Valid state transitions for the loop
 * Enforces: PLAN → APPLY → UNIFY → PLAN
 */
export const VALID_TRANSITIONS: Record<LoopPhase, LoopPhase[]> = {
  PLAN: ['APPLY'],
  APPLY: ['UNIFY'],
  UNIFY: ['PLAN'],
}

/**
 * Check if a transition from one phase to another is valid
 */
export function isValidTransition(from: LoopPhase, to: LoopPhase): boolean {
  const allowed = VALID_TRANSITIONS[from]
  return allowed?.includes(to) ?? false
}
