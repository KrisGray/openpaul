import { z } from 'zod';
/**
 * Loop Phase - The three stages of the PAUL loop
 *
 * PLAN: Create executable plan with tasks and acceptance criteria
 * APPLY: Execute the approved plan sequentially
 * UNIFY: Close the loop with reconciliation and state updates
 */
export type LoopPhase = 'PLAN' | 'APPLY' | 'UNIFY';
/**
 * Zod schema for LoopPhase validation
 */
export declare const LoopPhaseSchema: z.ZodEnum<["PLAN", "APPLY", "UNIFY"]>;
/**
 * Valid state transitions for the loop
 * Enforces: PLAN → APPLY → UNIFY → PLAN
 */
export declare const VALID_TRANSITIONS: Record<LoopPhase, LoopPhase[]>;
/**
 * Check if a transition from one phase to another is valid
 */
export declare function isValidTransition(from: LoopPhase, to: LoopPhase): boolean;
//# sourceMappingURL=loop.d.ts.map