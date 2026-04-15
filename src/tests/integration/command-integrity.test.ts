/**
 * Command Integrity Integration Tests
 *
 * Catches the class of bugs where:
 * - A command has required args but uses the generic "pass {}" template
 * - A two-step confirm flow is not documented in the template
 * - Source code references commands that no longer exist (stale refs)
 * - The help command and index.ts disagree on registered commands
 * - Deprecated commands are still registered
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

jest.mock(
  '@opencode-ai/plugin',
  () => {
    const chainable = (): any => {
      const fn: any = () => chainable()
      return new Proxy(fn, { get: () => chainable() })
    }
    const tool: any = (input: any) => input
    tool.schema = chainable()
    return { tool }
  },
  { virtual: true }
)

import { OpenPaulPlugin } from '../../index'
import { openpaulHelp } from '../../commands/help'

const COMMANDS_DIR = join(process.cwd(), 'src', 'commands')

const COMMAND_MANIFEST: Record<string, {
  allowsEmptyArgs: boolean
  twoStepFlow?: boolean
  templateKeywords: string[]
}> = {
  'openpaul:init': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:plan': { allowsEmptyArgs: true, templateKeywords: ['wizardInput'] },
  'openpaul:apply': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:unify': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:progress': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:help': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:pause': {
    allowsEmptyArgs: true,
    twoStepFlow: true,
    templateKeywords: ['onUnsavedChanges'],
  },
  'openpaul:resume': {
    allowsEmptyArgs: true,
    twoStepFlow: true,
    templateKeywords: ['confirm'],
  },
  'openpaul:handoff': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:milestone': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:complete-milestone': {
    allowsEmptyArgs: true,
    twoStepFlow: true,
    templateKeywords: ['confirm'],
  },
  'openpaul:config': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:flows': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:map-codebase': { allowsEmptyArgs: true, templateKeywords: [] },
  'openpaul:verify': {
    allowsEmptyArgs: false,
    twoStepFlow: true,
    templateKeywords: ['phase'],
  },
  'openpaul:plan-fix': {
    allowsEmptyArgs: false,
    twoStepFlow: true,
    templateKeywords: ['phase'],
  },
}

const REGISTERED_COMMAND_FILES: Record<string, string> = {
  'openpaul:init': 'init.ts',
  'openpaul:plan': 'plan.ts',
  'openpaul:apply': 'apply.ts',
  'openpaul:unify': 'unify.ts',
  'openpaul:progress': 'progress.ts',
  'openpaul:help': 'help.ts',
  'openpaul:pause': 'pause.ts',
  'openpaul:resume': 'resume.ts',
  'openpaul:handoff': 'handoff.ts',
  'openpaul:milestone': 'milestone.ts',
  'openpaul:complete-milestone': 'complete-milestone.ts',
  'openpaul:config': 'config.ts',
  'openpaul:flows': 'flows.ts',
  'openpaul:map-codebase': 'map-codebase.ts',
  'openpaul:verify': 'verify.ts',
  'openpaul:plan-fix': 'plan-fix.ts',
}

const DELETED_COMMANDS = [
  'status',
  'discuss',
  'discuss-milestone',
  'assumptions',
  'discover',
  'consider-issues',
  'research',
  'research-phase',
  'add-phase',
  'remove-phase',
]

describe('Command Integrity', () => {
  let registeredCommands: Record<string, { description: string; template: string }>

  beforeAll(async () => {
    const plugin = await OpenPaulPlugin({
      project: { id: 'test' } as any,
      client: undefined as any,
      directory: '/tmp',
      worktree: '/tmp',
      serverUrl: new URL('http://localhost'),
      $: {} as any,
    })
    const config: { command?: Record<string, { description: string; template: string }> } = {}
    await plugin.config!(config as any)
    registeredCommands = config.command ?? {}
  })

  describe('template-schema consistency', () => {
    it('should have a manifest entry for every registered command', () => {
      const registered = Object.keys(registeredCommands).sort()
      const manifest = Object.keys(COMMAND_MANIFEST).sort()
      expect(registered).toEqual(manifest)
    })

    it('should have a template for every registered command', () => {
      for (const [command, entry] of Object.entries(registeredCommands)) {
        expect(entry.template).toBeTruthy()
        expect(entry.template.length).toBeGreaterThan(50)
      }
    })

    it('should include tool name in every template', () => {
      const toToolName = (cmd: string) => cmd.replace(/:/g, '_')
      for (const [command, entry] of Object.entries(registeredCommands)) {
        expect(entry.template).toContain(toToolName(command))
      }
    })

    it('should not use generic "pass {}" template for commands with required args', () => {
      const commandsWithRequiredArgs = Object.entries(COMMAND_MANIFEST)
        .filter(([, req]) => !req.allowsEmptyArgs)
        .map(([cmd]) => cmd)

      for (const command of commandsWithRequiredArgs) {
        const template = registeredCommands[command]?.template
        expect(template).toBeDefined()
        expect(template).not.toContain('If $ARGUMENTS is empty, pass {}')
      }
    })

    it('should document required args in templates', () => {
      const commandsWithRequiredArgs = Object.entries(COMMAND_MANIFEST)
        .filter(([, req]) => req.templateKeywords.length > 0)

      for (const [command, req] of commandsWithRequiredArgs) {
        const template = registeredCommands[command]?.template
        expect(template).toBeDefined()
        for (const keyword of req.templateKeywords) {
          expect(template).toContain(keyword)
        }
      }
    })

    it('should document two-step flows in templates', () => {
      const twoStepCommands = Object.entries(COMMAND_MANIFEST)
        .filter(([, req]) => req.twoStepFlow)

      for (const [command, req] of twoStepCommands) {
        const template = registeredCommands[command]?.template
        expect(template).toBeDefined()
        const lower = template!.toLowerCase()
        const hasTwoStep = lower.includes('two-step') || lower.includes('two step') || lower.includes('multi-step') || template!.includes('TWO-STEP') || template!.includes('MULTI-STEP')
        expect(hasTwoStep).toBe(true)
        for (const keyword of req.templateKeywords) {
          expect(template).toContain(keyword)
        }
      }
    })
  })

  describe('stale reference detection', () => {
    function getRegisteredCommandSourceContents(): Map<string, string> {
      const contents = new Map<string, string>()
      for (const [command, fileName] of Object.entries(REGISTERED_COMMAND_FILES)) {
        const filePath = join(COMMANDS_DIR, fileName)
        try {
          contents.set(command, readFileSync(filePath, 'utf-8'))
        } catch {
          // File might not exist in test environment
        }
      }
      return contents
    }

    it('should not reference /gsd- commands in any registered command source', () => {
      const contents = getRegisteredCommandSourceContents()
      const violations: string[] = []

      for (const [command, source] of contents) {
        const lines = source.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/\/gsd-/.test(lines[i])) {
            violations.push(`${REGISTERED_COMMAND_FILES[command]}:${i + 1}: ${lines[i].trim()}`)
          }
        }
      }

      expect(violations).toEqual([])
    })

    it('should not reference /openpaul:status in registered command source', () => {
      const contents = getRegisteredCommandSourceContents()
      const violations: string[] = []

      for (const [command, source] of contents) {
        const lines = source.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/\/openpaul:status\b/.test(lines[i])) {
            violations.push(`${REGISTERED_COMMAND_FILES[command]}:${i + 1}: ${lines[i].trim()}`)
          }
        }
      }

      expect(violations).toEqual([])
    })

    it('should not reference deleted commands in registered command source', () => {
      const contents = getRegisteredCommandSourceContents()
      const violations: string[] = []

      for (const [command, source] of contents) {
        const lines = source.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          for (const deleted of DELETED_COMMANDS) {
            const pattern = new RegExp(`\\/openpaul:${deleted}\\b`)
            if (pattern.test(line)) {
              violations.push(
                `${REGISTERED_COMMAND_FILES[command]}:${i + 1}: references deleted /openpaul:${deleted}`
              )
            }
          }
        }
      }

      expect(violations).toEqual([])
    })

    it('should not contain any /gsd- references across all command source files', () => {
      const files = readdirSync(COMMANDS_DIR)
        .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'))
      const violations: string[] = []

      for (const file of files) {
        const content = readFileSync(join(COMMANDS_DIR, file), 'utf-8')
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          if (/\/gsd-/.test(lines[i])) {
            violations.push(`${file}:${i + 1}: ${lines[i].trim()}`)
          }
        }
      }

      expect(violations).toEqual([])
    })
  })

  describe('command registration consistency', () => {
    it('should have matching command counts in help.ts and index.ts', async () => {
      const registeredNames = new Set(Object.keys(registeredCommands))

      const toolContext = { directory: '/test/project' } as any
      const helpOutput = await openpaulHelp.execute({}, toolContext)

      for (const command of registeredNames) {
        const commandName = command.replace('openpaul:', '')
        expect(helpOutput).toContain(`/${commandName}`)
      }
    })

    it('should not register any deprecated commands', () => {
      for (const [command, entry] of Object.entries(registeredCommands)) {
        expect(entry.description.toLowerCase()).not.toContain('deprecated')
      }
    })

    it('should have a source file for every registered command', () => {
      for (const [command, fileName] of Object.entries(REGISTERED_COMMAND_FILES)) {
        const filePath = join(COMMANDS_DIR, fileName)
        const content = readFileSync(filePath, 'utf-8')
        expect(content.length).toBeGreaterThan(0)
      }
    })

    it('should have unique templates (no copy-paste generic templates for two-step commands)', () => {
      const twoStepCommands = Object.entries(COMMAND_MANIFEST)
        .filter(([, req]) => req.twoStepFlow)
        .map(([cmd]) => cmd)

      const templates = twoStepCommands.map(cmd => registeredCommands[cmd]?.template)
      const uniqueTemplates = new Set(templates)
      expect(uniqueTemplates.size).toBe(twoStepCommands.length)
    })
  })
})
