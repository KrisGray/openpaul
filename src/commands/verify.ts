import { tool, type ToolContext } from '@opencode-ai/plugin'
import { z } from 'zod'
import { QualityManager } from '../storage/quality-manager'
import { formatHeader, formatBold, formatList } from '../output/formatter'
import type { UATItem, UATIssue, UATResult, UATSeverity, UATCategory } from '../types/quality'

/**
 * /openpaul:verify Command
 * 
 * Perform manual acceptance testing by generating a test checklist from SUMMARY.md,
 * guiding users through each test, and capturing results in UAT.md and UAT-ISSUES.md.
 * 
 * From CONTEXT.md locked decisions:
 * - Extract verification items from SUMMARY.md must_haves/truths
 * - Display interactive numbered list with progress
 * - Failed handling: Prompt for issue description, severity, category
 * - Create both UAT.md (pass/fail summary) and UAT-ISSUES.md (failed item details)
 */
const toolFactory = tool as unknown as (input: any) => any

type VerifyArgs = {
  phase: number
  item?: number
  result?: 'pass' | 'fail' | 'skip'
  notes?: string
  severity?: 'critical' | 'major' | 'minor'
  category?: 'functional' | 'visual' | 'performance' | 'configuration'
}

export const paulVerify = toolFactory({
  name: 'openpaul:verify',
  description: 'Perform manual acceptance testing from SUMMARY.md checklist',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number to verify'),
    item: z.number().int().positive().optional().describe('Item number to test (1-based index)'),
    result: z.enum(['pass', 'fail', 'skip']).optional().describe('Test result for the item'),
    notes: z.string().optional().describe('Notes for pass/fail result'),
    severity: z.enum(['critical', 'major', 'minor']).optional().describe('Severity for failed items'),
    category: z.enum(['functional', 'visual', 'performance', 'configuration']).optional().describe('Category for failed items'),
  }),
  execute: async (args: VerifyArgs, context: ToolContext) => {
    try {
      const qualityManager = new QualityManager(context.directory)

      // Resolve phase directory
      const phaseDir = qualityManager.resolvePhaseDir(args.phase)
      if (!phaseDir) {
        return formatHeader(2, 'Cannot Verify') + '\n\n' +
          `Phase ${args.phase} directory not found.\n\n` +
          formatBold('What to do:') + '\n' +
          formatList([
            'Run /openpaul:init to initialize the project',
            'Make sure the phase has been planned and executed',
          ])
      }

      // Check if SUMMARY.md exists
      if (!qualityManager.summaryExists(phaseDir)) {
        return formatHeader(2, 'Cannot Verify') + '\n\n' +
          'SUMMARY.md not found. Run /gsd-execute-phase first to generate it.\n\n' +
          formatBold('What to do:') + '\n' +
          formatList([
            'Run `/gsd-execute-phase` to execute the plan',
            'Then re-run `/openpaul:verify`',
          ])
      }

      // Parse SUMMARY.md to get must_haves truths
      const summaryData = qualityManager.parseSummaryMustHaves(phaseDir)
      if (!summaryData) {
        return formatHeader(2, 'Cannot Verify') + '\n\n' +
          'Could not parse SUMMARY.md. Please check the file format.\n\n' +
          formatBold('What to do:') + '\n' +
          formatList([
            'Check that SUMMARY.md exists in the phase directory',
            'Verify it has valid YAML frontmatter with must_haves.truths',
          ])
      }

      const { truths, sourcePlanId } = summaryData

      if (truths.length === 0) {
        return formatHeader(2, 'No Test Items') + '\n\n' +
          'No truths found in SUMMARY.md must_haves section.\n\n' +
          formatBold('What to do:') + '\n' +
          formatList([
            'Ensure SUMMARY.md has must_haves.truths defined',
            'The truths should be in the YAML frontmatter under must_haves.truths',
          ])
      }

      // Load existing UAT or create new one
      let uat = qualityManager.readUAT(phaseDir)
      if (!uat) {
        uat = qualityManager.createEmptyUAT(args.phase, sourcePlanId)
      }

      // Load existing issues
      let uatIssues = qualityManager.readUATIssues(phaseDir)
      if (!uatIssues) {
        uatIssues = qualityManager.createEmptyUATIssues(args.phase, sourcePlanId)
      }

      // If no item specified, show checklist
      if (args.item === undefined) {
        return displayChecklist(args.phase, truths, uat)
      }

      // Validate item number
      if (args.item < 1 || args.item > truths.length) {
        return formatHeader(2, 'Invalid Item') + '\n\n' +
          `Item ${args.item} is out of range (1-${truths.length}).\n\n` +
          formatBold('Available items:') + '\n' +
          formatList(truths.map((t, i) => `${i + 1}. ${t}`))
      }

      // If no result specified, show item details
      if (args.result === undefined) {
        const itemIndex = args.item - 1
        const truth = truths[itemIndex]
        
        // Check if this item was already tested
        const existingItem = uat.items.find(i => i.id === args.item)
        
        let statusInfo = ''
        if (existingItem) {
          statusInfo = `\n${formatBold('Current status:')} ${existingItem.result}`
          if (existingItem.notes) {
            statusInfo += `\n${formatBold('Notes:')} ${existingItem.notes}`
          }
        }

        return formatHeader(2, `Item ${args.item}`) + '\n\n' +
          `${truth}\n${statusInfo}\n\n` +
          formatBold('Test this item:') + '\n' +
          `/openpaul:verify --phase ${args.phase} --item ${args.item} --result pass|fail|skip\n\n` +
          formatBold('For failed items, include:') + '\n' +
          formatList([
            '--notes "issue description"',
            '--severity critical|major|minor',
            '--category functional|visual|performance|configuration',
          ])
      }

      // Process the result
      const truth = truths[args.item - 1]
      const testedAt = Date.now()

      // If result is fail, validate severity and category
      if (args.result === 'fail') {
        if (!args.severity || !args.category) {
          return formatHeader(2, 'Missing Information') + '\n\n' +
            `Failed items require --severity and --category.\n\n` +
            formatBold('Required flags for --result fail:') + '\n' +
            formatList([
              '--severity critical|major|minor',
              '--category functional|visual|performance|configuration',
              '--notes "description of the issue"',
            ]) + '\n\n' +
            formatBold('Example:') + '\n' +
            `/openpaul:verify --phase ${args.phase} --item ${args.item} --result fail --severity major --category functional --notes "Button not responding"`
        }

        if (!args.notes) {
          return formatHeader(2, 'Missing Notes') + '\n\n' +
            `Failed items require --notes with issue description.\n\n` +
            formatBold('Example:') + '\n' +
            `/openpaul:verify --phase ${args.phase} --item ${args.item} --result fail --severity major --category functional --notes "Button not responding"`
        }

        // Create issue record
        const issueId = uatIssues.issues.length + 1
        const newIssue: UATIssue = {
          id: issueId,
          itemDescription: truth,
          status: 'open',
          severity: args.severity,
          category: args.category,
          description: args.notes,
          sourcePlanId: sourcePlanId,
          createdAt: testedAt,
        }
        uatIssues.issues.push(newIssue)
        await qualityManager.writeUATIssues(phaseDir, uatIssues)
      }

      // Update UAT item
      const existingItemIndex = uat.items.findIndex(i => i.id === args.item)
      const uatItem: UATItem = {
        id: args.item,
        description: truth,
        result: args.result,
        notes: args.notes,
        testedAt,
      }

      if (existingItemIndex >= 0) {
        uat.items[existingItemIndex] = uatItem
      } else {
        uat.items.push(uatItem)
      }

      // Calculate summary
      uat.summary = qualityManager.calculateSummary(uat.items)
      uat.testedAt = Date.now()

      // Determine status
      if (uat.summary.total === truths.length) {
        uat.status = uat.summary.failed > 0 ? 'partial' : 'complete'
      } else if (uat.items.length > 0) {
        uat.status = 'partial'
      }

      await qualityManager.writeUAT(phaseDir, uat)

      // Format response based on result
      const resultIcon = args.result === 'pass' ? '✅' : args.result === 'fail' ? '❌' : '⏭️'
      
      let output = formatHeader(2, 'Result Recorded') + '\n\n'
      output += `${resultIcon} Item ${args.item}: ${args.result.toUpperCase()}\n\n`
      output += formatBold('Truth:') + ` ${truth}\n\n`

      if (args.result === 'fail') {
        output += formatBold('Issue recorded in:') + ' UAT-ISSUES.md\n'
        output += formatBold('Severity:') + ` ${args.severity}\n`
        output += formatBold('Category:') + ` ${args.category}\n`
        if (args.notes) {
          output += formatBold('Notes:') + ` ${args.notes}\n`
        }
        output += '\n' + formatBold('Next:') + '\n'
        output += formatList([
          'Run `/openpaul:plan-fix` to create a fix plan',
          'Or continue testing other items',
        ])
      }

      // Show updated progress
      output += '\n' + formatBold('Progress:') + '\n'
      output += `${uat.summary.passed}/${truths.length} passed, ${uat.summary.failed} failed, ${uat.summary.skipped} skipped\n`

      // Check if all items tested
      if (uat.items.length === truths.length) {
        output += '\n' + formatHeader(3, 'Verification Complete') + '\n\n'
        output += formatBold('Summary:') + '\n'
        output += formatList([
          `Passed: ${uat.summary.passed}`,
          `Failed: ${uat.summary.failed}`,
          `Skipped: ${uat.summary.skipped}`,
          `Total: ${uat.summary.total}`,
        ]) + '\n\n'

        if (uat.summary.failed > 0) {
          output += formatBold('Files created:') + '\n'
          output += formatList([
            'UAT.md - Test results summary',
            'UAT-ISSUES.md - Failed item details',
          ]) + '\n\n'
          output += formatBold('Next:') + '\n'
          output += 'Run `/openpaul:plan-fix` to address issues\n'
        } else {
          output += formatBold('All tests passed!') + '\n'
          output += '\nResults saved to UAT.md\n'
        }
      }

      return output

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, 'Verification Failed') + '\n\n' +
        `Error: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure SUMMARY.md exists with valid must_haves.truths',
          'Check that the phase directory is writable',
          'Try running /openpaul:status to check project state',
        ])
    }
  },
})

/**
 * Display checklist of test items
 */
function displayChecklist(phase: number, truths: string[], uat: { items: UATItem[]; summary: { passed: number; failed: number; skipped: number; total: number } }): string {
  const lines: string[] = []

  lines.push(formatHeader(2, `UAT Checklist - Phase ${phase}`))
  lines.push('')

  // Show progress
  const testedCount = uat.items.length
  lines.push(formatBold('Progress:') + ` ${testedCount}/${truths.length} tested`)
  if (uat.summary.total > 0) {
    lines.push(`${formatBold('Passed:')} ${uat.summary.passed} | ${formatBold('Failed:')} ${uat.summary.failed} | ${formatBold('Skipped:')} ${uat.summary.skipped}`)
  }
  lines.push('')

  // Show truth items
  lines.push(formatBold('Test Items:'))
  lines.push('')

  for (let i = 0; i < truths.length; i++) {
    const itemNum = i + 1
    const existingItem = uat.items.find(item => item.id === itemNum)
    const statusIcon = existingItem 
      ? existingItem.result === 'pass' ? '✅' 
        : existingItem.result === 'fail' ? '❌' 
        : '⏭️'
      : '⬜'
    
    const resultStr = existingItem ? ` [${existingItem.result.toUpperCase()}]` : ''
    lines.push(`${itemNum}. ${statusIcon} ${truths[i]}${resultStr}`)
  }

  lines.push('')
  lines.push(formatBold('How to test:'))
  lines.push('')
  lines.push(formatList([
    `Run \`/openpaul:verify --phase ${phase} --item N --result pass|fail|skip\``,
    'For failed items, also add: --severity, --category, --notes',
  ]))

  lines.push('')
  lines.push(formatBold('Examples:'))
  lines.push('')
  lines.push(`\`/openpaul:verify --phase ${phase} --item 1 --result pass\``)
  lines.push(`\`/openpaul:verify --phase ${phase} --item 2 --result fail --severity major --category functional --notes "Button not working"\``)
  lines.push(`\`/openpaul:verify --phase ${phase} --item 3 --result skip\``)

  return lines.join('\n')
}
