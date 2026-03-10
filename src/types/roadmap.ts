import { z } from 'zod'

/**
 * Phase Entry - Represents a phase in the ROADMAP.md
 * 
 * Contains the essential information about a phase:
 * - number: Phase number (1, 2, 3, etc.)
 * - name: Human-readable name (e.g., "Core Loop Infrastructure")
 * - status: Current status of the phase
 * - directoryName: Directory name format (e.g., "04-roadmap-management")
 */
export interface PhaseEntry {
  number: number
  name: string
  status: 'pending' | 'in-progress' | 'complete'
  directoryName: string
}

/**
 * Zod schema for PhaseEntry validation
 */
export const PhaseEntrySchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1),
  status: z.enum(['pending', 'in-progress', 'complete']),
  directoryName: z.string().min(1),
})

/**
 * Add Phase Options - Options for adding a new phase
 * 
 * Specifies where to insert the new phase:
 * - name: Required name for the new phase
 * - position: Insert 'after' or 'before' the reference phase
 * - referencePhase: The phase number to use as reference point
 */
export interface AddPhaseOptions {
  name: string
  position: 'after' | 'before'
  referencePhase: number
}

/**
 * Zod schema for AddPhaseOptions validation
 */
export const AddPhaseOptionsSchema = z.object({
  name: z.string().min(1),
  position: z.enum(['after', 'before']),
  referencePhase: z.number().int().positive(),
})

/**
 * Remove Phase Result - Result of removing a phase
 * 
 * Contains information about what was removed and affected:
 * - success: Whether the removal was successful
 * - removedPhase: The phase that was removed (null if failed)
 * - renumberedPhases: Array of phase numbers that were renumbered
 */
export interface RemovePhaseResult {
  success: boolean
  removedPhase: PhaseEntry | null
  renumberedPhases: number[]
}

/**
 * Zod schema for RemovePhaseResult validation
 */
export const RemovePhaseResultSchema = z.object({
  success: z.boolean(),
  removedPhase: PhaseEntrySchema.nullable(),
  renumberedPhases: z.array(z.number().int().positive()),
})

/**
 * Roadmap Validation Result - Result of validating a phase operation
 * 
 * Contains validation status and any errors found:
 * - valid: Whether the operation is valid
 * - errors: Array of error messages if validation failed
 */
export interface RoadmapValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Zod schema for RoadmapValidationResult validation
 */
export const RoadmapValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
})
