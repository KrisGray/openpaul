import { readFileSync, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { atomicWrite } from './atomic-writes';
import { SessionStateSchema } from '../types/session';
/**
 * Session Manager
 *
 * Manages PAUL session state with file-based persistence.
 * Sessions are stored in .openpaul/SESSIONS/ directory with atomic writes.
 * Current session reference is stored in .openpaul/CURRENT-SESSION.
 */
export class SessionManager {
    constructor(projectRoot) {
        this.sessionsDir = join(projectRoot, '.openpaul', 'SESSIONS');
        this.currentSessionPath = join(projectRoot, '.openpaul', 'CURRENT-SESSION');
    }
    /**
     * Save session state with atomic write
     *
     * - Validates state with Zod schema
     * - Ensures .openpaul/SESSIONS/ directory exists
     * - Writes session file with atomic write
     * - Updates current session reference
     */
    async saveSession(state) {
        // Validate state with Zod
        SessionStateSchema.parse(state);
        // Ensure sessions directory exists
        if (!existsSync(this.sessionsDir)) {
            mkdirSync(this.sessionsDir, { recursive: true });
        }
        // Write session file with atomic write
        const sessionFilePath = this.getSessionPath(state.sessionId);
        const jsonContent = JSON.stringify(state, null, 2);
        await atomicWrite(sessionFilePath, jsonContent);
        // Update current session reference
        writeFileSync(this.currentSessionPath, state.sessionId, 'utf-8');
    }
    /**
     * Load current session from CURRENT-SESSION reference
     *
     * - Reads sessionId from .openpaul/CURRENT-SESSION
     * - Loads session file and validates with Zod
     * - Returns null if file doesn't exist or validation fails
     */
    loadCurrentSession() {
        // Check if current session reference exists
        if (!existsSync(this.currentSessionPath)) {
            return null;
        }
        try {
            // Read sessionId from current session reference
            const sessionId = readFileSync(this.currentSessionPath, 'utf-8').trim();
            // Load session file
            const sessionFilePath = this.getSessionPath(sessionId);
            if (!existsSync(sessionFilePath)) {
                return null;
            }
            const content = readFileSync(sessionFilePath, 'utf-8');
            const data = JSON.parse(content);
            // Validate with Zod schema
            return SessionStateSchema.parse(data);
        }
        catch (error) {
            // Return null if validation fails or any error occurs
            console.error('Failed to load current session:', error);
            return null;
        }
    }
    /**
     * Check if session file exists
     */
    sessionExists(sessionId) {
        const sessionFilePath = this.getSessionPath(sessionId);
        return existsSync(sessionFilePath);
    }
    /**
     * Delete session file
     */
    deleteSession(sessionId) {
        const sessionFilePath = this.getSessionPath(sessionId);
        if (existsSync(sessionFilePath)) {
            unlinkSync(sessionFilePath);
        }
    }
    /**
     * Get current session ID from CURRENT-SESSION reference
     */
    getCurrentSessionId() {
        if (!existsSync(this.currentSessionPath)) {
            return null;
        }
        return readFileSync(this.currentSessionPath, 'utf-8').trim();
    }
    /**
     * Generate unique session ID
     *
     * Format: session-{timestamp}
     */
    generateSessionId() {
        return `session-${Date.now()}`;
    }
    /**
     * Validate session state integrity and staleness
     *
     * - Checks if session file exists
     * - Checks if pausedAt is within 24 hours
     * - Returns validation result with errors list
     */
    validateSessionState(sessionId) {
        const errors = [];
        // Check if session file exists
        if (!this.sessionExists(sessionId)) {
            errors.push(`Session file not found: ${sessionId}`);
            return { valid: false, errors };
        }
        try {
            // Load and validate session
            const sessionFilePath = this.getSessionPath(sessionId);
            const content = readFileSync(sessionFilePath, 'utf-8');
            const data = JSON.parse(content);
            const session = SessionStateSchema.parse(data);
            // Check if session is stale (older than 24 hours)
            const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
            const now = Date.now();
            const age = now - session.pausedAt;
            if (age > TWENTY_FOUR_HOURS_MS) {
                const hoursOld = Math.round(age / (60 * 60 * 1000));
                errors.push(`Session is stale (${hoursOld} hours old, max 24 hours)`);
            }
            return { valid: errors.length === 0, errors };
        }
        catch (error) {
            errors.push(`Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { valid: false, errors };
        }
    }
    /**
     * Get session file path
     */
    getSessionPath(sessionId) {
        return join(this.sessionsDir, `${sessionId}.json`);
    }
}
//# sourceMappingURL=session-manager.js.map