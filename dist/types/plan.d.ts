import { z } from 'zod';
/**
 * Task - Individual unit of work within a plan
 *
 * Each task has:
 * - Type (auto, checkpoint:human-verify, checkpoint:decision, checkpoint:human-action)
 * - Name (descriptive identifier)
 * - Files (paths to create/modify)
 * - Action (implementation instructions)
 * - Verify (how to test completion)
 * - Done (acceptance criteria)
 */
export type TaskType = 'auto' | 'checkpoint:human-verify' | 'checkpoint:decision' | 'checkpoint:human-action';
export interface Task {
    type: TaskType;
    name: string;
    files?: string[];
    action: string;
    verify: string;
    done: string;
}
export declare const TaskSchema: z.ZodObject<{
    type: z.ZodEnum<["auto", "checkpoint:human-verify", "checkpoint:decision", "checkpoint:human-action"]>;
    name: z.ZodString;
    files: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    action: z.ZodString;
    verify: z.ZodString;
    done: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "auto" | "checkpoint:human-verify" | "checkpoint:decision" | "checkpoint:human-action";
    name: string;
    action: string;
    verify: string;
    done: string;
    files?: string[] | undefined;
}, {
    type: "auto" | "checkpoint:human-verify" | "checkpoint:decision" | "checkpoint:human-action";
    name: string;
    action: string;
    verify: string;
    done: string;
    files?: string[] | undefined;
}>;
/**
 * Artifact - File artifact for goal-backward verification
 */
export interface Artifact {
    path: string;
    provides: string;
    must_contain?: string[];
    min_lines?: number;
}
export declare const ArtifactSchema: z.ZodObject<{
    path: z.ZodString;
    provides: z.ZodString;
    must_contain: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    min_lines: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    path: string;
    provides: string;
    must_contain?: string[] | undefined;
    min_lines?: number | undefined;
}, {
    path: string;
    provides: string;
    must_contain?: string[] | undefined;
    min_lines?: number | undefined;
}>;
/**
 * KeyLink - Reference between files for verification
 */
export interface KeyLink {
    from: string;
    to: string;
    via: string;
    pattern: string;
}
export declare const KeyLinkSchema: z.ZodObject<{
    from: z.ZodString;
    to: z.ZodString;
    via: z.ZodString;
    pattern: z.ZodString;
}, "strip", z.ZodTypeAny, {
    from: string;
    to: string;
    via: string;
    pattern: string;
}, {
    from: string;
    to: string;
    via: string;
    pattern: string;
}>;
/**
 * Must-Haves - Goal-backward verification criteria
 */
export interface MustHaves {
    truths: string[];
    artifacts: Artifact[];
    key_links: KeyLink[];
}
export declare const MustHavesSchema: z.ZodObject<{
    truths: z.ZodArray<z.ZodString, "many">;
    artifacts: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        provides: z.ZodString;
        must_contain: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        min_lines: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        provides: string;
        must_contain?: string[] | undefined;
        min_lines?: number | undefined;
    }, {
        path: string;
        provides: string;
        must_contain?: string[] | undefined;
        min_lines?: number | undefined;
    }>, "many">;
    key_links: z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
        via: z.ZodString;
        pattern: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        from: string;
        to: string;
        via: string;
        pattern: string;
    }, {
        from: string;
        to: string;
        via: string;
        pattern: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    truths: string[];
    artifacts: {
        path: string;
        provides: string;
        must_contain?: string[] | undefined;
        min_lines?: number | undefined;
    }[];
    key_links: {
        from: string;
        to: string;
        via: string;
        pattern: string;
    }[];
}, {
    truths: string[];
    artifacts: {
        path: string;
        provides: string;
        must_contain?: string[] | undefined;
        min_lines?: number | undefined;
    }[];
    key_links: {
        from: string;
        to: string;
        via: string;
        pattern: string;
    }[];
}>;
/**
 * Plan - Executable plan with tasks
 *
 * Plans contain:
 * - Phase and plan identifiers
 * - Type (execute or tdd)
 * - Wave number for parallel execution
 * - Dependencies on other plans
 * - Files to be modified
 * - Autonomous flag (true if no checkpoints)
 * - Tasks to execute
 * - Must-haves for goal-backward verification
 */
export interface Plan {
    phase: string;
    plan: string;
    type: 'execute' | 'tdd';
    wave: number;
    depends_on: string[];
    files_modified: string[];
    autonomous: boolean;
    requirements: string[];
    tasks: Task[];
    must_haves: MustHaves;
}
export declare const PlanSchema: z.ZodObject<{
    phase: z.ZodString;
    plan: z.ZodString;
    type: z.ZodEnum<["execute", "tdd"]>;
    wave: z.ZodNumber;
    depends_on: z.ZodArray<z.ZodString, "many">;
    files_modified: z.ZodArray<z.ZodString, "many">;
    autonomous: z.ZodBoolean;
    requirements: z.ZodArray<z.ZodString, "many">;
    tasks: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["auto", "checkpoint:human-verify", "checkpoint:decision", "checkpoint:human-action"]>;
        name: z.ZodString;
        files: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        action: z.ZodString;
        verify: z.ZodString;
        done: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "auto" | "checkpoint:human-verify" | "checkpoint:decision" | "checkpoint:human-action";
        name: string;
        action: string;
        verify: string;
        done: string;
        files?: string[] | undefined;
    }, {
        type: "auto" | "checkpoint:human-verify" | "checkpoint:decision" | "checkpoint:human-action";
        name: string;
        action: string;
        verify: string;
        done: string;
        files?: string[] | undefined;
    }>, "many">;
    must_haves: z.ZodObject<{
        truths: z.ZodArray<z.ZodString, "many">;
        artifacts: z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            provides: z.ZodString;
            must_contain: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            min_lines: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            path: string;
            provides: string;
            must_contain?: string[] | undefined;
            min_lines?: number | undefined;
        }, {
            path: string;
            provides: string;
            must_contain?: string[] | undefined;
            min_lines?: number | undefined;
        }>, "many">;
        key_links: z.ZodArray<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
            via: z.ZodString;
            pattern: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            from: string;
            to: string;
            via: string;
            pattern: string;
        }, {
            from: string;
            to: string;
            via: string;
            pattern: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        truths: string[];
        artifacts: {
            path: string;
            provides: string;
            must_contain?: string[] | undefined;
            min_lines?: number | undefined;
        }[];
        key_links: {
            from: string;
            to: string;
            via: string;
            pattern: string;
        }[];
    }, {
        truths: string[];
        artifacts: {
            path: string;
            provides: string;
            must_contain?: string[] | undefined;
            min_lines?: number | undefined;
        }[];
        key_links: {
            from: string;
            to: string;
            via: string;
            pattern: string;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    phase: string;
    type: "execute" | "tdd";
    plan: string;
    wave: number;
    depends_on: string[];
    files_modified: string[];
    autonomous: boolean;
    requirements: string[];
    tasks: {
        type: "auto" | "checkpoint:human-verify" | "checkpoint:decision" | "checkpoint:human-action";
        name: string;
        action: string;
        verify: string;
        done: string;
        files?: string[] | undefined;
    }[];
    must_haves: {
        truths: string[];
        artifacts: {
            path: string;
            provides: string;
            must_contain?: string[] | undefined;
            min_lines?: number | undefined;
        }[];
        key_links: {
            from: string;
            to: string;
            via: string;
            pattern: string;
        }[];
    };
}, {
    phase: string;
    type: "execute" | "tdd";
    plan: string;
    wave: number;
    depends_on: string[];
    files_modified: string[];
    autonomous: boolean;
    requirements: string[];
    tasks: {
        type: "auto" | "checkpoint:human-verify" | "checkpoint:decision" | "checkpoint:human-action";
        name: string;
        action: string;
        verify: string;
        done: string;
        files?: string[] | undefined;
    }[];
    must_haves: {
        truths: string[];
        artifacts: {
            path: string;
            provides: string;
            must_contain?: string[] | undefined;
            min_lines?: number | undefined;
        }[];
        key_links: {
            from: string;
            to: string;
            via: string;
            pattern: string;
        }[];
    };
}>;
//# sourceMappingURL=plan.d.ts.map