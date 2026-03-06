import { z } from 'zod';
import type { State } from '../types/state';
import type { ModelConfigFile } from '../types/model-config';
import type { Plan } from '../types/plan';
/**
 * Summary Task - Individual task summary
 */
export interface SummaryTask {
    name: string;
    status: 'completed' | 'skipped' | 'failed';
    notes?: string;
}
/**
 * Summary - Plan execution summary
 */
export interface Summary {
    phaseNumber: number;
    planId: string;
    completed: number;
    total: number;
    status: 'success' | 'partial' | 'failed';
    tasks: SummaryTask[];
    createdAt: number;
}
/**
 * Zod schema for SummaryTask validation
 */
export declare const SummaryTaskSchema: z.ZodObject<{
    name: z.ZodString;
    status: z.ZodEnum<["completed", "skipped", "failed"]>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "failed" | "skipped";
    name: string;
    notes?: string | undefined;
}, {
    status: "completed" | "failed" | "skipped";
    name: string;
    notes?: string | undefined;
}>;
/**
 * Zod schema for Summary validation
 */
export declare const SummarySchema: z.ZodObject<{
    phaseNumber: z.ZodNumber;
    planId: z.ZodString;
    completed: z.ZodNumber;
    total: z.ZodNumber;
    status: z.ZodEnum<["success", "partial", "failed"]>;
    tasks: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        status: z.ZodEnum<["completed", "skipped", "failed"]>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "failed" | "skipped";
        name: string;
        notes?: string | undefined;
    }, {
        status: "completed" | "failed" | "skipped";
        name: string;
        notes?: string | undefined;
    }>, "many">;
    createdAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    phaseNumber: number;
    status: "failed" | "partial" | "success";
    completed: number;
    tasks: {
        status: "completed" | "failed" | "skipped";
        name: string;
        notes?: string | undefined;
    }[];
    planId: string;
    total: number;
    createdAt: number;
}, {
    phaseNumber: number;
    status: "failed" | "partial" | "success";
    completed: number;
    tasks: {
        status: "completed" | "failed" | "skipped";
        name: string;
        notes?: string | undefined;
    }[];
    planId: string;
    total: number;
    createdAt: number;
}>;
/**
 * File Manager
 *
 * Manages PAUL state files with per-phase organization.
 * Files are named: state-phase-{N}.json
 */
export declare class FileManager {
    private paulDir;
    private phasesDir;
    constructor(projectRoot: string);
    /**
     * Get phase state file path
     *
     * Pattern: .paul/state-phase-{N}.json
     */
    private getPhaseStatePath;
    /**
     * Read JSON file with validation
     */
    private readJSON;
    /**
     * Write JSON file with atomic writes
     */
    private writeJSON;
    /**
     * Read phase state
     */
    readPhaseState(phaseNumber: number): State | null;
    /**
     * Write phase state with atomic writes
     */
    writePhaseState(phaseNumber: number, state: State): Promise<void>;
    /**
     * Check if phase state exists
     */
    phaseStateExists(phaseNumber: number): boolean;
    /**
     * Ensure .paul directory exists
     */
    ensurePaulDir(): void;
    /**
     * Get model config file path
     *
     * Pattern: .paul/model-config.json
     */
    private getModelConfigPath;
    /**
     * Read model configuration
     */
    readModelConfig(): ModelConfigFile | null;
    /**
     * Write model configuration with atomic writes
     */
    writeModelConfig(config: ModelConfigFile): Promise<void>;
    /**
     * Get plan file path
     *
     * Pattern: .paul/phases/{phaseNumber}-{planId}-PLAN.json
     */
    private getPlanPath;
    /**
     * Read plan
     */
    readPlan(phaseNumber: number, planId: string): Plan | null;
    /**
     * Write plan with atomic writes
     */
    writePlan(phaseNumber: number, planId: string, plan: Plan): Promise<void>;
    /**
     * Check if plan exists
     */
    planExists(phaseNumber: number, planId: string): boolean;
    /**
     * Ensure .paul/phases directory exists
     */
    ensurePhasesDir(): void;
    /**
     * Get summary file path
     *
     * Pattern: .paul/phases/{phaseNumber}-{planId}-SUMMARY.json
     */
    private getSummaryPath;
    /**
     * Read summary
     */
    readSummary(phaseNumber: number, planId: string): Summary | null;
    /**
     * Write summary with atomic writes
     */
    writeSummary(phaseNumber: number, planId: string, summary: Summary): Promise<void>;
}
//# sourceMappingURL=file-manager.d.ts.map