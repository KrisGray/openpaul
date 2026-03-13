import type { Plugin } from '@opencode-ai/plugin'

/**
 * OpenPAUL - Plan-Apply-Unify Loop Plugin for OpenCode
 * 
 * This plugin enforces the PLAN → APPLY → UNIFY loop with mandatory reconciliation,
 * ensuring every plan closes properly with full traceability and context preservation.
 */
import { openpaulInit } from './commands/init'
import { openpaulPlan } from './commands/plan'
import { openpaulApply } from './commands/apply'
import { openpaulUnify } from './commands/unify'
import { openpaulProgress } from './commands/progress'
import { openpaulStatus } from './commands/status'
import { openpaulHelp } from './commands/help'
import { openpaulPause } from './commands/pause'
import { openpaulResume } from './commands/resume'
import { openpaulHandoff } from './commands/handoff'
import { openpaulMilestone } from './commands/milestone'
import { openpaulCompleteMilestone } from './commands/complete-milestone'
import { openpaulDiscussMilestone } from './commands/discuss-milestone'
import { openpaulDiscuss } from './commands/discuss'
import { openpaulAssumptions } from './commands/assumptions'
import { openpaulDiscover } from './commands/discover'
import { openpaulConsiderIssues } from './commands/consider-issues'
import { openpaulResearch } from './commands/research'
import { openpaulResearchPhase } from './commands/research-phase'
import { openpaulConfig } from './commands/config'
import { openpaulFlows } from './commands/flows'
import { openpaulMapCodebase } from './commands/map-codebase'
import { openpaulAddPhase } from './commands/add-phase'
import { openpaulRemovePhase } from './commands/remove-phase'
import { openpaulVerify } from './commands/verify'
import { openpaulPlanFix } from './commands/plan-fix'

export const OpenPaulPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  // Plugin initialization
  await client.app.log({
    body: {
      service: 'openpaul-plugin',
      level: 'info',
      message: 'OpenPAUL plugin initialized',
      extra: {
        project: project.id,
        directory,
      },
    },
  })
  
  return {
    // Register commands - openpaul: prefix only (clean break)
    tool: {
      'openpaul:init': openpaulInit,
      'openpaul:plan': openpaulPlan,
      'openpaul:apply': openpaulApply,
      'openpaul:unify': openpaulUnify,
      'openpaul:progress': openpaulProgress,
      'openpaul:status': openpaulStatus,
      'openpaul:help': openpaulHelp,
      'openpaul:pause': openpaulPause,
      'openpaul:resume': openpaulResume,
      'openpaul:handoff': openpaulHandoff,
      'openpaul:milestone': openpaulMilestone,
      'openpaul:complete-milestone': openpaulCompleteMilestone,
      'openpaul:discuss-milestone': openpaulDiscussMilestone,
      'openpaul:discuss': openpaulDiscuss,
      'openpaul:assumptions': openpaulAssumptions,
      'openpaul:discover': openpaulDiscover,
      'openpaul:consider-issues': openpaulConsiderIssues,
      'openpaul:research': openpaulResearch,
      'openpaul:research-phase': openpaulResearchPhase,
      'openpaul:config': openpaulConfig,
      'openpaul:flows': openpaulFlows,
      'openpaul:map-codebase': openpaulMapCodebase,
      'openpaul:add-phase': openpaulAddPhase,
      'openpaul:remove-phase': openpaulRemovePhase,
      'openpaul:verify': openpaulVerify,
      'openpaul:plan-fix': openpaulPlanFix,
    }
  }
}

// Export types for external use
export * from './types'
