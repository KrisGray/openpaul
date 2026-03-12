import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { generateCodebaseDoc, docToMarkdown } from '../utils/codebase-generator'
import { isCacheValid, loadCache, saveCache, getLastScanCacheEntries } from '../utils/directory-scanner'
import { formatHeader, formatBold } from '../output/formatter'
import { atomicWrite } from '../storage/atomic-writes'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'

export const openpaulMapCodebase: ToolDefinition = tool({
  description: 'Generate codebase documentation (CODEBASE.md)',
  args: {
    output: tool.schema.string().optional().describe('Output file path (default: CODEBASE.md)'),
    maxDepth: tool.schema.number().optional().describe('Max directory depth (default: 5)'),
    force: tool.schema.boolean().optional().describe('Bypass cache and force regeneration'),
    verbose: tool.schema.boolean().optional().describe('Show progress information'),
  },
  execute: async ({ output = 'CODEBASE.md', maxDepth = 5, force = false, verbose = false }, context) => {
    try {
      const outputPath = join(context.directory, output)

      if (!force && isCacheValid(context.directory, outputPath)) {
        const cache = loadCache(context.directory)
        const cachedAt = cache?.timestamp ? new Date(cache.timestamp).toISOString() : 'Unknown'
        return formatHeader(2, '📍 Codebase Cached') + '\n\n' +
          formatBold('Output:') + ` ${outputPath}\n` +
          formatBold('Status:') + ' Using cached result\n' +
          formatBold('Scan:') + ' Skipped (cache valid)\n' +
          formatBold('Cached at:') + ` ${cachedAt}\n\n` +
          'No changes detected since last run.\n' +
          'Use --force to regenerate.'
      }

      if (verbose) {
        console.error('Scanning codebase...')
      }

      const scanTimestamp = Date.now()
      const doc = generateCodebaseDoc(context.directory, { maxDepth, outputPath })

      const dir = dirname(outputPath)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      const markdown = docToMarkdown(doc)
      await atomicWrite(outputPath, markdown)

      const cacheEntries = getLastScanCacheEntries()
      saveCache(context.directory, cacheEntries, scanTimestamp)

      if (verbose) {
        console.error(`Scanned ${doc.fileCounts.files} files in ${doc.fileCounts.directories} directories`)
        console.error(`Cache entries saved: ${cacheEntries.length}`)
        if (cacheEntries.length === 0) {
          console.error('No cache entries captured; cache validation may fail.')
        }
      }

      return formatHeader(2, '📍 Codebase Mapped') + '\n\n' +
        formatBold('Output:') + ` ${outputPath}\n\n` +
        `Files: ${doc.fileCounts.files}\n` +
        `Directories: ${doc.fileCounts.directories}\n` +
        `Stack items: ${doc.stack.length}\n\n` +
        `Last updated: ${doc.generatedAt}`
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Map Codebase Error') + '\n\n' +
        `Failed to generate codebase documentation: ${errorMessage}`
    }
  },
})
