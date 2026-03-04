import type { LoopPhase } from '../types'
import { VALID_TRANSITIONS, isValidTransition } from '../types'

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
export class LoopEnforcer {
  /**
   * Check if a transition is valid
   */
  canTransition(from: LoopPhase, to: LoopPhase): boolean {
    return isValidTransition(from, to)
  }
  
  /**
   * Enforce a transition - throws error if invalid
   */
  enforceTransition(from: LoopPhase, to: LoopPhase): void {
    if (!this.canTransition(from, to)) {
      const allowed = VALID_TRANSITIONS[from]
      const allowedStr = allowed?.join(', ') || 'none'
      
      throw new Error(
        `Invalid transition: ${from} → ${to}.\n` +
        `Current state: ${from}.\n` +
        `Valid next states: ${allowedStr}.\n` +
        `Next action: ${this.getRequiredNextAction(from)}`
      )
    }
  }
  
  /**
   * Get required next action for a state
   */
  getRequiredNextAction(current: LoopPhase): string {
    const actions: Record<LoopPhase, string> = {
      PLAN: 'Run /paul:apply to execute the plan',
      APPLY: 'Run /paul:unify to close the loop',
      UNIFY: 'Run /paul:plan to start a new loop',
    }
    return actions[current]
  }
  
  /**
   * Validate that we can start a new loop
   * 
   * From CONTEXT.md: Force PLAN as entry point, users must always start with PLAN
   */
  canStartNewLoop(currentPhase: LoopPhase): boolean {
    return currentPhase === 'UNIFY' || currentPhase === undefined
  }
  
  /**
   * Enforce that we can start a new loop - throws error if not
   */
  enforceCanStartNewLoop(currentPhase: LoopPhase | undefined): void {
    if (!this.canStartNewLoop(currentPhase as LoopPhase)) {
      throw new Error(
        `Cannot start a new loop from ${currentPhase || 'initial state'}.\n` +
        `You must complete the current loop first.\n` +
        `Current state: ${currentPhase || 'no state'}.\n` +
        `Next action: ${currentPhase ? this.getRequiredNextAction(currentPhase) : 'Run /paul:plan to initialize PAUL'}`
      )
    }
  }
}
