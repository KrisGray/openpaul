import { z } from 'zod';
export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export const AgentStateSchema = z.enum(['spawning', 'running', 'complete', 'failed']);
export const AgentStatusSchema = z.object({
    topic: z.string().min(1),
    status: AgentStateSchema,
    summary: z.string().nullable(),
    error: z.string().nullable(),
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().nullable(),
});
export const ResearchFindingSchema = z.object({
    topic: z.string().min(1),
    summary: z.string().min(1),
    details: z.array(z.string()),
    confidence: ConfidenceLevelSchema,
    sources: z.array(z.string()),
});
export const ResearchResultSchema = z.object({
    phase: z.number().int().positive(),
    query: z.string().min(1),
    findings: z.array(ResearchFindingSchema),
    confidence: ConfidenceLevelSchema,
    verified: z.boolean(),
    createdAt: z.string().datetime(),
});
export const ResearchPhaseResultSchema = z.object({
    phase: z.number().int().positive(),
    agentsSpawned: z.number().int().nonnegative(),
    agentsCompleted: z.number().int().nonnegative(),
    agentsFailed: z.number().int().nonnegative(),
    findings: z.array(ResearchFindingSchema),
    themes: z.array(z.string()),
    createdAt: z.string().datetime(),
});
export const AgentDashboardSchema = z.object({
    agents: z.array(AgentStatusSchema),
    completed: z.number().int().nonnegative(),
    total: z.number().int().positive(),
    startTime: z.string().datetime(),
});
//# sourceMappingURL=research.js.map