import { z } from 'zod';
/**
 * Zod schema for MilestoneStatus validation
 */
export const MilestoneStatusSchema = z.enum(['planned', 'in-progress', 'completed']);
/**
 * Zod schema for Milestone validation
 */
export const MilestoneSchema = z.object({
    name: z.string().min(1),
    scope: z.string().min(1),
    phases: z.array(z.number().int().positive()),
    theme: z.string().nullable(),
    status: MilestoneStatusSchema,
    startedAt: z.string().datetime().nullable(),
    completedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
});
/**
 * Zod schema for PhaseStatus validation
 */
export const PhaseStatusSchema = z.object({
    number: z.number().int().positive(),
    status: z.enum(['pending', 'in-progress', 'complete']),
});
/**
 * Zod schema for MilestoneProgress validation
 */
export const MilestoneProgressSchema = z.object({
    milestoneName: z.string().min(1),
    phasesCompleted: z.number().int().nonnegative(),
    phasesTotal: z.number().int().positive(),
    percentage: z.number().min(0).max(100),
    phaseStatus: z.array(PhaseStatusSchema),
});
/**
 * Zod schema for MilestoneArchiveEntry validation
 */
export const MilestoneArchiveEntrySchema = z.object({
    name: z.string().min(1),
    scope: z.string().min(1),
    phases: z.array(z.number().int().positive()),
    startedAt: z.string().datetime().nullable(),
    completedAt: z.string().datetime(),
    plansCompleted: z.number().int().nonnegative(),
    totalPlans: z.number().int().nonnegative(),
    executionTime: z.string().min(1),
    requirementsAddressed: z.array(z.string()),
});
/**
 * Zod schema for PhaseModificationResult validation
 */
export const PhaseModificationResultSchema = z.object({
    allowed: z.boolean(),
    warning: z.string().optional(),
});
//# sourceMappingURL=milestone.js.map