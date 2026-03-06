/**
 * Error Formatter
 *
 * Guided error formatting with context, suggested fixes, and next steps
 */
/**
 * Parameters for guided error formatting
 */
export interface GuidedErrorParams {
    /** Error title */
    title: string;
    /** Main error message */
    message: string;
    /** Additional context about the error */
    context?: string;
    /** Suggested fix for the error */
    suggestedFix: string;
    /** Next steps to resolve the error */
    nextSteps: string[];
}
/**
 * Format a guided error message with structure and guidance
 *
 * @param params - Error parameters
 * @returns Formatted error string with markdown headers
 *
 * @example
 * formatGuidedError({
 *   title: 'Invalid State Transition',
 *   message: 'Cannot transition from PLAN to UNIFY',
 *   context: 'Current state: PLAN',
 *   suggestedFix: 'Run /paul:apply to execute the plan first',
 *   nextSteps: [
 *     'Check current state with /paul:progress',
 *     'Execute the current plan with /paul:apply'
 *   ]
 * })
 */
export declare function formatGuidedError(params: GuidedErrorParams): string;
//# sourceMappingURL=error-formatter.d.ts.map