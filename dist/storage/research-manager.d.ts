import type { ResearchResult, ResearchPhaseResult, ResearchFinding, AgentStatus, AgentDashboard } from '../types/research';
export declare class ResearchManager {
    private projectRoot;
    constructor(projectRoot: string);
    getPlanningDir(): string;
    resolvePhaseDir(phaseNumber: number): string | null;
    private formatPhaseDirName;
    resolveResearchPath(phaseNumber: number): string | null;
    createResearchResult(phaseNumber: number, query: string, findings: ResearchFinding[]): ResearchResult;
    private calculateOverallConfidence;
    aggregateAgentResults(agentResults: AgentStatus[]): ResearchPhaseResult;
    private extractThemes;
    organizeByTheme(findings: ResearchFinding[]): Map<string, ResearchFinding[]>;
    private extractPrimaryTheme;
    formatAgentStatus(agent: AgentStatus): string;
    formatAgentDashboard(dashboard: AgentDashboard): string;
    generateResearchContent(result: ResearchResult): string;
    private capitalizeFirst;
    generateResearchPhaseContent(phaseNumber: number, result: ResearchPhaseResult, findings: ResearchFinding[], themes: string[]): string;
    writeResearch(phaseNumber: number, query: string, findings: ResearchFinding[]): Promise<string>;
    writeResearchPhaseResult(phaseNumber: number, result: ResearchPhaseResult, findings: ResearchFinding[], themes: string[]): Promise<string>;
}
//# sourceMappingURL=research-manager.d.ts.map