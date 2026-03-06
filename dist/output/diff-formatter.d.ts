/**
 * Diff Formatter
 *
 * Formats file diffs and change summaries for session resume display
 */
/**
 * Change type for file modifications
 */
export type ChangeType = 'modified' | 'added' | 'deleted';
/**
 * File change entry
 */
export interface FileChange {
    type: ChangeType;
    filePath: string;
    diff?: string;
}
/**
 * Format a file diff between old and new content
 *
 * @param oldContent - Original file content
 * @param newContent - New file content
 * @returns Formatted diff string with +/- prefixes
 *
 * @example
 * formatFileDiff('line1\nline2', 'line1\nline3')
 * // '  line1\n- line2\n+ line3'
 */
export declare function formatFileDiff(oldContent: string, newContent: string): string;
/**
 * Format a summary of file changes with optional diffs
 *
 * @param changes - Array of file changes
 * @returns Formatted summary string
 *
 * @example
 * formatDiff([
 *   { type: 'modified', filePath: 'src/test.ts', diff: '+ line1\n- line2' },
 *   { type: 'added', filePath: 'src/new.ts' }
 * ])
 */
export declare function formatDiff(changes: FileChange[]): string;
/**
 * Format a staleness warning for old sessions
 *
 * @param hoursAgo - Number of hours since session was paused
 * @returns Warning message or empty string if session is fresh
 *
 * @example
 * formatStalenessWarning(25)  // '⚠️ Session paused 25 hours ago'
 * formatStalenessWarning(10)  // ''
 */
export declare function formatStalenessWarning(hoursAgo: number): string;
//# sourceMappingURL=diff-formatter.d.ts.map