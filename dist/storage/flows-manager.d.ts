export interface Flow {
    name: string;
    enabled: boolean;
    trigger?: string;
}
export declare class FlowsManager {
    private projectRoot;
    private flowsPath;
    private flows;
    constructor(projectRoot: string);
    private resolveFlowsPath;
    load(): Flow[];
    private parseFlowsFromMarkdown;
    save(): void;
    private generateFlowsMarkdown;
    list(): Flow[];
    enable(name: string): boolean;
    disable(name: string): boolean;
    static init(projectRoot: string): string;
}
//# sourceMappingURL=flows-manager.d.ts.map