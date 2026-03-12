import { z } from 'zod';
export const UATResultSchema = z.enum(['pass', 'fail', 'skip']);
export const UATSeveritySchema = z.enum(['critical', 'major', 'minor']);
export const UATCategorySchema = z.enum(['functional', 'visual', 'performance', 'configuration']);
export const UATItemSchema = z.object({
    id: z.number().int().positive(),
    description: z.string().min(1),
    result: UATResultSchema,
    notes: z.string().optional(),
    testedAt: z.number().int().nonnegative().optional(),
});
export const UATIssueSchema = z.object({
    id: z.number().int().positive(),
    itemDescription: z.string().min(1),
    status: z.enum(['open', 'fixed', 'wontfix']),
    severity: UATSeveritySchema,
    category: UATCategorySchema,
    description: z.string().min(1),
    suggestedFix: z.string().optional(),
    sourcePlanId: z.string().min(1),
    fixPlanId: z.string().optional(),
    createdAt: z.number().int().nonnegative(),
});
export const UATSummarySchema = z.object({
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
});
export const UATSchema = z.object({
    phaseNumber: z.number().int().positive(),
    planId: z.string().min(1),
    testedAt: z.number().int().nonnegative(),
    status: z.enum(['complete', 'partial', 'in-progress']),
    items: z.array(UATItemSchema),
    summary: UATSummarySchema,
});
export const UATIssuesSchema = z.object({
    phaseNumber: z.number().int().positive(),
    sourcePlanId: z.string().min(1),
    createdAt: z.number().int().nonnegative(),
    issues: z.array(UATIssueSchema),
});
//# sourceMappingURL=quality.js.map