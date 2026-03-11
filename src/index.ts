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
import { paulCompleteMilestone } from './commands/complete-milestone'
import { paulDiscussMilestone } from './commands/discuss-milestone'
import { paulDiscuss } from './commands/discuss'
import { paulAssumptions } from './commands/assumptions'
import { paulDiscover } from './commands/discover'
import { paulConsiderIssues } from './commands/consider-issues'
import { paulResearch } from './commands/research'
import { paulResearchPhase } from './commands/research-phase'
import { paulConfig } from './commands/config'
import { paulFlows } from './commands/flows'
import { paulMapCodebase } from './commands/map-codebase'

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
      'openpaul:complete-milestone': paulCompleteMilestone,
      'openpaul:discuss-milestone': paulDiscussMilestone,
      'openpaul:discuss': paulDiscuss,
      'paul:discuss': paulDiscuss,
      'openpaul:assumptions': paulAssumptions,
      'paul:assumptions': paulAssumptions,
      'openpaul:discover': paulDiscover,
      'paul:discover': paulDiscover,
      'openpaul:consider-issues': paulConsiderIssues,
      'paul:consider-issues': paulConsiderIssues,
      'openpaul:research': paulResearch,
      'paul:research': paulResearch,
      'openpaul:research-phase': paulResearchPhase,
      'openpaul:config': paulConfig,
      'paul:config': paulConfig,
      'openpaul:flows': paulFlows,
      'paul:flows': paulFlows,
      'openpaul:map-codebase': paulMapCodebase,
      'paul:map-codebase': paulMapCodebase,
      'paul:research-phase': paulResearchPhase,
    }
  }
}

// Export types for external use
export * from './types'
