export function buildSessionContext(stateManager, position) {
    const phaseState = stateManager.loadPhaseState(position.phaseNumber);
    const currentPlanId = phaseState?.currentPlanId;
    const accomplished = formatAccomplished(position.phaseNumber, phaseState?.completedPlans);
    const workInProgress = formatInProgress(position.phaseNumber, phaseState?.plans, currentPlanId);
    const nextSteps = [stateManager.getRequiredNextAction(position.phase)];
    return {
        currentPlanId,
        accomplished,
        workInProgress,
        nextSteps,
    };
}
function formatAccomplished(phaseNumber, completedPlans) {
    if (!Array.isArray(completedPlans) || completedPlans.length === 0) {
        return [];
    }
    return completedPlans.map((planId) => formatPlanLabel(phaseNumber, planId));
}
function formatInProgress(phaseNumber, plans, currentPlanId) {
    const inProgress = Array.isArray(plans)
        ? plans
            .filter((plan) => plan.status === 'in-progress')
            .map((plan) => formatPlanLabel(phaseNumber, plan.id))
        : [];
    if (inProgress.length > 0) {
        return inProgress;
    }
    if (currentPlanId) {
        return [formatPlanLabel(phaseNumber, currentPlanId)];
    }
    return [];
}
function formatPlanLabel(phaseNumber, planId) {
    if (planId.includes('-')) {
        return `Plan ${planId}`;
    }
    return `Plan ${phaseNumber}-${planId}`;
}
//# sourceMappingURL=session-context.js.map