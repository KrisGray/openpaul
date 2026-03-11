import type { SessionState } from '../types/session';
type HandoffTemplateInput = {
    sessionState: SessionState;
    status: 'paused' | 'active';
    projectName: string;
    phaseName: string;
    totalPhases: number;
    version: string;
    accomplished: string[];
    workInProgress: string[];
    nextSteps: string[];
};
export declare function renderHandoffTemplate(params: HandoffTemplateInput): string;
export {};
//# sourceMappingURL=handoff-template.d.ts.map