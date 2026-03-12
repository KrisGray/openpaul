import { tool } from '@opencode-ai/plugin';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { StateManager } from '../state/state-manager';
import { SessionManager } from '../storage/session-manager';
import { atomicWrite } from '../storage/atomic-writes';
import { formatHeader, formatList, formatBold } from '../output/formatter';
import { buildSessionContext } from '../utils/session-context';
import { renderHandoffTemplate } from '../utils/handoff-template';
/**
 * /openpaul:handoff Command
 *
 * Create explicit handoff document for team collaboration
 *
 * From PLAN.md:
 * - Creates HANDOFF.md with complete context transfer information
 * - Works with paused sessions (loads existing session state)
 * - Works without paused sessions (creates temporary session state on-the-fly)
 * - Saves to .openpaul/HANDOFF.md
 * - Returns formatted success message with file location
 */
export const openpaulHandoff = tool({
    description: 'Create explicit handoff document for team collaboration',
    args: {},
    execute: async (_args, context) => {
        try {
            const stateManager = new StateManager(context.directory);
            const sessionManager = new SessionManager(context.directory);
            // Get current position
            const position = stateManager.getCurrentPosition();
            if (!position) {
                return formatHeader(2, '❌ Cannot Create Handoff') + '\n\n' +
                    'OpenPAUL has not been initialized in this project.\n\n' +
                    formatBold('Next Steps:') + '\n' +
                    formatList([
                        'Run `/openpaul:init` to initialize OpenPAUL',
                    ]);
            }
            // Load current session or create temporary session state
            let sessionState;
            let status;
            const existingSession = sessionManager.loadCurrentSession();
            if (existingSession) {
                sessionState = existingSession;
                status = 'paused';
            }
            else {
                // Create temporary session state on-the-fly
                sessionState = {
                    sessionId: sessionManager.generateSessionId(),
                    createdAt: Date.now(),
                    pausedAt: Date.now(),
                    phase: position.phase,
                    phaseNumber: position.phaseNumber,
                    currentPlanId: undefined,
                    workInProgress: [],
                    nextSteps: [stateManager.getRequiredNextAction(position.phase)],
                    metadata: {},
                    fileChecksums: {}, // Empty checksums for temporary session
                };
                status = 'active';
            }
            // Get project info
            const projectName = getProjectName(context.directory);
            const phaseName = getPhaseName(context.directory, position.phaseNumber);
            const totalPhases = getTotalPhases(context.directory);
            const version = getVersion(context.directory);
            const sessionContext = buildSessionContext(stateManager, position);
            const resolvedSessionState = {
                ...sessionState,
                currentPlanId: sessionState.currentPlanId ?? sessionContext.currentPlanId,
                workInProgress: sessionContext.workInProgress,
                nextSteps: sessionContext.nextSteps,
            };
            const handoffContent = renderHandoffTemplate({
                sessionState: resolvedSessionState,
                status,
                projectName,
                phaseName,
                totalPhases,
                version,
                accomplished: sessionContext.accomplished,
                workInProgress: sessionContext.workInProgress,
                nextSteps: sessionContext.nextSteps,
            });
            // Write HANDOFF.md using atomic write
            const handoffDir = join(context.directory, '.openpaul');
            const handoffPath = join(handoffDir, 'HANDOFF.md');
            if (!existsSync(handoffDir)) {
                mkdirSync(handoffDir, { recursive: true });
            }
            await atomicWrite(handoffPath, handoffContent);
            // Format success output
            let output = formatHeader(2, '✅ Handoff Created') + '\n\n';
            output += formatBold('HANDOFF.md:') + ' .openpaul/HANDOFF.md\n';
            output += formatBold('Session ID:') + ` ${sessionState.sessionId}\n\n`;
            output += formatBold('Instructions:') + '\n';
            output += formatList([
                'Review and edit HANDOFF.md before sharing',
                'Share HANDOFF.md with team members',
                'To resume: /openpaul:resume',
            ]);
            return output;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, '❌ Handoff Failed') + '\n\n' +
                `Failed to create handoff: ${errorMessage}\n\n` +
                formatBold('Troubleshooting:') + '\n' +
                formatList([
                    'Ensure OpenPAUL is initialized with `/openpaul:init`',
                    'Check that the .openpaul directory is writable',
                    'Verify the HANDOFF.md template exists',
                ]);
        }
    },
});
/**
 * Get project name from model-config.json
 */
function getProjectName(projectRoot) {
    const modelConfigPath = join(projectRoot, '.paul', 'model-config.json');
    if (existsSync(modelConfigPath)) {
        try {
            const config = JSON.parse(readFileSync(modelConfigPath, 'utf-8'));
            return config.projectName || 'OpenPAUL Project';
        }
        catch {
            // Fall through to default
        }
    }
    return 'OpenPAUL Project';
}
/**
 * Get version from package.json
 */
function getVersion(projectRoot) {
    const packagePath = join(projectRoot, 'package.json');
    if (existsSync(packagePath)) {
        try {
            const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
            return pkg.version || '1.0.0';
        }
        catch {
            // Fall through to default
        }
    }
    return '1.0.0';
}
/**
 * Get total phases from ROADMAP.md
 */
function getTotalPhases(projectRoot) {
    const roadmapPath = join(projectRoot, '.paul', 'ROADMAP.md');
    if (!existsSync(roadmapPath)) {
        const altRoadmapPath = join(projectRoot, '.openpaul', 'ROADMAP.md');
        if (!existsSync(altRoadmapPath)) {
            return 9; // Default
        }
        return extractTotalPhases(altRoadmapPath);
    }
    return extractTotalPhases(roadmapPath);
}
/**
 * Extract total phases from ROADMAP content
 */
function extractTotalPhases(roadmapPath) {
    try {
        const content = readFileSync(roadmapPath, 'utf-8');
        // Look for progress table with phase counts
        const tableMatch = content.match(/\|\s*\d+\.\s+/g);
        if (tableMatch) {
            return tableMatch.length;
        }
        // Look for Phase X: headers
        const headerMatches = content.match(/###?\s*Phase\s+\d+:/gi);
        if (headerMatches) {
            return headerMatches.length;
        }
        return 9; // Default
    }
    catch {
        return 9;
    }
}
/**
 * Get phase name from ROADMAP.md
 */
function getPhaseName(projectRoot, phaseNumber) {
    const roadmapPath = join(projectRoot, '.paul', 'ROADMAP.md');
    if (!existsSync(roadmapPath)) {
        const altRoadmapPath = join(projectRoot, '.openpaul', 'ROADMAP.md');
        if (!existsSync(altRoadmapPath)) {
            return 'Unknown';
        }
        return extractPhaseName(altRoadmapPath, phaseNumber);
    }
    return extractPhaseName(roadmapPath, phaseNumber);
}
/**
 * Extract phase name from ROADMAP content
 */
function extractPhaseName(roadmapPath, phaseNumber) {
    try {
        const roadmapContent = readFileSync(roadmapPath, 'utf-8');
        // Look for "Phase X: Name" pattern
        const phaseRegex = new RegExp(`###?\\s*Phase\\s+${phaseNumber}:\\s*(.+?)(?:\\n|$)`, 'i');
        const match = roadmapContent.match(phaseRegex);
        if (match) {
            return match[1].trim();
        }
        // Also look for "| X. Name |" pattern in progress table
        const tableRegex = new RegExp(`\\|\\s*${phaseNumber}\\.\\s*(.+?)\\s*\\|`, 'g');
        const tableMatch = roadmapContent.match(tableRegex);
        if (tableMatch && tableMatch[0]) {
            const nameMatch = tableMatch[0].match(/\d+\.\s*(.+?)\s*\|/);
            if (nameMatch) {
                return nameMatch[1].trim();
            }
        }
        return 'Unknown';
    }
    catch {
        return 'Unknown';
    }
}
//# sourceMappingURL=handoff.js.map