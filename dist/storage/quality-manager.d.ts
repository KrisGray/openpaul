import type { UAT, UATIssues, UATItem, UATSummary } from '../types/quality';
/**
 * Quality Manager
 *
 * Manages UAT (User Acceptance Testing) file operations and plan ID generation
 * for the quality verification workflow.
 */
export declare class QualityManager {
    private projectRoot;
    private prePlanningManager;
    constructor(projectRoot: string);
    /**
     * Resolve phase directory using PrePlanningManager pattern
     */
    resolvePhaseDir(phaseNumber: number): string | null;
    /**
     * Check if any SUMMARY.md file exists in phase directory
     */
    summaryExists(phaseDir: string): boolean;
    /**
     * Parse SUMMARY.md frontmatter to extract must_haves truths
     */
    parseSummaryMustHaves(phaseDir: string): {
        truths: string[];
        sourcePlanId: string;
    } | null;
    /**
     * Read UAT.md from phase directory
     */
    readUAT(phaseDir: string): UAT | null;
    /**
     * Write UAT.md to phase directory
     */
    writeUAT(phaseDir: string, uat: UAT): Promise<void>;
    /**
     * Generate UAT markdown content
     */
    private generateUATMarkdown;
    /**
     * Read UAT-ISSUES.md from phase directory
     */
    readUATIssues(phaseDir: string): UATIssues | null;
    /**
     * Write UAT-ISSUES.md to phase directory
     */
    writeUATIssues(phaseDir: string, issues: UATIssues): Promise<void>;
    /**
     * Generate UAT-ISSUES markdown content
     */
    private generateUATIssuesMarkdown;
    /**
     * Get next alpha-suffix plan ID
     *
     * Scans phase directory for existing {phase}-{base}[a-z]*-PLAN.md files
     * Returns next alpha suffix (e.g., '01' -> '01a', '01a' -> '01b')
     */
    getNextAlphaPlanId(phaseDir: string, basePlanId: string): string;
    /**
     * Create a new UAT object with empty items
     */
    createEmptyUAT(phaseNumber: number, planId: string): UAT;
    /**
     * Create a new UATIssues object
     */
    createEmptyUATIssues(phaseNumber: number, sourcePlanId: string): UATIssues;
    /**
     * Calculate UAT summary from items
     */
    calculateSummary(items: UATItem[]): UATSummary;
}
//# sourceMappingURL=quality-manager.d.ts.map