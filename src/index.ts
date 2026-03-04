import type { Plugin } from '@opencode-ai/plugin'

/**
 * PAUL - Plan-Apply-Unify Loop Plugin for OpenCode
 * 
 * This plugin enforces the PLAN → APPLY → UNIFY loop with mandatory reconciliation,
 * ensuring every plan closes properly with full traceability and context preservation.
 */
import { paulInit } from './commands/init'

export const PaulPlugin: Plugin = async ({ project, client, directory, worktree }) => {
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
  })
  
  return {
    // Register commands
    tool: {
      'paul:init': paulInit,
    },
  }
}

// Export types for external use
// export * from './types'  // Will be added in subsequent plans
