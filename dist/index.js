/**
 * PAUL - Plan-Apply-Unify Loop Plugin for OpenCode
 *
 * This plugin enforces the PLAN → APPLY → UNIFY loop with mandatory reconciliation,
 * ensuring every plan closes properly with full traceability and context preservation.
 */
export const PaulPlugin = async ({ project, client, directory, worktree }) => {
    // Plugin initialization
    await client.app.log({
        body: {
            service: 'paul-plugin',
            level: 'info',
            message: 'PAUL plugin initialized',
            extra: {
                project: project.id,
                directory,
            },
        },
    });
    return {
    // Event hooks will be added in subsequent plans
    };
};
// Export types for external use
// export * from './types'  // Will be added in subsequent plans
//# sourceMappingURL=index.js.map