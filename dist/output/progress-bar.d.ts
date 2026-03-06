/**
 * Progress Bar
 *
 * Visual progress indicator for task completion
 */
/**
 * Generate a visual progress bar
 *
 * @param current - Current progress value
 * @param total - Total target value
 * @param width - Width of the progress bar in characters (default: 10)
 * @returns Formatted progress bar string
 *
 * @example
 * progressBar(3, 10)        // '[███░░░░░░░] 3/10'
 * progressBar(0, 10)        // '[░░░░░░░░░░] 0/10'
 * progressBar(10, 10)       // '[██████████] 10/10'
 * progressBar(5, 10, 20)    // '[██████████░░░░░░░░░░] 5/10'
 */
export declare function progressBar(current: number, total: number, width?: number): string;
//# sourceMappingURL=progress-bar.d.ts.map