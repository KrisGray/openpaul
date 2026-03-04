import type { LoopPhase } from '../types';
/**
 * Loop Enforcer
 *
 * Enforces strict loop transitions: PLAN → APPLY → UNIFY → PLAN
 *
 * From CONTEXT.md:
 * - Strict enforcement - block invalid transitions
 * - Force PLAN as entry point
 * - Informative errors with guidance
 * - Require UNIFY to close loop
 */
export declare class LoopEnforcer {
    /**
     * Check if a transition is valid
     */
    canTransition(from: LoopPhase, to: LoopPhase): boolean;
    /**
     * Enforce a transition - throws error if invalid
     */
    enforceTransition(from: LoopPhase, to: LoopPhase): void;
    /**
     * Get required next action for a state
     */
    getRequiredNextAction(current: LoopPhase): string;
    /**
     * Validate that we can start a new loop
     *
     * From CONTEXT.md: Force PLAN as entry point, users must always start with PLAN
     */
    canStartNewLoop(currentPhase: LoopPhase): boolean;
    /**
     * Enforce that we can start a new loop - throws error if not
     */
    enforceCanStartNewLoop(currentPhase: LoopPhase | undefined): void;
}
//# sourceMappingURL=loop-enforcer.d.ts.map