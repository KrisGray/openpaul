import { z } from 'zod';
import type { LoopPhase } from './loop';
/**
 * Session State - Captures the current state of a PAUL session
 *
 * Used for pause/resume functionality to enable:
 * - Saving session state with current PAUL loop position and work context
 * - Loading saved session state from .openpaul/SESSIONS/ directory
 * - Validating session integrity before resuming
 * - File checksums for diff generation between sessions
 */
export interface SessionState {
    /** Unique session identifier */
    sessionId: string;
    /** Timestamp when session was created */
    createdAt: number;
    /** Timestamp when session was paused */
    pausedAt: number;
    /** Current loop phase (PLAN/APPLY/UNIFY) */
    phase: LoopPhase;
    /** Current phase number */
    phaseNumber: number;
    /** Current plan being executed (optional) */
    currentPlanId?: string;
    /** List of work items in progress */
    workInProgress: string[];
    /** Next actions to take when resuming */
    nextSteps: string[];
    /** Additional session metadata */
    metadata: Record<string, unknown>;
    /** File path to SHA256 checksum for diff generation */
    fileChecksums: Record<string, string>;
}
/**
 * Zod schema for SessionState validation
 */
export declare const SessionStateSchema: z.ZodObject<{
    sessionId: z.ZodString;
    createdAt: z.ZodNumber;
    pausedAt: z.ZodNumber;
    phase: z.ZodEnum<["PLAN", "APPLY", "UNIFY"]>;
    phaseNumber: z.ZodNumber;
    currentPlanId: z.ZodOptional<z.ZodString>;
    workInProgress: z.ZodArray<z.ZodString, "many">;
    nextSteps: z.ZodArray<z.ZodString, "many">;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    fileChecksums: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    phase: "PLAN" | "APPLY" | "UNIFY";
    phaseNumber: number;
    metadata: Record<string, unknown>;
    createdAt: number;
    nextSteps: string[];
    sessionId: string;
    pausedAt: number;
    workInProgress: string[];
    fileChecksums: Record<string, string>;
    currentPlanId?: string | undefined;
}, {
    phase: "PLAN" | "APPLY" | "UNIFY";
    phaseNumber: number;
    metadata: Record<string, unknown>;
    createdAt: number;
    nextSteps: string[];
    sessionId: string;
    pausedAt: number;
    workInProgress: string[];
    fileChecksums: Record<string, string>;
    currentPlanId?: string | undefined;
}>;
//# sourceMappingURL=session.d.ts.map