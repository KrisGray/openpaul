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
export function progressBar(
  current: number,
  total: number,
  width: number = 10
): string {
  // Handle edge cases
  if (total <= 0) {
    return `[${'░'.repeat(width)}] 0/0`
  }
  
  // Clamp current to valid range
  const clampedCurrent = Math.max(0, Math.min(current, total))
  
  // Calculate filled and empty portions
  const filled = Math.round((clampedCurrent / total) * width)
  const empty = width - filled
  
  // Build progress bar
  const filledChar = '█'
  const emptyChar = '░'
  const bar = filledChar.repeat(filled) + emptyChar.repeat(empty)
  
  return `[${bar}] ${clampedCurrent}/${total}`
}
