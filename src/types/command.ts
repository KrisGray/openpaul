import { z } from 'zod'
import type { LoopPhase } from './loop'

/**
 * Command - User command to interact with OpenPAUL
 * 
 * Commands include:
 * - /openpaul:init - Initialize OpenPAUL in project
 * - /openpaul:plan - Create executable plan
 * - /openpaul:apply - Execute approved plan
 * - /openpaul:unify - Close the loop
 * - /openpaul:progress - View current status
 * - /openpaul:help - Command reference
 * - And 10 more commands from roadmap
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
  | 'milestone'
  | 'complete-milestone'
  | 'map-codebase'
  | 'verify'
  | 'plan-fix'
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
    'pause', 'resume', 'handoff',
    'milestone', 'complete-milestone', 'map-codebase',
    'verify', 'plan-fix', 'flows', 'config',
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
