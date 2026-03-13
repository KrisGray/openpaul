import { FileManager } from '../storage/file-manager'
import type { State } from '../types'
import { StateSchema } from '../types'
import type { LoopPhase } from '../types'

/**
 * State Manager
 * 
 * Manages OpenPAUL state with per-phase organization.
 * Implements the decisions from CONTEXT.md:
 * - Per-phase state files (state-phase-N.json)
 * - Plans inline in phase state
 * - Phase-prefixed naming
 * - Derive current position from existing state files
 */
export class StateManager {
  private fileManager: FileManager
  private projectRoot: string
  
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
    this.fileManager = new FileManager(projectRoot)
  }
  
  /**
   * Load phase state
   * 
   * Returns null if phase state does not exist or is invalid.
   */
  loadPhaseState(phaseNumber: number): State | null {
    return this.fileManager.readPhaseState(phaseNumber)
  }
  
  /**
   * Save phase state
   * 
   * Validates with Zod schema before saving.
   * Uses atomic writes for zero data loss.
   */
  async savePhaseState(phaseNumber: number, state: State): Promise<void> {
    await this.fileManager.writePhaseState(phaseNumber, state)
  }
  
  /**
   * Get current loop position
   * 
   * Derives current position from existing state files.
   * Returns undefined if no phase states exist.
   */
  getCurrentPosition(): { phaseNumber: number; phase: LoopPhase } | undefined {
    // Find all phase state files
    const fs = require('fs')
    const path = require('path')
    const paulDir = path.join(this.projectRoot, '.paul')
    
    if (!fs.existsSync(paulDir)) {
      return undefined
    }
    
    // Get all state-phase-N.json files
    const files = fs.readdirSync(paulDir)
      .filter((f: string) => f.match(/state-phase-\d+\.json/))
      .sort()
    
    if (files.length === 0) {
      return undefined
    }
    
    // Load the latest phase state
    const latestFile = files[files.length - 1]
    // Files are filtered by the same regex pattern above, so match is guaranteed
    const match = latestFile.match(/state-phase-(\d+)\.json/)!
    const phaseNumber = parseInt(match[1], 10)
    const state = this.loadPhaseState(phaseNumber)
    
    if (!state) {
      return undefined
    }
    
    return { phaseNumber, phase: state.phase }
  }
  
  /**
   * Get required next action based on current state
   */
  getRequiredNextAction(currentPhase: LoopPhase): string {
    const actions: Record<LoopPhase, string> = {
      PLAN: 'Run /openpaul:apply to execute the plan',
      APPLY: 'Run /openpaul:unify to close the loop',
      UNIFY: 'Run /openpaul:plan to start a new loop',
    }
    return actions[currentPhase]
  }
}
