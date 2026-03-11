import { z } from 'zod';
/**
 * Zod schema for PhaseEntry validation
 */
export const PhaseEntrySchema = z.object({
    number: z.number().int().positive(),
    name: z.string().min(1),
    status: z.enum(['pending', 'in-progress', 'complete']),
    directoryName: z.string().min(1),
});
/**
 * Zod schema for AddPhaseOptions validation
 */
export const AddPhaseOptionsSchema = z.object({
    name: z.string().min(1),
    position: z.enum(['after', 'before']),
    referencePhase: z.number().int().positive(),
});
/**
 * Zod schema for RemovePhaseResult validation
 */
export const RemovePhaseResultSchema = z.object({
    success: z.boolean(),
    removedPhase: PhaseEntrySchema.nullable(),
    renumberedPhases: z.array(z.number().int().positive()),
});
/**
 * Zod schema for RoadmapValidationResult validation
 */
export const RoadmapValidationResultSchema = z.object({
    valid: z.boolean(),
    errors: z.array(z.string()),
});
//# sourceMappingURL=roadmap.js.map