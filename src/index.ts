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

const toToolName = (command: string): string => command.replace(/:/g, '_')
const toolTemplate = (command: string): string => (
  `Call the OpenCode tool \`${toToolName(command)}\` with a JSON argument object. ` +
  'Convert CLI flags in $ARGUMENTS into tool arguments (e.g., --phase 1 -> {"phase": 1}). ' +
  'If $ARGUMENTS is empty, pass {}. ' +
  'IMPORTANT: After the tool finishes, respond with ONLY the tool output, ' +
  'verbatim. Do not add summaries, questions, or any extra text.'
)

const planWizardTemplate = (): string => (
  `Plan mode wizard for /openpaul:plan. Call the OpenCode tool \`${toToolName('openpaul:plan')}\` ` +
  'with a JSON argument object when ready. ' +
  'If $ARGUMENTS is present, convert CLI flags into JSON and call the tool. ' +
  'If required arguments are missing, do NOT call the tool yet. ' +
  'Instead, ask the user for: phase number, plan ID, acceptance criteria, and 1-5 tasks. ' +
  'Use a TDD flow: (1) write failing test, (2) implement, (3) add edge/coverage tests. ' +
  'Once all inputs are collected, call the tool with JSON arguments. ' +
  'IMPORTANT: After the tool finishes, respond with ONLY the tool output, verbatim.'
)

const OPENPAUL_COMMANDS: Record<string, { description: string; template: string }> = {
  'openpaul:init': {
    description: 'Initialize OpenPAUL project state',
    template: toolTemplate('openpaul:init'),
  },
  'openpaul:plan': {
    description: 'Create a structured OpenPAUL plan',
    template: planWizardTemplate(),
  },
  'openpaul:apply': {
    description: 'Apply the current OpenPAUL plan',
    template: toolTemplate('openpaul:apply'),
  },
  'openpaul:unify': {
    description: 'Close the loop with an OpenPAUL summary',
    template: toolTemplate('openpaul:unify'),
  },
  'openpaul:progress': {
    description: 'Show OpenPAUL progress summary',
    template: toolTemplate('openpaul:progress'),
  },
  'openpaul:status': {
    description: 'Show OpenPAUL current status',
    template: toolTemplate('openpaul:status'),
  },
  'openpaul:help': {
    description: 'Show OpenPAUL command reference',
    template: toolTemplate('openpaul:help'),
  },
  'openpaul:pause': {
    description: 'Pause the current OpenPAUL session',
    template: toolTemplate('openpaul:pause'),
  },
  'openpaul:resume': {
    description: 'Resume the last OpenPAUL session',
    template: toolTemplate('openpaul:resume'),
  },
  'openpaul:handoff': {
    description: 'Create an OpenPAUL handoff summary',
    template: toolTemplate('openpaul:handoff'),
  },
  'openpaul:milestone': {
    description: 'Manage OpenPAUL milestones',
    template: toolTemplate('openpaul:milestone'),
  },
  'openpaul:complete-milestone': {
    description: 'Complete the current OpenPAUL milestone',
    template: toolTemplate('openpaul:complete-milestone'),
  },
  'openpaul:discuss-milestone': {
    description: 'Discuss the current OpenPAUL milestone',
    template: toolTemplate('openpaul:discuss-milestone'),
  },
  'openpaul:discuss': {
    description: 'Discuss the current OpenPAUL phase',
    template: toolTemplate('openpaul:discuss'),
  },
  'openpaul:assumptions': {
    description: 'Capture OpenPAUL assumptions',
    template: toolTemplate('openpaul:assumptions'),
  },
  'openpaul:discover': {
    description: 'Run OpenPAUL discovery prompts',
    template: toolTemplate('openpaul:discover'),
  },
  'openpaul:consider-issues': {
    description: 'Review issues and risks',
    template: toolTemplate('openpaul:consider-issues'),
  },
  'openpaul:research': {
    description: 'Start OpenPAUL research flow',
    template: toolTemplate('openpaul:research'),
  },
  'openpaul:research-phase': {
    description: 'Research a specific OpenPAUL phase',
    template: toolTemplate('openpaul:research-phase'),
  },
  'openpaul:config': {
    description: 'Configure OpenPAUL settings',
    template: toolTemplate('openpaul:config'),
  },
  'openpaul:flows': {
    description: 'List OpenPAUL workflow flows',
    template: toolTemplate('openpaul:flows'),
  },
  'openpaul:map-codebase': {
    description: 'Map the project codebase',
    template: toolTemplate('openpaul:map-codebase'),
  },
  'openpaul:add-phase': {
    description: 'Add a new OpenPAUL phase',
    template: toolTemplate('openpaul:add-phase'),
  },
  'openpaul:remove-phase': {
    description: 'Remove an OpenPAUL phase',
    template: toolTemplate('openpaul:remove-phase'),
  },
  'openpaul:verify': {
    description: 'Verify OpenPAUL phase completion',
    template: toolTemplate('openpaul:verify'),
  },
  'openpaul:plan-fix': {
    description: 'Fix a broken OpenPAUL plan',
    template: toolTemplate('openpaul:plan-fix'),
  },
}

const OPENPAUL_TOOL_HANDLERS = {
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

const OPENPAUL_TOOLS = Object.fromEntries(
  Object.entries(OPENPAUL_TOOL_HANDLERS).map(([command, handler]) => [toToolName(command), handler]),
)

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
    // Register tools (opencode tool names must be alphanumeric/underscore/dash)
    tool: OPENPAUL_TOOLS,
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
