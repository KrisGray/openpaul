/**
 * Output Formatter
 * 
 * Rich text formatting utilities for markdown-based output
 */

/**
 * Status type for status indicators
 */
export type Status = 'success' | 'in-progress' | 'paused' | 'failed'

/**
 * Criteria result status for reconciliation output
 */
export type CriteriaResultStatus = 'pass' | 'fail'

/**
 * Criteria result entry
 */
export interface CriteriaResult {
  criteria: string
  status: CriteriaResultStatus
  notes?: string
}

/**
 * Header level (1-3)
 */
export type HeaderLevel = 1 | 2 | 3

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
export function formatHeader(level: HeaderLevel, text: string): string {
  const hashes = '#'.repeat(level)
  return `${hashes} ${text}`
}

/**
 * Format bold text
 * 
 * @param text - Text to make bold
 * @returns Bold formatted text
 * 
 * @example
 * formatBold('important')  // '**important**'
 */
export function formatBold(text: string): string {
  return `**${text}**`
}

/**
 * Format italic text
 * 
 * @param text - Text to make italic
 * @returns Italic formatted text
 * 
 * @example
 * formatItalic('emphasis')  // '*emphasis*'
 */
export function formatItalic(text: string): string {
  return `*${text}*`
}

/**
 * Format inline code
 * 
 * @param text - Code text
 * @returns Code formatted text
 * 
 * @example
 * formatCode('const x = 1')  // '`const x = 1`'
 */
export function formatCode(text: string): string {
  return `\`${text}\``
}

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
export function formatCodeBlock(code: string, language?: string): string {
  const lang = language || ''
  return `\`\`\`${lang}\n${code}\n\`\`\``
}

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
export function formatList(items: string[], ordered: boolean = false): string {
  return items
    .map((item, index) => {
      if (ordered) {
        return `${index + 1}. ${item}`
      }
      return `- ${item}`
    })
    .join('\n')
}

/**
 * Format an execution graph (waves) into a readable string
 *
 * @param graph - Execution graph waves (e.g., [[1, 3], [2]])
 * @returns Formatted execution graph string
 */
export function formatExecutionGraph(graph: number[][]): string {
  if (!graph || graph.length === 0) {
    return 'No execution graph available'
  }

  const waves = graph.map(wave => `[${wave.join(', ')}]`)
  return waves.join(' → ')
}

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
export function formatKeyValue(pairs: Record<string, string>): string {
  return Object.entries(pairs)
    .map(([key, value]) => `**${key}:** ${value}`)
    .join('\n')
}

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
export function formatStatus(status: Status): string {
  const statusMap: Record<Status, string> = {
    success: '✅',
    'in-progress': '⏳',
    paused: '⏸️',
    failed: '❌',
  }
  
  return statusMap[status]
}

/**
 * Format comparison items with a default fallback when empty
 */
export function formatComparisonItems(items: string[], emptyMessage: string = 'None'): string {
  if (!items.length) {
    return `- ${emptyMessage}`
  }

  return formatList(items)
}

/**
 * Format criteria results with pass/fail markers
 */
export function formatCriteriaResults(results: CriteriaResult[]): string {
  if (!results.length) {
    return '- None'
  }

  return results
    .map(result => {
      const marker = result.status === 'pass' ? '✅' : '❌'
      const notes = result.notes ? ` — ${result.notes}` : ''
      return `- ${marker} ${result.criteria}${notes}`
    })
    .join('\n')
}
