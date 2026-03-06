/**
 * /paul:pause Command
 *
 * Pause current development session and save context
 *
 * From PLAN.md:
 * - Captures current loop position (phase, phaseNumber, planId)
 * - Saves session state with SessionManager
 * - Generates HANDOFF.md with session context
 * - Warns before overwriting recent sessions (< 24 hours)
 * - Returns formatted success message with next steps
 */
export declare const paulPause: {
    description: string;
    args: {};
    execute(args: Record<string, never>, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=pause.d.ts.map