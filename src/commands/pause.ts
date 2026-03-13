import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs'
import { join, relative, sep } from 'path'
import { createHash } from 'crypto'
import { StateManager } from '../state/state-manager'
import { SessionManager } from '../storage/session-manager'
import { atomicWrite } from '../storage/atomic-writes'
import type { SessionState } from '../types/session'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { detectUncommittedChanges, detectModifiedFiles } from '../utils/change-detector'
import { buildSessionContext } from '../utils/session-context'
import { renderHandoffTemplate } from '../utils/handoff-template'
import { captureSessionSnapshots } from '../utils/session-snapshots'

/**
 * /openpaul:pause Command
 * 
 * Pause current development session and save context
 * 
 * From PLAN.md:
 * - Captures current loop position (phase, phaseNumber, planId)
 * - Saves session state with SessionManager
 * - Generates HANDOFF.md with session context
 * - Warns before overwriting recent sessions (< 24 hours)
 * - Returns formatted success message with next steps
 */
type PauseArgs = {
  onUnsavedChanges?: 'commit' | 'save' | 'discard' | 'abort'
}

const toolFactory = tool as unknown as (input: any) => any

export const openpaulPause = toolFactory({
  name: 'openpaul:pause',
  description: 'Pause current development session and save context',
  parameters: z.object({
    onUnsavedChanges: z
      .enum(['commit', 'save', 'discard', 'abort'])
      .optional()
      .describe('How to proceed when unsaved changes are detected'),
  }),
  execute: async ({ onUnsavedChanges }: PauseArgs, context: { directory: string }) => {
    try {
      const stateManager = new StateManager(context.directory)
      const sessionManager = new SessionManager(context.directory)

      // Get current position
      const position = stateManager.getCurrentPosition()
      
      if (!position) {
        return formatHeader(2, '❌ Cannot Pause') + '\n\n' +
          'OpenPAUL has not been initialized in this project.\n\n' +
          formatBold('Next Steps:') + '\n' +
          formatList([
            'Run `/openpaul:init` to initialize OpenPAUL',
          ])
      }

      // Check for existing session
      const existingSessionId = sessionManager.getCurrentSessionId()
      if (existingSessionId) {
        const existingSession = sessionManager.loadCurrentSession()
        if (existingSession) {
          const hoursSincePause = (Date.now() - existingSession.pausedAt) / (1000 * 60 * 60)
          if (hoursSincePause < 24) {
            const hoursRounded = Math.round(hoursSincePause * 10) / 10
            return formatHeader(2, '⚠️ Recent Session Exists') + '\n\n' +
              `A session was paused ${hoursRounded} hours ago.\n\n` +
              formatBold('Options:') + '\n' +
              formatList([
                'Run `/openpaul:resume` to continue the existing session',
                'Run `/openpaul:pause` again to replace it with a new session',
              ])
          }
        }
      }

      // Compute file checksums for diff generation
      const fileChecksums = computeFileChecksums(context.directory)

      // Check for uncommitted changes
      const gitStatus = await detectUncommittedChanges(context.directory)
      const fileStatus = await detectModifiedFiles(context.directory, fileChecksums)
      
      const hasUnsavedChanges = gitStatus.hasChanges || fileStatus.hasModifications
      if (hasUnsavedChanges && !onUnsavedChanges) {
        const changeSummary = formatChangeSummary(gitStatus, fileStatus)
        return formatHeader(2, '⚠️ Unsaved Changes Detected') + '\n\n' +
          changeSummary + '\n\n' +
          formatBold('Next Steps:') + '\n' +
          formatList([
            'Re-run `/openpaul:pause` with onUnsavedChanges="commit" after committing your work',
            'Re-run `/openpaul:pause` with onUnsavedChanges="save" after saving your work',
            'Re-run `/openpaul:pause` with onUnsavedChanges="discard" to continue without saving',
            'Re-run `/openpaul:pause` with onUnsavedChanges="abort" to cancel pausing',
          ])
      }

      if (hasUnsavedChanges && onUnsavedChanges === 'abort') {
        return formatHeader(2, '⏹ Pause Aborted') + '\n\n' +
          'Pause was canceled. No session data was saved.\n\n' +
          formatBold('Next Steps:') + '\n' +
          formatList([
            'Resolve your changes and re-run `/openpaul:pause` when ready',
            'Run `/openpaul:status` to check your current position',
          ])
      }

      const sessionContext = buildSessionContext(stateManager, position)
      const metadata: Record<string, unknown> = {}
      if (hasUnsavedChanges && onUnsavedChanges) {
        metadata.unsavedChangesAction = onUnsavedChanges
      }

      const sessionId = sessionManager.generateSessionId()
      const snapshotResult = captureSessionSnapshots(context.directory, sessionId, fileChecksums)
      metadata.snapshotRoot = snapshotResult.snapshotRoot

      // Capture session state
      const sessionState: SessionState = {
        sessionId,
        createdAt: Date.now(),
        pausedAt: Date.now(),
        phase: position.phase,
        phaseNumber: position.phaseNumber,
        currentPlanId: sessionContext.currentPlanId,
        workInProgress: sessionContext.workInProgress,
        nextSteps: sessionContext.nextSteps,
        metadata,
        fileChecksums,
      }

      // Save session
      await sessionManager.saveSession(sessionState)

      // Get project name from model-config.json
      let projectName = 'Unknown'
      const modelConfigPath = join(context.directory, '.paul', 'model-config.json')
      if (existsSync(modelConfigPath)) {
        try {
          const config = JSON.parse(readFileSync(modelConfigPath, 'utf-8'))
          projectName = config.projectName || 'Unknown'
        } catch {
          // Use default
        }
      }

      // Get phase name from ROADMAP.md
      const phaseName = getPhaseName(context.directory, position.phaseNumber)

      // Generate HANDOFF.md
      const handoffPath = join(context.directory, '.openpaul', 'HANDOFF.md')
      const handoffContent = renderHandoffTemplate({
        sessionState,
        status: 'paused',
        projectName,
        phaseName,
        totalPhases: 9,
        version: getVersion(context.directory),
        accomplished: sessionContext.accomplished,
        workInProgress: sessionContext.workInProgress,
        nextSteps: sessionContext.nextSteps,
      })

      // Write HANDOFF.md using atomic write
      const handoffDir = join(context.directory, '.openpaul')
      if (!existsSync(handoffDir)) {
        mkdirSync(handoffDir, { recursive: true })
      }
      await atomicWrite(handoffPath, handoffContent)

      // Format success output
      const pausedAtDate = new Date(sessionState.pausedAt)
      const pausedAtStr = pausedAtDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'

      let output = formatHeader(2, '✅ Session Paused') + '\n\n'
      output += formatBold('Session ID:') + ` ${sessionState.sessionId}\n`
      output += formatBold('Paused at:') + ` ${pausedAtStr}\n`
      output += formatBold('Current phase:') + ` ${position.phaseNumber} - ${position.phase}\n`
      output += formatBold('Loop position:') + ` ${position.phase}\n\n`
      output += formatBold('HANDOFF.md:') + ` .openpaul/HANDOFF.md\n\n`
      output += formatBold('Next Steps:') + '\n'
      output += formatList([
        'Run `/openpaul:resume` to continue this session',
        'Run `/openpaul:status` to check your current position',
      ])

      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Pause Failed') + '\n\n' +
        `Failed to pause session: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure OpenPAUL is initialized with `/openpaul:init`',
          'Check that the .openpaul directory is writable',
          'Try running with appropriate permissions',
        ])
    }
  },
})

/**
 * Compute SHA256 checksums for tracked files
 * 
 * Tracks: .openpaul/, src/, package.json, tsconfig.json
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
      const relPath = file
      checksums[relPath] = computeFileChecksum(filePath)
    }
  }

  return checksums
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

/**
 * Get phase name from ROADMAP.md
 */
function getPhaseName(projectRoot: string, phaseNumber: number): string {
  const roadmapPath = join(projectRoot, '.paul', 'ROADMAP.md')
  if (!existsSync(roadmapPath)) {
    // Try alternate location
    const altRoadmapPath = join(projectRoot, '.openpaul', 'ROADMAP.md')
    if (!existsSync(altRoadmapPath)) {
      return 'Unknown'
    }
    return extractPhaseName(altRoadmapPath, phaseNumber)
  }
  
  return extractPhaseName(roadmapPath, phaseNumber)
}

/**
 * Extract phase name from ROADMAP content
 */
function extractPhaseName(roadmapPath: string, phaseNumber: number): string {
  try {
    const roadmapContent = readFileSync(roadmapPath, 'utf-8')
    
    // Look for "Phase X: Name" pattern
    const phaseRegex = new RegExp(`###?\\s*Phase\\s+${phaseNumber}:\\s*(.+?)(?:\\n|$)`, 'i')
    const match = roadmapContent.match(phaseRegex)
    if (match) {
      return match[1].trim()
    }

    // Also look for "| X. Name |" pattern in progress table
    const tableRegex = new RegExp(`\\|\\s*${phaseNumber}\\.\\s*(.+?)\\s*\\|`, 'g')
    const tableMatch = roadmapContent.match(tableRegex)
    if (tableMatch && tableMatch[0]) {
      const nameMatch = tableMatch[0].match(/\d+\.\s*(.+?)\s*\|/)
      if (nameMatch) {
        return nameMatch[1].trim()
      }
    }

    return 'Unknown'
  } catch {
    return 'Unknown'
  }
}

/**
 * Format change summary for display
 */
function formatChangeSummary(
  gitStatus: { hasChanges: boolean; files: Array<{ path: string; status: string }> },
  fileStatus: { hasModifications: boolean; files: Array<{ path: string }> }
): string {
  const parts: string[] = []

  if (gitStatus.hasChanges) {
    const modified = gitStatus.files.filter(f => f.status === 'modified').length
    const added = gitStatus.files.filter(f => f.status === 'added').length
    const deleted = gitStatus.files.filter(f => f.status === 'deleted').length
    const untracked = gitStatus.files.filter(f => f.status === 'untracked').length

    const counts: string[] = []
    if (modified > 0) counts.push(`${modified} modified`)
    if (added > 0) counts.push(`${added} added`)
    if (deleted > 0) counts.push(`${deleted} deleted`)
    if (untracked > 0) counts.push(`${untracked} untracked`)

    parts.push(`Git changes: ${counts.join(', ')}`)

    const filesToShow = gitStatus.files.slice(0, 10)
    filesToShow.forEach(f => {
      parts.push(`  - ${f.path} (${f.status})`)
    })
    if (gitStatus.files.length > 10) {
      parts.push(`  ... and ${gitStatus.files.length - 10} more`)
    }
  }

  if (fileStatus.hasModifications) {
    parts.push(`Modified files: ${fileStatus.files.length} file(s) changed`)
    const filesToShow = fileStatus.files.slice(0, 10)
    filesToShow.forEach(f => {
      parts.push(`  - ${f.path}`)
    })
    if (fileStatus.files.length > 10) {
      parts.push(`  ... and ${fileStatus.files.length - 10} more`)
    }
  }

  return parts.join('\n')
}

/**
 * Get version from package.json
 */
function getVersion(projectRoot: string): string {
  const packagePath = join(projectRoot, 'package.json')
  if (existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'))
      return pkg.version || '1.0.0'
    } catch {
      // Fall through to default
    }
  }
  return '1.0.0'
}
