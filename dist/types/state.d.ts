import { z } from 'zod';
import type { LoopPhase } from './loop';
/**
 * State - Current position in the PAUL loop
 *
 * Per-phase state files (state-phase-N.json) track:
 * - Current loop position (PLAN/APPLY/UNIFY)
 * - Current plan being executed
 * - Timestamp of last state change
 * - Phase-specific metadata
 */
export interface State {
    phase: LoopPhase;
    phaseNumber: number;
    currentPlanId?: string;
    lastUpdated: number;
    metadata: Record<string, unknown>;
}
/**
 * Zod schema for State validation
 */
export declare const StateSchema: z.ZodObject<{
    phase: z.ZodEnum<["PLAN", "APPLY", "UNIFY"]>;
    phaseNumber: z.ZodNumber;
    currentPlanId: z.ZodOptional<z.ZodString>;
    lastUpdated: z.ZodNumber;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    phase: "PLAN" | "APPLY" | "UNIFY";
    phaseNumber: number;
    lastUpdated: number;
    metadata: Record<string, unknown>;
    currentPlanId?: string | undefined;
}, {
    phase: "PLAN" | "APPLY" | "UNIFY";
    phaseNumber: number;
    lastUpdated: number;
    metadata: Record<string, unknown>;
    currentPlanId?: string | undefined;
}>;
/**
 * Plan Reference - Lightweight reference to a plan in a phase
 */
export interface PlanReference {
    id: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    created: number;
}
export declare const PlanReferenceSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["pending", "in-progress", "completed", "failed"]>;
    created: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "in-progress" | "completed" | "failed";
    id: string;
    created: number;
}, {
    status: "pending" | "in-progress" | "completed" | "failed";
    id: string;
    created: number;
}>;
/**
 * Phase State - State specific to a phase (stored in state-phase-N.json)
 */
export interface PhaseState extends State {
    phaseNumber: number;
    plans: PlanReference[];
    completedPlans: string[];
}
export declare const PhaseStateSchema: z.ZodObject<{
    phase: z.ZodEnum<["PLAN", "APPLY", "UNIFY"]>;
    phaseNumber: z.ZodNumber;
    currentPlanId: z.ZodOptional<z.ZodString>;
    lastUpdated: z.ZodNumber;
    metadata: z.ZodRecord<z.ZodString, z.ZodUnknown>;
} & {
    plans: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<["pending", "in-progress", "completed", "failed"]>;
        created: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "in-progress" | "completed" | "failed";
        id: string;
        created: number;
    }, {
        status: "pending" | "in-progress" | "completed" | "failed";
        id: string;
        created: number;
    }>, "many">;
    completedPlans: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    phase: "PLAN" | "APPLY" | "UNIFY";
    phaseNumber: number;
    lastUpdated: number;
    metadata: Record<string, unknown>;
    plans: {
        status: "pending" | "in-progress" | "completed" | "failed";
        id: string;
        created: number;
    }[];
    completedPlans: string[];
    currentPlanId?: string | undefined;
}, {
    phase: "PLAN" | "APPLY" | "UNIFY";
    phaseNumber: number;
    lastUpdated: number;
    metadata: Record<string, unknown>;
    plans: {
        status: "pending" | "in-progress" | "completed" | "failed";
        id: string;
        created: number;
    }[];
    completedPlans: string[];
    currentPlanId?: string | undefined;
}>;
//# sourceMappingURL=state.d.ts.map