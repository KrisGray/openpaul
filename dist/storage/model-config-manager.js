import { FileManager } from './file-manager';
import { createDefaultModelConfig } from '../types/model-config';
/**
 * Model Configuration Manager
 *
 * Manages model configuration with caching and atomic updates.
 */
export class ModelConfigManager {
    constructor(projectRoot) {
        this.cached = null;
        this.fileManager = new FileManager(projectRoot);
    }
    /**
     * Load model config with caching
     */
    load() {
        if (this.cached) {
            return this.cached;
        }
        const config = this.fileManager.readModelConfig();
        if (!config) {
            throw new Error('Model configuration not found.\n' +
                'Run /paul:init to initialize PAUL and create default configuration.');
        }
        this.cached = config;
        return config;
    }
    /**
     * Get model for a specific sub-stage
     * Returns sub-stage config if set, otherwise default
     */
    getModel(subStage) {
        const config = this.load();
        return config.subStages?.[subStage] ?? config.default;
    }
    /**
     * Update model for a specific sub-stage
     */
    async setModel(subStage, modelConfig) {
        const config = this.load();
        if (!config.subStages) {
            config.subStages = {};
        }
        config.subStages[subStage] = modelConfig;
        config.lastUpdated = Date.now();
        await this.fileManager.writeModelConfig(config);
        this.cached = config;
    }
    /**
     * Update default model
     */
    async setDefault(modelConfig) {
        const config = this.load();
        config.default = modelConfig;
        config.lastUpdated = Date.now();
        await this.fileManager.writeModelConfig(config);
        this.cached = config;
    }
    /**
     * Clear cache (call when config file changes externally)
     */
    clearCache() {
        this.cached = null;
    }
    /**
     * Initialize default configuration
     */
    async initializeDefault() {
        const config = createDefaultModelConfig();
        this.fileManager.ensurePaulDir();
        await this.fileManager.writeModelConfig(config);
        this.cached = config;
    }
}
//# sourceMappingURL=model-config-manager.js.map