export interface ProjectConfig {
    version: string;
    project: {
        name: string;
        description?: string;
    };
    integrations?: {
        openai?: {
            apiKey?: string;
            model?: string;
        };
        github?: {
            token?: string;
        };
        vercel?: {
            token?: string;
        };
    };
    preferences?: {
        autoAdvance?: boolean;
        parallelization?: boolean;
        verbose?: boolean;
    };
    flows?: Record<string, {
        enabled: boolean;
        trigger?: string;
    }>;
}
export declare class ConfigManager {
    private projectRoot;
    private configPath;
    private config;
    constructor(projectRoot: string);
    private resolveConfigPath;
    load(): ProjectConfig;
    save(config?: ProjectConfig): void;
    get(key?: string): ProjectConfig | unknown;
    set(key: string, value: unknown): void;
    getWithDefaults(key: string, defaultValue: unknown): unknown;
    validate(): {
        valid: boolean;
        errors: string[];
    };
    static init(projectRoot: string): string;
}
//# sourceMappingURL=config-manager.d.ts.map