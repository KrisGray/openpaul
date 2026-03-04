import { tool } from '@opencode-ai/plugin'
import { existsSync } from 'fs'
import { join } from 'path'
import { FileManager } from '../storage/file-manager'
import { createDefaultModelConfig } from '../types/model-config'
import { formatHeader, formatList, formatBold } from '../output/formatter'

/**
 * /paul:init Command
 * 
 * Initialize a new OpenPAUL project with .paul/ directory structure
 * 
 * From CONTEXT.md:
 * - Creates .paul/ directory
 * - Initializes model-config.json with defaults
 * - Sets up initial state for phase 1
 * - Provides clear next steps
 */
export const paulInit = tool({
  description: 'Initialize OpenPAUL in the current project',
  args: {
    force: tool.schema.boolean().optional().describe('Reinitialize even if .paul/ exists'),
  },
  execute: async ({ force }, context) => {
    try {
      const fileManager = new FileManager(context.directory)
      const paulDir = join(context.directory, '.paul')
      
      // Check if already initialized
      if (existsSync(paulDir) && !force) {
        return formatHeader(2, '⚠️ OpenPAUL Already Initialized') + '\n\n' +
          'OpenPAUL has already been initialized in this project.\n\n' +
          formatBold('Options:') + '\n' +
          formatList([
            'Run `/paul:progress` to check current state',
            'Run `/paul:init --force` to reinitialize (this will reset all state)',
          ])
      }
      
      // Ensure .paul directory exists
      fileManager.ensurePaulDir()
      
      // Write default model configuration
      await fileManager.writeModelConfig(createDefaultModelConfig())
      
      // Initialize state for phase 1 (ready for new loop)
      await fileManager.writePhaseState(1, {
        phase: 'UNIFY', // Ready to start new loop (PLAN is next)
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })
      
      // Format success message
      let output = formatHeader(2, '✅ OpenPAUL Initialized') + '\n\n'
      output += 'OpenPAUL has been successfully initialized in your project.\n\n'
      
      output += formatBold('Created Files:') + '\n'
      output += formatList([
        '.paul/model-config.json - Model configuration for PAUL sub-stages',
        '.paul/state-phase-1.json - Initial state for phase 1',
      ]) + '\n\n'
      
      output += formatBold('Next Steps:') + '\n'
      output += formatList([
        'Run `/paul:plan` to create your first plan',
        'Run `/paul:help` to see all available commands',
        'Run `/paul:progress` to check your current state',
      ])
      
      return output
    } catch (error) {
      // Return formatted error message instead of throwing
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '❌ Initialization Failed') + '\n\n' +
        `Failed to initialize OpenPAUL: ${errorMessage}\n\n` +
        formatBold('Troubleshooting:') + '\n' +
        formatList([
          'Ensure you have write permissions in this directory',
          'Check that the directory is not read-only',
          'Try running with appropriate permissions',
        ])
    }
  },
})
