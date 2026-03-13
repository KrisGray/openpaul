/**
 * ResearchManager Tests
 *
 * Tests for ResearchManager class covering research coordination and result aggregation
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { ResearchManager } from '../../storage/research-manager'
import { atomicWrite } from '../../storage/atomic-writes'
import type {
  ResearchResult,
  ResearchPhaseResult,
  ResearchFinding,
  AgentStatus,
  AgentDashboard,
  ConfidenceLevel,
} from '../../types/research'

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

// Mock atomic-writes module
jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn(),
}))

// Mock path.join to return predictable paths
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

describe('ResearchManager', () => {
  const mockProjectRoot = '/test/project'
  let manager: ResearchManager

  const createMockFinding = (
    topic: string,
    summary: string,
    confidence: ConfidenceLevel = 'medium',
    sources: string[] = []
  ): ResearchFinding => ({
    topic,
    summary,
    details: [],
    confidence,
    sources,
  })

  const createMockAgentStatus = (
    topic: string,
    status: 'spawning' | 'running' | 'complete' | 'failed',
    options: { summary?: string; error?: string } = {}
  ): AgentStatus => ({
    topic,
    status,
    summary: options.summary ?? null,
    error: options.error ?? null,
    startedAt: '2026-03-13T10:00:00.000Z',
    completedAt: status === 'complete' || status === 'failed' ? '2026-03-13T10:05:00.000Z' : null,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new ResearchManager(mockProjectRoot)
  })

  describe('resolvePhaseDir', () => {
    it('should find phase directory in .openpaul/phases', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.openpaul') && path.includes('06-phase-6')
      })

      const result = manager.resolvePhaseDir(6)

      expect(result).toBe('/test/project/.openpaul/phases/06-phase-6')
    })

    it('should find phase directory in .paul/phases as fallback', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') && !path.includes('.openpaul') && path.includes('06-phase-6')
      })

      const result = manager.resolvePhaseDir(6)

      expect(result).toBe('/test/project/.paul/phases/06-phase-6')
    })

    it('should find phase directory in .planning/phases as final fallback', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.planning') && path.includes('06-phase-6')
      })

      const result = manager.resolvePhaseDir(6)

      expect(result).toBe('/test/project/.planning/phases/06-phase-6')
    })

    it('should return null when phase directory does not exist anywhere', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = manager.resolvePhaseDir(99)

      expect(result).toBeNull()
    })

    it('should format phase directory name with zero-padding', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('03-phase-3')
      })

      const result = manager.resolvePhaseDir(3)

      expect(result).toContain('03-phase-3')
    })
  })

  describe('resolveResearchPath', () => {
    it('should return RESEARCH.md path when phase dir and file exist', () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = manager.resolveResearchPath(6)

      expect(result).toBe('/test/project/.openpaul/phases/06-phase-6/RESEARCH.md')
    })

    it('should return null when phase directory does not exist', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = manager.resolveResearchPath(99)

      expect(result).toBeNull()
    })

    it('should return null when RESEARCH.md does not exist', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') && !path.includes('RESEARCH.md')
      })

      const result = manager.resolveResearchPath(6)

      expect(result).toBeNull()
    })
  })

  describe('getPlanningDir', () => {
    it('should return .openpaul when it exists', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.openpaul')
      })

      const result = manager.getPlanningDir()

      expect(result).toBe('/test/project/.openpaul')
    })

    it('should return .paul when .openpaul does not exist but .paul does', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') && !path.includes('.openpaul')
      })

      const result = manager.getPlanningDir()

      expect(result).toBe('/test/project/.paul')
    })

    it('should default to .openpaul when neither exists', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = manager.getPlanningDir()

      expect(result).toBe('/test/project/.openpaul')
    })
  })

  describe('createResearchResult', () => {
    it('should create valid ResearchResult with required fields', () => {
      const findings = [createMockFinding('Topic 1', 'Summary 1')]

      const result = manager.createResearchResult(6, 'Test query', findings)

      expect(result.phase).toBe(6)
      expect(result.query).toBe('Test query')
      expect(result.findings).toEqual(findings)
      expect(result.verified).toBe(false)
      expect(result.createdAt).toBeDefined()
    })

    it('should calculate overall confidence from findings', () => {
      const highConfidenceFindings = [
        createMockFinding('T1', 'S1', 'high'),
        createMockFinding('T2', 'S2', 'high'),
      ]

      const result = manager.createResearchResult(6, 'Query', highConfidenceFindings)

      expect(result.confidence).toBe('high')
    })

    it('should return low confidence for empty findings', () => {
      const result = manager.createResearchResult(6, 'Query', [])

      expect(result.confidence).toBe('low')
    })

    it('should calculate medium confidence from mixed findings', () => {
      const mixedFindings = [
        createMockFinding('T1', 'S1', 'high'),
        createMockFinding('T2', 'S2', 'low'),
      ]

      const result = manager.createResearchResult(6, 'Query', mixedFindings)

      expect(result.confidence).toBe('medium')
    })

    it('should generate ISO timestamp for createdAt', () => {
      const result = manager.createResearchResult(6, 'Query', [])

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should handle findings with sources correctly', () => {
      const findings = [
        createMockFinding('Topic 1', 'Summary 1', 'high', ['https://example.com']),
      ]

      const result = manager.createResearchResult(6, 'Query', findings)

      expect(result.findings[0].sources).toContain('https://example.com')
    })
  })

  describe('aggregateAgentResults', () => {
    it('should combine multiple agent results', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'Summary 1' }),
        createMockAgentStatus('Topic 2', 'complete', { summary: 'Summary 2' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.agentsSpawned).toBe(2)
      expect(result.agentsCompleted).toBe(2)
      expect(result.agentsFailed).toBe(0)
      expect(result.findings).toHaveLength(2)
    })

    it('should note failed agents without breaking aggregation', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'Summary 1' }),
        createMockAgentStatus('Topic 2', 'failed', { error: 'Error occurred' }),
        createMockAgentStatus('Topic 3', 'complete', { summary: 'Summary 3' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.agentsCompleted).toBe(2)
      expect(result.agentsFailed).toBe(1)
      expect(result.findings).toHaveLength(2)
    })

    it('should organize results by theme', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Testing best practices', 'complete', { summary: 'Summary 1' }),
        createMockAgentStatus('Security testing', 'complete', { summary: 'Summary 2' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.themes.length).toBeGreaterThan(0)
    })

    it('should produce synthesized output with timestamps', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'Summary 1' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should skip agents without summaries', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'Summary 1' }),
        createMockAgentStatus('Topic 2', 'complete', {}),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.findings).toHaveLength(1)
    })

    it('should handle all failed agents', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'failed', { error: 'Error 1' }),
        createMockAgentStatus('Topic 2', 'failed', { error: 'Error 2' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.agentsCompleted).toBe(0)
      expect(result.agentsFailed).toBe(2)
      expect(result.findings).toHaveLength(0)
    })

    it('should handle running agents in count', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'Summary 1' }),
        createMockAgentStatus('Topic 2', 'running'),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.agentsSpawned).toBe(2)
      expect(result.agentsCompleted).toBe(1)
      expect(result.agentsFailed).toBe(0)
    })
  })

  describe('formatAgentStatus', () => {
    it('should show correct emoji for spawning status', () => {
      const agent = createMockAgentStatus('Topic 1', 'spawning')

      const result = manager.formatAgentStatus(agent)

      expect(result).toContain('⏳')
    })

    it('should show correct emoji for running status', () => {
      const agent = createMockAgentStatus('Topic 1', 'running')

      const result = manager.formatAgentStatus(agent)

      expect(result).toContain('🔄')
    })

    it('should show correct emoji for complete status', () => {
      const agent = createMockAgentStatus('Topic 1', 'complete', { summary: 'Done' })

      const result = manager.formatAgentStatus(agent)

      expect(result).toContain('✅')
    })

    it('should show correct emoji for failed status', () => {
      const agent = createMockAgentStatus('Topic 1', 'failed', { error: 'Error' })

      const result = manager.formatAgentStatus(agent)

      expect(result).toContain('❌')
    })

    it('should include summary when present', () => {
      const agent = createMockAgentStatus('Topic 1', 'complete', { summary: 'Found useful info' })

      const result = manager.formatAgentStatus(agent)

      expect(result).toContain('Found useful info')
    })

    it('should include error when present', () => {
      const agent = createMockAgentStatus('Topic 1', 'failed', { error: 'Network timeout' })

      const result = manager.formatAgentStatus(agent)

      expect(result).toContain('Error: Network timeout')
    })
  })

  describe('formatAgentDashboard', () => {
    it('should show status for each agent', () => {
      const dashboard: AgentDashboard = {
        agents: [
          createMockAgentStatus('Topic 1', 'complete', { summary: 'Done' }),
          createMockAgentStatus('Topic 2', 'running'),
        ],
        completed: 1,
        total: 2,
        startTime: '2026-03-13T10:00:00.000Z',
      }

      const result = manager.formatAgentDashboard(dashboard)

      expect(result).toContain('Topic 1')
      expect(result).toContain('Topic 2')
    })

    it('should display accurate progress counter', () => {
      const dashboard: AgentDashboard = {
        agents: [
          createMockAgentStatus('Topic 1', 'complete', { summary: 'Done' }),
          createMockAgentStatus('Topic 2', 'running'),
          createMockAgentStatus('Topic 3', 'complete', { summary: 'Done' }),
        ],
        completed: 2,
        total: 3,
        startTime: '2026-03-13T10:00:00.000Z',
      }

      const result = manager.formatAgentDashboard(dashboard)

      expect(result).toContain('2/3')
    })

    it('should display summary section', () => {
      const dashboard: AgentDashboard = {
        agents: [createMockAgentStatus('Topic 1', 'complete', { summary: 'Done' })],
        completed: 1,
        total: 1,
        startTime: '2026-03-13T10:00:00.000Z',
      }

      const result = manager.formatAgentDashboard(dashboard)

      expect(result).toContain('Research Progress')
      expect(result).toContain('agents complete')
    })

    it('should show zero progress when no agents complete', () => {
      const dashboard: AgentDashboard = {
        agents: [
          createMockAgentStatus('Topic 1', 'running'),
          createMockAgentStatus('Topic 2', 'spawning'),
        ],
        completed: 0,
        total: 2,
        startTime: '2026-03-13T10:00:00.000Z',
      }

      const result = manager.formatAgentDashboard(dashboard)

      expect(result).toContain('0/2')
    })
  })

  describe('organizeByTheme', () => {
    it('should group findings by theme', () => {
      const findings: ResearchFinding[] = [
        createMockFinding('Testing frameworks', 'Summary 1'),
        createMockFinding('Security testing', 'Summary 2'),
        createMockFinding('Performance testing', 'Summary 3'),
      ]

      const result = manager.organizeByTheme(findings)

      expect(result.size).toBeGreaterThan(0)
    })

    it('should support multiple findings per theme', () => {
      const findings: ResearchFinding[] = [
        createMockFinding('Testing frameworks', 'Summary 1'),
        createMockFinding('Testing best practices', 'Summary 2'),
      ]

      const result = manager.organizeByTheme(findings)

      const entries = Array.from(result.entries())
      const testingEntry = entries.find(([theme]) => theme === 'testing')
      expect(testingEntry?.[1].length).toBe(2)
    })

    it('should handle empty findings array', () => {
      const result = manager.organizeByTheme([])

      expect(result.size).toBe(0)
    })

    it('should use general theme for short words', () => {
      const findings: ResearchFinding[] = [
        createMockFinding('API', 'Summary 1'),
      ]

      const result = manager.organizeByTheme(findings)

      expect(result.has('general')).toBe(true)
    })

    it('should extract primary theme from first long word', () => {
      const findings: ResearchFinding[] = [
        createMockFinding('Database connection handling', 'Summary 1'),
      ]

      const result = manager.organizeByTheme(findings)

      expect(result.has('database')).toBe(true)
    })
  })

  describe('generateResearchContent', () => {
    it('should produce valid markdown structure', () => {
      const result: ResearchResult = {
        phase: 6,
        query: 'Test query',
        findings: [createMockFinding('Topic 1', 'Summary 1')],
        confidence: 'medium',
        verified: false,
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchContent(result)

      expect(content).toContain('# Phase 6: Research')
      expect(content).toContain('## Summary')
      expect(content).toContain('## Findings')
    })

    it('should include all sections', () => {
      const result: ResearchResult = {
        phase: 6,
        query: 'Test query',
        findings: [createMockFinding('Topic 1', 'Summary 1', 'high', ['https://example.com'])],
        confidence: 'high',
        verified: true,
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchContent(result)

      expect(content).toContain('## Confidence Breakdown')
      expect(content).toContain('## Sources')
      expect(content).toContain('## Recommendations')
    })

    it('should reflect theme organization in output', () => {
      const result: ResearchResult = {
        phase: 6,
        query: 'Test query',
        findings: [
          createMockFinding('Testing frameworks', 'Summary 1'),
          createMockFinding('Security frameworks', 'Summary 2'),
        ],
        confidence: 'medium',
        verified: false,
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchContent(result)

      expect(content).toContain('### ')
    })

    it('should include confidence level in uppercase', () => {
      const result: ResearchResult = {
        phase: 6,
        query: 'Test query',
        findings: [createMockFinding('Topic 1', 'Summary 1', 'high')],
        confidence: 'high',
        verified: false,
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchContent(result)

      expect(content).toContain('HIGH')
    })

    it('should include verified status', () => {
      const verifiedResult: ResearchResult = {
        phase: 6,
        query: 'Test query',
        findings: [],
        confidence: 'low',
        verified: true,
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchContent(verifiedResult)

      expect(content).toContain('**Verified:** yes')
    })

    it('should show verified no when not verified', () => {
      const result: ResearchResult = {
        phase: 6,
        query: 'Test query',
        findings: [],
        confidence: 'low',
        verified: false,
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchContent(result)

      expect(content).toContain('**Verified:** no')
    })

    it('should include confidence breakdown table', () => {
      const result: ResearchResult = {
        phase: 6,
        query: 'Test query',
        findings: [
          createMockFinding('Topic 1', 'S1', 'high'),
          createMockFinding('Topic 2', 'S2', 'medium'),
          createMockFinding('Topic 3', 'S3', 'low'),
        ],
        confidence: 'medium',
        verified: false,
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchContent(result)

      expect(content).toContain('| HIGH |')
      expect(content).toContain('| MEDIUM |')
      expect(content).toContain('| LOW |')
    })
  })

  describe('generateResearchPhaseContent', () => {
    it('should include agent result table', () => {
      const phaseResult: ResearchPhaseResult = {
        phase: 6,
        agentsSpawned: 2,
        agentsCompleted: 2,
        agentsFailed: 0,
        findings: [
          createMockFinding('Topic 1', 'Summary 1'),
          createMockFinding('Topic 2', 'Summary 2'),
        ],
        themes: ['testing'],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchPhaseContent(
        6,
        phaseResult,
        phaseResult.findings,
        phaseResult.themes
      )

      expect(content).toContain('| Topic | Status | Confidence | Key Finding |')
      expect(content).toContain('✅ Complete')
    })

    it('should show failed agents section when present', () => {
      const phaseResult: ResearchPhaseResult = {
        phase: 6,
        agentsSpawned: 2,
        agentsCompleted: 1,
        agentsFailed: 1,
        findings: [createMockFinding('Topic 1', 'Summary 1')],
        themes: [],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchPhaseContent(
        6,
        phaseResult,
        phaseResult.findings,
        phaseResult.themes
      )

      expect(content).toContain('## Failed Agents')
    })

    it('should include theme sections', () => {
      const phaseResult: ResearchPhaseResult = {
        phase: 6,
        agentsSpawned: 1,
        agentsCompleted: 1,
        agentsFailed: 0,
        findings: [createMockFinding('Testing frameworks', 'Summary 1')],
        themes: ['testing'],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchPhaseContent(
        6,
        phaseResult,
        phaseResult.findings,
        phaseResult.themes
      )

      expect(content).toContain('## Findings by Theme')
    })

    it('should include agent metrics', () => {
      const phaseResult: ResearchPhaseResult = {
        phase: 6,
        agentsSpawned: 4,
        agentsCompleted: 3,
        agentsFailed: 1,
        findings: [createMockFinding('Topic 1', 'Summary 1')],
        themes: [],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const content = manager.generateResearchPhaseContent(
        6,
        phaseResult,
        phaseResult.findings,
        phaseResult.themes
      )

      expect(content).toContain('**Topics Researched:** 4')
      expect(content).toContain('**Agents Spawned:** 4')
      expect(content).toContain('3 successful, 1 failed')
    })
  })

  describe('Error handling', () => {
    it('should throw error for invalid phase number in writeResearch', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      await expect(manager.writeResearch(99, 'Query', [])).rejects.toThrow(
        'Phase 99 directory not found'
      )
    })

    it('should throw error for invalid phase number in writeResearchPhaseResult', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const phaseResult: ResearchPhaseResult = {
        phase: 99,
        agentsSpawned: 0,
        agentsCompleted: 0,
        agentsFailed: 0,
        findings: [],
        themes: [],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      await expect(
        manager.writeResearchPhaseResult(99, phaseResult, [], [])
      ).rejects.toThrow('Phase 99 directory not found')
    })

    it('should handle empty findings arrays gracefully', () => {
      const result = manager.createResearchResult(6, 'Query', [])

      expect(result.findings).toEqual([])
      expect(result.confidence).toBe('low')
    })

    it('should handle write failures from atomic-writes', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))

      await expect(manager.writeResearch(6, 'Query', [])).rejects.toThrow('Write failed')
    })
  })

  describe('Max 4 agents constraint', () => {
    it('should handle 4 agents correctly', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'S1' }),
        createMockAgentStatus('Topic 2', 'complete', { summary: 'S2' }),
        createMockAgentStatus('Topic 3', 'complete', { summary: 'S3' }),
        createMockAgentStatus('Topic 4', 'complete', { summary: 'S4' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.agentsSpawned).toBe(4)
      expect(result.findings).toHaveLength(4)
    })

    it('should handle 4 agents with mixed status', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'S1' }),
        createMockAgentStatus('Topic 2', 'failed', { error: 'E2' }),
        createMockAgentStatus('Topic 3', 'running'),
        createMockAgentStatus('Topic 4', 'complete', { summary: 'S4' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.agentsSpawned).toBe(4)
      expect(result.agentsCompleted).toBe(2)
      expect(result.agentsFailed).toBe(1)
    })
  })

  describe('Partial results handling', () => {
    it('should continue with partial results when some agents fail', () => {
      const agentResults: AgentStatus[] = [
        createMockAgentStatus('Topic 1', 'complete', { summary: 'Success' }),
        createMockAgentStatus('Topic 2', 'failed', { error: 'Failed' }),
        createMockAgentStatus('Topic 3', 'complete', { summary: 'Success 2' }),
      ]

      const result = manager.aggregateAgentResults(agentResults)

      expect(result.agentsCompleted).toBe(2)
      expect(result.agentsFailed).toBe(1)
      expect(result.findings).toHaveLength(2)
    })

    it('should handle write operations for partial results', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)

      const partialFindings = [createMockFinding('Topic 1', 'Partial result')]

      const path = await manager.writeResearch(6, 'Query', partialFindings)

      expect(path).toBe('/test/project/.openpaul/phases/06-phase-6/RESEARCH.md')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should save partial results on writeResearchPhaseResult', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)

      const partialResult: ResearchPhaseResult = {
        phase: 6,
        agentsSpawned: 3,
        agentsCompleted: 2,
        agentsFailed: 1,
        findings: [createMockFinding('Topic 1', 'Partial')],
        themes: ['testing'],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const path = await manager.writeResearchPhaseResult(
        6,
        partialResult,
        partialResult.findings,
        partialResult.themes
      )

      expect(path).toBe('/test/project/.openpaul/phases/06-phase-6/RESEARCH.md')
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('writeResearch', () => {
    it('should write research content to RESEARCH.md', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)

      const findings = [createMockFinding('Topic 1', 'Summary 1')]

      const path = await manager.writeResearch(6, 'Test query', findings)

      expect(path).toBe('/test/project/.openpaul/phases/06-phase-6/RESEARCH.md')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should call atomicWrite with correct path and content', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)

      await manager.writeResearch(6, 'Test query', [])

      const call = (atomicWrite as jest.Mock).mock.calls[0]
      expect(call[0]).toContain('RESEARCH.md')
      expect(typeof call[1]).toBe('string')
      expect(call[1]).toContain('# Phase 6: Research')
    })
  })

  describe('writeResearchPhaseResult', () => {
    it('should write phase research content to RESEARCH.md', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)

      const phaseResult: ResearchPhaseResult = {
        phase: 6,
        agentsSpawned: 2,
        agentsCompleted: 2,
        agentsFailed: 0,
        findings: [createMockFinding('Topic 1', 'Summary 1')],
        themes: ['testing'],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      const path = await manager.writeResearchPhaseResult(
        6,
        phaseResult,
        phaseResult.findings,
        phaseResult.themes
      )

      expect(path).toBe('/test/project/.openpaul/phases/06-phase-6/RESEARCH.md')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should generate content with agent metrics', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)

      const phaseResult: ResearchPhaseResult = {
        phase: 6,
        agentsSpawned: 3,
        agentsCompleted: 2,
        agentsFailed: 1,
        findings: [createMockFinding('Topic 1', 'Summary 1')],
        themes: [],
        createdAt: '2026-03-13T10:00:00.000Z',
      }

      await manager.writeResearchPhaseResult(
        6,
        phaseResult,
        phaseResult.findings,
        phaseResult.themes
      )

      const content = (atomicWrite as jest.Mock).mock.calls[0][1]
      expect(content).toContain('**Agents Spawned:** 3')
      expect(content).toContain('2 successful, 1 failed')
    })
  })
})
