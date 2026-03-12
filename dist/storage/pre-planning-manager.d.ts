import type { AssumptionEntry, IssueEntry, ContextParams, DiscoveryParams } from '../types/pre-planning';
export declare class PrePlanningManager {
    private projectRoot;
    constructor(projectRoot: string);
    /**
     * Get the planning directory path (.openpaul or .paul)
     * Uses .openpaul as primary, falls back to .paul for migration compatibility.
     * Defaults to .openpaul if neither exists.
     */
    private getPlanningDir;
    /**
     * Resolve phase directory path
     * Checks .openpaul/phases first, then falls back to .paul/phases and .planning/phases
     */
    resolvePhaseDir(phaseNumber: number): string | null;
    private formatPhaseDirName;
    resolveContextPath(phaseNumber: number): string | null;
    resolveAssumptionsPath(phaseNumber: number): string | null;
    resolveIssuesPath(phaseNumber: number): string | null;
    resolveDiscoveryPath(phaseNumber: number): string | null;
    createContext(phaseNumber: number, params: ContextParams): string;
    private generateContextContent;
    createAssumptions(phaseNumber: number, assumptions: AssumptionEntry[]): string;
    private generateAssumptionsContent;
    createIssues(phaseNumber: number, issues: IssueEntry[]): string;
    private sortIssuesBySeverity;
    private generateIssuesContent;
    private groupIssuesBySeverity;
    private capitalizeFirst;
    createDiscovery(phaseNumber: number, params: DiscoveryParams): string;
    private generateDiscoveryContent;
    writeContext(phaseNumber: number, params: ContextParams): Promise<string>;
    writeAssumptions(phaseNumber: number, assumptions: AssumptionEntry[]): Promise<string>;
    writeIssues(phaseNumber: number, issues: IssueEntry[]): Promise<string>;
    writeDiscovery(phaseNumber: number, params: DiscoveryParams): Promise<string>;
}
//# sourceMappingURL=pre-planning-manager.d.ts.map