/**
 * Commands Index
 * 
 * Exports all PAUL commands
 */

// Core loop commands
export { paulHelp } from './help'

 // Placeholder exports for commands not yet implemented
// export { paulApply } from './apply'
// export { paulUnify } from './unify'
// export { paulProgress } from './progress'
// export { paulHelp } from './help'
    
    // Session Management commands (Phase 3)
    pause: { 
        description: 'Create session handoff', 
        usage: '/paul:pause', 
        phase: '3',
      },
      resume: { 
        description: 'Restore from paused session', 
        usage: '/paul:resume', 
        phase: '3',
      },
      handoff: { 
        description: 'Generate comprehensive handoff document', 
        usage: '/paul:handoff', 
        phase: '3',
      },
      status: { 
        description: '[DEPRECATED] Use /paul:progress instead', 
        usage: '/paul:status', 
        phase: '3',
      },
      
      // Project Management commands (Phase 4)
      milestone: {
        description: 'Create a milestone',
        usage: '/paul:milestone --name "..."',
        phase: '4',
      },
      'complete-milestone': {
        description: 'Complete a milestone', 
        usage: '/paul:complete-milestone --id ...',
        phase: '4',
      },
      'map-codebase': {
        description: 'Generate codebase overview',
        usage: '/paul:map-codebase', 
        phase: '4',
      },
      
      // Planning Support commands (Phase 5)
      discuss: { 
        description: 'Capture planning discussion', ,
        usage: '/paul:discuss --topic "..."',
        phase: '5',
      },
      assumptions: {
        description: 'Review intended approach',
        usage: '/paul:assumptions',
        phase: '5',
      },
      'consider-issues': {
        description: 'Triage deferred issues',
        usage: '/paul:consider-issues',
        phase: '5',
      },
      
      // Research & Quality commands (Phase 6)
      research: {... description: 'Deploy research agents',
        usage: '/paul:research --question "..."',
        phase: '6',
      },
      'plan-fix': {
        description: 'Plan UAT fixes',
        usage: '/paul:plan-fix',
        phase: '6',
      },
      verify: {
        description: 'Verify acceptance criteria',
        usage: '/paul:verify',
        phase: '6',
      },
      'add-phase': {
        description: 'Append new phase to roadmap', 
        usage: '/paul:add-phase --name "..."',
        phase: '7',
      },
      'remove-phase': {
        description: 'Remove future phase',
        usage: '/paul:remove-phase --phase N',
        phase: '7',
      },
      flows: {
        description: 'Configure skill requirements',
        usage: '/paul:flows',
        phase: '7',
      },
      config: {
        description: 'View/modify settings',
        usage: '/paul:config',
        phase: '7',
      },
    }
    `}

