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
import { openpaulHelp } from './commands/help'
import { openpaulPause } from './commands/pause'
import { openpaulResume } from './commands/resume'
import { openpaulHandoff } from './commands/handoff'
import { openpaulMilestone } from './commands/milestone'
import { openpaulCompleteMilestone } from './commands/complete-milestone'
import { openpaulConfig } from './commands/config'
import { openpaulFlows } from './commands/flows'
import { openpaulMapCodebase } from './commands/map-codebase'
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
  'with a JSON argument object. ' +
  'If $ARGUMENTS is present, convert CLI flags into JSON and call the tool. ' +
  'If the user replies to a wizard question, pass their response as {"wizardInput": "<response>"}. ' +
  'Use a step-by-step flow: phase number, plan ID, acceptance criteria, boundaries, task count, then task details in TDD order. ' +
  'IMPORTANT: After the tool finishes, respond with ONLY the tool output, verbatim.'
)

const pauseTemplate = (): string => (
  `Pause session wizard for /openpaul:pause. Call the OpenCode tool \`${toToolName('openpaul:pause')}\` ` +
  'with a JSON argument object. ' +
  'This is a TWO-STEP flow:\n' +
  '1. First call with {} to check for unsaved changes.\n' +
  '2. If unsaved changes are detected, the tool will ask the user to choose an action. ' +
  'Re-call with {"onUnsavedChanges": "<choice>"} where <choice> is one of: ' +
  '"commit" (commit changes first), "save" (save without commit), "discard" (ignore changes), "abort" (cancel pause).\n' +
  'If no unsaved changes, the first call completes the pause.\n' +
  'IMPORTANT: After the tool finishes, respond with ONLY the tool output, verbatim.'
)

const resumeTemplate = (): string => (
  `Resume session wizard for /openpaul:resume. Call the OpenCode tool \`${toToolName('openpaul:resume')}\` ` +
  'with a JSON argument object. ' +
  'This is a TWO-STEP flow:\n' +
  '1. First call with {} to show session summary and ask for confirmation.\n' +
  '2. Re-call with {"confirm": true} to restore the session state.\n' +
  'IMPORTANT: After the tool finishes, respond with ONLY the tool output, verbatim.'
)

const verifyTemplate = (): string => (
  `Verify wizard for /openpaul:verify. Call the OpenCode tool \`${toToolName('openpaul:verify')}\` ` +
  'with a JSON argument object. ' +
  'REQUIRED: {"phase": <number>} — the phase number to verify.\n' +
  'MULTI-STEP flow:\n' +
  '1. Call with {"phase": N} to show the test checklist.\n' +
  '2. For each item, call with {"phase": N, "item": <num>, "result": "pass|fail|skip"} to record a result.\n' +
  '3. On failure, optionally include "notes", "severity" ("critical"|"major"|"minor"), and "category" ("functional"|"visual"|"performance"|"configuration").\n' +
  'IMPORTANT: After the tool finishes, respond with ONLY the tool output, verbatim.'
)

const planFixTemplate = (): string => (
  `Plan-fix wizard for /openpaul:plan-fix. Call the OpenCode tool \`${toToolName('openpaul:plan-fix')}\` ` +
  'with a JSON argument object. ' +
  'REQUIRED: {"phase": <number>} — the phase number with UAT issues.\n' +
  'MULTI-STEP flow:\n' +
  '1. Call with {"phase": N} to list open UAT issues.\n' +
  '2. Call with {"phase": N, "issue": <num>} to create a fix plan for that issue.\n' +
  '3. Optionally add {"execute": true, "confirm": true} to auto-execute the fix plan.\n' +
  'IMPORTANT: After the tool finishes, respond with ONLY the tool output, verbatim.'
)

const completeMilestoneTemplate = (): string => (
  `Complete-milestone wizard for /openpaul:complete-milestone. Call the OpenCode tool \`${toToolName('openpaul:complete-milestone')}\` ` +
  'with a JSON argument object. ' +
  'This is a TWO-STEP flow:\n' +
  '1. First call with {} or {"name": "..."} to show milestone summary and ask for confirmation.\n' +
  '2. Re-call with {"confirm": true} to complete the milestone. Optionally add {"name": "..."} and {"verbose": true}.\n' +
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
  'openpaul:help': {
    description: 'Show OpenPAUL command reference',
    template: toolTemplate('openpaul:help'),
  },
  'openpaul:pause': {
    description: 'Pause the current OpenPAUL session',
    template: pauseTemplate(),
  },
  'openpaul:resume': {
    description: 'Resume the last OpenPAUL session',
    template: resumeTemplate(),
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
    template: completeMilestoneTemplate(),
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
  'openpaul:verify': {
    description: 'Verify OpenPAUL phase completion',
    template: verifyTemplate(),
  },
  'openpaul:plan-fix': {
    description: 'Fix a broken OpenPAUL plan',
    template: planFixTemplate(),
  },
}

const OPENPAUL_TOOL_HANDLERS = {
  'openpaul:init': openpaulInit,
  'openpaul:plan': openpaulPlan,
  'openpaul:apply': openpaulApply,
  'openpaul:unify': openpaulUnify,
  'openpaul:progress': openpaulProgress,
  'openpaul:help': openpaulHelp,
  'openpaul:pause': openpaulPause,
  'openpaul:resume': openpaulResume,
  'openpaul:handoff': openpaulHandoff,
  'openpaul:milestone': openpaulMilestone,
  'openpaul:complete-milestone': openpaulCompleteMilestone,
  'openpaul:config': openpaulConfig,
  'openpaul:flows': openpaulFlows,
  'openpaul:map-codebase': openpaulMapCodebase,
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
