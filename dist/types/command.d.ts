import { z } from 'zod';
import type { LoopPhase } from './loop';
/**
 * Command - User command to interact with PAUL
 *
 * Commands include:
 * - /paul:init - Initialize PAUL in project
 * - /paul:plan - Create executable plan
 * - /paul:apply - Execute approved plan
 * - /paul:unify - Close the loop
 * - /paul:progress - View current status
 * - /paul:help - Command reference
 * - And 20 more commands from roadmap
 */
export type CommandType = 'init' | 'plan' | 'apply' | 'unify' | 'progress' | 'help' | 'pause' | 'resume' | 'handoff' | 'status' | 'milestone' | 'complete-milestone' | 'discuss-milestone' | 'map-codebase' | 'discuss' | 'assumptions' | 'discover' | 'consider-issues' | 'research' | 'research-phase' | 'verify' | 'plan-fix' | 'add-phase' | 'remove-phase' | 'flows' | 'config';
/**
 * Command Input - User input for a command
 */
export interface CommandInput {
    type: CommandType;
    args?: string[];
    flags?: Record<string, unknown>;
}
export declare const CommandInputSchema: z.ZodObject<{
    type: z.ZodEnum<["init", "plan", "apply", "unify", "progress", "help", "pause", "resume", "handoff", "status", "milestone", "complete-milestone", "discuss-milestone", "map-codebase", "discuss", "assumptions", "discover", "consider-issues", "research", "research-phase", "verify", "plan-fix", "add-phase", "remove-phase", "flows", "config"]>;
    args: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    flags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "config" | "status" | "verify" | "plan" | "init" | "apply" | "unify" | "progress" | "help" | "pause" | "resume" | "handoff" | "milestone" | "complete-milestone" | "discuss-milestone" | "map-codebase" | "discuss" | "assumptions" | "discover" | "consider-issues" | "research" | "research-phase" | "plan-fix" | "add-phase" | "remove-phase" | "flows";
    args?: string[] | undefined;
    flags?: Record<string, unknown> | undefined;
}, {
    type: "config" | "status" | "verify" | "plan" | "init" | "apply" | "unify" | "progress" | "help" | "pause" | "resume" | "handoff" | "milestone" | "complete-milestone" | "discuss-milestone" | "map-codebase" | "discuss" | "assumptions" | "discover" | "consider-issues" | "research" | "research-phase" | "plan-fix" | "add-phase" | "remove-phase" | "flows";
    args?: string[] | undefined;
    flags?: Record<string, unknown> | undefined;
}>;
/**
 * Command Result - Result of executing a command
 */
export interface CommandResult {
    success: boolean;
    message: string;
    data?: unknown;
    nextAction?: string;
}
export declare const CommandResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    message: z.ZodString;
    data: z.ZodOptional<z.ZodUnknown>;
    nextAction: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    success: boolean;
    data?: unknown;
    nextAction?: string | undefined;
}, {
    message: string;
    success: boolean;
    data?: unknown;
    nextAction?: string | undefined;
}>;
/**
 * Command Handler - Function that handles a command
 */
export type CommandHandler = (input: CommandInput, context: CommandContext) => Promise<CommandResult>;
/**
 * Command Context - Context passed to command handlers
 */
export interface CommandContext {
    projectRoot: string;
    currentState: LoopPhase;
    phaseNumber: number;
}
//# sourceMappingURL=command.d.ts.map