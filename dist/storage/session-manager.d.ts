import type { SessionState } from '../types/session';
/**
 * Session Manager
 *
 * Manages PAUL session state with file-based persistence.
 * Sessions are stored in .openpaul/SESSIONS/ directory with atomic writes.
 * Current session reference is stored in .openpaul/CURRENT-SESSION.
 */
export declare class SessionManager {
    private sessionsDir;
    private currentSessionPath;
    constructor(projectRoot: string);
    /**
     * Save session state with atomic write
     *
     * - Validates state with Zod schema
     * - Ensures .openpaul/SESSIONS/ directory exists
     * - Writes session file with atomic write
     * - Updates current session reference
     */
    saveSession(state: SessionState): Promise<void>;
    /**
     * Load current session from CURRENT-SESSION reference
     *
     * - Reads sessionId from .openpaul/CURRENT-SESSION
     * - Loads session file and validates with Zod
     * - Returns null if file doesn't exist or validation fails
     */
    loadCurrentSession(): SessionState | null;
    /**
     * Check if session file exists
     */
    sessionExists(sessionId: string): boolean;
    /**
     * Delete session file
     */
    deleteSession(sessionId: string): void;
    /**
     * Get current session ID from CURRENT-SESSION reference
     */
    getCurrentSessionId(): string | null;
    /**
     * Generate unique session ID
     *
     * Format: session-{timestamp}
     */
    generateSessionId(): string;
    /**
     * Validate session state integrity and staleness
     *
     * - Checks if session file exists
     * - Checks if pausedAt is within 24 hours
     * - Returns validation result with errors list
     */
    validateSessionState(sessionId: string): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get session file path
     */
    private getSessionPath;
}
//# sourceMappingURL=session-manager.d.ts.map