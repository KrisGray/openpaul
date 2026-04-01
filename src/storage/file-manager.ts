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
 * Manages OpenPAUL state files with per-phase organization.
 * Uses dual-path resolution: checks .openpaul/ first, falls back to .paul/ for migration compatibility.
 * Files are named: state-phase-{N}.json
 */
export class FileManager {
  private openPaulDir: string
  private paulDir: string
  private phasesDir: string
  
  constructor(projectRoot: string) {
    this.openPaulDir = join(projectRoot, '.openpaul')
    this.paulDir = join(projectRoot, '.paul')
    this.phasesDir = join(this.openPaulDir, 'phases')
  }
  
  /**
   * Get phase state file path for READS
   * Checks .openpaul first, falls back to .paul for migration compatibility.
   */
  private getPhaseStateReadPath(phaseNumber: number): string {
    const openPaulPath = join(this.openPaulDir, `state-phase-${phaseNumber}.json`)
    if (existsSync(openPaulPath)) {
      return openPaulPath
    }
    const paulPath = join(this.paulDir, `state-phase-${phaseNumber}.json`)
    if (existsSync(paulPath)) {
      return paulPath
    }
    return openPaulPath
  }

  /**
   * Get phase state file path for WRITES — always .openpaul/
   */
  private getPhaseStateWritePath(phaseNumber: number): string {
    return join(this.openPaulDir, `state-phase-${phaseNumber}.json`)
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
    const filePath = this.getPhaseStateReadPath(phaseNumber)
    return this.readJSON(filePath, StateSchema)
  }
  
  /**
   * Write phase state with atomic writes — always to .openpaul/
   */
  async writePhaseState(phaseNumber: number, state: State): Promise<void> {
    const filePath = this.getPhaseStateWritePath(phaseNumber)
    await this.writeJSON(filePath, state, StateSchema)
  }
  
  /**
   * Check if phase state exists
   */
  phaseStateExists(phaseNumber: number): boolean {
    const filePath = this.getPhaseStateReadPath(phaseNumber)
    return existsSync(filePath)
  }
  
  /**
   * Ensure .openpaul directory exists
   */
  ensurePaulDir(): void {
    if (!existsSync(this.openPaulDir)) {
      mkdirSync(this.openPaulDir, { recursive: true })
    }
  }
  
  /**
   * Get model config path for READS — checks .openpaul first, falls back to .paul
   */
  private getModelConfigReadPath(): string {
    const openPaulPath = join(this.openPaulDir, 'model-config.json')
    if (existsSync(openPaulPath)) {
      return openPaulPath
    }
    const paulPath = join(this.paulDir, 'model-config.json')
    if (existsSync(paulPath)) {
      return paulPath
    }
    return openPaulPath
  }

  /**
   * Get model config path for WRITES — always .openpaul/
   */
  private getModelConfigWritePath(): string {
    return join(this.openPaulDir, 'model-config.json')
  }
  
  /**
   * Read model configuration
   */
  readModelConfig(): ModelConfigFile | null {
    const filePath = this.getModelConfigReadPath()
    return this.readJSON(filePath, ModelConfigFileSchema)
  }
  
  /**
   * Write model configuration with atomic writes — always to .openpaul/
   */
  async writeModelConfig(config: ModelConfigFile): Promise<void> {
    const filePath = this.getModelConfigWritePath()
    await this.writeJSON(filePath, config, ModelConfigFileSchema)
  }
  
  /**
   * Get plan path for READS — checks .openpaul/phases first, falls back to .paul/phases
   */
  private getPlanReadPath(phaseNumber: number, planId: string): string {
    const openPaulPath = join(this.openPaulDir, 'phases', `${phaseNumber}-${planId}-PLAN.json`)
    if (existsSync(openPaulPath)) {
      return openPaulPath
    }
    const paulPath = join(this.paulDir, 'phases', `${phaseNumber}-${planId}-PLAN.json`)
    if (existsSync(paulPath)) {
      return paulPath
    }
    return openPaulPath
  }

  /**
   * Get plan path for WRITES — always .openpaul/phases/
   */
  private getPlanWritePath(phaseNumber: number, planId: string): string {
    return join(this.openPaulDir, 'phases', `${phaseNumber}-${planId}-PLAN.json`)
  }
  
  /**
   * Read plan
   */
  readPlan(phaseNumber: number, planId: string): Plan | null {
    const filePath = this.getPlanReadPath(phaseNumber, planId)
    return this.readJSON(filePath, PlanSchema)
  }
  
  /**
   * Write plan with atomic writes — always to .openpaul/phases/
   */
  async writePlan(phaseNumber: number, planId: string, plan: Plan): Promise<void> {
    const filePath = this.getPlanWritePath(phaseNumber, planId)
    await this.writeJSON(filePath, plan, PlanSchema)
  }

  /**
   * Write plan markdown summary — always to .openpaul/phases/
   */
  async writePlanMarkdown(phaseNumber: number, planId: string, markdown: string): Promise<void> {
    const filePath = join(this.openPaulDir, 'phases', `${phaseNumber}-${planId}-PLAN.md`)
    await atomicWrite(filePath, markdown)
  }
  
  /**
   * Check if plan exists
   */
  planExists(phaseNumber: number, planId: string): boolean {
    const filePath = this.getPlanReadPath(phaseNumber, planId)
    return existsSync(filePath)
  }
  
  /**
   * Ensure .openpaul/phases directory exists
   */
  ensurePhasesDir(): void {
    if (!existsSync(this.phasesDir)) {
      mkdirSync(this.phasesDir, { recursive: true })
    }
  }
  
  /**
   * Get summary path for READS — checks .openpaul/phases first, falls back to .paul/phases
   */
  private getSummaryReadPath(phaseNumber: number, planId: string): string {
    const openPaulPath = join(this.openPaulDir, 'phases', `${phaseNumber}-${planId}-SUMMARY.json`)
    if (existsSync(openPaulPath)) {
      return openPaulPath
    }
    const paulPath = join(this.paulDir, 'phases', `${phaseNumber}-${planId}-SUMMARY.json`)
    if (existsSync(paulPath)) {
      return paulPath
    }
    return openPaulPath
  }

  /**
   * Get summary path for WRITES — always .openpaul/phases/
   */
  private getSummaryWritePath(phaseNumber: number, planId: string): string {
    return join(this.openPaulDir, 'phases', `${phaseNumber}-${planId}-SUMMARY.json`)
  }
  
  /**
   * Read summary
   */
  readSummary(phaseNumber: number, planId: string): Summary | null {
    const filePath = this.getSummaryReadPath(phaseNumber, planId)
    return this.readJSON(filePath, SummarySchema)
  }
  
  /**
   * Write summary with atomic writes — always to .openpaul/phases/
   */
  async writeSummary(phaseNumber: number, planId: string, summary: Summary): Promise<void> {
    const filePath = this.getSummaryWritePath(phaseNumber, planId)
    await this.writeJSON(filePath, summary, SummarySchema)
  }
}
