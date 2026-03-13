/**
 * Discuss Command Tests
 * 
 * Tests for /openpaul:discuss command functionality
 */

import { openpaulDiscuss } from '../../commands/discuss'
import { existsSync } from 'fs'
import { join } from 'path'
import { atomicWrite } from '../../storage/atomic-writes'
import { PrePlanningManager } from '../../storage/pre-planning-manager'

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../../storage/pre-planning-manager')

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
      number: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('openpaulDiscuss', () => {
  const mockDirectory = '/test/project'
  const mockContext = { directory: mockDirectory }
  const mockPhaseDir = '/test/project/.planning/phases/06-test-phase'

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock behavior
    ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
      resolvePhaseDir: jest.fn().mockReturnValue(mockPhaseDir),
      createContext: jest.fn().mockReturnValue('# Phase Context\n\nContent here'),
    }))
    ;(existsSync as jest.Mock).mockReturnValue(false)
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('successful context creation', () => {
    it('should create CONTEXT.md with all fields', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
        domain: 'User authentication system',
        decisions: 'Use JWT:JSON Web Tokens for auth,Use bcrypt:Password hashing',
        specifics: 'OAuth integration, Session management',
        deferred: 'Multi-factor auth, Passwordless login',
      }, mockContext)

      expect(result).toContain('Context Created')
      expect(result).toContain('6')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should create file in correct phase directory', async () => {
      await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenPath = writeCall[0]
      
      expect(writtenPath).toContain('.planning')
      expect(writtenPath).toContain('phases')
      expect(writtenPath).toContain('CONTEXT.md')
    })

    it('should handle minimal args (just phase)', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Context Created')
      expect(result).toContain('6')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should parse comma-separated decisions correctly', async () => {
      await (openpaulDiscuss as any).execute({
        phase: 6,
        decisions: 'Decision A, Decision B, Decision C',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createContext).toHaveBeenCalledWith(6, expect.objectContaining({
        decisions: expect.arrayContaining([
          expect.objectContaining({ title: 'Decision A' }),
          expect.objectContaining({ title: 'Decision B' }),
          expect.objectContaining({ title: 'Decision C' }),
        ]),
      }))
    })

    it('should parse comma-separated specifics correctly', async () => {
      await (openpaulDiscuss as any).execute({
        phase: 6,
        specifics: 'Specific A, Specific B',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createContext).toHaveBeenCalledWith(6, expect.objectContaining({
        specifics: ['Specific A', 'Specific B'],
      }))
    })

    it('should parse comma-separated deferred ideas correctly', async () => {
      await (openpaulDiscuss as any).execute({
        phase: 6,
        deferred: 'Deferred A, Deferred B',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createContext).toHaveBeenCalledWith(6, expect.objectContaining({
        deferred: ['Deferred A', 'Deferred B'],
      }))
    })

    it('should include all template sections in output', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
        domain: 'Test domain',
      }, mockContext)

      expect(result).toContain('Key Sections:')
      expect(result).toContain('Domain:')
      expect(result).toContain('Decisions:')
      expect(result).toContain('Specifics:')
      expect(result).toContain('Deferred:')
    })

    it('should return formatted success message with next steps', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Phase:')
      expect(result).toContain('File:')
      expect(result).toContain('Next Steps')
      expect(result).toContain('Review and edit CONTEXT.md')
      expect(result).toContain('/openpaul:assumptions')
      expect(result).toContain('/openpaul:discover')
    })
  })

  describe('existing file handling', () => {
    it('should prompt to overwrite when file exists without --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Context Already Exists')
      expect(result).toContain('--overwrite')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should overwrite with --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
        overwrite: true,
      }, mockContext)

      expect(result).toContain('Context Created')
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should return error when phase directory not found', async () => {
      ;(PrePlanningManager as jest.Mock).mockImplementation(() => ({
        resolvePhaseDir: jest.fn().mockReturnValue(null),
      }))

      const result = await (openpaulDiscuss as any).execute({
        phase: 99,
      }, mockContext)

      expect(result).toContain('Cannot Discuss Phase')
      expect(result).toContain('not found')
      expect(result).toContain('/openpaul:init')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should return formatted error on file write failure', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))

      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Context Creation Failed')
      expect(result).toContain('Write failed')
      expect(result).toContain('Troubleshooting')
    })

    it('should handle unknown errors gracefully', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue('Unknown error string')

      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Context Creation Failed')
      expect(result).toContain('Unknown error occurred')
    })
  })

  describe('decision parsing', () => {
    it('should handle decision with colon separator', async () => {
      await (openpaulDiscuss as any).execute({
        phase: 6,
        decisions: 'Use JWT: JSON Web Tokens for stateless auth',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createContext).toHaveBeenCalledWith(6, expect.objectContaining({
        decisions: [
          expect.objectContaining({
            title: 'Use JWT',
            description: 'JSON Web Tokens for stateless auth',
          }),
        ],
      }))
    })

    it('should handle decision without colon separator', async () => {
      await (openpaulDiscuss as any).execute({
        phase: 6,
        decisions: 'Simple decision statement',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createContext).toHaveBeenCalledWith(6, expect.objectContaining({
        decisions: [
          expect.objectContaining({
            title: 'Simple decision statement',
          }),
        ],
      }))
    })

    it('should handle empty decisions', async () => {
      await (openpaulDiscuss as any).execute({
        phase: 6,
        decisions: '',
      }, mockContext)

      const managerInstance = (PrePlanningManager as jest.Mock).mock.results[0].value
      expect(managerInstance.createContext).toHaveBeenCalledWith(6, expect.objectContaining({
        decisions: [],
      }))
    })
  })

  describe('counts in output', () => {
    it('should show decision count in output', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
        decisions: 'Decision A, Decision B',
      }, mockContext)

      expect(result).toContain('Decisions: 2 items')
    })

    it('should show "None yet" for no decisions', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Decisions: None yet')
    })

    it('should show specifics count in output', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
        specifics: 'Specific A',
      }, mockContext)

      expect(result).toContain('Specifics: 1 items')
    })

    it('should show "None yet" for no specifics', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Specifics: None yet')
    })

    it('should show deferred count in output', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
        deferred: 'Deferred A, Deferred B, Deferred C',
      }, mockContext)

      expect(result).toContain('Deferred: 3 items')
    })

    it('should show "None" for no deferred', async () => {
      const result = await (openpaulDiscuss as any).execute({
        phase: 6,
      }, mockContext)

      expect(result).toContain('Deferred: None')
    })
  })
})
