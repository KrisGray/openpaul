import { z } from 'zod';
export const TaskSchema = z.object({
    type: z.enum(['auto', 'checkpoint:human-verify', 'checkpoint:decision', 'checkpoint:human-action']),
    name: z.string().min(1),
    files: z.array(z.string()).optional(),
    action: z.string().min(1),
    verify: z.string().min(1),
    done: z.string().min(1),
});
export const ArtifactSchema = z.object({
    path: z.string(),
    provides: z.string(),
    must_contain: z.array(z.string()).optional(),
    min_lines: z.number().int().positive().optional(),
});
export const KeyLinkSchema = z.object({
    from: z.string(),
    to: z.string(),
    via: z.string(),
    pattern: z.string(),
});
export const MustHavesSchema = z.object({
    truths: z.array(z.string()).min(1),
    artifacts: z.array(ArtifactSchema).min(1),
    key_links: z.array(KeyLinkSchema),
});
export const PlanSchema = z.object({
    phase: z.string(),
    plan: z.string(),
    type: z.enum(['execute', 'tdd']),
    wave: z.number().int().nonnegative(),
    depends_on: z.array(z.string()),
    files_modified: z.array(z.string()),
    autonomous: z.boolean(),
    requirements: z.array(z.string()).min(1),
    tasks: z.array(TaskSchema).min(1).max(5),
    must_haves: MustHavesSchema,
});
//# sourceMappingURL=plan.js.map