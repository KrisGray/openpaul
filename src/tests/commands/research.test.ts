/**
 * research command Tests
 */

import { openpaulResearch } from '../../commands/research'
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

describe('openpaulResearch', () => {
  const mockContext = { directory: '/test/project' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return error when query is empty', async () => {
    const result = await (openpaulResearch as any).execute(
      { phase: 1, query: '' },
      mockContext
    )
    
    expect(result).toContain('Invalid Query')
  })

  it('should return error when phase directory not found', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(false)
    
    const result = await (openpaulResearch as any).execute(
      { phase: 99, query: 'Test query' },
      mockContext
    )
    
    expect(result).toContain('Cannot Research')
  })

  it('should create RESEARCH.md with findings', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (openpaulResearch as any).execute(
      { 
        phase: 1, 
        query: 'Test query',
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Research Complete')
    expect(result).toContain('Confidence Distribution')
  })

  it('should handle verification flag', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (openpaulResearch as any).execute(
      { 
        phase: 1, 
        query: 'Test query',
        verify: true,
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Verified:')
  })

  it('should return error when file exists without overwrite', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(true)
    
    const result = await (openpaulResearch as any).execute(
      { phase: 1, query: 'Test' },
      mockContext
    )
    
    expect(result).toContain('Research Already Exists')
  })
})
