/**
 * ConfigManager Tests
 * 
 * Tests for ConfigManager class
 */

import { join } from 'path'
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { ConfigManager } from '../../storage/config-manager'

describe('ConfigManager class', () => {
  const tempDir = join(__dirname, 'temp-config-test')
  let configManager: ConfigManager

  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirSync(tempDir, { recursive: true })
    configManager = new ConfigManager(tempDir)
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('load', () => {
    it('should return default config when no config file exists', () => {
      const config = configManager.load()
      
      expect(config.project?.name).toBe('OpenPAUL Project')
      expect(config.project?.description).toBe('A project managed with OpenPAUL')
    })

    it('should load config from .openpaul/config.md', () => {
      const configDir = join(tempDir, '.openpaul')
      mkdirSync(configDir, { recursive: true })
      const configContent = `---
project:
  name: Test Project
  description: A test project
---
# Config
`
      writeFileSync(join(configDir, 'config.md'), configContent)

      const manager = new ConfigManager(tempDir)
      const config = manager.load()

      expect(config.project?.name).toBe('Test Project')
      expect(config.project?.description).toBe('A test project')
    })
  })

  describe('get/set', () => {
    it('should get and set config values', () => {
      configManager.set('project.name', 'New Name')
      const name = configManager.get('project.name')
      
      expect(name).toBe('New Name')
    })

    it('should throw for non-existent top-level keys', () => {
      expect(() => configManager.get('nonexistent.key')).toThrow('Unknown config key')
    })
  })

  describe('getWithDefaults', () => {
    it('should return value if exists', () => {
      configManager.set('project.name', 'Test')
      const value = configManager.getWithDefaults('project.name', 'Default')
      
      expect(value).toBe('Test')
    })

    it('should throw for missing invalid keys', () => {
      expect(() => configManager.getWithDefaults('missing.key', 'DefaultValue')).toThrow('Unknown config key')
    })
  })

  describe('validate', () => {
    it('should return valid for default config', () => {
      const result = configManager.validate()
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('init', () => {
    it('should create config file at .openpaul/config.md', () => {
      const configPath = ConfigManager.init(tempDir)
      
      expect(existsSync(configPath)).toBe(true)
      const content = readFileSync(configPath, 'utf-8')
      expect(content).toContain('project:')
    })
  })
})
