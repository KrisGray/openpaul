import { z } from 'zod'

/**
 * Milestone status - Current state of a milestone
 */
export type MilestoneStatus = 'planned' | 'in-progress' | 'completed'

/**
 * Zod schema for MilestoneStatus validation
 */
export const MilestoneStatusSchema = z.enum(['planned', 'in-progress', 'completed'])

/**
 * Milestone - Represents a project milestone
 * 
 * A milestone groups multiple phases into a meaningful deliverable.
 * Milestones track progress, completion, and archive history.
 * 
 * Fields:
 * - name: Milestone identifier (e.g., "v1.1 Full Command Implementation")
 * - scope: Description of what the milestone delivers
 * - phases: Array of phase numbers included in milestone
 * - theme: Optional theme/slogan for the milestone
 * - status: Current status (planned, in-progress, completed)
 * - startedAt: ISO date when first phase started (null if not started)
 * - completedAt: ISO date when marked complete (null if not complete)
 * - createdAt: ISO date when milestone was created
 */
export interface Milestone {
  name: string
  scope: string
  phases: number[]
  theme: string | null
  status: MilestoneStatus
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

/**
 * Zod schema for Milestone validation
 */
export const MilestoneSchema = z.object({
  name: z.string().min(1),
  scope: z.string().min(1),
  phases: z.array(z.number().int().positive()),
  theme: z.string().nullable(),
  status: MilestoneStatusSchema,
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})

/**
 * Phase Status - Status of a single phase within a milestone
 */
export interface PhaseStatus {
  number: number
  status: 'pending' | 'in-progress' | 'complete'
}

/**
 * Zod schema for PhaseStatus validation
 */
export const PhaseStatusSchema = z.object({
  number: z.number().int().positive(),
  status: z.enum(['pending', 'in-progress', 'complete']),
})

/**
 * MilestoneProgress - Progress tracking for a milestone
 * 
 * Calculates progress by phases completed (primary metric).
 * 
 * Fields:
 * - milestoneName: Name of the milestone
 * - phasesCompleted: Number of completed phases
 * - phasesTotal: Total number of phases in milestone
 * - percentage: Completion percentage (0-100)
 * - phaseStatus: Detailed status breakdown per phase
 */
export interface MilestoneProgress {
  milestoneName: string
  phasesCompleted: number
  phasesTotal: number
  percentage: number
  phaseStatus: PhaseStatus[]
}

/**
 * Zod schema for MilestoneProgress validation
 */
export const MilestoneProgressSchema = z.object({
  milestoneName: z.string().min(1),
  phasesCompleted: z.number().int().nonnegative(),
  phasesTotal: z.number().int().positive(),
  percentage: z.number().min(0).max(100),
  phaseStatus: z.array(PhaseStatusSchema),
})

/**
 * MilestoneArchiveEntry - Archived milestone data
 * 
 * Captures milestone summary and metrics when archived.
 * Stored in MILESTONE-ARCHIVE.md (append mode).
 * 
 * Fields:
 * - name: Milestone name
 * - scope: What the milestone delivered
 * - phases: Array of phase numbers that were included
 * - startedAt: ISO date when first phase started (null if not started)
 * - completedAt: ISO date when milestone was completed
 * - plansCompleted: Number of plans completed
 * - totalPlans: Total number of plans across all phases
 * - executionTime: Human-readable execution time (e.g., "2.5 hours")
 * - requirementsAddressed: Array of requirement IDs addressed
 */
export interface MilestoneArchiveEntry {
  name: string
  scope: string
  phases: number[]
  startedAt: string | null
  completedAt: string
  plansCompleted: number
  totalPlans: number
  executionTime: string
  requirementsAddressed: string[]
}

/**
 * Zod schema for MilestoneArchiveEntry validation
 */
export const MilestoneArchiveEntrySchema = z.object({
  name: z.string().min(1),
  scope: z.string().min(1),
  phases: z.array(z.number().int().positive()),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime(),
  plansCompleted: z.number().int().nonnegative(),
  totalPlans: z.number().int().nonnegative(),
  executionTime: z.string().min(1),
  requirementsAddressed: z.array(z.string()),
})

/**
 * Phase Modification Result - Result of checking if a phase can be modified
 * 
 * Used to validate scope modifications during active milestones.
 * 
 * Fields:
 * - allowed: Whether the modification is allowed
 * - warning: Optional warning message if phase is in active milestone
 */
export interface PhaseModificationResult {
  allowed: boolean
  warning?: string
}

/**
 * Zod schema for PhaseModificationResult validation
 */
export const PhaseModificationResultSchema = z.object({
  allowed: z.boolean(),
  warning: z.string().optional(),
})
