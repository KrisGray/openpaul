import { diffLines } from 'diff';
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
export function formatFileDiff(oldContent, newContent) {
    const changes = diffLines(oldContent, newContent);
    const formattedLines = changes.map(part => {
        const lines = part.value.split('\n');
        // Remove trailing empty line from split
        if (lines[lines.length - 1] === '') {
            lines.pop();
        }
        return lines.map(line => {
            if (part.added) {
                return `+ ${line}`;
            }
            if (part.removed) {
                return `- ${line}`;
            }
            return `  ${line}`;
        }).join('\n');
    });
    return formattedLines.join('\n');
}
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
export function formatDiff(changes) {
    if (changes.length === 0) {
        return 'No changes since pause';
    }
    // Count changes by type
    const modified = changes.filter(c => c.type === 'modified').length;
    const added = changes.filter(c => c.type === 'added').length;
    const deleted = changes.filter(c => c.type === 'deleted').length;
    // Build summary header
    let output = '## Changes since pause\n\n';
    output += `${changes.length} file(s) changed: ${modified} modified, ${added} added, ${deleted} deleted\n\n`;
    // Show each change
    for (const change of changes) {
        const typeIndicator = getTypeIndicator(change.type);
        output += `${typeIndicator} ${change.filePath}\n`;
        // Show diff if provided and not too large
        if (change.diff) {
            const diffLines = change.diff.split('\n');
            if (diffLines.length <= 50) {
                output += '```\n';
                output += change.diff;
                output += '\n```\n';
            }
            else {
                output += '(large file, run verbose for full diff)\n';
            }
        }
        output += '\n';
    }
    return output.trim();
}
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
export function formatStalenessWarning(hoursAgo) {
    if (hoursAgo > 24) {
        return `⚠️ Session paused ${Math.round(hoursAgo)} hours ago`;
    }
    return '';
}
/**
 * Get type indicator for change type
 */
function getTypeIndicator(type) {
    const indicators = {
        modified: 'M',
        added: 'A',
        deleted: 'D',
    };
    return indicators[type];
}
//# sourceMappingURL=diff-formatter.js.map