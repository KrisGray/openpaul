import type { Plugin } from '@opencode-ai/plugin'

/**
 * PAUL - Plan-Apply-Unify Loop Plugin for OpenCode
 * 
 * This plugin enforces the PLAN → APPLY → UNIFY loop with mandatory reconciliation,
 * ensuring every plan closes properly with full traceability and context preservation.
 */
import { paulInit } from './commands/init'
import { paulPlan } from './commands/plan'
import { paulApply } from './commands/apply'
import { paulUnify } from './commands/unify'
import { paulProgress } from './commands/progress'
import { paulStatus } from './commands/status'
import { paulHelp } from './commands/help'
import { paulPause } from './commands/pause'
import { paulResume } from './commands/resume'
import { paulHandoff } from './commands/handoff'
import { paulMilestone } from './commands/milestone'

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
      'paul:plan': paulPlan,
      'paul:apply': paulApply,
      'paul:unify': paulUnify,
      'paul:progress': paulProgress,
      'paul:status': paulStatus,
      'paul:help': paulHelp,
      'paul:pause': paulPause,
      'paul:resume': paulResume,
      'paul:handoff': paulHandoff,
      'openpaul:init': paulInit,
      'openpaul:plan': paulPlan,
      'openpaul:apply': paulApply,
      'openpaul:unify': paulUnify,
      'openpaul:progress': paulProgress,
      'openpaul:status': paulStatus,
      'openpaul:help': paulHelp,
      'openpaul:pause': paulPause,
      'openpaul:resume': paulResume,
      'openpaul:handoff': paulHandoff,
      'openpaul:milestone': paulMilestone,
    }
  }
}

// Export types for external use
export * from './types'
