/**
 * /paul:handoff Command
 *
 * Create explicit handoff document for team collaboration
 *
 * From PLAN.md:
 * - Creates HANDOFF.md with complete context transfer information
 * - Works with paused sessions (loads existing session state)
 * - Works without paused sessions (creates temporary session state on-the-fly)
 * - Saves to .openpaul/HANDOFF.md
 * - Returns formatted success message with file location
 */
export declare const paulHandoff: {
    description: string;
    args: {};
    execute(args: Record<string, never>, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=handoff.d.ts.map