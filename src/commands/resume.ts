import { tool, type ToolContext } from '@opencode-ai/plugin'
import { z } from 'zod'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, relative, sep } from 'path'
import { createHash } from 'crypto'
import { SessionManager } from '../storage/session-manager'
import { StateManager } from '../state/state-manager'
import { FileManager } from '../storage/file-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import { formatDiff, formatStalenessWarning, formatFileDiff, type FileChange } from '../output/diff-formatter'
import { loadSnapshotContent } from '../utils/session-snapshots'
import type { LoopPhase } from '../types/loop'
import type { PhaseState } from '../types/state'
import type { SessionState } from '../types/session'

/**
 * /openpaul:resume Command
 * 
 * Resume paused development session with diff display
 * 
 * From CONTEXT.md:
 * - Loads session from .openpaul/CURRENT-SESSION
 * - Validates session integrity
 * - Shows session summary with loop position
 * - Computes file checksums and shows changes since pause
 * - Displays next action for current phase
 */
type ResumeArgs = {
  confirm?: boolean
}

const toolFactory = tool as unknown as (input: any) => any

export const openpaulResume = toolFactory({
  name: 'openpaul:resume',
  description: 'Resume paused development session',
  parameters: z.object({
    confirm: z.boolean().optional().describe('Confirm restoring session state'),
  }),
  execute: async ({ confirm }: ResumeArgs, context: ToolContext) => {
    try {
      const sessionManager = new SessionManager(context.directory)
      const stateManager = new StateManager(context.directory)
      const fileManager = new FileManager(context.directory)
      
      // Load current session
      const session = sessionManager.loadCurrentSession()
      
      if (!session) {
        return formatHeader(2, '📋 Session Resume') + '\n\n' +
          formatBold('Status:') + ' No paused session found\n\n' +
          formatHeader(3, 'What to do') + '\n' +
          formatList([
            'Run `/openpaul:init` to start a new session',
            'Run `/openpaul:progress` to check current status',
          ])
      }

      if (!confirm) {
        return formatResumeConfirmation(session, context.directory)
      }
      
      // Validate session
      const validation = sessionManager.validateSessionState(session.sessionId)
      if (!validation.valid) {
        return formatHeader(2, '❌ Session Validation Failed') + '\n\n' +
          formatBold('Errors:') + '\n' +
          formatList(validation.errors) + '\n\n' +
          formatHeader(3, 'What to do') + '\n' +
          formatList([
            'Run `/openpaul:init` to start a fresh session',
            'Check .openpaul/SESSIONS/ for session files',
          ])
      }

      const preconditions = validateResumePreconditions(context.directory, session, stateManager, fileManager)
      if (!preconditions.valid) {
        return formatHeader(2, '❌ Resume Preconditions Failed') + '\n\n' +
          formatBold('Issues:') + '\n' +
          formatList(preconditions.errors) + '\n\n' +
          formatHeader(3, 'What to do') + '\n' +
          formatList([
            'Resolve the issues above and retry `/openpaul:resume --confirm`',
            'Run `/openpaul:progress` to inspect project state',
          ])
      }

      const restoredState: PhaseState = {
        ...preconditions.phaseState,
        phase: session.phase,
        currentPlanId: session.currentPlanId,
        lastUpdated: Date.now(),
        metadata: {
          ...preconditions.phaseState.metadata,
          resumedFromSession: session.sessionId,
        },
      }
      await stateManager.savePhaseState(session.phaseNumber, restoredState)
      
      // Calculate staleness
      const hoursAgo = (Date.now() - session.pausedAt) / (1000 * 60 * 60)
      const stalenessWarning = formatStalenessWarning(hoursAgo)
      
      // Format session summary
      let output = formatHeader(2, '📋 Session Resume') + '\n\n'
      
      output += formatBold('Session ID:') + ` ${session.sessionId}\n`
      output += formatBold('Paused:') + ` ${new Date(session.pausedAt).toISOString()}\n`
      output += formatBold('Current Phase:') + ` ${session.phaseNumber} - ${session.phase}\n`
      
      if (session.workInProgress.length > 0) {
        output += '\n' + formatBold('Work in Progress:') + '\n'
        output += formatList(session.workInProgress) + '\n'
      }
      
      if (session.nextSteps.length > 0) {
        output += '\n' + formatBold('Next Steps:') + '\n'
        output += formatList(session.nextSteps) + '\n'
      }
      
      // Check for file changes
      const changes = detectFileChanges(context.directory, session.fileChecksums, preconditions.snapshotRoot)
      
      if (changes.length > 0) {
        output += '\n' + formatDiff(changes) + '\n'
      } else {
        output += '\n' + formatBold('File Changes:') + ' No changes since pause\n'
      }
      
      // Show staleness warning if applicable
      if (stalenessWarning) {
        output += '\n' + stalenessWarning + '\n'
      }
      
      // Format loop visual
      const loopVisual = formatLoopVisual(session.phase)
      output += '\n' + loopVisual + '\n\n'
      
      // Show next action
      const nextAction = stateManager.getRequiredNextAction(session.phase)
      output += formatBold('Next Action:') + ` ${nextAction}\n\n`
      
      output += formatBold('Commands:') + '\n' +
        formatList([
          'Run `/openpaul:progress` for full project status',
          'Run `/openpaul:progress` for detailed loop status',
        ])
      
      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Resume Failed') + '\n\n' +
        `Failed to resume session: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure .openpaul/CURRENT-SESSION file exists',
          'Check if session files are valid JSON',
          'Try running `/openpaul:init` to start fresh',
        ])
    }
  },
})

type ContextSource = {
  label: string
  path: string
  status: 'found' | 'missing'
  preview?: string
}

function formatResumeConfirmation(session: SessionState, projectRoot: string): string {
  const sources = buildContextSources(projectRoot)
  let output = formatHeader(2, '📋 Session Resume') + '\n\n'
  output += formatBold('Status:') + ' Confirmation required before restoring session\n\n'
  output += formatBold('Session ID:') + ` ${session.sessionId}\n`
  output += formatBold('Paused:') + ` ${new Date(session.pausedAt).toISOString()}\n`
  output += formatBold('Current Phase:') + ` ${session.phaseNumber} - ${session.phase}\n\n`

  output += formatHeader(3, 'Context Sources') + '\n'
  output += formatList(sources.map((source) => {
    const preview = source.preview ? ` — ${source.preview}` : ''
    return `${source.label}: ${source.status} (${source.path})${preview}`
  }))
  output += '\n\n' + formatBold('Next Steps:') + '\n'
  output += formatList([
    'Review the context sources above',
    'Re-run `/openpaul:resume --confirm` to restore session state',
  ])

  return output
}

function buildContextSources(projectRoot: string): ContextSource[] {
  const handoffPath = join(projectRoot, '.openpaul', 'HANDOFF.md')
  const primaryStatePath = join(projectRoot, '.paul', 'STATE.md')
  const fallbackStatePath = join(projectRoot, '.openpaul', 'STATE.md')
  const statePath = existsSync(primaryStatePath) ? primaryStatePath : fallbackStatePath

  return [
    readContextSource('HANDOFF.md', handoffPath),
    readContextSource('STATE.md', statePath),
  ]
}

function readContextSource(label: string, filePath: string): ContextSource {
  if (!existsSync(filePath)) {
    return { label, path: filePath, status: 'missing' }
  }

  try {
    const content = readFileSync(filePath, 'utf-8')
    return {
      label,
      path: filePath,
      status: 'found',
      preview: buildPreview(content),
    }
  } catch {
    return { label, path: filePath, status: 'missing' }
  }
}

function buildPreview(content: string): string {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
  if (lines.length === 0) {
    return 'No preview available'
  }
  const preview = lines.join(' | ')
  return preview.length > 140 ? `${preview.slice(0, 140)}...` : preview
}

function validateResumePreconditions(
  projectRoot: string,
  session: SessionState,
  stateManager: StateManager,
  fileManager: FileManager
): { valid: boolean; errors: string[]; snapshotRoot: string; phaseState: PhaseState } {
  const errors: string[] = []

  const snapshotRoot = typeof session.metadata?.snapshotRoot === 'string'
    ? session.metadata.snapshotRoot
    : ''
  if (!snapshotRoot) {
    errors.push('Session snapshot metadata missing (metadata.snapshotRoot)')
  } else if (!existsSync(join(projectRoot, snapshotRoot))) {
    errors.push(`Snapshot directory missing: ${snapshotRoot}`)
  }

  const phaseState = stateManager.loadPhaseState(session.phaseNumber) as PhaseState | null
  if (!phaseState) {
    errors.push(`Phase state not found for phase ${session.phaseNumber}`)
  }

  const roadmapPath = resolveRoadmapPath(projectRoot)
  if (!roadmapPath) {
    errors.push('ROADMAP.md not found in .paul or .openpaul')
  } else if (!phaseExistsInRoadmap(roadmapPath, session.phaseNumber)) {
    errors.push(`Phase ${session.phaseNumber} not found in ROADMAP.md`)
  }

  if (session.currentPlanId && !fileManager.planExists(session.phaseNumber, session.currentPlanId)) {
    errors.push(`Plan ${session.phaseNumber}-${session.currentPlanId} not found in .paul/phases`) 
  }

  return {
    valid: errors.length === 0,
    errors,
    snapshotRoot,
    phaseState: phaseState ?? ({
      phase: session.phase,
      phaseNumber: session.phaseNumber,
      currentPlanId: session.currentPlanId,
      lastUpdated: Date.now(),
      metadata: {},
      plans: [],
      completedPlans: [],
    } as PhaseState),
  }
}

function resolveRoadmapPath(projectRoot: string): string | null {
  const primaryPath = join(projectRoot, '.paul', 'ROADMAP.md')
  if (existsSync(primaryPath)) {
    return primaryPath
  }
  const fallbackPath = join(projectRoot, '.openpaul', 'ROADMAP.md')
  if (existsSync(fallbackPath)) {
    return fallbackPath
  }
  return null
}

function phaseExistsInRoadmap(roadmapPath: string, phaseNumber: number): boolean {
  try {
    const content = readFileSync(roadmapPath, 'utf-8')
    const phaseRegex = new RegExp(`Phase\s+${phaseNumber}[:\s]`, 'i')
    const tableRegex = new RegExp(`\|\s*${phaseNumber}\.\s`, 'i')
    return phaseRegex.test(content) || tableRegex.test(content)
  } catch {
    return false
  }
}

/**
 * Compute SHA256 checksums for tracked files
 * 
 * @param projectRoot - Project root directory
 * @returns Map of file paths to checksums
 */
function computeFileChecksums(projectRoot: string): Record<string, string> {
  const checksums: Record<string, string> = {}
  const trackedDirs = ['.openpaul', 'src']
  const trackedFiles = ['package.json', 'tsconfig.json']

  for (const dir of trackedDirs) {
    const dirPath = join(projectRoot, dir)
    if (existsSync(dirPath)) {
      collectChecksums(dirPath, projectRoot, checksums)
    }
  }

  for (const file of trackedFiles) {
    const filePath = join(projectRoot, file)
    if (existsSync(filePath)) {
      checksums[file] = computeFileChecksum(filePath)
    }
  }

  return checksums
}

/**
 * Detect file changes by comparing checksums
 * 
 * @param projectRoot - Project root directory
 * @param savedChecksums - Checksums from saved session
 * @returns Array of file changes
 */
function detectFileChanges(
  projectRoot: string,
  savedChecksums: Record<string, string>,
  snapshotRoot: string
): FileChange[] {
  const currentChecksums = computeFileChecksums(projectRoot)
  const changes: FileChange[] = []
  
  // Check for modified and deleted files
  for (const [filePath, oldChecksum] of Object.entries(savedChecksums)) {
    const newChecksum = currentChecksums[filePath]
    
    if (!newChecksum) {
      const oldContent = loadSnapshotContent(projectRoot, snapshotRoot, filePath) ?? ''
      changes.push({
        type: 'deleted',
        filePath,
        diff: formatFileDiff(oldContent, ''),
      })
    } else if (newChecksum !== oldChecksum) {
      const oldContent = loadSnapshotContent(projectRoot, snapshotRoot, filePath) ?? ''
      const newContent = readTextFile(join(projectRoot, filePath)) ?? ''
      changes.push({
        type: 'modified',
        filePath,
        diff: formatFileDiff(oldContent, newContent),
      })
    }
  }
  
  // Check for added files
  for (const filePath of Object.keys(currentChecksums)) {
    if (!savedChecksums[filePath]) {
      const newContent = readTextFile(join(projectRoot, filePath)) ?? ''
      changes.push({
        type: 'added',
        filePath,
        diff: formatFileDiff('', newContent),
      })
    }
  }
  
  return changes
}

/**
 * Recursively collect checksums for all files in a directory
 */
function collectChecksums(
  dirPath: string,
  projectRoot: string,
  checksums: Record<string, string>
): void {
  const entries = readdirSync(dirPath)

  for (const entry of entries) {
    const fullPath = join(dirPath, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      const relPath = relative(projectRoot, fullPath)
      if (!isSnapshotPath(relPath)) {
        collectChecksums(fullPath, projectRoot, checksums)
      }
    } else if (stat.isFile()) {
      const relPath = relative(projectRoot, fullPath)
      if (!isSnapshotPath(relPath)) {
        checksums[relPath] = computeFileChecksum(fullPath)
      }
    }
  }
}

function isSnapshotPath(relPath: string): boolean {
  const parts = relPath.split(sep)
  const openIndex = parts.indexOf('.openpaul')
  const sessionsIndex = parts.indexOf('SESSIONS')
  const snapshotsIndex = parts.indexOf('snapshots')
  return openIndex !== -1 && sessionsIndex === openIndex + 1 && snapshotsIndex > sessionsIndex
}

/**
 * Compute SHA256 checksum for a single file
 */
function computeFileChecksum(filePath: string): string {
  const content = readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}

function readTextFile(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * Format the loop visual indicator
 * 
 * Shows the PLAN → APPLY → UNIFY loop with current position highlighted
 */
function formatLoopVisual(currentPhase: LoopPhase): string {
  const phases: LoopPhase[] = ['PLAN', 'APPLY', 'UNIFY']
  
  const formattedPhases = phases.map(phase => {
    if (phase === currentPhase) {
      // Current phase: ◉
      return `◉ ${phase}`
    }
    
    // Check if phase is before current (completed)
    const currentIndex = phases.indexOf(currentPhase)
    const phaseIndex = phases.indexOf(phase)
    
    if (phaseIndex < currentIndex) {
      // Completed phase: ✓
      return `✓ ${phase}`
    }
    
    // Future phase: ○
    return `○ ${phase}`
  })
  
  return `📍 Loop: ${formattedPhases.join(' → ')}`
}
