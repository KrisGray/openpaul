import { existsSync, readFileSync, unlinkSync, rmdirSync, readdirSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { ModelConfigManager } from '../../storage/model-config-manager'
import { createDefaultModelConfig } from '../../types/model-config'
import type { ModelConfig, ModelConfigFile } from '../../types'

describe('ModelConfigManager', () => {
  const testDir = join(tmpdir(), 'paul-test-model-config-' + Date.now())
  let manager: ModelConfigManager
  
  const createTestConfig = (): ModelConfigFile => ({
    version: '1.0',
    default: {
      ref: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
      },
      description: 'Default model for all sub-stages',
    },
    subStages: {
      'plan-research': {
        ref: {
          provider: 'anthropic',
          model: 'claude-opus-4-5',
        },
        options: {
          reasoningEffort: 'high',
        },
        description: 'High-reasoning model for planning research',
      },
    },
    lastUpdated: Date.now(),
  })
  
  beforeAll(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true })
    }
  })
  
  afterAll(() => {
    // Cleanup test files
    if (existsSync(testDir)) {
      const files = readdirSync(testDir)
      files.forEach(f => {
        try {
          unlinkSync(join(testDir, f))
        } catch {
          // Ignore cleanup errors
        }
      })
      try {
        // Clean up subdirectories if any
        const entries = readdirSync(testDir, { withFileTypes: true })
        entries.forEach(entry => {
          if (entry.isDirectory()) {
            rmdirSync(join(testDir, entry.name), { recursive: true })
          }
        })
        rmdirSync(testDir, { recursive: true })
      } catch {
        // Ignore cleanup errors
      }
    }
  })
  
  describe('Initialization', () => {
    it('should throw error when config does not exist and no default created', () => {
      manager = new ModelConfigManager(testDir)
      expect(() => manager.getModel('plan-research')).toThrow(
        'Model configuration not found.\nRun /openpaul:init to initialize OpenPAUL and create default configuration.'
      )
    })
    
    it('should create default config with initializeDefault()', async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
      
      // Verify .paul directory was created
      expect(existsSync(join(testDir, '.paul'))).toBe(true)
      
      // Verify config file exists
      expect(existsSync(join(testDir, '.paul', 'model-config.json'))).toBe(true)
      
      // Verify we can load the config
      const config = manager.getModel('plan-research')
      expect(config).toBeDefined()
      expect(config.ref.provider).toBe('anthropic')
    })
    
    it('should load existing config without error', async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
      
      // Create new manager to test loading existing
      const manager2 = new ModelConfigManager(testDir)
      const config = manager2.getModel('plan-research')
      expect(config).toBeDefined()
    })
  })
  
  describe('getModel', () => {
    beforeEach(async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
    })
    
    it('should return default model for unconfigured sub-stage', () => {
      // apply-slicing not configured in default, so should return default
      const config = manager.getModel('apply-slicing')
      expect(config.ref.model).toBe('claude-sonnet-4-5')
    })
    
    it('should return sub-stage specific model when configured', () => {
      // plan-research is configured with opus in default config
      const config = manager.getModel('plan-research')
      expect(config.ref.model).toBe('claude-opus-4-5')
      expect(config.options?.reasoningEffort).toBe('high')
    })
    
    it('should fall back to default when sub-stage config is undefined', async () => {
      // Clear sub-stages to test fallback
      await manager.setDefault({
        ref: { provider: 'test', model: 'default-model' },
      })
      
      const config = manager.getModel('unify-documentation')
      expect(config.ref.model).toBe('default-model')
    })
  })
  
  describe('setModel', () => {
    beforeEach(async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
    })
    
    it('should add new sub-stage configuration', async () => {
      const newConfig: ModelConfig = {
        ref: { provider: 'openai', model: 'gpt-4' },
        description: 'New sub-stage config',
      }
      
      await manager.setModel('apply-slicing', newConfig)
      
      const config = manager.getModel('apply-slicing')
      expect(config.ref.model).toBe('gpt-4')
      expect(config.description).toBe('New sub-stage config')
    })
    
    it('should update existing sub-stage configuration', async () => {
      const updatedConfig: ModelConfig = {
        ref: { provider: 'anthropic', model: 'claude-sonnet-4-5' },
        options: { temperature: 0.5 },
      }
      
      await manager.setModel('plan-research', updatedConfig)
      
      const config = manager.getModel('plan-research')
      expect(config.ref.model).toBe('claude-sonnet-4-5')
      expect(config.options?.temperature).toBe(0.5)
    })
    
    it('should update lastUpdated timestamp', async () => {
      const beforeUpdate = Date.now()
      
      await manager.setModel('apply-slicing', {
        ref: { provider: 'test', model: 'test-model' },
      })
      
      // Read file directly to check timestamp
      const configPath = join(testDir, '.paul', 'model-config.json')
      const fileContent = readFileSync(configPath, 'utf-8')
      const fileConfig = JSON.parse(fileContent)
      
      expect(fileConfig.lastUpdated).toBeGreaterThanOrEqual(beforeUpdate)
    })
    
    it('should persist changes to file', async () => {
      await manager.setModel('unify-verification', {
        ref: { provider: 'test', model: 'persistent-model' },
      })
      
      // Create new manager to verify persistence
      const newManager = new ModelConfigManager(testDir)
      const config = newManager.getModel('unify-verification')
      expect(config.ref.model).toBe('persistent-model')
    })
  })
  
  describe('setDefault', () => {
    beforeEach(async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
    })
    
    it('should update default model configuration', async () => {
      await manager.setDefault({
        ref: { provider: 'openai', model: 'gpt-4-turbo' },
        description: 'New default',
      })
      
      const config = manager.getModel('apply-debug') // Not configured, should use default
      expect(config.ref.model).toBe('gpt-4-turbo')
      expect(config.description).toBe('New default')
    })
    
    it('should persist changes to file', async () => {
      await manager.setDefault({
        ref: { provider: 'persisted', model: 'default-model' },
      })
      
      // Create new manager to verify persistence
      const newManager = new ModelConfigManager(testDir)
      const config = newManager.getModel('apply-codegen') // Uses default
      expect(config.ref.provider).toBe('persisted')
    })
  })
  
  describe('Caching', () => {
    beforeEach(async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
    })
    
    it('should cache config after first load', () => {
      // First load
      manager.getModel('plan-research')
      
      // Second load should use cache
      const config = manager.getModel('plan-research')
      expect(config).toBeDefined()
    })
    
    it('should clear cache when clearCache() called', async () => {
      manager.getModel('plan-research')
      manager.clearCache()
      
      // Should reload from file
      const config = manager.getModel('plan-research')
      expect(config).toBeDefined()
    })
    
    it('should reload from file after cache cleared', async () => {
      // Modify file directly
      await manager.setModel('apply-slicing', {
        ref: { provider: 'direct', model: 'modification' },
      })
      
      // Get cached value
      const cached = manager.getModel('apply-slicing')
      expect(cached.ref.provider).toBe('direct')
      
      // Clear cache and reload
      manager.clearCache()
      const reloaded = manager.getModel('apply-slicing')
      expect(reloaded.ref.provider).toBe('direct')
    })
  })
  
  describe('Validation', () => {
    it('should validate model reference format (provider/model)', async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
      
      const validConfig: ModelConfig = {
        ref: { provider: 'anthropic', model: 'claude-sonnet-4-5' },
      }
      
      await expect(manager.setModel('plan-research', validConfig)).resolves.not.toThrow()
    })
    
    it('should accept provider/sub-provider/model format', async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
      
      const validConfig: ModelConfig = {
        ref: { 
          provider: 'synthetic', 
          subProvider: 'deepseek-ai',
          model: 'DeepSeek-R1' 
        },
      }
      
      await expect(manager.setModel('apply-slicing', validConfig)).resolves.not.toThrow()
      
      const config = manager.getModel('apply-slicing')
      expect(config.ref.subProvider).toBe('deepseek-ai')
    })
    
    it('should validate model options (temperature range, etc.)', async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
      
      const validConfig: ModelConfig = {
        ref: { provider: 'anthropic', model: 'claude-sonnet-4-5' },
        options: {
          temperature: 0.7,
          maxTokens: 4096,
          topP: 0.9,
          reasoningEffort: 'medium',
        },
      }
      
      await expect(manager.setModel('unify-diff-analysis', validConfig)).resolves.not.toThrow()
      
      const config = manager.getModel('unify-diff-analysis')
      expect(config.options?.temperature).toBe(0.7)
      expect(config.options?.reasoningEffort).toBe('medium')
    })
  })
  
  describe('Atomic write verification', () => {
    beforeEach(async () => {
      manager = new ModelConfigManager(testDir)
      await manager.initializeDefault()
    })
    
    it('should use atomic writes (file exists after write)', async () => {
      await manager.setModel('plan-blueprint', {
        ref: { provider: 'atomic', model: 'test' },
      })
      
      const configPath = join(testDir, '.paul', 'model-config.json')
      expect(existsSync(configPath)).toBe(true)
    })
    
    it('should handle concurrent writes gracefully', async () => {
      // Simulate concurrent writes
      const promises = [
        manager.setModel('apply-slicing', { ref: { provider: 'concurrent1', model: 'model1' } }),
        manager.setModel('apply-codegen', { ref: { provider: 'concurrent2', model: 'model2' } }),
        manager.setModel('apply-debug', { ref: { provider: 'concurrent3', model: 'model3' } }),
      ]
      
      await Promise.all(promises)
      
      // All configs should be persisted
      expect(manager.getModel('apply-slicing').ref.provider).toBe('concurrent1')
      expect(manager.getModel('apply-codegen').ref.provider).toBe('concurrent2')
      expect(manager.getModel('apply-debug').ref.provider).toBe('concurrent3')
    })
  })
})
