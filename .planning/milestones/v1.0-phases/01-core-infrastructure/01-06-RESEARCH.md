# Phase 01-06: Model Configuration System - Research

**Researched:** 2026-03-04
**Domain:** TypeScript configuration system with model specialization
**Confidence:** HIGH

## Summary

This research investigates how to design a model configuration system for PAUL's sub-stage architecture. The system needs to support 3 sub-stages per PAUL loop phase (PLAN/APPLY/UNIFY), with each sub-stage potentially using a different model configuration. The configuration should integrate seamlessly with the existing TypeScript + Zod validation pattern used throughout the codebase.

**Primary recommendation:** Use a flat string literal union type for sub-stages with a helper type for grouping by phase. Store model configurations in `.paul/model-config.json` using the existing FileManager pattern. Support both default and custom model configurations with provider/model format matching OpenCode conventions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.0.0 | Type system | Already in use, provides excellent type inference |
| Zod | ^3.22.0 | Runtime validation | Matches existing codebase pattern (Type + Schema pairs) |
| @opencode-ai/plugin | ^1.2.0 | Plugin integration | Already integrated, provides model selection API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs (Node.js) | ^16.7.0+ | File operations | Config file reading/writing |
| JSON.parse | Native | Config parsing | Simpler than YAML, no new dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON config | YAML config | YAML is more readable but requires js-yaml dependency (280KB); JSON is native, already used in codebase |
| Enum for sub-stages | String literal union | Enums add complexity; literal unions are simpler and provide same type safety |
| Nested sub-stage structure | Flat structure | Flat is simpler to validate and query; grouping can be done with helper types |

**Installation:**
No new dependencies required. Uses existing stack (TypeScript, Zod, Node.js fs).

## Architecture Patterns

### Recommended Project Structure
```
src/
├── types/
│   ├── model-config.ts      # Model configuration types and schemas
│   ├── sub-stage.ts         # Sub-stage definitions and helpers
│   └── index.ts             # Export all types
├── storage/
│   ├── file-manager.ts      # (existing) Add model config methods
│   └── model-config-manager.ts  # Model config specific logic
└── tests/
    ├── model-config.test.ts # Model config validation tests
    └── sub-stage.test.ts    # Sub-stage type tests
```

### Pattern 1: Flat Sub-Stage Definition with Helper Types
**What:** Define sub-stages as flat string literal union, with helper types for phase grouping
**When to use:** When you need simple validation and easy grouping by parent phase
**Example:**
```typescript
// Source: Based on existing loop.ts pattern
import { z } from 'zod'

/**
 * Sub-stage - Three stages per PAUL loop phase
 * 
 * PLAN phases: plan-research, plan-create, plan-verify
 * APPLY phases: apply-prepare, apply-execute, apply-validate
 * UNIFY phases: unify-summarize, unify-reconcile, unify-close
 */
export type SubStage = 
  // PLAN sub-stages
  | 'plan-research'
  | 'plan-create'
  | 'plan-verify'
  // APPLY sub-stages
  | 'apply-prepare'
  | 'apply-execute'
  | 'apply-validate'
  // UNIFY sub-stages
  | 'unify-summarize'
  | 'unify-reconcile'
  | 'unify-close'

export const SubStageSchema = z.enum([
  'plan-research', 'plan-create', 'plan-verify',
  'apply-prepare', 'apply-execute', 'apply-validate',
  'unify-summarize', 'unify-reconcile', 'unify-close',
])

/**
 * Helper: Sub-stages grouped by parent phase
 */
export const SUB_STAGES_BY_PHASE = {
  PLAN: ['plan-research', 'plan-create', 'plan-verify'] as const,
  APPLY: ['apply-prepare', 'apply-execute', 'apply-validate'] as const,
  UNIFY: ['unify-summarize', 'unify-reconcile', 'unify-close'] as const,
} as const

/**
 * Helper: Get parent phase from sub-stage
 */
export function getParentPhase(subStage: SubStage): LoopPhase {
  const prefix = subStage.split('-')[0].toUpperCase() as LoopPhase
  return prefix
}
```

### Pattern 2: Model Configuration Schema
**What:** Configuration schema matching OpenCode's provider/model format with sub-stage mapping
**When to use:** For storing model preferences per sub-stage
**Example:**
```typescript
// Source: Based on OpenCode config pattern + existing Zod patterns
import { z } from 'zod'

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

export const ModelReferenceSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
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
  // Allow additional provider-specific options
  [key: string]: unknown
}

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
  description?: string  // Human-readable description
}

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
  version: '1.0'  // Schema version for future migrations
  default: ModelConfig  // Fallback when sub-stage not configured
  subStages: Partial<Record<SubStage, ModelConfig>>  // Optional per sub-stage
  lastUpdated: number  // Unix timestamp
}

export const ModelConfigFileSchema = z.object({
  version: z.literal('1.0'),
  default: ModelConfigSchema,
  subStages: z.record(SubStageSchema, ModelConfigSchema).optional(),
  lastUpdated: z.number(),
})
```

### Pattern 3: Configuration File Manager Integration
**What:** Extend FileManager with model config methods following existing atomic write pattern
**When to use:** For loading/saving model configurations safely
**Example:**
```typescript
// Source: Based on existing file-manager.ts pattern
export class FileManager {
  // ... existing methods ...
  
  /**
   * Get model config file path
   * Pattern: .paul/model-config.json
   */
  private getModelConfigPath(): string {
    return join(this.paulDir, 'model-config.json')
  }
  
  /**
   * Read model configuration
   */
  readModelConfig(): ModelConfigFile | null {
    const filePath = this.getModelConfigPath()
    return this.readJSON(filePath, ModelConfigFileSchema)
  }
  
  /**
   * Write model configuration with atomic writes
   */
  async writeModelConfig(config: ModelConfigFile): Promise<void> {
    const filePath = this.getModelConfigPath()
    await this.writeJSON(filePath, config, ModelConfigFileSchema)
  }
  
  /**
   * Get model config for a specific sub-stage
   * Falls back to default if sub-stage not configured
   */
  getModelForSubStage(subStage: SubStage): ModelConfig {
    const config = this.readModelConfig()
    if (!config) {
      throw new Error('Model configuration not found. Run /paul:init first.')
    }
    
    return config.subStages[subStage] ?? config.default
  }
}
```

### Anti-Patterns to Avoid
- **Nested enum structure:** Don't create `PLAN.research`, `APPLY.execute` nested enums - adds complexity without benefit
- **YAML configuration:** Don't add YAML parser dependency - JSON is native and already used in codebase
- **Separate config per sub-stage:** Don't create 9 separate config files - harder to manage, atomic writes become complex
- **Hardcoded model strings:** Don't use plain strings like "opus" - use structured ModelReference for type safety
- **Ignoring OpenCode conventions:** Don't invent custom model format - use provider/model for OpenCode compatibility

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config file parsing | Custom parser | JSON.parse + Zod validation | Native, no dependencies, matches existing pattern |
| Atomic writes | Custom locking | atomicWrite from atomic-writes.ts | Already implemented, handles edge cases |
| Sub-stage validation | Runtime checks | Zod SubStageSchema | Compile-time + runtime safety |
| Model reference parsing | String manipulation | ModelReferenceSchema | Type-safe parsing and validation |
| Default model fallback | Manual if/else | Nullish coalescing (`??`) | Cleaner, more idiomatic |

**Key insight:** The existing codebase has established patterns (Type + Schema, atomic writes, FileManager). Reusing these patterns reduces cognitive load and ensures consistency.

## Common Pitfalls

### Pitfall 1: Config File Not Initialized
**What goes wrong:** Commands try to load model config before `/paul:init` creates it
**Why it happens:** Model config file is optional, but commands assume it exists
**How to avoid:** 
- Create default config in `/paul:init` command (Phase 2)
- Throw clear error message: "Run /paul:init first to configure models"
- Provide sensible default in error message
**Warning signs:** Null pointer errors when accessing model config

### Pitfall 2: Invalid Model Reference Format
**What goes wrong:** User enters "gpt-5" instead of "openai/gpt-5"
**Why it happens:** OpenCode requires provider/model format but users may not know
**How to avoid:**
- Validate format with Zod schema before saving
- Provide clear error: "Model format must be 'provider/model' (e.g., 'anthropic/claude-sonnet-4-5')"
- In Phase 2, integrate with OpenCode's `/models` command for interactive selection
**Warning signs:** String parsing errors, provider not found errors

### Pitfall 3: Sub-Stage Mismatch
**What goes wrong:** Config has typo in sub-stage name like "plan-researcher" instead of "plan-research"
**Why it happens:** String-based keys are error-prone without validation
**How to avoid:**
- Use SubStageSchema for key validation in ModelConfigFileSchema
- Zod will reject invalid sub-stage names at runtime
- TypeScript will catch typos at compile time
**Warning signs:** Config validates but wrong sub-stage used, falls back to default silently

### Pitfall 4: Concurrent Config Modifications
**What goes wrong:** Two processes write to model-config.json simultaneously, one overwrites the other
**Why it happens:** Multiple OpenCode sessions or concurrent commands
**How to avoid:**
- Use atomic writes (temp file + rename) from atomic-writes.ts
- This is already implemented and used for state files
**Warning signs:** Config changes disappear, corrupted JSON files

### Pitfall 5: Schema Version Mismatch
**What goes wrong:** Old config file format doesn't match new schema after PAUL upgrade
**Why it happens:** Config file persists across PAUL version updates
**How to avoid:**
- Include `version: '1.0'` field in config
- Write migration logic if schema changes
- Fail gracefully with migration instructions
**Warning signs:** Zod validation errors after upgrade

## Code Examples

Verified patterns from official sources and existing codebase:

### Creating Default Model Configuration
```typescript
// Source: Based on OpenCode recommended models + existing State pattern
import type { ModelConfigFile } from '../types/model-config'

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
      // Example: Use higher-reasoning model for planning research
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
      // Example: Use faster model for simple apply execution
      'apply-execute': {
        ref: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-5',
        },
        description: 'Balanced model for task execution',
      },
    },
    lastUpdated: Date.now(),
  }
}
```

### Model Configuration Manager
```typescript
// Source: Based on existing file-manager.ts + state-manager.ts patterns
import { FileManager } from './file-manager'
import type { ModelConfig, ModelConfigFile, SubStage } from '../types'

export class ModelConfigManager {
  private fileManager: FileManager
  private cached: ModelConfigFile | null = null
  
  constructor(projectRoot: string) {
    this.fileManager = new FileManager(projectRoot)
  }
  
  /**
   * Load model config with caching
   */
  private load(): ModelConfigFile {
    if (this.cached) {
      return this.cached
    }
    
    const config = this.fileManager.readModelConfig()
    if (!config) {
      throw new Error(
        'Model configuration not found.\n' +
        'Run /paul:init to initialize PAUL and create default configuration.'
      )
    }
    
    this.cached = config
    return config
  }
  
  /**
   * Get model for a specific sub-stage
   * Returns sub-stage config if set, otherwise default
   */
  getModel(subStage: SubStage): ModelConfig {
    const config = this.load()
    return config.subStages[subStage] ?? config.default
  }
  
  /**
   * Update model for a specific sub-stage
   */
  async setModel(subStage: SubStage, modelConfig: ModelConfig): Promise<void> {
    const config = this.load()
    config.subStages[subStage] = modelConfig
    config.lastUpdated = Date.now()
    await this.fileManager.writeModelConfig(config)
    this.cached = config  // Update cache
  }
  
  /**
   * Update default model
   */
  async setDefault(modelConfig: ModelConfig): Promise<void> {
    const config = this.load()
    config.default = modelConfig
    config.lastUpdated = Date.now()
    await this.fileManager.writeModelConfig(config)
    this.cached = config
  }
  
  /**
   * Clear cache (call when config file changes externally)
   */
  clearCache(): void {
    this.cached = null
  }
}
```

### OpenCode Integration (Future Phase 2)
```typescript
// Source: Based on OpenCode plugin API patterns
import type { Plugin } from '@opencode-ai/plugin'
import type { SubStage } from '../types'

/**
 * Get OpenCode-compatible model ID for a sub-stage
 * 
 * Returns format: "provider/model" or "provider/sub-provider/model"
 * This can be passed to OpenCode's task() or agent selection
 */
export function getOpenCodeModelId(subStage: SubStage): string {
  const manager = new ModelConfigManager(process.cwd())
  const config = manager.getModel(subStage)
  
  const { provider, subProvider, model } = config.ref
  
  if (subProvider) {
    return `${provider}/${subProvider}/${model}`
  }
  
  return `${provider}/${model}`
}

/**
 * Example usage in Phase 2 command
 */
export const planCommand = {
  name: 'plan',
  description: 'Create an executable plan',
  async execute(context: Plugin.Context) {
    const modelId = getOpenCodeModelId('plan-create')
    
    await context.task({
      prompt: 'Create a plan...',
      model: modelId,  // Pass to OpenCode
      // ... other options from config.options
    })
  },
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| String-based model names | Structured ModelReference | This phase | Type safety, validation, OpenCode compatibility |
| YAML config files | JSON with Zod validation | This phase | No dependencies, native parsing, runtime validation |
| Hardcoded model selection | Per-sub-stage configuration | This phase | Flexibility, optimization per task type |
| Global model setting | Sub-stage specific models | This phase | Better cost/quality balance per task |

**Deprecated/outdated:**
- Plain string model identifiers (e.g., `"gpt-4"`): Use ModelReference with provider/model format for type safety
- Manual config file edits without validation: Always use Zod schemas to validate before write
- Separate config files per sub-stage: Use single config file with subStages map

## Open Questions

1. **Should model configurations support environment variable substitution?**
   - What we know: OpenCode supports `{env:VAR_NAME}` in config files
   - What's unclear: Should PAUL support this for API keys in model configs?
   - Recommendation: No - API keys should be managed through OpenCode's `/connect` command, not in PAUL config. Keep PAUL config focused on model selection, not authentication.

2. **Should we support model profiles (quality/balanced/budget) like GSD?**
   - What we know: GSD has model profiles that map agents to models based on quality tier
   - What's unclear: Does PAUL need this level of abstraction, or is per-sub-stage config sufficient?
   - Recommendation: Start with per-sub-stage config. Add profiles in future if needed (can be built on top of current system).

3. **Should model config support model variants (high/low reasoning effort)?**
   - What we know: OpenCode supports model variants with different configurations
   - What's unclear: Should PAUL expose this or simplify it?
   - Recommendation: Yes - include in ModelOptions. This is powerful for optimizing cost/quality per sub-stage (e.g., high reasoning for plan-research, low for apply-execute).

## Sources

### Primary (HIGH confidence)
- OpenCode Models Documentation (https://opencode.ai/docs/models/) - Model selection, provider/model format, variants
- OpenCode Config Documentation (https://opencode.ai/docs/config/) - Configuration file format, JSON/JSONC support
- Existing codebase patterns (src/types/*.ts, src/storage/file-manager.ts) - Type + Schema pattern, FileManager usage

### Secondary (MEDIUM confidence)
- Zod documentation (https://zod.dev/) - Schema validation patterns
- Web search: TypeScript configuration schema best practices 2024-2025 - Zod validation patterns
- Web search: State machine TypeScript enum patterns - Flat vs nested enum tradeoffs

### Tertiary (LOW confidence)
- None - All critical findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing dependencies (TypeScript, Zod, Node.js fs), no new libraries needed
- Architecture: HIGH - Based on existing codebase patterns (Type + Schema, FileManager, atomic writes), OpenCode conventions
- Pitfalls: HIGH - Based on common configuration mistakes and existing atomic write safeguards

**Research date:** 2026-03-04
**Valid until:** 30 days (stable patterns, unlikely to change significantly)
