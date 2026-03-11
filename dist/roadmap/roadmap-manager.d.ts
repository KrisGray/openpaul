import type { PhaseEntry, AddPhaseOptions, RemovePhaseResult, RoadmapValidationResult } from '../types/roadmap';
/**
 * RoadmapManager
 *
 * Manages ROADMAP.md phase manipulation operations.
 * Provides core logic for adding and removing phases with proper
 * validation and file system operations.
 */
export declare class RoadmapManager {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Resolve the path to ROADMAP.md file
     * Checks both .paul/ROADMAP.md and .openpaul/ROADMAP.md locations.
     *
     * @returns Full path to ROADMAP.md or null if not found
     */
    resolveRoadmapPath(): string | null;
    /**
     * Get the planning directory path (.paul or .openpaul)
     */
    private getPlanningDir;
    /**
     * Parse ROADMAP.md and extract phase entries
     *
     * Matches both section headers "### Phase N:" and table patterns "| N. | name |"
     * @returns Array of PhaseEntry objects
     */
    parsePhases(): PhaseEntry[];
    /**
     * Generate a slugified directory name from a phase name and number
     *
     * @param name - Phase name to format
     * @param number - Phase number for ordering
     * @returns Directory name like "05-search-feature"
     */
    generateDirectoryName(name: string, number: number): string;
    /**
     * Add a new phase to ROADMAP.md
     *
     * @param options Position options for adding the new phase
     * @returns The new PhaseEntry that was created
     */
    addPhase(options: AddPhaseOptions): PhaseEntry;
    /**
     * Read the current phase number from STATE.md
     */
    private readCurrentPhaseFromState;
    /**
     * Validate if a phase can be removed
     *
     * @param phaseNumber The phase number to remove
     * @param statePath Path to STATE.md file
     * @returns Validation result
     */
    canRemovePhase(phaseNumber: number, statePath: string): RoadmapValidationResult;
    /**
     * Remove a phase from ROADMAP.md
     *
     * @param phaseNumber The phase number to remove
     * @returns Result of the removal operation
     */
    removePhase(phaseNumber: number): RemovePhaseResult;
}
//# sourceMappingURL=roadmap-manager.d.ts.map