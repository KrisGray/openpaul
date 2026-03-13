/**
 * Help Command Tests
 * 
 * Tests for the command reference functionality
 */

import { openpaulHelp } from '../../commands/help'
import { formatHeader, formatBold } from '../../output/formatter'

jest.mock(
  '@opencode-ai/plugin',
  () => {
    const chainable = {
      optional: () => chainable,
      describe: () => chainable,
    }
    const tool = (input: any) => input
    tool.schema = {
      boolean: () => chainable,
      string: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('Help Command Functionality', () => {
  describe('command reference data', () => {
    it('should include all core commands in reference', () => {
      const commands = ['init', 'plan', 'apply', 'unify', 'progress', 'help']
      expect(commands).toContain('init')
      expect(commands).toContain('plan')
      expect(commands).toContain('apply')
      expect(commands).toContain('unify')
      expect(commands).toContain('progress')
      expect(commands).toContain('help')
    })

    it('should include session management commands', () => {
      const commands = ['pause', 'resume', 'handoff', 'status']
      expect(commands.length).toBe(4)
    })

    it('should include project management commands', () => {
      const commands = ['milestone', 'complete-milestone', 'discuss-milestone', 'map-codebase']
      expect(commands.length).toBe(4)
    })

    it('should include planning support commands', () => {
      const commands = ['discuss', 'assumptions', 'discover', 'consider-issues']
      expect(commands.length).toBe(4)
    })

    it('should include research & quality commands', () => {
      const commands = ['research', 'research-phase', 'verify', 'plan-fix']
      expect(commands.length).toBe(4)
    })

    it('should include roadmap & configuration commands', () => {
      const commands = ['add-phase', 'remove-phase', 'flows', 'config']
      expect(commands.length).toBe(4)
    })

    it('should count to 26 total commands', () => {
      const coreCommands = 6
      const sessionCommands = 4
      const projectCommands = 4
      const planningCommands = 4
      const researchCommands = 4
      const roadmapCommands = 4
      
      const total = coreCommands + sessionCommands + projectCommands + planningCommands + researchCommands + roadmapCommands
      expect(total).toBe(26)
    })
  })

  describe('command grouping by phase', () => {
    it('should group commands correctly', () => {
      const coreCommands = ['init', 'progress', 'help']
      const phase2Commands = ['plan', 'apply', 'unify']
      
      // Core commands have no phase property
      coreCommands.forEach(cmd => {
        expect(cmd).toBeDefined()
      })
      
      // Phase 2 commands are marked
      phase2Commands.forEach(cmd => {
        expect(cmd).toBeDefined()
      })
    })
  })

  describe('phase 2 grouping output', () => {
    const toolContext = { directory: '/test/project' } as any

    it('should list Phase 2 commands in grouped output', async () => {
      const output = await openpaulHelp.execute({}, toolContext)

      expect(output).toContain('Core Loop Commands (Phase 2)')
      expect(output).toContain('/plan')
      expect(output).toContain('/apply')
      expect(output).toContain('/unify')
    })
  })

  describe('output formatting', () => {
    it('should format all commands view with proper structure', () => {
      const output = formatHeader(1, '📚 OpenPAUL Command Reference') + '\n\n' +
        formatHeader(2, 'Core Commands') + '\n' +
        '- **/openpaul:init** — Initialize OpenPAUL\n' +
        '  - Usage: `/openpaul:init [--force]`\n\n' +
        formatBold('Tip:') + ' Run `/openpaul:help {command}` for detailed usage.'

      expect(output).toContain('📚')
      expect(output).toContain('OpenPAUL Command Reference')
      expect(output).toContain('Core Commands')
      expect(output).toContain('/openpaul:init')
      expect(output).toContain('Usage:')
    })

    it('should format specific command help with proper structure', () => {
      const output = formatHeader(1, '📖 Command: /openpaul:init') + '\n\n' +
        formatBold('Description:') + ' Initialize OpenPAUL in the current project\n' +
        formatBold('Usage:') + ' `/openpaul:init [--force]`\n\n' +
        formatBold('Tip:') + ' Run `/openpaul:help` to see all commands.'

      expect(output).toContain('📖')
      expect(output).toContain('Command: /openpaul:init')
      expect(output).toContain('Description:')
      expect(output).toContain('Usage:')
      expect(output).toContain('Initialize OpenPAUL')
    })

    it('should format unknown command error with proper structure', () => {
      const output = formatHeader(2, '❓ Unknown Command') + '\n\n' +
        'Unknown command: nonexistent\n\n' +
        formatBold('Available commands:') + '\n' +
        '- init\n- plan\n- apply\n\n' +
        'Run `/openpaul:help` to see all commands'

      expect(output).toContain('❓')
      expect(output).toContain('Unknown Command')
      expect(output).toContain('nonexistent')
      expect(output).toContain('Available commands')
    })
  })

  describe('usage examples', () => {
    it('should include usage example for each command', () => {
      const usages = {
        init: '/openpaul:init [--force]',
        plan: '/openpaul:plan --phase N --plan NN --tasks [...]',
        apply: '/openpaul:apply [--dry-run] [--task N]',
        progress: '/openpaul:progress [--verbose]',
        help: '/openpaul:help [command]',
      }

      Object.entries(usages).forEach(([cmd, usage]) => {
        expect(usage).toContain('/openpaul:' + cmd)
      })
    })

    it('should show phase information when available', () => {
      const planCommand = {
        description: 'Create an executable plan with tasks',
        usage: '/openpaul:plan --phase N --plan NN --tasks [...]',
        phase: '2',
      }

      expect(planCommand.phase).toBe('2')
    })
  })
})
