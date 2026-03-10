import type { LoopPhase } from '../types/loop'
import type { PhaseState, PlanReference } from '../types/state'
import { StateManager } from '../state/state-manager'

export type SessionContext = {
  currentPlanId?: string
  accomplished: string[]
  workInProgress: string[]
  nextSteps: string[]
}

export function buildSessionContext(
  stateManager: StateManager,
  position: { phaseNumber: number; phase: LoopPhase }
): SessionContext {
  const phaseState = stateManager.loadPhaseState(position.phaseNumber) as PhaseState | null
  const currentPlanId = phaseState?.currentPlanId
  const accomplished = formatAccomplished(position.phaseNumber, phaseState?.completedPlans)
  const workInProgress = formatInProgress(
    position.phaseNumber,
    phaseState?.plans,
    currentPlanId
  )
  const nextSteps = [stateManager.getRequiredNextAction(position.phase)]

  return {
    currentPlanId,
    accomplished,
    workInProgress,
    nextSteps,
  }
}

function formatAccomplished(phaseNumber: number, completedPlans?: string[]): string[] {
  if (!Array.isArray(completedPlans) || completedPlans.length === 0) {
    return []
  }

  return completedPlans.map((planId) => formatPlanLabel(phaseNumber, planId))
}

function formatInProgress(
  phaseNumber: number,
  plans?: PlanReference[],
  currentPlanId?: string
): string[] {
  const inProgress = Array.isArray(plans)
    ? plans
      .filter((plan) => plan.status === 'in-progress')
      .map((plan) => formatPlanLabel(phaseNumber, plan.id))
    : []

  if (inProgress.length > 0) {
    return inProgress
  }

  if (currentPlanId) {
    return [formatPlanLabel(phaseNumber, currentPlanId)]
  }

  return []
}

function formatPlanLabel(phaseNumber: number, planId: string): string {
  if (planId.includes('-')) {
    return `Plan ${planId}`
  }

  return `Plan ${phaseNumber}-${planId}`
}
