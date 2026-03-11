/**
 * Commands Index
 * 
 * Exports all PAUL commands
 */

// Core loop commands
export { paulInit } from './init'
export { paulPlan } from './plan'
export { paulProgress } from './progress'
export { paulStatus } from './status'
export { paulHelp } from './help'
export { paulApply } from './apply'
export { paulUnify } from './unify'
export { paulPause } from './pause'
export { paulResume } from './resume'
export { paulAddPhase } from './add-phase'
export { paulRemovePhase } from './remove-phase'

// Pre-planning commands
export { paulDiscuss } from './discuss'
export { paulAssumptions } from './assumptions'
export { paulDiscover } from './discover'
export { paulConsiderIssues } from './consider-issues'

// Research commands
export { paulResearch } from './research'
export { paulResearchPhase } from './research-phase'

// Quality commands
export { paulVerify } from './verify'
export { paulPlanFix } from './plan-fix'
