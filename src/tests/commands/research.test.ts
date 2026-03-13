/**
 * Research Command Tests
 * 
 * Tests for /openpaul:research command functionality
 */

import { openpaulResearch } from '../../commands/research'
import { existsSync } from 'fs'
import { atomicWrite } from '../../storage/atomic-writes'

// Mock dependencies
jest.mock('fs')
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))
jest.mock('../../storage/atomic-writes')
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
      enum: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('openpaulResearch command', () => {
  const mockDirectory = '/test/project'
  const toolContext = { directory: mockDirectory } as any

  beforeEach(() => {
    jest.clearAllMocks()
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('successful research execution', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
    })

    it('should create RESEARCH.md with findings', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', overwrite: true },
        toolContext
      )

      expect(result).toContain('Research Complete')
      expect(result).toContain('1')
      expect(result).toContain('Test query')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should assign confidence levels (HIGH/MEDIUM/LOW)', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', overwrite: true },
        toolContext
      )

      expect(result).toContain('Confidence Distribution')
      expect(result).toContain('High:')
      expect(result).toContain('Medium:')
      expect(result).toContain('Low:')
    })

    it('should track sources per finding', async () => {
      await (openpaulResearch as any).execute(
        { 
          phase: 1, 
          query: 'Test query', 
          sources: 'Source A, Source B',
          overwrite: true,
        },
        toolContext
      )

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('## Sources')
    })

    it('should return formatted output with confidence distribution', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', overwrite: true },
        toolContext
      )

      expect(result).toContain('Next Steps')
      expect(result).toContain('Edit RESEARCH.md')
    })
  })

  describe('verification flag', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
    })

    it('should include verification status when --verify flag is true', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', verify: true, overwrite: true },
        toolContext
      )

      expect(result).toContain('Verified:')
      expect(result).toContain('Yes')
    })

    it('should show verification disabled when --verify flag is false', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', verify: false, overwrite: true },
        toolContext
      )

      expect(result).toContain('Verified:')
      expect(result).toContain('No')
    })
  })

  describe('depth modes', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
    })

    it('should handle quick depth mode', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', depth: 'quick', overwrite: true },
        toolContext
      )

      expect(result).toContain('Depth:')
      expect(result).toContain('quick')
    })

    it('should handle standard depth mode', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', depth: 'standard', overwrite: true },
        toolContext
      )

      expect(result).toContain('Depth:')
      expect(result).toContain('standard')
    })

    it('should handle deep depth mode', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', depth: 'deep', overwrite: true },
        toolContext
      )

      expect(result).toContain('Depth:')
      expect(result).toContain('deep')
    })

    it('should default to standard depth when not specified', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', overwrite: true },
        toolContext
      )

      expect(result).toContain('Depth:')
      expect(result).toContain('standard')
    })
  })

  describe('error handling', () => {
    it('should return error when phase directory not found', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = await (openpaulResearch as any).execute(
        { phase: 99, query: 'Test query' },
        toolContext
      )

      expect(result).toContain('Cannot Research')
      expect(result).toContain('not found')
    })

    it('should return error for empty query', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: '' },
        toolContext
      )

      expect(result).toContain('Invalid Query')
      expect(result).toContain('empty')
    })

    it('should return error for whitespace-only query', async () => {
      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: '   ' },
        toolContext
      )

      expect(result).toContain('Invalid Query')
    })

    it('should return error when file exists without --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query' },
        toolContext
      )

      expect(result).toContain('Research Already Exists')
      expect(result).toContain('--overwrite')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should return formatted error on file write failure', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))

      const result = await (openpaulResearch as any).execute(
        { phase: 1, query: 'Test query', overwrite: true },
        toolContext
      )

      expect(result).toContain('Research Failed')
      expect(result).toContain('Write failed')
    })
  })
})
