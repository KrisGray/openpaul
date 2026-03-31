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

const OPENPAUL_COMMANDS: Record<string, { description: string; template: string }> = {
  'openpaul:init': {
    description: 'Initialize OpenPAUL project state',
    template: 'Run the OpenCode tool `openpaul:init`. $ARGUMENTS',
  },
  'openpaul:plan': {
    description: 'Create a structured OpenPAUL plan',
    template: 'Run the OpenCode tool `openpaul:plan`. $ARGUMENTS',
  },
  'openpaul:apply': {
    description: 'Apply the current OpenPAUL plan',
    template: 'Run the OpenCode tool `openpaul:apply`. $ARGUMENTS',
  },
  'openpaul:unify': {
    description: 'Close the loop with an OpenPAUL summary',
    template: 'Run the OpenCode tool `openpaul:unify`. $ARGUMENTS',
  },
  'openpaul:progress': {
    description: 'Show OpenPAUL progress summary',
    template: 'Run the OpenCode tool `openpaul:progress`. $ARGUMENTS',
  },
  'openpaul:status': {
    description: 'Show OpenPAUL current status',
    template: 'Run the OpenCode tool `openpaul:status`. $ARGUMENTS',
  },
  'openpaul:help': {
    description: 'Show OpenPAUL command reference',
    template: 'Run the OpenCode tool `openpaul:help`. $ARGUMENTS',
  },
  'openpaul:pause': {
    description: 'Pause the current OpenPAUL session',
    template: 'Run the OpenCode tool `openpaul:pause`. $ARGUMENTS',
  },
  'openpaul:resume': {
    description: 'Resume the last OpenPAUL session',
    template: 'Run the OpenCode tool `openpaul:resume`. $ARGUMENTS',
  },
  'openpaul:handoff': {
    description: 'Create an OpenPAUL handoff summary',
    template: 'Run the OpenCode tool `openpaul:handoff`. $ARGUMENTS',
  },
  'openpaul:milestone': {
    description: 'Manage OpenPAUL milestones',
    template: 'Run the OpenCode tool `openpaul:milestone`. $ARGUMENTS',
  },
  'openpaul:complete-milestone': {
    description: 'Complete the current OpenPAUL milestone',
    template: 'Run the OpenCode tool `openpaul:complete-milestone`. $ARGUMENTS',
  },
  'openpaul:discuss-milestone': {
    description: 'Discuss the current OpenPAUL milestone',
    template: 'Run the OpenCode tool `openpaul:discuss-milestone`. $ARGUMENTS',
  },
  'openpaul:discuss': {
    description: 'Discuss the current OpenPAUL phase',
    template: 'Run the OpenCode tool `openpaul:discuss`. $ARGUMENTS',
  },
  'openpaul:assumptions': {
    description: 'Capture OpenPAUL assumptions',
    template: 'Run the OpenCode tool `openpaul:assumptions`. $ARGUMENTS',
  },
  'openpaul:discover': {
    description: 'Run OpenPAUL discovery prompts',
    template: 'Run the OpenCode tool `openpaul:discover`. $ARGUMENTS',
  },
  'openpaul:consider-issues': {
    description: 'Review issues and risks',
    template: 'Run the OpenCode tool `openpaul:consider-issues`. $ARGUMENTS',
  },
  'openpaul:research': {
    description: 'Start OpenPAUL research flow',
    template: 'Run the OpenCode tool `openpaul:research`. $ARGUMENTS',
  },
  'openpaul:research-phase': {
    description: 'Research a specific OpenPAUL phase',
    template: 'Run the OpenCode tool `openpaul:research-phase`. $ARGUMENTS',
  },
  'openpaul:config': {
    description: 'Configure OpenPAUL settings',
    template: 'Run the OpenCode tool `openpaul:config`. $ARGUMENTS',
  },
  'openpaul:flows': {
    description: 'List OpenPAUL workflow flows',
    template: 'Run the OpenCode tool `openpaul:flows`. $ARGUMENTS',
  },
  'openpaul:map-codebase': {
    description: 'Map the project codebase',
    template: 'Run the OpenCode tool `openpaul:map-codebase`. $ARGUMENTS',
  },
  'openpaul:add-phase': {
    description: 'Add a new OpenPAUL phase',
    template: 'Run the OpenCode tool `openpaul:add-phase`. $ARGUMENTS',
  },
  'openpaul:remove-phase': {
    description: 'Remove an OpenPAUL phase',
    template: 'Run the OpenCode tool `openpaul:remove-phase`. $ARGUMENTS',
  },
  'openpaul:verify': {
    description: 'Verify OpenPAUL phase completion',
    template: 'Run the OpenCode tool `openpaul:verify`. $ARGUMENTS',
  },
  'openpaul:plan-fix': {
    description: 'Fix a broken OpenPAUL plan',
    template: 'Run the OpenCode tool `openpaul:plan-fix`. $ARGUMENTS',
  },
}

export const OpenPaulPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  if (client?.app?.log) {
    try {
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
    } catch {
    }
  }
  
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
    },
    config: async (config) => {
      config.command = {
        ...(config.command ?? {}),
        ...OPENPAUL_COMMANDS,
      }
    },
  }
}

// Export types for external use
export * from './types'

export default OpenPaulPlugin
