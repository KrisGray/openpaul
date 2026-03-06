import { tool } from '@opencode-ai/plugin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SessionManager } from '../storage/session-manager';
import { StateManager } from '../state/state-manager';
import { formatHeader, formatBold, formatList } from '../output/formatter';
import { formatDiff, formatStalenessWarning } from '../output/diff-formatter';
import { createHash } from 'crypto';
/**
 * /paul:resume Command
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
export const paulResume = tool({
    description: 'Resume paused development session',
    args: {},
    execute: async (_args, context) => {
        try {
            const sessionManager = new SessionManager(context.directory);
            const stateManager = new StateManager(context.directory);
            // Load current session
            const session = sessionManager.loadCurrentSession();
            if (!session) {
                return formatHeader(2, '📋 Session Resume') + '\n\n' +
                    formatBold('Status:') + ' No paused session found\n\n' +
                    formatHeader(3, 'What to do') + '\n' +
                    formatList([
                        'Run `/paul:init` to start a new session',
                        'Run `/paul:progress` to check current status',
                    ]);
            }
            // Validate session
            const validation = sessionManager.validateSessionState(session.sessionId);
            if (!validation.valid) {
                return formatHeader(2, '❌ Session Validation Failed') + '\n\n' +
                    formatBold('Errors:') + '\n' +
                    formatList(validation.errors) + '\n\n' +
                    formatHeader(3, 'What to do') + '\n' +
                    formatList([
                        'Run `/paul:init` to start a fresh session',
                        'Check .openpaul/SESSIONS/ for session files',
                    ]);
            }
            // Calculate staleness
            const hoursAgo = (Date.now() - session.pausedAt) / (1000 * 60 * 60);
            const stalenessWarning = formatStalenessWarning(hoursAgo);
            // Format session summary
            let output = formatHeader(2, '📋 Session Resume') + '\n\n';
            output += formatBold('Session ID:') + ` ${session.sessionId}\n`;
            output += formatBold('Paused:') + ` ${new Date(session.pausedAt).toISOString()}\n`;
            output += formatBold('Current Phase:') + ` ${session.phaseNumber} - ${session.phase}\n`;
            if (session.workInProgress.length > 0) {
                output += '\n' + formatBold('Work in Progress:') + '\n';
                output += formatList(session.workInProgress) + '\n';
            }
            if (session.nextSteps.length > 0) {
                output += '\n' + formatBold('Next Steps:') + '\n';
                output += formatList(session.nextSteps) + '\n';
            }
            // Check for file changes
            const changes = detectFileChanges(context.directory, session.fileChecksums);
            if (changes.length > 0) {
                output += '\n' + formatDiff(changes) + '\n';
            }
            else {
                output += '\n' + formatBold('File Changes:') + ' No changes since pause\n';
            }
            // Show staleness warning if applicable
            if (stalenessWarning) {
                output += '\n' + stalenessWarning + '\n';
            }
            // Format loop visual
            const loopVisual = formatLoopVisual(session.phase);
            output += '\n' + loopVisual + '\n\n';
            // Show next action
            const nextAction = stateManager.getRequiredNextAction(session.phase);
            output += formatBold('Next Action:') + ` ${nextAction}\n\n`;
            output += formatBold('Commands:') + '\n' +
                formatList([
                    'Run `/paul:status` for full project status',
                    'Run `/paul:progress` for detailed loop status',
                ]);
            return output;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, '❌ Resume Failed') + '\n\n' +
                `Failed to resume session: ${errorMessage}\n\n` +
                formatBold('Troubleshooting:') + '\n' +
                formatList([
                    'Ensure .openpaul/CURRENT-SESSION file exists',
                    'Check if session files are valid JSON',
                    'Try running `/paul:init` to start fresh',
                ]);
        }
    },
});
/**
 * Compute SHA256 checksums for tracked files
 *
 * @param projectRoot - Project root directory
 * @returns Map of file paths to checksums
 */
function computeFileChecksums(projectRoot) {
    const checksums = {};
    // Define tracked files/directories
    const trackedPaths = [
        '.openpaul',
        'src',
        'package.json',
        'tsconfig.json',
    ];
    for (const trackedPath of trackedPaths) {
        const fullPath = join(projectRoot, trackedPath);
        if (!existsSync(fullPath)) {
            continue;
        }
        // For now, we only checksum files, not directories
        // A more sophisticated implementation would recursively walk directories
        try {
            const stat = require('fs').statSync(fullPath);
            if (stat.isFile()) {
                const content = readFileSync(fullPath, 'utf-8');
                const hash = createHash('sha256').update(content).digest('hex');
                checksums[trackedPath] = hash;
            }
        }
        catch (error) {
            // Skip files that can't be read
            continue;
        }
    }
    return checksums;
}
/**
 * Detect file changes by comparing checksums
 *
 * @param projectRoot - Project root directory
 * @param savedChecksums - Checksums from saved session
 * @returns Array of file changes
 */
function detectFileChanges(projectRoot, savedChecksums) {
    const currentChecksums = computeFileChecksums(projectRoot);
    const changes = [];
    // Check for modified and deleted files
    for (const [filePath, oldChecksum] of Object.entries(savedChecksums)) {
        const newChecksum = currentChecksums[filePath];
        if (!newChecksum) {
            // File was deleted
            changes.push({
                type: 'deleted',
                filePath,
            });
        }
        else if (newChecksum !== oldChecksum) {
            // File was modified
            try {
                const fullPath = join(projectRoot, filePath);
                const content = readFileSync(fullPath, 'utf-8');
                // We don't have old content in the session state
                // So we show a placeholder diff
                changes.push({
                    type: 'modified',
                    filePath,
                    diff: `File modified (checksum: ${oldChecksum.substring(0, 8)}... → ${newChecksum.substring(0, 8)}...)`,
                });
            }
            catch (error) {
                changes.push({
                    type: 'modified',
                    filePath,
                });
            }
        }
    }
    // Check for added files
    for (const filePath of Object.keys(currentChecksums)) {
        if (!savedChecksums[filePath]) {
            changes.push({
                type: 'added',
                filePath,
            });
        }
    }
    return changes;
}
/**
 * Format the loop visual indicator
 *
 * Shows the PLAN → APPLY → UNIFY loop with current position highlighted
 */
function formatLoopVisual(currentPhase) {
    const phases = ['PLAN', 'APPLY', 'UNIFY'];
    const formattedPhases = phases.map(phase => {
        if (phase === currentPhase) {
            // Current phase: ◉
            return `◉ ${phase}`;
        }
        // Check if phase is before current (completed)
        const currentIndex = phases.indexOf(currentPhase);
        const phaseIndex = phases.indexOf(phase);
        if (phaseIndex < currentIndex) {
            // Completed phase: ✓
            return `✓ ${phase}`;
        }
        // Future phase: ○
        return `○ ${phase}`;
    });
    return `📍 Loop: ${formattedPhases.join(' → ')}`;
}
//# sourceMappingURL=resume.js.map