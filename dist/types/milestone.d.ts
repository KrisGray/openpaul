import { z } from 'zod';
/**
 * Milestone status - Current state of a milestone
 */
export type MilestoneStatus = 'planned' | 'in-progress' | 'completed';
/**
 * Zod schema for MilestoneStatus validation
 */
export declare const MilestoneStatusSchema: z.ZodEnum<["planned", "in-progress", "completed"]>;
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
    name: string;
    scope: string;
    phases: number[];
    theme: string | null;
    status: MilestoneStatus;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
}
/**
 * Zod schema for Milestone validation
 */
export declare const MilestoneSchema: z.ZodObject<{
    name: z.ZodString;
    scope: z.ZodString;
    phases: z.ZodArray<z.ZodNumber, "many">;
    theme: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["planned", "in-progress", "completed"]>;
    startedAt: z.ZodNullable<z.ZodString>;
    completedAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "in-progress" | "completed" | "planned";
    name: string;
    createdAt: string;
    phases: number[];
    scope: string;
    theme: string | null;
    startedAt: string | null;
    completedAt: string | null;
}, {
    status: "in-progress" | "completed" | "planned";
    name: string;
    createdAt: string;
    phases: number[];
    scope: string;
    theme: string | null;
    startedAt: string | null;
    completedAt: string | null;
}>;
/**
 * Phase Status - Status of a single phase within a milestone
 */
export interface PhaseStatus {
    number: number;
    status: 'pending' | 'in-progress' | 'complete';
}
/**
 * Zod schema for PhaseStatus validation
 */
export declare const PhaseStatusSchema: z.ZodObject<{
    number: z.ZodNumber;
    status: z.ZodEnum<["pending", "in-progress", "complete"]>;
}, "strip", z.ZodTypeAny, {
    number: number;
    status: "pending" | "in-progress" | "complete";
}, {
    number: number;
    status: "pending" | "in-progress" | "complete";
}>;
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
    milestoneName: string;
    phasesCompleted: number;
    phasesTotal: number;
    percentage: number;
    phaseStatus: PhaseStatus[];
}
/**
 * Zod schema for MilestoneProgress validation
 */
export declare const MilestoneProgressSchema: z.ZodObject<{
    milestoneName: z.ZodString;
    phasesCompleted: z.ZodNumber;
    phasesTotal: z.ZodNumber;
    percentage: z.ZodNumber;
    phaseStatus: z.ZodArray<z.ZodObject<{
        number: z.ZodNumber;
        status: z.ZodEnum<["pending", "in-progress", "complete"]>;
    }, "strip", z.ZodTypeAny, {
        number: number;
        status: "pending" | "in-progress" | "complete";
    }, {
        number: number;
        status: "pending" | "in-progress" | "complete";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    milestoneName: string;
    phasesCompleted: number;
    phasesTotal: number;
    percentage: number;
    phaseStatus: {
        number: number;
        status: "pending" | "in-progress" | "complete";
    }[];
}, {
    milestoneName: string;
    phasesCompleted: number;
    phasesTotal: number;
    percentage: number;
    phaseStatus: {
        number: number;
        status: "pending" | "in-progress" | "complete";
    }[];
}>;
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
    name: string;
    scope: string;
    phases: number[];
    startedAt: string | null;
    completedAt: string;
    plansCompleted: number;
    totalPlans: number;
    executionTime: string;
    requirementsAddressed: string[];
}
/**
 * Zod schema for MilestoneArchiveEntry validation
 */
export declare const MilestoneArchiveEntrySchema: z.ZodObject<{
    name: z.ZodString;
    scope: z.ZodString;
    phases: z.ZodArray<z.ZodNumber, "many">;
    startedAt: z.ZodNullable<z.ZodString>;
    completedAt: z.ZodString;
    plansCompleted: z.ZodNumber;
    totalPlans: z.ZodNumber;
    executionTime: z.ZodString;
    requirementsAddressed: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    phases: number[];
    scope: string;
    startedAt: string | null;
    completedAt: string;
    plansCompleted: number;
    totalPlans: number;
    executionTime: string;
    requirementsAddressed: string[];
}, {
    name: string;
    phases: number[];
    scope: string;
    startedAt: string | null;
    completedAt: string;
    plansCompleted: number;
    totalPlans: number;
    executionTime: string;
    requirementsAddressed: string[];
}>;
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
    allowed: boolean;
    warning?: string;
}
/**
 * Zod schema for PhaseModificationResult validation
 */
export declare const PhaseModificationResultSchema: z.ZodObject<{
    allowed: z.ZodBoolean;
    warning: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    allowed: boolean;
    warning?: string | undefined;
}, {
    allowed: boolean;
    warning?: string | undefined;
}>;
//# sourceMappingURL=milestone.d.ts.map