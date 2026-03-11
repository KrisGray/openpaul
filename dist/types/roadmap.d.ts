import { z } from 'zod';
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
    number: number;
    name: string;
    status: 'pending' | 'in-progress' | 'complete';
    directoryName: string;
}
/**
 * Zod schema for PhaseEntry validation
 */
export declare const PhaseEntrySchema: z.ZodObject<{
    number: z.ZodNumber;
    name: z.ZodString;
    status: z.ZodEnum<["pending", "in-progress", "complete"]>;
    directoryName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    number: number;
    status: "pending" | "in-progress" | "complete";
    name: string;
    directoryName: string;
}, {
    number: number;
    status: "pending" | "in-progress" | "complete";
    name: string;
    directoryName: string;
}>;
/**
 * Add Phase Options - Options for adding a new phase
 *
 * Specifies where to insert the new phase:
 * - name: Required name for the new phase
 * - position: Insert 'after' or 'before' the reference phase
 * - referencePhase: The phase number to use as reference point
 */
export interface AddPhaseOptions {
    name: string;
    position: 'after' | 'before';
    referencePhase: number;
}
/**
 * Zod schema for AddPhaseOptions validation
 */
export declare const AddPhaseOptionsSchema: z.ZodObject<{
    name: z.ZodString;
    position: z.ZodEnum<["after", "before"]>;
    referencePhase: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    position: "after" | "before";
    referencePhase: number;
}, {
    name: string;
    position: "after" | "before";
    referencePhase: number;
}>;
/**
 * Remove Phase Result - Result of removing a phase
 *
 * Contains information about what was removed and affected:
 * - success: Whether the removal was successful
 * - removedPhase: The phase that was removed (null if failed)
 * - renumberedPhases: Array of phase numbers that were renumbered
 */
export interface RemovePhaseResult {
    success: boolean;
    removedPhase: PhaseEntry | null;
    renumberedPhases: number[];
}
/**
 * Zod schema for RemovePhaseResult validation
 */
export declare const RemovePhaseResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    removedPhase: z.ZodNullable<z.ZodObject<{
        number: z.ZodNumber;
        name: z.ZodString;
        status: z.ZodEnum<["pending", "in-progress", "complete"]>;
        directoryName: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        number: number;
        status: "pending" | "in-progress" | "complete";
        name: string;
        directoryName: string;
    }, {
        number: number;
        status: "pending" | "in-progress" | "complete";
        name: string;
        directoryName: string;
    }>>;
    renumberedPhases: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    removedPhase: {
        number: number;
        status: "pending" | "in-progress" | "complete";
        name: string;
        directoryName: string;
    } | null;
    renumberedPhases: number[];
}, {
    success: boolean;
    removedPhase: {
        number: number;
        status: "pending" | "in-progress" | "complete";
        name: string;
        directoryName: string;
    } | null;
    renumberedPhases: number[];
}>;
/**
 * Roadmap Validation Result - Result of validating a phase operation
 *
 * Contains validation status and any errors found:
 * - valid: Whether the operation is valid
 * - errors: Array of error messages if validation failed
 */
export interface RoadmapValidationResult {
    valid: boolean;
    errors: string[];
}
/**
 * Zod schema for RoadmapValidationResult validation
 */
export declare const RoadmapValidationResultSchema: z.ZodObject<{
    valid: z.ZodBoolean;
    errors: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    valid: boolean;
    errors: string[];
}, {
    valid: boolean;
    errors: string[];
}>;
//# sourceMappingURL=roadmap.d.ts.map