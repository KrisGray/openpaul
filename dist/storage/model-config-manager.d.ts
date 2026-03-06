import type { ModelConfig, SubStage } from '../types';
/**
 * Model Configuration Manager
 *
 * Manages model configuration with caching and atomic updates.
 */
export declare class ModelConfigManager {
    private fileManager;
    private cached;
    constructor(projectRoot: string);
    /**
     * Load model config with caching
     */
    private load;
    /**
     * Get model for a specific sub-stage
     * Returns sub-stage config if set, otherwise default
     */
    getModel(subStage: SubStage): ModelConfig;
    /**
     * Update model for a specific sub-stage
     */
    setModel(subStage: SubStage, modelConfig: ModelConfig): Promise<void>;
    /**
     * Update default model
     */
    setDefault(modelConfig: ModelConfig): Promise<void>;
    /**
     * Clear cache (call when config file changes externally)
     */
    clearCache(): void;
    /**
     * Initialize default configuration
     */
    initializeDefault(): Promise<void>;
}
//# sourceMappingURL=model-config-manager.d.ts.map