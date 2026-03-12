import { z } from 'zod';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export declare const ConfidenceLevelSchema: z.ZodEnum<["high", "medium", "low"]>;
export type AgentState = 'spawning' | 'running' | 'complete' | 'failed';
export declare const AgentStateSchema: z.ZodEnum<["spawning", "running", "complete", "failed"]>;
export interface AgentStatus {
    topic: string;
    status: AgentState;
    summary: string | null;
    error: string | null;
    startedAt: string;
    completedAt: string | null;
}
export declare const AgentStatusSchema: z.ZodObject<{
    topic: z.ZodString;
    status: z.ZodEnum<["spawning", "running", "complete", "failed"]>;
    summary: z.ZodNullable<z.ZodString>;
    error: z.ZodNullable<z.ZodString>;
    startedAt: z.ZodString;
    completedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "failed" | "complete" | "spawning" | "running";
    startedAt: string;
    completedAt: string | null;
    summary: string | null;
    topic: string;
    error: string | null;
}, {
    status: "failed" | "complete" | "spawning" | "running";
    startedAt: string;
    completedAt: string | null;
    summary: string | null;
    topic: string;
    error: string | null;
}>;
export interface ResearchFinding {
    topic: string;
    summary: string;
    details: string[];
    confidence: ConfidenceLevel;
    sources: string[];
}
export declare const ResearchFindingSchema: z.ZodObject<{
    topic: z.ZodString;
    summary: z.ZodString;
    details: z.ZodArray<z.ZodString, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    sources: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    summary: string;
    confidence: "low" | "medium" | "high";
    topic: string;
    details: string[];
    sources: string[];
}, {
    summary: string;
    confidence: "low" | "medium" | "high";
    topic: string;
    details: string[];
    sources: string[];
}>;
export interface ResearchResult {
    phase: number;
    query: string;
    findings: ResearchFinding[];
    confidence: ConfidenceLevel;
    verified: boolean;
    createdAt: string;
}
export declare const ResearchResultSchema: z.ZodObject<{
    phase: z.ZodNumber;
    query: z.ZodString;
    findings: z.ZodArray<z.ZodObject<{
        topic: z.ZodString;
        summary: z.ZodString;
        details: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodEnum<["high", "medium", "low"]>;
        sources: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }, {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }>, "many">;
    confidence: z.ZodEnum<["high", "medium", "low"]>;
    verified: z.ZodBoolean;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phase: number;
    createdAt: string;
    confidence: "low" | "medium" | "high";
    findings: {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }[];
    query: string;
    verified: boolean;
}, {
    phase: number;
    createdAt: string;
    confidence: "low" | "medium" | "high";
    findings: {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }[];
    query: string;
    verified: boolean;
}>;
export interface ResearchPhaseResult {
    phase: number;
    agentsSpawned: number;
    agentsCompleted: number;
    agentsFailed: number;
    findings: ResearchFinding[];
    themes: string[];
    createdAt: string;
}
export declare const ResearchPhaseResultSchema: z.ZodObject<{
    phase: z.ZodNumber;
    agentsSpawned: z.ZodNumber;
    agentsCompleted: z.ZodNumber;
    agentsFailed: z.ZodNumber;
    findings: z.ZodArray<z.ZodObject<{
        topic: z.ZodString;
        summary: z.ZodString;
        details: z.ZodArray<z.ZodString, "many">;
        confidence: z.ZodEnum<["high", "medium", "low"]>;
        sources: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }, {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }>, "many">;
    themes: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    phase: number;
    createdAt: string;
    findings: {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }[];
    agentsSpawned: number;
    agentsCompleted: number;
    agentsFailed: number;
    themes: string[];
}, {
    phase: number;
    createdAt: string;
    findings: {
        summary: string;
        confidence: "low" | "medium" | "high";
        topic: string;
        details: string[];
        sources: string[];
    }[];
    agentsSpawned: number;
    agentsCompleted: number;
    agentsFailed: number;
    themes: string[];
}>;
export interface AgentDashboard {
    agents: AgentStatus[];
    completed: number;
    total: number;
    startTime: string;
}
export declare const AgentDashboardSchema: z.ZodObject<{
    agents: z.ZodArray<z.ZodObject<{
        topic: z.ZodString;
        status: z.ZodEnum<["spawning", "running", "complete", "failed"]>;
        summary: z.ZodNullable<z.ZodString>;
        error: z.ZodNullable<z.ZodString>;
        startedAt: z.ZodString;
        completedAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "failed" | "complete" | "spawning" | "running";
        startedAt: string;
        completedAt: string | null;
        summary: string | null;
        topic: string;
        error: string | null;
    }, {
        status: "failed" | "complete" | "spawning" | "running";
        startedAt: string;
        completedAt: string | null;
        summary: string | null;
        topic: string;
        error: string | null;
    }>, "many">;
    completed: z.ZodNumber;
    total: z.ZodNumber;
    startTime: z.ZodString;
}, "strip", z.ZodTypeAny, {
    completed: number;
    total: number;
    agents: {
        status: "failed" | "complete" | "spawning" | "running";
        startedAt: string;
        completedAt: string | null;
        summary: string | null;
        topic: string;
        error: string | null;
    }[];
    startTime: string;
}, {
    completed: number;
    total: number;
    agents: {
        status: "failed" | "complete" | "spawning" | "running";
        startedAt: string;
        completedAt: string | null;
        summary: string | null;
        topic: string;
        error: string | null;
    }[];
    startTime: string;
}>;
//# sourceMappingURL=research.d.ts.map