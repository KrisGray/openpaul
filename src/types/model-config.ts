import { z } from 'zod'
import type { SubStage } from './sub-stage'
import { SubStageSchema } from './sub-stage'

/**
 * Model Reference - OpenCode-compatible model identifier
 * 
 * Format: "provider/model" or "provider/sub-provider/model"
 * Examples: "anthropic/claude-sonnet-4-5", "synthetic/deepseek-ai/DeepSeek-R1"
 */
export interface ModelReference {
  provider: string
  model: string
  subProvider?: string
}

/**
 * Zod schema for ModelReference validation
 */
export const ModelReferenceSchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  model: z.string().min(1, 'Model is required'),
  subProvider: z.string().optional(),
})

/**
 * Model Options - Provider-specific configuration
 * 
 * Matches OpenCode's model configuration options
 */
export interface ModelOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  reasoningEffort?: 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
  thinking?: {
    type: 'enabled' | 'disabled'
    budgetTokens?: number
  }
  // Allow additional provider-specific options via index signature
  [key: string]: unknown
}

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
}).passthrough() // Allow additional properties

/**
 * Model Configuration - Complete model setup for a sub-stage
 */
export interface ModelConfig {
  ref: ModelReference
  options?: ModelOptions
  description?: string // Human-readable description
}

/**
 * Zod schema for ModelConfig validation
 */
export const ModelConfigSchema = z.object({
  ref: ModelReferenceSchema,
  options: ModelOptionsSchema.optional(),
  description: z.string().optional(),
})

/**
 * Model Configuration File - Top-level configuration structure
 * 
 * Stored in .paul/model-config.json
 */
export interface ModelConfigFile {
  version: '1.0' // Schema version for future migrations
  default: ModelConfig // Fallback when sub-stage not configured
  subStages?: Partial<Record<SubStage, ModelConfig>> // Optional per sub-stage
  lastUpdated: number // Unix timestamp
}

/**
 * Zod schema for ModelConfigFile validation
 */
export const ModelConfigFileSchema = z.object({
  version: z.literal('1.0'),
  default: ModelConfigSchema,
  subStages: z.record(SubStageSchema, ModelConfigSchema).optional(),
  lastUpdated: z.number(),
})

/**
 * Create default model configuration
 * Called by /paul:init command
 */
export function createDefaultModelConfig(): ModelConfigFile {
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
  }
}
