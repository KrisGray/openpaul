import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import type { SessionState } from '../types/session'

type HandoffTemplateInput = {
  sessionState: SessionState
  status: 'paused' | 'active'
  projectName: string
  phaseName: string
  totalPhases: number
  version: string
  accomplished: string[]
  workInProgress: string[]
  nextSteps: string[]
}

export function renderHandoffTemplate(params: HandoffTemplateInput): string {
  const templatePath = join(__dirname, '../../templates/HANDOFF.md')

  if (!existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`)
  }

  const template = readFileSync(templatePath, 'utf-8')
  const { sessionState } = params

  const planMark = sessionState.phase === 'PLAN' ? '●' : '○'
  const applyMark = sessionState.phase === 'APPLY' ? '●' : '○'
  const unifyMark = sessionState.phase === 'UNIFY' ? '●' : '○'

  const currentPlanPath = sessionState.currentPlanId
    ? `.paul/phases/${sessionState.phaseNumber}-${sessionState.currentPlanId}-PLAN.json`
    : 'none'

  const replacements: Record<string, string> = {
    timestamp: new Date().toISOString(),
    session_id: sessionState.sessionId,
    status: params.status,
    project_name: params.projectName,
    core_value: 'Enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation',
    version: params.version,
    phase_number: String(sessionState.phaseNumber),
    total_phases: String(params.totalPhases),
    phase_name: params.phaseName,
    plan_id: sessionState.currentPlanId || 'none',
    plan_status: sessionState.phase,
    accomplished_list: formatHandoffList(params.accomplished),
    in_progress_list: formatHandoffList(params.workInProgress),
    next_action: params.nextSteps[0] || 'No next step',
    following_action: 'Continue with next plan',
    current_plan_path: currentPlanPath,
    plan_purpose: sessionState.currentPlanId ? 'Current active plan' : 'No active plan',
    plan_mark: planMark,
    apply_mark: applyMark,
    unify_mark: unifyMark,
  }

  let handoffContent = template
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    handoffContent = handoffContent.replace(regex, value)
  }

  return handoffContent
}

function formatHandoffList(items: string[]): string {
  if (items.length === 0) {
    return '- None'
  }
  return items.map((item) => `- ${item}`).join('\n')
}
