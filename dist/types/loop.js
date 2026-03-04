import { z } from 'zod';
/**
 * Zod schema for LoopPhase validation
 */
export const LoopPhaseSchema = z.enum(['PLAN', 'APPLY', 'UNIFY']);
/**
 * Valid state transitions for the loop
 * Enforces: PLAN → APPLY → UNIFY → PLAN
 */
export const VALID_TRANSITIONS = {
    PLAN: ['APPLY'],
    APPLY: ['UNIFY'],
    UNIFY: ['PLAN'],
};
/**
 * Check if a transition from one phase to another is valid
 */
export function isValidTransition(from, to) {
    const allowed = VALID_TRANSITIONS[from];
    return allowed?.includes(to) ?? false;
}
//# sourceMappingURL=loop.js.map