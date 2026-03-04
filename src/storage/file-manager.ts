import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import { atomicWrite } from './atomic-writes'
import type { State } from '../types/state'
import { StateSchema } from '../types/state'
import type { ModelConfigFile } from '../types/model-config'
import { ModelConfigFileSchema } from '../types/model-config'
import type { Plan } from '../types/plan'
import { PlanSchema } from '../types/plan'

/**
 * Summary Task - Individual task summary
 */
export interface SummaryTask {
  name: string
  status: 'completed' | 'skipped' | 'failed'
  notes?: string
}

/**
 * Summary - Plan execution summary
 */
export interface Summary {
  phaseNumber: number
  planId: string
  completed: number
  total: number
  status: 'success' | 'partial' | 'failed'
  tasks: SummaryTask[]
  createdAt: number
}

/**
 * Zod schema for SummaryTask validation
 */
export const SummaryTaskSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['completed', 'skipped', 'failed']),
  notes: z.string().optional(),
})

/**
 * Zod schema for Summary validation
 */
export const SummarySchema = z.object({
  phaseNumber: z.number().int().positive(),
  planId: z.string().min(1),
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  status: z.enum(['success', 'partial', 'failed']),
  tasks: z.array(SummaryTaskSchema),
  createdAt: z.number(),
})

/**
 * File Manager
 * 
 * Manages PAUL state files with per-phase organization.
 * Files are named: state-phase-{N}.json
 */
export class FileManager {
  private paulDir: string
  private phasesDir: string
  
  constructor(projectRoot: string) {
    this.paulDir = join(projectRoot, '.paul')
    this.phasesDir = join(this.paulDir, 'phases')
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
  
  /**
   * Get model config file path
   * 
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
   * Get plan file path
   * 
   * Pattern: .paul/phases/{phaseNumber}-{planId}-PLAN.json
   */
  private getPlanPath(phaseNumber: number, planId: string): string {
    return join(this.phasesDir, `${phaseNumber}-${planId}-PLAN.json`)
  }
  
  /**
   * Read plan
   */
  readPlan(phaseNumber: number, planId: string): Plan | null {
    const filePath = this.getPlanPath(phaseNumber, planId)
    return this.readJSON(filePath, PlanSchema)
  }
  
  /**
   * Write plan with atomic writes
   */
  async writePlan(phaseNumber: number, planId: string, plan: Plan): Promise<void> {
    const filePath = this.getPlanPath(phaseNumber, planId)
    await this.writeJSON(filePath, plan, PlanSchema)
  }
  
  /**
   * Check if plan exists
   */
  planExists(phaseNumber: number, planId: string): boolean {
    const filePath = this.getPlanPath(phaseNumber, planId)
    return existsSync(filePath)
  }
  
  /**
   * Ensure .paul/phases directory exists
   */
  ensurePhasesDir(): void {
    if (!existsSync(this.phasesDir)) {
      mkdirSync(this.phasesDir, { recursive: true })
    }
  }
  
  /**
   * Get summary file path
   * 
   * Pattern: .paul/phases/{phaseNumber}-{planId}-SUMMARY.json
   */
  private getSummaryPath(phaseNumber: number, planId: string): string {
    return join(this.phasesDir, `${phaseNumber}-${planId}-SUMMARY.json`)
  }
  
  /**
   * Read summary
   */
  readSummary(phaseNumber: number, planId: string): Summary | null {
    const filePath = this.getSummaryPath(phaseNumber, planId)
    return this.readJSON(filePath, SummarySchema)
  }
  
  /**
   * Write summary with atomic writes
   */
  async writeSummary(phaseNumber: number, planId: string, summary: Summary): Promise<void> {
    const filePath = this.getSummaryPath(phaseNumber, planId)
    await this.writeJSON(filePath, summary, SummarySchema)
  }
}
