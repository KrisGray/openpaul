import { z } from 'zod'
import type { LoopPhase } from './loop'
import { LoopPhaseSchema } from './loop'

/**
 * Session State - Captures the current state of a PAUL session
 * 
 * Used for pause/resume functionality to enable:
 * - Saving session state with current PAUL loop position and work context
 * - Loading saved session state from .openpaul/SESSIONS/ directory
 * - Validating session integrity before resuming
 * - File checksums for diff generation between sessions
 */
export interface SessionState {
  /** Unique session identifier */
  sessionId: string
  /** Timestamp when session was created */
  createdAt: number
  /** Timestamp when session was paused */
  pausedAt: number
  /** Current loop phase (PLAN/APPLY/UNIFY) */
  phase: LoopPhase
  /** Current phase number */
  phaseNumber: number
  /** Current plan being executed (optional) */
  currentPlanId?: string
  /** List of work items in progress */
  workInProgress: string[]
  /** Next actions to take when resuming */
  nextSteps: string[]
  /** Additional session metadata */
  metadata: Record<string, unknown>
  /** File path to SHA256 checksum for diff generation */
  fileChecksums: Record<string, string>
}

/**
 * Zod schema for SessionState validation
 */
export const SessionStateSchema = z.object({
  sessionId: z.string().min(1, 'sessionId must be a non-empty string'),
  createdAt: z.number().positive('createdAt must be a positive number'),
  pausedAt: z.number().positive('pausedAt must be a positive number'),
  phase: LoopPhaseSchema,
  phaseNumber: z.number().int().positive('phaseNumber must be a positive integer'),
  currentPlanId: z.string().optional(),
  workInProgress: z.array(z.string()),
  nextSteps: z.array(z.string()),
  metadata: z.record(z.string(), z.unknown()),
  fileChecksums: z.record(z.string(), z.string()),
})
