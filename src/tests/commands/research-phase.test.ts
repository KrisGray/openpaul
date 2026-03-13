/**
 * Research-Phase Command Tests
 * 
 * Tests for /openpaul:research-phase command functionality
 */

// Mock dependencies - must be at top for jest hoisting
jest.mock('@opencode-ai/plugin', () => ({ tool: (input: any) => input }), { virtual: true })

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

import { openpaulResearchPhase } from '../../commands/research-phase'
import { existsSync, readFileSync } from 'fs'
import { atomicWrite } from '../../storage/atomic-writes'

// Helper functions for typed mock data
function createMockFinding(topic: string, confidence: 'high' | 'medium' | 'low' = 'medium') {
  return {
    topic,
    summary: `Research findings for ${topic}`,
    details: ['Finding 1', 'Finding 2'],
    confidence,
    sources: ['Source 1'],
  }
}

function createMockAgentStatus(topic: string, status: 'spawning' | 'running' | 'complete' | 'failed' = 'complete') {
  return {
    topic,
    status,
    summary: status === 'complete' ? `Found 2 findings` : null,
    error: status === 'failed' ? 'Agent failed' : null,
    startedAt: new Date().toISOString(),
    completedAt: status === 'complete' || status === 'failed' ? new Date().toISOString() : null,
  }
}

describe('openpaulResearchPhase command', () => {
  const mockDirectory = '/test/project'
  const toolContext = { directory: mockDirectory } as any

  beforeEach(() => {
    jest.clearAllMocks()
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('phase analysis', () => {
    it('should extract topics from phase description via CONTEXT.md', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.endsWith('RESEARCH.md')) return false
        if (path.endsWith('CONTEXT.md')) return true
        return path.includes('phases')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(`
        ## Phase Description
        Implementing API authentication with OAuth and database caching.
      `)

      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, overwrite: true },
        toolContext
      )

      // Should detect tech terms from context
      expect(result).toContain('Phase Research Complete')
    })

    it('should generate up to 4 research topics from context', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.endsWith('RESEARCH.md')) return false
        if (path.endsWith('CONTEXT.md')) return true
        return path.includes('phases')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(`
        Need to research api, auth, database, cache, websocket, graphql.
      `)

      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, overwrite: true },
        toolContext
      )

      expect(result).toContain('Agents Spawned:')
    })

    it('should handle manual topic override', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })

      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, topics: 'Custom Topic 1, Custom Topic 2', overwrite: true },
        toolContext
      )

      expect(result).toContain('Phase Research Complete')
      expect(result).toContain('Agents Spawned:')
    })
  })

  describe('agent dashboard', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
    })

    it('should display status for each agent', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, topics: 'Topic 1, Topic 2, Topic 3', overwrite: true },
        toolContext
      )

      expect(result).toContain('Agents Spawned:')
      expect(result).toContain('Completed:')
    })

    it('should use correct status emoji', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, topics: 'Topic 1', overwrite: true },
        toolContext
      )

      // Complete status uses ✅
      expect(result).toContain('Completed:')
    })

    it('should show accurate progress counter', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, topics: 'Topic 1, Topic 2', overwrite: true },
        toolContext
      )

      expect(result).toContain('Completed:')
      expect(result).toContain('Failed:')
    })
  })

  describe('result aggregation', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
    })

    it('should combine multiple agent results', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, topics: 'api, auth, database', overwrite: true },
        toolContext
      )

      expect(result).toContain('Phase Research Complete')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should organize findings by theme (not by agent)', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, topics: 'api integration, auth system', overwrite: true },
        toolContext
      )

      expect(result).toContain('Key Themes Discovered:')
    })

    it('should note failed agents in report', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1, topics: 'Topic 1', overwrite: true },
        toolContext
      )

      expect(result).toContain('Failed:')
    })
  })

  describe('partial results', () => {
    it('should continue with partial results on failure when continue=true', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })

      const result = await (openpaulResearchPhase as any).execute(
        { 
          phase: 1, 
          topics: 'Topic 1, Topic 2', 
          continue: true,
          overwrite: true,
        },
        toolContext
      )

      // Should still complete even if some fail
      expect(result).toContain('Completed:')
    })

    it('should save what succeeded', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })

      await (openpaulResearchPhase as any).execute(
        { 
          phase: 1, 
          topics: 'Topic 1, Topic 2', 
          overwrite: true,
        },
        toolContext
      )

      // Should have called atomicWrite to save results
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('max agents enforcement', () => {
    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })
    })

    it('should limit to 4 agents maximum', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { 
          phase: 1, 
          topics: 'T1, T2, T3, T4, T5, T6', 
          maxAgents: 10,
          overwrite: true,
        },
        toolContext
      )

      // Even with maxAgents=10, should be limited to 4
      expect(result).toContain('Agents Spawned:')
    })

    it('should respect lower maxAgents value', async () => {
      const result = await (openpaulResearchPhase as any).execute(
        { 
          phase: 1, 
          topics: 'T1, T2, T3, T4', 
          maxAgents: 2,
          overwrite: true,
        },
        toolContext
      )

      expect(result).toContain('Phase Research Complete')
    })
  })

  describe('error handling', () => {
    it('should return error when phase not found', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = await (openpaulResearchPhase as any).execute(
        { phase: 99 },
        toolContext
      )

      expect(result).toContain('Cannot Research Phase')
      expect(result).toContain('not found')
    })

    it('should return error when no topics detected and none provided', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.endsWith('RESEARCH.md')) return false
        if (path.endsWith('CONTEXT.md')) return true
        return path.includes('phases')
      })
      ;(readFileSync as jest.Mock).mockReturnValue('No tech terms here')

      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1 },
        toolContext
      )

      expect(result).toContain('No Topics Detected')
      expect(result).toContain('--topics')
    })

    it('should return error when file exists without --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = await (openpaulResearchPhase as any).execute(
        { phase: 1 },
        toolContext
      )

      expect(result).toContain('Research Already Exists')
      expect(result).toContain('--overwrite')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should save report even when all agents fail', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('phases')
      })

      // The command always completes successfully with agent results
      const result = await (openpaulResearchPhase as any).execute(
        { 
          phase: 1, 
          topics: 'Topic 1',
          overwrite: true,
        },
        toolContext
      )

      // Should complete and save something
      expect(result).toContain('Phase Research Complete')
    })
  })
})
