import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { atomicWrite } from './atomic-writes'
import type { State } from '../types/state'
import { StateSchema } from '../types/state'

/**
 * File Manager
 * 
 * Manages PAUL state files with per-phase organization.
 * Files are named: state-phase-{N}.json
 */
export class FileManager {
  private paulDir: string
  
  constructor(projectRoot: string) {
    this.paulDir = join(projectRoot, '.paul')
  }
  
  /**
   * Get phase state file path
   * 
   * Pattern: .paul/state-phase-{N}.json
   */
  private getPhaseStatePath(phaseNumber: number): string {
    return join(this.paulDir, `state-phase-${phaseNumber}.json`)
  }
  
  /**
   * Read JSON file with validation
   */
  private readJSON<T>(filePath: string, schema: z.ZodSchema<T>): T | null {
    if (!existsSync(filePath)) {
      return null
    }
    
    try {
      const content = readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content)
      return schema.parse(data)
    } catch (error) {
      // Log error but don't throw - return null for missing/invalid files
      console.error(`Failed to read ${filePath}:`, error)
      return null
    }
  }
  
  /**
   * Write JSON file with atomic writes
   */
  private async writeJSON<T>(filePath: string, data: T, schema: z.ZodSchema<T>): Promise<void> {
    const validated = schema.parse(data)
    const jsonContent = JSON.stringify(validated, null, 2)
    await atomicWrite(filePath, jsonContent)
  }
  
  /**
   * Read phase state
   */
  readPhaseState(phaseNumber: number): State | null {
    const filePath = this.getPhaseStatePath(phaseNumber)
    return this.readJSON(filePath, StateSchema)
  }
  
  /**
   * Write phase state with atomic writes
   */
  async writePhaseState(phaseNumber: number, state: State): Promise<void> {
    const filePath = this.getPhaseStatePath(phaseNumber)
    await this.writeJSON(filePath, state, StateSchema)
  }
  
  /**
   * Check if phase state exists
   */
  phaseStateExists(phaseNumber: number): boolean {
    const filePath = this.getPhaseStatePath(phaseNumber)
    return existsSync(filePath)
  }
  
  /**
   * Ensure .paul directory exists
   */
  ensurePaulDir(): void {
    if (!existsSync(this.paulDir)) {
      mkdirSync(this.paulDir, { recursive: true })
    }
  }
}
