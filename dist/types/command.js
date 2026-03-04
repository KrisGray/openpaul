import { z } from 'zod';
export const CommandInputSchema = z.object({
    type: z.enum([
        'init', 'plan', 'apply', 'unify', 'progress', 'help',
        'pause', 'resume', 'handoff', 'status',
        'milestone', 'complete-milestone', 'discuss-milestone', 'map-codebase',
        'discuss', 'assumptions', 'discover', 'consider-issues',
        'research', 'research-phase', 'verify', 'plan-fix',
        'add-phase', 'remove-phase', 'flows', 'config',
    ]),
    args: z.array(z.string()).optional(),
    flags: z.record(z.string(), z.unknown()).optional(),
});
export const CommandResultSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    data: z.unknown().optional(),
    nextAction: z.string().optional(),
});
//# sourceMappingURL=command.js.map