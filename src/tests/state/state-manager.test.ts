import { StateManager } from '../../state/state-manager'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdirSync, rmSync, writeFileSync } from 'fs'

describe('StateManager', () => {
  let stateManager: StateManager
  let testDir: string
  
  beforeEach(() => {
    testDir = join(tmpdir(), `paul-test-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })
    stateManager = new StateManager(testDir)
  })
  
  afterEach(() => {
    // Cleanup test directory
    rmSync(testDir, { recursive: true, force: true })
  })
  
  describe('loadPhaseState', () => {
    it('should return null for non-existent state', () => {
      const state = stateManager.loadPhaseState(1)
      expect(state).toBeNull()
    })
    
    it('should load valid phase state', () => {
      // Create .paul directory and state file
      const paulDir = join(testDir, '.paul')
      mkdirSync(paulDir)
      
      const stateFile = join(paulDir, 'state-phase-1.json')
      const stateData = {
        phase: 'PLAN',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      }
      
      writeFileSync(stateFile, JSON.stringify(stateData))
      
      const loaded = stateManager.loadPhaseState(1)
      expect(loaded).not.toBeNull()
      expect(loaded?.phase).toBe('PLAN')
      expect(loaded?.phaseNumber).toBe(1)
    })
    
    it('should return null for invalid state', () => {
      const paulDir = join(testDir, '.paul')
      mkdirSync(paulDir)
      
      const stateFile = join(paulDir, 'state-phase-1.json')
      writeFileSync(stateFile, 'invalid json')
      
      const loaded = stateManager.loadPhaseState(1)
      expect(loaded).toBeNull()
    })
  })
  
  describe('savePhaseState', () => {
    it('should save state with atomic writes', async () => {
      const state = {
        phase: 'PLAN' as const,
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: { test: true },
      }
      
      await stateManager.savePhaseState(1, state)
      
      const loaded = stateManager.loadPhaseState(1)
      expect(loaded).not.toBeNull()
      expect(loaded?.phase).toBe('PLAN')
    })
    
    it('should validate state with Zod schema', async () => {
      const invalidState = {
        phase: 'INVALID' as any,
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      }
      
      await expect(stateManager.savePhaseState(1, invalidState)).rejects.toThrow()
    })
  })
  
  describe('getRequiredNextAction', () => {
    it('should return correct action for each phase', () => {
      expect(stateManager.getRequiredNextAction('PLAN')).toContain('apply')
      expect(stateManager.getRequiredNextAction('APPLY')).toContain('unify')
      expect(stateManager.getRequiredNextAction('UNIFY')).toContain('plan')
    })
  })
  
  describe('getCurrentPosition', () => {
    it('should return undefined when no state files exist', () => {
      const position = stateManager.getCurrentPosition()
      expect(position).toBeUndefined()
    })
    
    it('should return undefined when .paul directory exists but has no state files', () => {
      // Create .paul directory with files that don't match the pattern
      const paulDir = join(testDir, '.paul')
      mkdirSync(paulDir)
      writeFileSync(join(paulDir, 'other.json'), '{}')
      writeFileSync(join(paulDir, 'config.json'), '{}')
      
      const position = stateManager.getCurrentPosition()
      expect(position).toBeUndefined()
    })
    
    it('should return undefined when state file is corrupted', () => {
      // Create .paul directory with corrupted state file
      const paulDir = join(testDir, '.paul')
      mkdirSync(paulDir)
      writeFileSync(join(paulDir, 'state-phase-1.json'), 'invalid json')
      
      const position = stateManager.getCurrentPosition()
      expect(position).toBeUndefined()
    })
    
    it('should return latest phase position', async () => {
      // Create multiple phase states
      await stateManager.savePhaseState(1, {
        phase: 'UNIFY',
        phaseNumber: 1,
        lastUpdated: Date.now() - 1000,
        metadata: {},
      })
      
      await stateManager.savePhaseState(2, {
        phase: 'PLAN',
        phaseNumber: 2,
        lastUpdated: Date.now(),
        metadata: {},
      })
      
      const position = stateManager.getCurrentPosition()
      expect(position).toBeDefined()
      expect(position?.phaseNumber).toBe(2)
      expect(position?.phase).toBe('PLAN')
    })
  })
})
