/**
 * Error Formatter
 *
 * Guided error formatting with context, suggested fixes, and next steps
 */
/**
 * Format a guided error message with structure and guidance
 *
 * @param params - Error parameters
 * @returns Formatted error string with markdown headers
 *
 * @example
 * formatGuidedError({
 *   title: 'Invalid State Transition',
 *   message: 'Cannot transition from PLAN to UNIFY',
 *   context: 'Current state: PLAN',
 *   suggestedFix: 'Run /paul:apply to execute the plan first',
 *   nextSteps: [
 *     'Check current state with /paul:progress',
 *     'Execute the current plan with /paul:apply'
 *   ]
 * })
 */
export function formatGuidedError(params) {
    const { title, message, context, suggestedFix, nextSteps } = params;
    let output = `## ❌ ${title}\n\n`;
    output += `${message}\n\n`;
    if (context) {
        output += `### Context\n\n${context}\n\n`;
    }
    output += `### Suggested Fix\n\n${suggestedFix}\n\n`;
    if (nextSteps.length > 0) {
        output += `### Next Steps\n\n`;
        nextSteps.forEach((step, index) => {
            output += `${index + 1}. ${step}\n`;
        });
        output += '\n';
    }
    output += `### Quick Help\n\n`;
    output += `- Run \`/paul:help\` for command reference\n`;
    output += `- Run \`/paul:progress\` to check current state\n`;
    return output;
}
//# sourceMappingURL=error-formatter.js.map