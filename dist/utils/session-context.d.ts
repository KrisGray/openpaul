import type { LoopPhase } from '../types/loop';
import { StateManager } from '../state/state-manager';
export type SessionContext = {
    currentPlanId?: string;
    accomplished: string[];
    workInProgress: string[];
    nextSteps: string[];
};
export declare function buildSessionContext(stateManager: StateManager, position: {
    phaseNumber: number;
    phase: LoopPhase;
}): SessionContext;
//# sourceMappingURL=session-context.d.ts.map