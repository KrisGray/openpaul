import { z } from 'zod'
import type { LoopPhase } from './loop'

/**
 * Command - User command to interact with PAUL
 * 
 * Commands include:
 * - /paul:init - Initialize PAUL in project
 * - /paul:plan - Create executable plan
 * - /paul:apply - Execute approved plan
 * - /paul:unify - Close the loop
 * - /paul:progress - View current status
 * - /paul:help - Command reference
 * - And 20 more commands from roadmap
 */
export type CommandType =
  | 'init'
  | 'plan'
  | 'apply'
  | 'unify'
  | 'progress'
  | 'help'
  | 'pause'
  | 'resume'
  | 'handoff'
  | 'status'
  | 'milestone'
  | 'complete-milestone'
  | 'discuss-milestone'
  | 'map-codebase'
  | 'discuss'
  | 'assumptions'
  | 'discover'
  | 'consider-issues'
  | 'research'
  | 'research-phase'
  | 'verify'
  | 'plan-fix'
  | 'add-phase'
  | 'remove-phase'
  | 'flows'
  | 'config'

/**
 * Command Input - User input for a command
 */
export interface CommandInput {
  type: CommandType
  args: string[]
  flags: Record<string, unknown>
}

export const CommandInputSchema = z.object({
  type: z.enum([
    'init', 'plan', 'apply', 'unify', 'progress', 'help',
    'pause', 'resume', 'handoff', 'status',
    'milestone', 'complete-milestone', 'discuss-milestone', 'map-codebase',
    'discuss', 'assumptions', 'discover', 'consider-issues',
    'research', 'research-phase', 'verify', 'plan-fix',
    'add-phase', 'remove-phase', 'flows', 'config',
  ]),
  args: z.array(z.string()),
  flags: z.record(z.string(), z.unknown()),
})

/**
 * Command Result - Result of executing a command
 */
export interface CommandResult {
  success: boolean
  message: string
  data: unknown | null
  nextAction: string | null
}

export const CommandResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.unknown().nullable(),
  nextAction: z.string().nullable(),
})

/**
 * Command Handler - Function that handles a command
 */
export type CommandHandler = (
  input: CommandInput,
  context: CommandContext
) => Promise<CommandResult>

/**
 * Command Context - Context passed to command handlers
 */
export interface CommandContext {
  projectRoot: string
  currentState: LoopPhase
  phaseNumber: number
}
