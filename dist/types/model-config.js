import { z } from 'zod';
import { SubStageSchema } from './sub-stage';
/**
 * Zod schema for ModelReference validation
 */
export const ModelReferenceSchema = z.object({
    provider: z.string().min(1, 'Provider is required'),
    model: z.string().min(1, 'Model is required'),
    subProvider: z.string().optional(),
});
/**
 * Zod schema for ModelOptions validation
 */
export const ModelOptionsSchema = z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().positive().optional(),
    topP: z.number().min(0).max(1).optional(),
    reasoningEffort: z.enum(['none', 'minimal', 'low', 'medium', 'high', 'xhigh']).optional(),
    thinking: z.object({
        type: z.enum(['enabled', 'disabled']),
        budgetTokens: z.number().int().positive().optional(),
    }).optional(),
}).passthrough(); // Allow additional properties
/**
 * Zod schema for ModelConfig validation
 */
export const ModelConfigSchema = z.object({
    ref: ModelReferenceSchema,
    options: ModelOptionsSchema.optional(),
    description: z.string().optional(),
});
/**
 * Zod schema for ModelConfigFile validation
 */
export const ModelConfigFileSchema = z.object({
    version: z.literal('1.0'),
    default: ModelConfigSchema,
    subStages: z.record(SubStageSchema, ModelConfigSchema).optional(),
    lastUpdated: z.number(),
});
/**
 * Create default model configuration
 * Called by /paul:init command
 */
export function createDefaultModelConfig() {
    return {
        version: '1.0',
        default: {
            ref: {
                provider: 'anthropic',
                model: 'claude-sonnet-4-5',
            },
            description: 'Default model for all sub-stages',
        },
        subStages: {
            // Use higher-reasoning model for planning research
            'plan-research': {
                ref: {
                    provider: 'anthropic',
                    model: 'claude-opus-4-5',
                },
                options: {
                    reasoningEffort: 'high',
                },
                description: 'High-reasoning model for planning research phase',
            },
        },
        lastUpdated: Date.now(),
    };
}
//# sourceMappingURL=model-config.js.map