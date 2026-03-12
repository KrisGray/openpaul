import { tool } from '@opencode-ai/plugin';
import { generateCodebaseDoc, docToMarkdown } from '../utils/codebase-generator';
import { isCacheValid, loadCache } from '../utils/directory-scanner';
import { formatHeader, formatBold } from '../output/formatter';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
export const paulMapCodebase = tool({
    description: 'Generate codebase documentation (CODEBASE.md)',
    args: {
        output: tool.schema.string().optional().describe('Output file path (default: CODEBASE.md)'),
        maxDepth: tool.schema.number().optional().describe('Max directory depth (default: 5)'),
        force: tool.schema.boolean().optional().describe('Bypass cache and force regeneration'),
        verbose: tool.schema.boolean().optional().describe('Show progress information'),
    },
    execute: async ({ output = 'CODEBASE.md', maxDepth = 5, force = false, verbose = false }, context) => {
        try {
            const outputPath = join(context.directory, output);
            if (!force && isCacheValid(context.directory, outputPath)) {
                const cache = loadCache(context.directory);
                return formatHeader(2, '📍 Codebase Cached') + '\n\n' +
                    formatBold('Output:') + ` ${outputPath}\n` +
                    formatBold('Status:') + ' Using cached result\n\n' +
                    'No changes detected since last run.\n' +
                    'Use --force to regenerate.';
            }
            if (verbose) {
                console.error('Scanning codebase...');
            }
            const doc = generateCodebaseDoc(context.directory, { maxDepth, outputPath });
            const dir = dirname(outputPath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            const markdown = docToMarkdown(doc);
            writeFileSync(outputPath, markdown, 'utf-8');
            if (verbose) {
                console.error(`Scanned ${doc.fileCounts.files} files in ${doc.fileCounts.directories} directories`);
            }
            return formatHeader(2, '📍 Codebase Mapped') + '\n\n' +
                formatBold('Output:') + ` ${outputPath}\n\n` +
                `Files: ${doc.fileCounts.files}\n` +
                `Directories: ${doc.fileCounts.directories}\n` +
                `Stack items: ${doc.stack.length}\n\n` +
                'Run `cat CODEBASE.md` to view the documentation.';
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            return formatHeader(2, '❌ Map Codebase Error') + '\n\n' +
                `Failed to generate codebase documentation: ${errorMessage}`;
        }
    },
});
//# sourceMappingURL=map-codebase.js.map