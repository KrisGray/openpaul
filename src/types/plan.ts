import { z } from 'zod'
import type { LoopPhase } from './loop'

/**
 * Task - Individual unit of work within a plan
 * 
 * Each task has:
 * - Type (auto, checkpoint:human-verify, checkpoint:decision, checkpoint:human-action)
 * - Name (descriptive identifier)
 * - Files (paths to create/modify)
 * - Action (implementation instructions)
 * - Verify (how to test completion)
 * - Done (acceptance criteria)
 */
export type TaskType = 'auto' | 'checkpoint:human-verify' | 'checkpoint:decision' | 'checkpoint:human-action'

export interface Task {
  type: TaskType
  name: string
  files?: string[]
  action: string
  verify: string
  done: string
}

export const TaskSchema = z.object({
  type: z.enum(['auto', 'checkpoint:human-verify', 'checkpoint:decision', 'checkpoint:human-action']),
  name: z.string().min(1),
  files: z.array(z.string()).optional(),
  action: z.string().min(1),
  verify: z.string().min(1),
  done: z.string().min(1),
})

/**
 * Artifact - File artifact for goal-backward verification
 */
export interface Artifact {
  path: string
  provides: string
  must_contain?: string[]
  min_lines?: number
}

export const ArtifactSchema = z.object({
  path: z.string(),
  provides: z.string(),
  must_contain: z.array(z.string()).optional(),
  min_lines: z.number().int().positive().optional(),
})

/**
 * KeyLink - Reference between files for verification
 */
export interface KeyLink {
  from: string
  to: string
  via: string
  pattern: string
}

export const KeyLinkSchema = z.object({
  from: z.string(),
  to: z.string(),
  via: z.string(),
  pattern: z.string(),
})

/**
 * Must-Haves - Goal-backward verification criteria
 */
export interface MustHaves {
  truths?: string[]
  artifacts?: Artifact[]
  key_links?: KeyLink[]
}

export const MustHavesSchema = z.object({
  truths: z.array(z.string()).default([]),
  artifacts: z.array(ArtifactSchema).default([]),
  key_links: z.array(KeyLinkSchema).default([]),
})

/**
 * Task Dependencies - Mapping of task number to dependencies
 */
export type TaskDependencies = Record<string, number[]>

/**
 * Execution Graph - Ordered waves of task execution
 */
export type ExecutionGraph = number[][]

/**
 * Plan - Executable plan with tasks
 * 
 * Plans contain:
 * - Phase and plan identifiers
 * - Type (execute or tdd)
 * - Wave number for parallel execution
 * - Dependencies on other plans
 * - Files to be modified
 * - Autonomous flag (true if no checkpoints)
 * - Tasks to execute
 * - Must-haves for goal-backward verification
 */
export interface Plan {
  phase: string
  plan: string
  type: 'execute' | 'tdd'
  wave: number
  depends_on: string[]
  files_modified: string[]
  autonomous: boolean
  requirements?: string[]
  criteria?: string[]
  boundaries?: string[]
  tasks: Task[]
  must_haves?: MustHaves
  taskDependencies?: TaskDependencies
  executionGraph?: ExecutionGraph
}

export const PlanSchema = z.object({
  phase: z.string(),
  plan: z.string(),
  type: z.enum(['execute', 'tdd']),
  wave: z.number().int().nonnegative(),
  depends_on: z.array(z.string()),
  files_modified: z.array(z.string()),
  autonomous: z.boolean(),
  requirements: z.array(z.string()).default([]),
  criteria: z.array(z.string()).default([]),
  boundaries: z.array(z.string()).default([]),
  tasks: z.array(TaskSchema).min(1).max(5),
  must_haves: MustHavesSchema.optional().default({
    truths: [],
    artifacts: [],
    key_links: [],
  }),
  taskDependencies: z.record(z.string(), z.array(z.number().int().positive())).default({}),
  executionGraph: z.array(z.array(z.number().int().positive())).default([]),
})
