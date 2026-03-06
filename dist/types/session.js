import { z } from 'zod';
import { LoopPhaseSchema } from './loop';
/**
 * Zod schema for SessionState validation
 */
export const SessionStateSchema = z.object({
    sessionId: z.string().min(1, 'sessionId must be a non-empty string'),
    createdAt: z.number().positive('createdAt must be a positive number'),
    pausedAt: z.number().positive('pausedAt must be a positive number'),
    phase: LoopPhaseSchema,
    phaseNumber: z.number().int().positive('phaseNumber must be a positive integer'),
    currentPlanId: z.string().optional(),
    workInProgress: z.array(z.string()),
    nextSteps: z.array(z.string()),
    metadata: z.record(z.string(), z.unknown()),
    fileChecksums: z.record(z.string(), z.string()),
});
//# sourceMappingURL=session.js.map