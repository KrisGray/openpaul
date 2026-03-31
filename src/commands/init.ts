import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { basename, join } from 'path'
import { FileManager } from '../storage/file-manager'
import { createDefaultModelConfig } from '../types/model-config'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { atomicWrite } from '../storage/atomic-writes'

type InitState = {
  coreValue?: string
  description?: string
  projectName?: string
  createdAt: number
}

const INIT_STATE_FILE = 'init-state.json'

/**
 * /openpaul:init Command
 * 
 * Initialize a new OpenPAUL project with .openpaul/ directory structure
 * 
 * From CONTEXT.md:
 * - Creates .openpaul/ directory
 * - Initializes model-config.json with defaults
 * - Sets up initial state for phase 1
 * - Provides clear next steps
 */
export const openpaulInit: ToolDefinition = tool({
  description: 'Initialize OpenPAUL in the current project',
  args: {
    force: tool.schema.boolean().optional().describe('Reinitialize even if .openpaul/ exists'),
    coreValue: tool.schema.string().optional().describe('Core value the project delivers'),
    description: tool.schema.string().optional().describe('Short description of what you are building'),
    projectName: tool.schema.string().optional().describe('Project name override'),
  },
  execute: async ({ force, coreValue, description, projectName }, context) => {
    try {
      const fileManager = new FileManager(context.directory)
      const initStatePath = join(context.directory, '.openpaul', INIT_STATE_FILE)
      
      // Check if already initialized by looking for the model-config file,
      // NOT just the directory — .openpaul/ is created by `npx openpaul`
      // before /openpaul:init is ever run.
      // Check both locations for robustness with migrated .paul/ projects.
      const modelConfigInOpenPaul = join(context.directory, '.openpaul', 'model-config.json')
      const modelConfigInPaul = join(context.directory, '.paul', 'model-config.json')
      const initState = force ? null : readInitState(initStatePath)
      if ((existsSync(modelConfigInOpenPaul) || existsSync(modelConfigInPaul)) && !force && !initState) {
        return formatHeader(2, '⚠️ OpenPAUL Already Initialized') + '\n\n' +
          'OpenPAUL has already been initialized in this project.\n\n' +
          formatBold('Options:') + '\n' +
          formatList([
            'Run `/openpaul:progress` to check current state',
            'Run `/openpaul:init --force` to reinitialize (this will reset all state)',
          ])
      }
      
      // Ensure .openpaul directory exists
      fileManager.ensurePaulDir()
      fileManager.ensurePhasesDir()

      if (force) {
        clearInitState(initStatePath)
      }
      
      // Write default model configuration
      await fileManager.writeModelConfig(createDefaultModelConfig())
      
      // Initialize state for phase 1 (ready for new loop)
      await fileManager.writePhaseState(1, {
        phase: 'UNIFY', // Ready to start new loop (PLAN is next)
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })

      const state: InitState = initState ?? { createdAt: Date.now() }
      if (coreValue && coreValue.trim()) {
        state.coreValue = coreValue.trim()
      }
      if (description && description.trim()) {
        state.description = description.trim()
      }
      if (projectName && projectName.trim()) {
        state.projectName = projectName.trim()
      }

      if (!state.coreValue) {
        await writeInitState(initStatePath, state)
        return formatHeader(2, '🧭 OpenPAUL Initialization') + '\n\n' +
          'Before planning, I need to understand what you are building.\n\n' +
          formatBold('Question 1: Core Value') + '\n' +
          "What's the core value this project delivers?\n\n" +
          '(Example: "Users can track expenses and see spending patterns")\n\n' +
          formatBold('Reply:') + ' Provide your answer to continue.\n' +
          'Tip: /openpaul:init --coreValue "..."'
      }

      if (!state.description) {
        await writeInitState(initStatePath, state)
        return formatHeader(2, '🧭 OpenPAUL Initialization') + '\n\n' +
          formatBold('Question 2: Project Description') + '\n' +
          'What are you building? (1-2 sentences)\n\n' +
          '(Example: "A CLI tool for managing Docker containers")\n\n' +
          formatBold('Reply:') + ' Provide your answer to continue.\n' +
          'Tip: /openpaul:init --description "..."'
      }

      const resolvedProjectName = state.projectName ?? inferProjectName(context.directory)
      state.projectName = resolvedProjectName

      const timestamp = new Date().toISOString()
      const projectPath = join(context.directory, '.openpaul', 'PROJECT.md')
      const roadmapPath = join(context.directory, '.openpaul', 'ROADMAP.md')
      const statePath = join(context.directory, '.openpaul', 'STATE.md')

      await atomicWrite(projectPath, createProjectMarkdown(resolvedProjectName, state.description, state.coreValue, timestamp))
      await atomicWrite(roadmapPath, createRoadmapMarkdown(resolvedProjectName, state.description, timestamp))
      await atomicWrite(statePath, createStateMarkdown(state.coreValue, timestamp))

      clearInitState(initStatePath)
      
      // Format success message
      let output = formatHeader(2, '✅ OpenPAUL Initialized') + '\n\n'
      output += 'OpenPAUL has been successfully initialized in your project.\n\n'
      
      output += formatBold('Created Files:') + '\n'
      output += formatList([
        '.openpaul/model-config.json - Model configuration for OpenPAUL sub-stages',
        '.openpaul/state-phase-1.json - Initial state for phase 1',
        '.openpaul/PROJECT.md - Project overview and core value',
        '.openpaul/ROADMAP.md - Roadmap scaffold for planning',
        '.openpaul/STATE.md - Project status tracker',
        '.openpaul/phases/ - Phase plan storage',
      ]) + '\n\n'
      
      output += formatBold('Next Steps:') + '\n'
      output += formatList([
        'Run `/openpaul:plan` to create your first plan',
      ])
      
      return output
    } catch (error) {
      // Return formatted error message instead of throwing
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Initialization Failed') + '\n\n' +
        `Failed to initialize OpenPAUL: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure you have write permissions in this directory',
          'Check that the directory is not read-only',
          'Try running with appropriate permissions',
        ])
    }
  },
})

function readInitState(initStatePath: string): InitState | null {
  if (!existsSync(initStatePath)) {
    return null
  }

  try {
    const content = readFileSync(initStatePath, 'utf-8')
    const parsed = JSON.parse(content)
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    return {
      coreValue: typeof parsed.coreValue === 'string' ? parsed.coreValue : undefined,
      description: typeof parsed.description === 'string' ? parsed.description : undefined,
      projectName: typeof parsed.projectName === 'string' ? parsed.projectName : undefined,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
    }
  } catch {
    return null
  }
}

async function writeInitState(initStatePath: string, state: InitState): Promise<void> {
  await atomicWrite(initStatePath, JSON.stringify(state, null, 2))
}

function clearInitState(initStatePath: string): void {
  if (!existsSync(initStatePath)) {
    return
  }
  try {
    unlinkSync(initStatePath)
  } catch {
    // Ignore cleanup errors
  }
}

function inferProjectName(projectRoot: string): string {
  const packagePath = join(projectRoot, 'package.json')
  if (existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8')) as { name?: string }
      if (pkg.name && pkg.name.trim()) {
        return pkg.name.trim()
      }
    } catch {
      // Fall back to directory name
    }
  }

  const dirName = basename(projectRoot)
  return dirName || 'OpenPAUL Project'
}

function createProjectMarkdown(projectName: string, description: string, coreValue: string, timestamp: string): string {
  return `# Project: ${projectName}

## Description
${description}

## Core Value
${coreValue}

## Requirements

### Must Have
- [To be defined during planning]

### Should Have
- [To be defined during planning]

### Nice to Have
- [To be defined during planning]

## Constraints
- [To be identified during planning]

## Success Criteria
- ${coreValue} is achieved
- [To be refined during planning]

---
*Created: ${timestamp}*
`
}

function createRoadmapMarkdown(projectName: string, description: string, timestamp: string): string {
  return `# Roadmap: ${projectName}

## Overview
${description}

## Current Milestone
**v0.1 Initial Release** (v0.1.0)
Status: Not started
Phases: 0 of TBD complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | TBD | TBD | Not started | - |

## Phase Details

Phases will be defined during /openpaul:plan.

---
*Roadmap created: ${timestamp}*
`
}

function createStateMarkdown(coreValue: string, timestamp: string): string {
  return `# Project State

## Project Reference

See: .openpaul/PROJECT.md (updated ${timestamp})

**Core value:** ${coreValue}
**Current focus:** Project initialized - ready for planning

## Current Position

Milestone: v0.1 Initial Release
Phase: Not yet defined
Plan: None yet
Status: Ready to create roadmap and first PLAN
Last activity: ${timestamp} - Project initialized

Progress:
- Milestone: [----------] 0%

## Loop Position

Current loop state:
    PLAN --> APPLY --> UNIFY
      o        o        o     [Ready for first PLAN]

## Accumulated Context

### Decisions
None yet.

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: ${timestamp}
Stopped at: Project initialization complete
Next action: Run /openpaul:plan to define phases and first plan
Resume file: .openpaul/PROJECT.md

---
*STATE.md - Updated after every significant action*
`
}
