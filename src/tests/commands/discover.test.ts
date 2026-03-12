/**
 * discover command Tests
 */

import { openpaulDiscover } from '../../commands/discover'
import { existsSync } from 'fs'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn().mockResolvedValue(undefined),
}))

describe('openpaulDiscover', () => {
  const mockContext = { directory: '/test/project' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Quick mode', () => {
    it('should return verbal response only (no file)', async () => {
      const result = await (openpaulDiscover as any).execute(
        { phase: 1, topic: 'Test topic', quick: true },
        mockContext
      )
      
      expect(result).toContain('Quick Discovery')
      expect(result).toContain('no file created')
      expect(result).toContain('verbal response only')
    })
  })

  describe('Standard mode', () => {
    it('should create DISCOVERY.md', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
      
      const result = await (openpaulDiscover as any).execute(
        { phase: 1, topic: 'Test topic', overwrite: true },
        mockContext
      )
      
      expect(result).toContain('Discovery Created')
    })
  })

  describe('Deep mode', () => {
    it('should prompt for confirmation without --confirm', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
      
      const result = await (openpaulDiscover as any).execute(
        { phase: 1, topic: 'Test topic', deep: true },
        mockContext
      )
      
      expect(result).toContain('Deep Mode Confirmation Required')
    })

    it('should create DISCOVERY.md with --confirm', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
      
      const result = await (openpaulDiscover as any).execute(
        { phase: 1, topic: 'Test topic', deep: true, confirm: true, overwrite: true },
        mockContext
      )
      
      expect(result).toContain('Discovery Created')
      expect(result).toContain('depth')
      expect(result).toContain('deep')
    })
  })

  describe('Mode conflict', () => {
    it('should error when both --quick and --deep specified', async () => {
      const result = await (openpaulDiscover as any).execute(
        { phase: 1, topic: 'Test', quick: true, deep: true },
        mockContext
      )
      
      expect(result).toContain('Conflicting Options')
    })
  })
})
