import { FileManager } from '../storage/file-manager';
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
export class StateManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.fileManager = new FileManager(projectRoot);
    }
    /**
     * Load phase state
     *
     * Returns null if phase state does not exist or is invalid.
     */
    loadPhaseState(phaseNumber) {
        return this.fileManager.readPhaseState(phaseNumber);
    }
    /**
     * Save phase state
     *
     * Validates with Zod schema before saving.
     * Uses atomic writes for zero data loss.
     */
    async savePhaseState(phaseNumber, state) {
        await this.fileManager.writePhaseState(phaseNumber, state);
    }
    /**
     * Get current loop position
     *
     * Derives current position from existing state files.
     * Returns undefined if no phase states exist.
     */
    getCurrentPosition() {
        // Find all phase state files
        const fs = require('fs');
        const path = require('path');
        const paulDir = path.join(this.projectRoot, '.paul');
        if (!fs.existsSync(paulDir)) {
            return undefined;
        }
        // Get all state-phase-N.json files
        const files = fs.readdirSync(paulDir)
            .filter((f) => f.match(/state-phase-\d+\.json/))
            .sort();
        if (files.length === 0) {
            return undefined;
        }
        // Load the latest phase state
        const latestFile = files[files.length - 1];
        // Files are filtered by the same regex pattern above, so match is guaranteed
        const match = latestFile.match(/state-phase-(\d+)\.json/);
        const phaseNumber = parseInt(match[1], 10);
        const state = this.loadPhaseState(phaseNumber);
        if (!state) {
            return undefined;
        }
        return { phaseNumber, phase: state.phase };
    }
    /**
     * Get required next action based on current state
     */
    getRequiredNextAction(currentPhase) {
        const actions = {
            PLAN: 'Run /paul:apply to execute the plan',
            APPLY: 'Run /paul:unify to close the loop',
            UNIFY: 'Run /paul:plan to start a new loop',
        };
        return actions[currentPhase];
    }
}
//# sourceMappingURL=state-manager.js.map