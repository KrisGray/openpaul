import { tool } from '@opencode-ai/plugin'
import { readFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'fs'
import { join, relative } from 'path'
import { createHash } from 'crypto'
import { StateManager } from '../state/state-manager'
import { SessionManager } from '../storage/session-manager'
import { atomicWrite } from '../storage/atomic-writes'
import type { SessionState } from '../types/session'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { detectUncommittedChanges, detectModifiedFiles } from '../utils/change-detector'

/**
 * /paul:pause Command
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
export const paulPause = tool({
  description: 'Pause current development session and save context',
  args: {},
  execute: async (_args, context) => {
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
            'Run `/paul:init` to initialize OpenPAUL',
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
                'Run `/paul:resume` to continue the existing session',
                'Run `/paul:pause` again to replace it with a new session',
              ])
          }
        }
      }

      // Compute file checksums for diff generation
      const fileChecksums = computeFileChecksums(context.directory)

      // Check for uncommitted changes
      const gitStatus = await detectUncommittedChanges(context.directory)
      const fileStatus = await detectModifiedFiles(context.directory, fileChecksums)
      
      if (gitStatus.hasChanges || fileStatus.hasModifications) {
        const changeSummary = formatChangeSummary(gitStatus, fileStatus)
        return formatHeader(2, '⚠️ Unsaved Changes Detected') + '\n\n' +
          changeSummary + '\n\n' +
          formatBold('Options:') + '\n' +
          formatList([
            'Commit your changes: `git add . && git commit -m "message"`',
            'Save specific files manually before pausing',
            'Run `/paul:pause` again to proceed anyway (changes will be noted in HANDOFF)',
            'Run `/paul:status` to see current session info',
          ])
      }

      // Capture session state
      const sessionState: SessionState = {
        sessionId: sessionManager.generateSessionId(),
        createdAt: Date.now(),
        pausedAt: Date.now(),
        phase: position.phase,
        phaseNumber: position.phaseNumber,
        currentPlanId: undefined, // Will be extracted from state metadata in future enhancement
        workInProgress: [], // Empty for now, will be extracted in later enhancement
        nextSteps: [stateManager.getRequiredNextAction(position.phase)],
        metadata: {},
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
      const handoffContent = generateHandoffMd({
        sessionState,
        projectName,
        phaseName,
        totalPhases: 9, // Hardcoded for now, could be extracted from ROADMAP.md
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
        'Run `/paul:resume` to continue this session',
        'Run `/paul:status` to check your current position',
      ])

      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Pause Failed') + '\n\n' +
        `Failed to pause session: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure OpenPAUL is initialized with `/paul:init`',
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
      collectChecksums(fullPath, projectRoot, checksums)
    } else if (stat.isFile()) {
      const relPath = relative(projectRoot, fullPath)
      checksums[relPath] = computeFileChecksum(fullPath)
    }
  }
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
 * Generate HANDOFF.md content from template
 */
function generateHandoffMd(params: {
  sessionState: SessionState
  projectName: string
  phaseName: string
  totalPhases: number
}): string {
  const { sessionState, projectName, phaseName, totalPhases } = params

  // Determine loop position markers
  const planMark = sessionState.phase === 'PLAN' ? '●' : '○'
  const applyMark = sessionState.phase === 'APPLY' ? '●' : sessionState.phase === 'PLAN' ? '○' : '○'
  const unifyMark = sessionState.phase === 'UNIFY' ? '●' : sessionState.phase === 'APPLY' ? '○' : '○'

  // Format current plan path
  const currentPlanPath = sessionState.currentPlanId
    ? `.paul/phases/${sessionState.phaseNumber}-${sessionState.currentPlanId}-PLAN.json`
    : 'none'

  // Format accomplished list (empty for now)
  const accomplishedList = '- None (session captured before execution)'

  // Format in-progress list
  const inProgressList = sessionState.workInProgress.length > 0
    ? sessionState.workInProgress.map(item => `- ${item}`).join('\n')
    : '- None'

  const timestamp = new Date().toISOString()

  return `# PAUL Handoff

**Date:** ${timestamp}
**Session:** ${sessionState.sessionId}
**Status:** paused

---

## READ THIS FIRST

You have no prior context. This document tells you everything.

**Project:** ${projectName}
**Core value:** Enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation

---

## Current State

**Version:** 1.0.0
**Phase:** ${sessionState.phaseNumber} of ${totalPhases} — ${phaseName}
**Plan:** ${sessionState.currentPlanId || 'none'} — ${sessionState.phase}

**Loop Position:**
\`\`\`
PLAN ──▶ APPLY ──▶ UNIFY
  ${planMark}        ${applyMark}        ${unifyMark}
\`\`\`

---

## What Was Done

${accomplishedList}

---

## What's In Progress

${inProgressList}

---

## What's Next

**Immediate:** ${sessionState.nextSteps[0] || 'No next step'}

**After that:** Continue with next plan

---

## Key Files

| File | Purpose |
|------|---------|
| \`.paul/STATE.md\` | Live project state |
| \`.paul/ROADMAP.md\` | Phase overview |
| ${currentPlanPath} | Current active plan |

---

## Resume Instructions

1. Read \`.paul/STATE.md\` for latest position
2. Check if PLAN exists for current phase
3. Based on loop position:
   - \`○○○\` (fresh) → Run \`/paul:plan\`
   - \`✓○○\` (planned) → Review plan, then \`/paul:apply\`
   - \`✓✓○\` (applied) → Run \`/paul:unify\`
   - \`✓✓✓\` (complete) → Ready for next phase

**Or simply run:** \`/paul:resume\`

---

*Handoff created: ${timestamp}*
*This file is the single entry point for fresh sessions*
`
}
