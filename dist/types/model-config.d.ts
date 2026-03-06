import { z } from 'zod';
import type { SubStage } from './sub-stage';
/**
 * Model Reference - OpenCode-compatible model identifier
 *
 * Format: "provider/model" or "provider/sub-provider/model"
 * Examples: "anthropic/claude-sonnet-4-5", "synthetic/deepseek-ai/DeepSeek-R1"
 */
export interface ModelReference {
    provider: string;
    model: string;
    subProvider?: string;
}
/**
 * Zod schema for ModelReference validation
 */
export declare const ModelReferenceSchema: z.ZodObject<{
    provider: z.ZodString;
    model: z.ZodString;
    subProvider: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    provider: string;
    model: string;
    subProvider?: string | undefined;
}, {
    provider: string;
    model: string;
    subProvider?: string | undefined;
}>;
/**
 * Model Options - Provider-specific configuration
 *
 * Matches OpenCode's model configuration options
 */
export interface ModelOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';
    thinking?: {
        type: 'enabled' | 'disabled';
        budgetTokens?: number;
    };
    [key: string]: unknown;
}
/**
 * Zod schema for ModelOptions validation
 */
export declare const ModelOptionsSchema: z.ZodObject<{
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
    thinking: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["enabled", "disabled"]>;
        budgetTokens: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "enabled" | "disabled";
        budgetTokens?: number | undefined;
    }, {
        type: "enabled" | "disabled";
        budgetTokens?: number | undefined;
    }>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
    thinking: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["enabled", "disabled"]>;
        budgetTokens: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "enabled" | "disabled";
        budgetTokens?: number | undefined;
    }, {
        type: "enabled" | "disabled";
        budgetTokens?: number | undefined;
    }>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
    thinking: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["enabled", "disabled"]>;
        budgetTokens: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type: "enabled" | "disabled";
        budgetTokens?: number | undefined;
    }, {
        type: "enabled" | "disabled";
        budgetTokens?: number | undefined;
    }>>;
}, z.ZodTypeAny, "passthrough">>;
/**
 * Model Configuration - Complete model setup for a sub-stage
 */
export interface ModelConfig {
    ref: ModelReference;
    options?: ModelOptions;
    description?: string;
}
/**
 * Zod schema for ModelConfig validation
 */
export declare const ModelConfigSchema: z.ZodObject<{
    ref: z.ZodObject<{
        provider: z.ZodString;
        model: z.ZodString;
        subProvider: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        model: string;
        subProvider?: string | undefined;
    }, {
        provider: string;
        model: string;
        subProvider?: string | undefined;
    }>;
    options: z.ZodOptional<z.ZodObject<{
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
        thinking: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["enabled", "disabled"]>;
            budgetTokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }>>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
        thinking: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["enabled", "disabled"]>;
            budgetTokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
        thinking: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["enabled", "disabled"]>;
            budgetTokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough">>>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    ref: {
        provider: string;
        model: string;
        subProvider?: string | undefined;
    };
    options?: z.objectOutputType<{
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
        thinking: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["enabled", "disabled"]>;
            budgetTokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    description?: string | undefined;
}, {
    ref: {
        provider: string;
        model: string;
        subProvider?: string | undefined;
    };
    options?: z.objectInputType<{
        temperature: z.ZodOptional<z.ZodNumber>;
        maxTokens: z.ZodOptional<z.ZodNumber>;
        topP: z.ZodOptional<z.ZodNumber>;
        reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
        thinking: z.ZodOptional<z.ZodObject<{
            type: z.ZodEnum<["enabled", "disabled"]>;
            budgetTokens: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }, {
            type: "enabled" | "disabled";
            budgetTokens?: number | undefined;
        }>>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
    description?: string | undefined;
}>;
/**
 * Model Configuration File - Top-level configuration structure
 *
 * Stored in .paul/model-config.json
 */
export interface ModelConfigFile {
    version: '1.0';
    default: ModelConfig;
    subStages?: Partial<Record<SubStage, ModelConfig>>;
    lastUpdated: number;
}
/**
 * Zod schema for ModelConfigFile validation
 */
export declare const ModelConfigFileSchema: z.ZodObject<{
    version: z.ZodLiteral<"1.0">;
    default: z.ZodObject<{
        ref: z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodString;
            subProvider: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        }, {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        }>;
        options: z.ZodOptional<z.ZodObject<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectOutputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    }, {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectInputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    }>;
    subStages: z.ZodOptional<z.ZodRecord<z.ZodEnum<["plan-research", "plan-blueprint", "plan-critique", "apply-slicing", "apply-codegen", "apply-debug", "unify-diff-analysis", "unify-verification", "unify-documentation"]>, z.ZodObject<{
        ref: z.ZodObject<{
            provider: z.ZodString;
            model: z.ZodString;
            subProvider: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        }, {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        }>;
        options: z.ZodOptional<z.ZodObject<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough">>>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectOutputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    }, {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectInputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    }>>>;
    lastUpdated: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lastUpdated: number;
    version: "1.0";
    default: {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectOutputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    };
    subStages?: Partial<Record<"plan-research" | "plan-blueprint" | "plan-critique" | "apply-slicing" | "apply-codegen" | "apply-debug" | "unify-diff-analysis" | "unify-verification" | "unify-documentation", {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectOutputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    }>> | undefined;
}, {
    lastUpdated: number;
    version: "1.0";
    default: {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectInputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    };
    subStages?: Partial<Record<"plan-research" | "plan-blueprint" | "plan-critique" | "apply-slicing" | "apply-codegen" | "apply-debug" | "unify-diff-analysis" | "unify-verification" | "unify-documentation", {
        ref: {
            provider: string;
            model: string;
            subProvider?: string | undefined;
        };
        options?: z.objectInputType<{
            temperature: z.ZodOptional<z.ZodNumber>;
            maxTokens: z.ZodOptional<z.ZodNumber>;
            topP: z.ZodOptional<z.ZodNumber>;
            reasoningEffort: z.ZodOptional<z.ZodEnum<["none", "minimal", "low", "medium", "high", "xhigh"]>>;
            thinking: z.ZodOptional<z.ZodObject<{
                type: z.ZodEnum<["enabled", "disabled"]>;
                budgetTokens: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }, {
                type: "enabled" | "disabled";
                budgetTokens?: number | undefined;
            }>>;
        }, z.ZodTypeAny, "passthrough"> | undefined;
        description?: string | undefined;
    }>> | undefined;
}>;
/**
 * Create default model configuration
 * Called by /paul:init command
 */
export declare function createDefaultModelConfig(): ModelConfigFile;
//# sourceMappingURL=model-config.d.ts.map