import type { State } from '../types/state';
/**
 * File Manager
 *
 * Manages PAUL state files with per-phase organization.
 * Files are named: state-phase-{N}.json
 */
export declare class FileManager {
    private paulDir;
    constructor(projectRoot: string);
    /**
     * Get phase state file path
     *
     * Pattern: .paul/state-phase-{N}.json
     */
    private getPhaseStatePath;
    /**
     * Read JSON file with validation
     */
    private readJSON;
    /**
     * Write JSON file with atomic writes
     */
    private writeJSON;
    /**
     * Read phase state
     */
    readPhaseState(phaseNumber: number): State | null;
    /**
     * Write phase state with atomic writes
     */
    writePhaseState(phaseNumber: number, state: State): Promise<void>;
    /**
     * Check if phase state exists
     */
    phaseStateExists(phaseNumber: number): boolean;
    /**
     * Ensure .paul directory exists
     */
    ensurePaulDir(): void;
}
//# sourceMappingURL=file-manager.d.ts.map