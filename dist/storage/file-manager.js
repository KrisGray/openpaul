import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { atomicWrite } from './atomic-writes';
import { StateSchema } from '../types/state';
import { ModelConfigFileSchema } from '../types/model-config';
import { PlanSchema } from '../types/plan';
/**
 * Zod schema for SummaryTask validation
 */
export const SummaryTaskSchema = z.object({
    name: z.string().min(1),
    status: z.enum(['completed', 'skipped', 'failed']),
    notes: z.string().optional(),
});
/**
 * Zod schema for Summary validation
 */
export const SummarySchema = z.object({
    phaseNumber: z.number().int().positive(),
    planId: z.string().min(1),
    completed: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    status: z.enum(['success', 'partial', 'failed']),
    tasks: z.array(SummaryTaskSchema),
    createdAt: z.number(),
});
/**
 * File Manager
 *
 * Manages OpenPAUL state files with per-phase organization.
 * Uses dual-path resolution: checks .openpaul/ first, falls back to .paul/ for migration compatibility.
 * Files are named: state-phase-{N}.json
 */
export class FileManager {
    constructor(projectRoot) {
        this.openPaulDir = join(projectRoot, '.openpaul');
        this.paulDir = join(projectRoot, '.paul');
        this.phasesDir = join(this.openPaulDir, 'phases');
    }
    /**
     * Get phase state file path
     *
     * Pattern: .openpaul/state-phase-{N}.json (primary) or .paul/state-phase-{N}.json (fallback)
     * Reads check .openpaul first, fall back to .paul for migration compatibility.
     * Writes always go to .openpaul/.
     */
    getPhaseStatePath(phaseNumber) {
        // Check .openpaul first (primary)
        const openPaulPath = join(this.openPaulDir, `state-phase-${phaseNumber}.json`);
        if (existsSync(openPaulPath)) {
            return openPaulPath;
        }
        // Fall back to .paul for migration compatibility
        return join(this.paulDir, `state-phase-${phaseNumber}.json`);
    }
    /**
     * Read JSON file with validation
     */
    readJSON(filePath, schema) {
        if (!existsSync(filePath)) {
            return null;
        }
        try {
            const content = readFileSync(filePath, 'utf-8');
            const data = JSON.parse(content);
            return schema.parse(data);
        }
        catch (error) {
            // Log error but don't throw - return null for missing/invalid files
            console.error(`Failed to read ${filePath}:`, error);
            return null;
        }
    }
    /**
     * Write JSON file with atomic writes
     */
    async writeJSON(filePath, data, schema) {
        const validated = schema.parse(data);
        const jsonContent = JSON.stringify(validated, null, 2);
        await atomicWrite(filePath, jsonContent);
    }
    /**
     * Read phase state
     */
    readPhaseState(phaseNumber) {
        const filePath = this.getPhaseStatePath(phaseNumber);
        return this.readJSON(filePath, StateSchema);
    }
    /**
     * Write phase state with atomic writes
     */
    async writePhaseState(phaseNumber, state) {
        const filePath = this.getPhaseStatePath(phaseNumber);
        await this.writeJSON(filePath, state, StateSchema);
    }
    /**
     * Check if phase state exists
     */
    phaseStateExists(phaseNumber) {
        const filePath = this.getPhaseStatePath(phaseNumber);
        return existsSync(filePath);
    }
    /**
     * Ensure .openpaul directory exists
     */
    ensurePaulDir() {
        if (!existsSync(this.openPaulDir)) {
            mkdirSync(this.openPaulDir, { recursive: true });
        }
    }
    /**
     * Get model config file path
     *
     * Pattern: .openpaul/model-config.json (primary) or .paul/model-config.json (fallback)
     */
    getModelConfigPath() {
        // Check .openpaul first (primary)
        const openPaulPath = join(this.openPaulDir, 'model-config.json');
        if (existsSync(openPaulPath)) {
            return openPaulPath;
        }
        // Fall back to .paul for migration compatibility
        return join(this.paulDir, 'model-config.json');
    }
    /**
     * Read model configuration
     */
    readModelConfig() {
        const filePath = this.getModelConfigPath();
        return this.readJSON(filePath, ModelConfigFileSchema);
    }
    /**
     * Write model configuration with atomic writes
     */
    async writeModelConfig(config) {
        const filePath = this.getModelConfigPath();
        await this.writeJSON(filePath, config, ModelConfigFileSchema);
    }
    /**
     * Get plan file path
     *
     * Pattern: .openpaul/phases/{phaseNumber}-{planId}-PLAN.json
     * Note: phasesDir is set to .openpaul/phases, but reads check both locations
     */
    getPlanPath(phaseNumber, planId) {
        // Check .openpaul/phases first (primary)
        const openPaulPath = join(this.openPaulDir, 'phases', `${phaseNumber}-${planId}-PLAN.json`);
        if (existsSync(openPaulPath)) {
            return openPaulPath;
        }
        // Fall back to .paul/phases for migration compatibility
        return join(this.paulDir, 'phases', `${phaseNumber}-${planId}-PLAN.json`);
    }
    /**
     * Read plan
     */
    readPlan(phaseNumber, planId) {
        const filePath = this.getPlanPath(phaseNumber, planId);
        return this.readJSON(filePath, PlanSchema);
    }
    /**
     * Write plan with atomic writes
     */
    async writePlan(phaseNumber, planId, plan) {
        const filePath = this.getPlanPath(phaseNumber, planId);
        await this.writeJSON(filePath, plan, PlanSchema);
    }
    /**
     * Check if plan exists
     */
    planExists(phaseNumber, planId) {
        const filePath = this.getPlanPath(phaseNumber, planId);
        return existsSync(filePath);
    }
    /**
     * Ensure .openpaul/phases directory exists
     */
    ensurePhasesDir() {
        if (!existsSync(this.phasesDir)) {
            mkdirSync(this.phasesDir, { recursive: true });
        }
    }
    /**
     * Get summary file path
     *
     * Pattern: .openpaul/phases/{phaseNumber}-{planId}-SUMMARY.json
     */
    getSummaryPath(phaseNumber, planId) {
        // Check .openpaul/phases first (primary)
        const openPaulPath = join(this.openPaulDir, 'phases', `${phaseNumber}-${planId}-SUMMARY.json`);
        if (existsSync(openPaulPath)) {
            return openPaulPath;
        }
        // Fall back to .paul/phases for migration compatibility
        return join(this.paulDir, 'phases', `${phaseNumber}-${planId}-SUMMARY.json`);
    }
    /**
     * Read summary
     */
    readSummary(phaseNumber, planId) {
        const filePath = this.getSummaryPath(phaseNumber, planId);
        return this.readJSON(filePath, SummarySchema);
    }
    /**
     * Write summary with atomic writes
     */
    async writeSummary(phaseNumber, planId, summary) {
        const filePath = this.getSummaryPath(phaseNumber, planId);
        await this.writeJSON(filePath, summary, SummarySchema);
    }
}
//# sourceMappingURL=file-manager.js.map