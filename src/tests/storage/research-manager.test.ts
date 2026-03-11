/**
 * ResearchManager Tests
 * 
 * Tests for ResearchManager class
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { ResearchManager } from '../../storage/research-manager'
import type { 
  ResearchFinding,
  AgentStatus,
} from '../../types/research'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

describe('ResearchManager', () => {
  const mockProjectRoot = '/test/project'
  let manager: ResearchManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new ResearchManager(mockProjectRoot)
  })

  describe('getPlanningDir', () => {
    it('should return .paul directory when it exists', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul')
      })
      
      const result = manager.getPlanningDir()
      expect(result).toContain('.paul')
    })

    it('should return .openpaul directory as fallback', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.getPlanningDir()
      expect(result).toContain('.openpaul')
    })
  })

  describe('resolvePhaseDir', () => {
    it('should find phase directory when it exists', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul/phases')
      })
      
      const result = manager.resolvePhaseDir(6)
      expect(result).toContain('phases')
    })

    it('should return null when phase directory not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.resolvePhaseDir(99)
      expect(result).toBeNull()
    })
  })

  describe('createResearchResult', () => {
    it('should create valid ResearchResult', () => {
      const findings: ResearchFinding[] = [
        {
          topic: 'Topic 1',
          summary: 'Summary 1',
          details: ['Detail 1'],
          confidence: 'high',
          sources: ['Source 1'],
        },
      ]
      
      const result = manager.createResearchResult(6, 'Test query', findings)
      
      expect(result.phase).toBe(6)
      expect(result.query).toBe('Test query')
      expect(result.findings).toHaveLength(1)
      expect(result.confidence).toBe('high')
      expect(result.verified).toBe(false)
      expect(result.createdAt).toBeDefined()
    })

    it('should calculate overall confidence as low for empty findings', () => {
      const result = manager.createResearchResult(6, 'Test query', [])
      
      expect(result.confidence).toBe('low')
    })

    it('should calculate overall confidence as medium for mixed findings', () => {
      const findings: ResearchFinding[] = [
        { topic: 'T1', summary: 'S1', details: [], confidence: 'high', sources: [] },
        { topic: 'T2', summary: 'S2', details: [], confidence: 'low', sources: [] },
      ]
      
      const result = manager.createResearchResult(6, 'Test query', findings)
      
      expect(result.confidence).toBe('medium')
    })
  })

  describe('aggregateAgentResults', () => {
    it('should aggregate agent results correctly', () => {
      const agents: AgentStatus[] = [
        {
          topic: 'Topic 1',
          status: 'complete',
          summary: 'Summary 1',
          error: null,
          startedAt: '2026-03-11T00:00:00Z',
          completedAt: '2026-03-11T00:05:00Z',
        },
        {
          topic: 'Topic 2',
          status: 'failed',
          summary: null,
          error: 'Error message',
          startedAt: '2026-03-11T00:00:00Z',
          completedAt: null,
        },
      ]
      
      const result = manager.aggregateAgentResults(agents)
      
      expect(result.phase).toBeDefined()
      expect(result.agentsSpawned).toBe(2)
      expect(result.agentsCompleted).toBe(1)
      expect(result.agentsFailed).toBe(1)
      expect(result.findings).toHaveLength(1)
      expect(result.themes).toBeDefined()
    })
  })

  describe('formatAgentDashboard', () => {
    it('should format agent dashboard correctly', () => {
      const agents: AgentStatus[] = [
        {
          topic: 'Topic 1',
          status: 'running',
          summary: null,
          error: null,
          startedAt: '2026-03-11T00:00:00Z',
          completedAt: null,
        },
        {
          topic: 'Topic 2',
          status: 'complete',
          summary: 'Done',
          error: null,
          startedAt: '2026-03-11T00:00:00Z',
          completedAt: '2026-03-11T00:05:00Z',
        },
      ]
      
      const dashboard = {
        agents,
        completed: 1,
        total: 2,
        startTime: '2026-03-11T00:00:00Z',
      }
      
      const output = manager.formatAgentDashboard(dashboard)
      
      expect(output).toContain('Topic 1')
      expect(output).toContain('Topic 2')
      expect(output).toContain('running')
      expect(output).toContain('complete')
      expect(output).toContain('Progress:')
    })
  })

  describe('organizeByTheme', () => {
    it('should organize findings by theme', () => {
      const findings: ResearchFinding[] = [
        { topic: 'Auth', summary: 'S1', details: [], confidence: 'high', sources: [] },
        { topic: 'API', summary: 'S2', details: [], confidence: 'medium', sources: [] },
      ]
      
      const themes = manager.organizeByTheme(findings)
      
      expect(themes.size).toBeGreaterThan(0)
    })
  })

  describe('generateResearchContent', () => {
    it('should generate valid RESEARCH.md content', () => {
      const result = manager.createResearchResult(6, 'Test query', [
        {
          topic: 'Topic 1',
          summary: 'Summary 1',
          details: ['Detail 1'],
          confidence: 'high',
          sources: ['Source 1'],
        },
      ])
      
      const content = manager.generateResearchContent(result)
      
      expect(content).toContain('# Phase 6: Research')
      expect(content).toContain('Test query')
      expect(content).toContain('## Summary')
      expect(content).toContain('## Findings')
      expect(content).toContain('## Confidence Breakdown')
      expect(content).toContain('## Sources')
    })
  })
})
