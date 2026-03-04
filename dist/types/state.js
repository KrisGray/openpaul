import { z } from 'zod';
import { LoopPhaseSchema } from './loop';
/**
 * Zod schema for State validation
 */
export const StateSchema = z.object({
    phase: LoopPhaseSchema,
    phaseNumber: z.number().int().positive(),
    currentPlanId: z.string().optional(),
    lastUpdated: z.number(),
    metadata: z.record(z.string(), z.unknown()),
});
export const PlanReferenceSchema = z.object({
    id: z.string(),
    status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
    created: z.number(),
});
export const PhaseStateSchema = StateSchema.extend({
    plans: z.array(PlanReferenceSchema),
    completedPlans: z.array(z.string()),
});
//# sourceMappingURL=state.js.map