import type { State } from '../types';
import type { LoopPhase } from '../types';
/**
 * State Manager
 *
 * Manages PAUL state with per-phase organization.
 * Implements the decisions from CONTEXT.md:
 * - Per-phase state files (state-phase-N.json)
 * - Plans inline in phase state
 * - Phase-prefixed naming
 * - Derive current position from existing state files
 */
export declare class StateManager {
    private fileManager;
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Load phase state
     *
     * Returns null if phase state does not exist or is invalid.
     */
    loadPhaseState(phaseNumber: number): State | null;
    /**
     * Save phase state
     *
     * Validates with Zod schema before saving.
     * Uses atomic writes for zero data loss.
     */
    savePhaseState(phaseNumber: number, state: State): Promise<void>;
    /**
     * Get current loop position
     *
     * Derives current position from existing state files.
     * Returns undefined if no phase states exist.
     */
    getCurrentPosition(): {
        phaseNumber: number;
        phase: LoopPhase;
    } | undefined;
    /**
     * Get required next action based on current state
     */
    getRequiredNextAction(currentPhase: LoopPhase): string;
}
//# sourceMappingURL=state-manager.d.ts.map