/**
 * Output Formatter
 *
 * Rich text formatting utilities for markdown-based output
 */
/**
 * Status type for status indicators
 */
export type Status = 'success' | 'in-progress' | 'paused' | 'failed';
/**
 * Criteria result status for reconciliation output
 */
export type CriteriaResultStatus = 'pass' | 'fail';
/**
 * Criteria result entry
 */
export interface CriteriaResult {
    criteria: string;
    status: CriteriaResultStatus;
    notes?: string;
}
/**
 * Header level (1-3)
 */
export type HeaderLevel = 1 | 2 | 3;
/**
 * Format a markdown header
 *
 * @param level - Header level (1-3)
 * @param text - Header text
 * @returns Formatted header string
 *
 * @example
 * formatHeader(1, 'Main Title')  // '# Main Title'
 * formatHeader(2, 'Section')     // '## Section'
 * formatHeader(3, 'Subsection')  // '### Subsection'
 */
export declare function formatHeader(level: HeaderLevel, text: string): string;
/**
 * Format bold text
 *
 * @param text - Text to make bold
 * @returns Bold formatted text
 *
 * @example
 * formatBold('important')  // '**important**'
 */
export declare function formatBold(text: string): string;
/**
 * Format italic text
 *
 * @param text - Text to make italic
 * @returns Italic formatted text
 *
 * @example
 * formatItalic('emphasis')  // '*emphasis*'
 */
export declare function formatItalic(text: string): string;
/**
 * Format inline code
 *
 * @param text - Code text
 * @returns Code formatted text
 *
 * @example
 * formatCode('const x = 1')  // '`const x = 1`'
 */
export declare function formatCode(text: string): string;
/**
 * Format a code block
 *
 * @param code - Code content
 * @param language - Optional language identifier
 * @returns Fenced code block
 *
 * @example
 * formatCodeBlock('console.log("hello")', 'javascript')
 * // '```javascript\nconsole.log("hello")\n```'
 */
export declare function formatCodeBlock(code: string, language?: string): string;
/**
 * Format a list (ordered or unordered)
 *
 * @param items - List items
 * @param ordered - Whether to create ordered list (default: false)
 * @returns Formatted list string
 *
 * @example
 * formatList(['item 1', 'item 2'])
 * // '- item 1\n- item 2'
 *
 * formatList(['first', 'second'], true)
 * // '1. first\n2. second'
 */
export declare function formatList(items: string[], ordered?: boolean): string;
/**
 * Format an execution graph (waves) into a readable string
 *
 * @param graph - Execution graph waves (e.g., [[1, 3], [2]])
 * @returns Formatted execution graph string
 */
export declare function formatExecutionGraph(graph: number[][]): string;
/**
 * Format key-value pairs
 *
 * @param pairs - Object with key-value pairs
 * @returns Formatted key-value lines
 *
 * @example
 * formatKeyValue({ Name: 'John', Age: '30' })
 * // '**Name:** John\n**Age:** 30'
 */
export declare function formatKeyValue(pairs: Record<string, string>): string;
/**
 * Format a status indicator
 *
 * @param status - Status type
 * @returns Emoji indicator for the status
 *
 * @example
 * formatStatus('success')       // '✅'
 * formatStatus('in-progress')   // '⏳'
 * formatStatus('paused')        // '⏸️'
 * formatStatus('failed')        // '❌'
 */
export declare function formatStatus(status: Status): string;
/**
 * Format comparison items with a default fallback when empty
 */
export declare function formatComparisonItems(items: string[], emptyMessage?: string): string;
/**
 * Format criteria results with pass/fail markers
 */
export declare function formatCriteriaResults(results: CriteriaResult[]): string;
//# sourceMappingURL=formatter.d.ts.map