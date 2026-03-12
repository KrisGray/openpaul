import { z } from 'zod';
export const ValidationStatusSchema = z.enum(['unvalidated', 'validated', 'invalidated']);
export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export const IssueSeveritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const DiscoveryDepthSchema = z.enum(['quick', 'standard', 'deep']);
export const ContextStatusSchema = z.enum(['Ready for planning', 'In progress', 'Complete']);
export const DecisionEntrySchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
});
export const ContextArtifactSchema = z.object({
    phase: z.number().int().positive(),
    gathered: z.string().datetime(),
    status: ContextStatusSchema,
    domain: z.string(),
    decisions: z.array(DecisionEntrySchema),
    specifics: z.array(z.string()),
    deferred: z.array(z.string()),
});
export const AssumptionEntrySchema = z.object({
    statement: z.string().min(1),
    validation_status: ValidationStatusSchema,
    confidence: ConfidenceLevelSchema,
    impact: z.string().min(1),
});
export const AssumptionsArtifactSchema = z.object({
    phase: z.number().int().positive(),
    assumptions: z.array(AssumptionEntrySchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export const IssueEntrySchema = z.object({
    severity: IssueSeveritySchema,
    description: z.string().min(1),
    affectedAreas: z.array(z.string()),
    mitigation: z.string().min(1),
});
export const IssuesArtifactSchema = z.object({
    phase: z.number().int().positive(),
    issues: z.array(IssueEntrySchema),
    createdAt: z.string().datetime(),
});
export const DiscoveryArtifactSchema = z.object({
    phase: z.number().int().positive(),
    depth: DiscoveryDepthSchema,
    summary: z.string().min(1),
    findings: z.array(z.string()),
    optionsConsidered: z.array(z.string()),
    recommendation: z.string(),
    references: z.array(z.string()),
    createdAt: z.string().datetime(),
});
export const ContextParamsSchema = z.object({
    domain: z.string().optional(),
    decisions: z.array(DecisionEntrySchema).optional(),
    specifics: z.array(z.string()).optional(),
    deferred: z.array(z.string()).optional(),
});
export const DiscoveryParamsSchema = z.object({
    topic: z.string().min(1),
    depth: DiscoveryDepthSchema,
    summary: z.string().min(1),
    findings: z.array(z.string()),
    optionsConsidered: z.array(z.string()),
    recommendation: z.string(),
    references: z.array(z.string()),
});
//# sourceMappingURL=pre-planning.js.map