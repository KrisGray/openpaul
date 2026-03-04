import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { atomicWrite } from './atomic-writes';
import { StateSchema } from '../types/state';
/**
 * File Manager
 *
 * Manages PAUL state files with per-phase organization.
 * Files are named: state-phase-{N}.json
 */
export class FileManager {
    constructor(projectRoot) {
        this.paulDir = join(projectRoot, '.paul');
    }
    /**
     * Get phase state file path
     *
     * Pattern: .paul/state-phase-{N}.json
     */
    getPhaseStatePath(phaseNumber) {
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
     * Ensure .paul directory exists
     */
    ensurePaulDir() {
        if (!existsSync(this.paulDir)) {
            mkdirSync(this.paulDir, { recursive: true });
        }
    }
}
//# sourceMappingURL=file-manager.js.map