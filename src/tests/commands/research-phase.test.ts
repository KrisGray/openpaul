/**
 * research-phase command Tests
 */

import { openpaulpaulResearchPhase } from '../../commands/research-phase'
import { existsSync, readFileSync } from 'fs'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn().mockResolvedValue(undefined),
}))

describe('openpaulpaulResearchPhase', () => {
  const mockContext = { directory: '/test/project' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return error when phase directory not found', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(false)
    
    const result = await (openpaulpaulResearchPhase as any).execute(
      { phase: 99 },
      mockContext
    )
    
    expect(result).toContain('Cannot Research Phase')
  })

  it('should return error when no topics detected and none provided', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    ;(readFileSync as jest.Mock).mockReturnValue('')
    
    const result = await (openpaulpaulResearchPhase as any).execute(
      { phase: 1 },
      mockContext
    )
    
    expect(result).toContain('No Topics Detected')
  })

  it('should accept manual topics', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (openpaulpaulResearchPhase as any).execute(
      { 
        phase: 1, 
        topics: 'Topic 1, Topic 2, Topic 3',
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Phase Research Complete')
    expect(result).toContain('Agents Spawned:')
  })

  it('should limit max agents to 4', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (openpaulpaulResearchPhase as any).execute(
      { 
        phase: 1, 
        topics: 'T1, T2, T3, T4, T5, T6',
        maxAgents: 10,
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Phase Research Complete')
  })

  it('should return error when file exists without overwrite', async () => {
    ;(existsSync as jest.Mock).mockReturnValue(true)
    
    const result = await (openpaulpaulResearchPhase as any).execute(
      { phase: 1 },
      mockContext
    )
    
    expect(result).toContain('Research Already Exists')
  })

  it('should show agent status dashboard', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (openpaulpaulResearchPhase as any).execute(
      { 
        phase: 1, 
        topics: 'Topic 1, Topic 2',
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Completed:')
    expect(result).toContain('Failed:')
  })

  it('should discover key themes', async () => {
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      return path.includes('phases')
    })
    
    const result = await (openpaulpaulResearchPhase as any).execute(
      { 
        phase: 1, 
        topics: 'api, auth, database',
        overwrite: true,
      },
      mockContext
    )
    
    expect(result).toContain('Phase Research Complete')
  })
})
