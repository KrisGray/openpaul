import { RoadmapManager } from '../roadmap/roadmap-manager';
import type { Milestone, MilestoneProgress, MilestoneArchiveEntry, PhaseModificationResult } from '../types/milestone';
/**
 * MilestoneManager
 *
 * Manages milestone lifecycle operations:
 * - Create milestones with name, scope, and phases
 * - Track milestone progress by phases completed
 * - Mark milestones complete and archive them
 * - Validate milestone scope modifications
 *
 * Integration points:
 * - ROADMAP.md: Stores milestone definitions and progress
 * - MILESTONE-ARCHIVE.md: Archives completed milestones
 * - STATE.md: Tracks current milestone position
 */
export declare class MilestoneManager {
    private projectRoot;
    private roadmapManager;
    constructor(projectRoot: string, roadmapManager: RoadmapManager);
    /**
     * Resolve the path to MILESTONE-ARCHIVE.md file
     * Checks both .paul/ and .openpaul/ locations.
     *
     * @returns Full path to MILESTONE-ARCHIVE.md or null if planning dir not found
     */
    resolveMilestoneArchivePath(): string | null;
    /**
     * Get the planning directory path (.paul or .openpaul)
     */
    private getPlanningDir;
    /**
     * Get the path to ROADMAP.md
     */
    private getRoadmapPath;
    /**
     * Create a new milestone
     *
     * Adds milestone section to ROADMAP.md with header + bullet list format.
     *
     * @param name - Milestone identifier (e.g., "v1.1 Full Command Implementation")
     * @param scope - Description of what the milestone delivers
     * @param phases - Array of phase numbers included in milestone
     * @param theme - Optional theme/slogan for the milestone
     * @returns The created Milestone object
     */
    createMilestone(name: string, scope: string, phases: number[], theme?: string): Milestone;
    /**
     * Format phase range for display (e.g., "3-9" or "5")
     */
    private formatPhaseRange;
    /**
     * Format milestone detail section for ROADMAP.md
     */
    private formatMilestoneDetailSection;
    /**
     * Format scope items as bullet list
     */
    private formatScopeItems;
    /**
     * Get a milestone by name
     *
     * Parses milestone from ROADMAP.md section.
     *
     * @param name - Milestone name to find
     * @returns Milestone object or null if not found
     */
    getMilestone(name: string): Milestone | null;
    /**
     * Escape special regex characters in a string
     */
    private escapeRegex;
    /**
     * Parse milestone from ROADMAP.md content
     */
    private parseMilestoneFromContent;
    /**
     * Get the active (first non-completed) milestone
     *
     * @returns Active Milestone or null if all completed or no milestones
     */
    getActiveMilestone(): Milestone | null;
    /**
     * Get milestone progress by phases completed
     *
     * Primary metric: phases completed / total phases
     *
     * @param name - Milestone name
     * @returns MilestoneProgress with detailed breakdown
     */
    getMilestoneProgress(name: string): MilestoneProgress | null;
    /**
     * Mark a milestone as complete and archive it
     *
     * - Archives milestone to MILESTONE-ARCHIVE.md
     * - Includes summary + metrics
     * - Collapses milestone phases to <details> section in ROADMAP.md
     *
     * @param name - Milestone name to complete
     * @returns MilestoneArchiveEntry with completion details
     */
    completeMilestone(name: string): MilestoneArchiveEntry;
    /**
     * Calculate total plans completed from phases
     */
    private calculatePlansCompleted;
    /**
     * Calculate total plans from phases
     */
    private calculateTotalPlans;
    /**
     * Calculate execution time between start and end
     */
    private calculateExecutionTime;
    /**
     * Extract requirements addressed from phases
     */
    private extractRequirements;
    /**
     * Archive milestone to MILESTONE-ARCHIVE.md
     */
    private archiveMilestone;
    /**
     * Collapse milestone in ROADMAP.md
     */
    private collapseMilestoneInRoadmap;
    /**
     * Create collapsed <details> section for completed milestone
     */
    private createCollapsedSection;
    /**
     * Get plan count for a phase from ROADMAP.md
     */
    private getPlanCountForPhase;
    /**
     * Check if a phase can be modified
     *
     * Validates scope modifications during active milestones.
     * Returns warning if phase is part of active milestone.
     *
     * @param phaseNumber - Phase number to check
     * @returns PhaseModificationResult with allowed status and optional warning
     */
    canModifyPhase(phaseNumber: number): PhaseModificationResult;
}
//# sourceMappingURL=milestone-manager.d.ts.map