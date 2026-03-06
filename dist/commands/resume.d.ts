/**
 * /paul:resume Command
 *
 * Resume paused development session with diff display
 *
 * From CONTEXT.md:
 * - Loads session from .openpaul/CURRENT-SESSION
 * - Validates session integrity
 * - Shows session summary with loop position
 * - Computes file checksums and shows changes since pause
 * - Displays next action for current phase
 */
export declare const paulResume: {
    description: string;
    args: {};
    execute(args: Record<string, never>, context: import("@opencode-ai/plugin").ToolContext): Promise<string>;
};
//# sourceMappingURL=resume.d.ts.map