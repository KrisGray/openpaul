import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { z } from 'zod';
import YAML from 'yaml';
const ProjectConfigSchema = z.object({
    version: z.string().default('1.0'),
    project: z.object({
        name: z.string(),
        description: z.string().optional(),
    }),
    integrations: z.record(z.object({
        apiKey: z.string().optional(),
        token: z.string().optional(),
        model: z.string().optional(),
    })).optional(),
    preferences: z.object({
        autoAdvance: z.boolean().optional(),
        parallelization: z.boolean().optional(),
        verbose: z.boolean().optional(),
    }).optional(),
    flows: z.record(z.object({
        enabled: z.boolean(),
        trigger: z.string().optional(),
    })).optional(),
});
const DEFAULT_CONFIG = {
    version: '1.0',
    project: {
        name: 'My Project',
        description: 'A project managed with OpenPAUL',
    },
    integrations: {},
    preferences: {
        autoAdvance: false,
        parallelization: false,
        verbose: false,
    },
    flows: {},
};
export class ConfigManager {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
        this.config = null;
        this.configPath = this.resolveConfigPath();
    }
    resolveConfigPath() {
        const openpaulConfig = join(this.projectRoot, '.openpaul', 'config.md');
        const paulConfig = join(this.projectRoot, '.paul', 'config.md');
        if (existsSync(openpaulConfig)) {
            return openpaulConfig;
        }
        if (existsSync(paulConfig)) {
            const targetPath = openpaulConfig;
            const targetDir = dirname(targetPath);
            if (!existsSync(targetDir)) {
                mkdirSync(targetDir, { recursive: true });
            }
            copyFileSync(paulConfig, targetPath);
            return targetPath;
        }
        return openpaulConfig;
    }
    load() {
        if (this.config) {
            return this.config;
        }
        if (!existsSync(this.configPath)) {
            this.config = { ...DEFAULT_CONFIG };
            return this.config;
        }
        try {
            const content = readFileSync(this.configPath, 'utf-8');
            const parsed = YAML.parse(content);
            const validated = ProjectConfigSchema.parse(parsed);
            this.config = { ...DEFAULT_CONFIG, ...validated };
            return this.config;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to parse config: ${errorMessage}`);
        }
    }
    save(config) {
        const toSave = config || this.config || DEFAULT_CONFIG;
        const dir = dirname(this.configPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        const yamlContent = YAML.stringify(toSave, { indent: 2 });
        writeFileSync(this.configPath, yamlContent, 'utf-8');
        this.config = toSave;
    }
    get(key) {
        const config = this.load();
        if (!key) {
            return config;
        }
        const keys = key.split('.');
        let value = config;
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    set(key, value) {
        const config = this.load();
        const keys = key.split('.');
        let current = config;
        for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (!(k in current) || typeof current[k] !== 'object') {
                current[k] = {};
            }
            current = current[k];
        }
        current[keys[keys.length - 1]] = value;
        this.save(config);
    }
    getWithDefaults(key, defaultValue) {
        const value = this.get(key);
        return value !== undefined ? value : defaultValue;
    }
    validate() {
        try {
            this.load();
            return { valid: true, errors: [] };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return { valid: false, errors: [message] };
        }
    }
    static init(projectRoot) {
        const configPath = join(projectRoot, '.openpaul', 'config.md');
        const dir = dirname(configPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        const yamlContent = YAML.stringify(DEFAULT_CONFIG, { indent: 2 });
        writeFileSync(configPath, yamlContent, 'utf-8');
        return configPath;
    }
}
//# sourceMappingURL=config-manager.js.map