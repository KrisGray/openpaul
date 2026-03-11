import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { generateCodebaseDoc, docToMarkdown } from '../utils/codebase-generator'
import { formatHeader, formatBold } from '../output/formatter'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'

export const paulMapCodebase: ToolDefinition = tool({
  description: 'Generate codebase documentation (CODEBASE.md)',
  args: {
    output: tool.schema.string().optional().describe('Output file path (default: CODEBASE.md)'),
    maxDepth: tool.schema.number().optional().describe('Max directory depth (default: 5)'),
  },
  execute: async ({ output = 'CODEBASE.md', maxDepth = 5 }, context) => {
    try {
      const outputPath = join(context.directory, output)
      const doc = generateCodebaseDoc(context.directory, { maxDepth, outputPath })

      const dir = dirname(outputPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      const markdown = docToMarkdown(doc)
      writeFileSync(outputPath, markdown, 'utf-8')

      return formatHeader(2, '📍 Codebase Mapped') + '\n\n' +
        formatBold('Output:') + ` ${outputPath}\n\n` +
        `Files: ${doc.fileCounts.files}\n` +
        `Directories: ${doc.fileCounts.directories}\n` +
        `Stack items: ${doc.stack.length}\n\n` +
        'Run `cat CODEBASE.md` to view the documentation.'
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Map Codebase Error') + '\n\n' +
        `Failed to generate codebase documentation: ${errorMessage}`
    }
  },
})
