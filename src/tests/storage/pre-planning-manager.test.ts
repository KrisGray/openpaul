/**
 * PrePlanningManager Tests
 * 
 * Tests for PrePlanningManager class
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { PrePlanningManager } from '../../storage/pre-planning-manager'
import type { 
  AssumptionEntry, 
  IssueEntry, 
  DiscoveryParams,
  ContextParams,
} from '../../types/pre-planning'

jest.mock('fs', () => ({
  existsSync: jest.fn(),
}))

jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}))

describe('PrePlanningManager', () => {
  const mockProjectRoot = '/test/project'
  let manager: PrePlanningManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new PrePlanningManager(mockProjectRoot)
  })

  describe('resolvePhaseDir', () => {
    it('should find phase directory in .paul/phases/', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul/phases/06-phase-6')
      })
      
      const result = manager.resolvePhaseDir(6)
      expect(result).toContain('.paul/phases')
    })

    it('should find phase directory in .planning/phases/', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.planning/phases/06-phase-6')
      })
      
      const result = manager.resolvePhaseDir(6)
      expect(result).toContain('.planning/phases')
    })

    it('should return null when phase directory not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.resolvePhaseDir(99)
      expect(result).toBeNull()
    })
  })

  describe('createContext', () => {
    it('should generate valid CONTEXT.md content', () => {
      const params: ContextParams = {
        domain: 'Test domain',
        decisions: [{ title: 'Decision 1', description: 'Description 1' }],
        specifics: ['Idea 1', 'Idea 2'],
        deferred: ['Deferred item'],
      }
      
      const content = manager.createContext(6, params)
      
      expect(content).toContain('# Phase 6: Context')
      expect(content).toContain('**Gathered:**')
      expect(content).toContain('**Status:** Ready for planning')
      expect(content).toContain('<domain>')
      expect(content).toContain('Test domain')
      expect(content).toContain('</domain>')
      expect(content).toContain('<decisions>')
      expect(content).toContain('Decision 1')
      expect(content).toContain('</decisions>')
      expect(content).toContain('<specifics>')
      expect(content).toContain('Idea 1')
      expect(content).toContain('</specifics>')
      expect(content).toContain('<deferred>')
      expect(content).toContain('Deferred item')
      expect(content).toContain('</deferred>')
    })

    it('should handle empty deferred with default message', () => {
      const params: ContextParams = {
        deferred: [],
      }
      
      const content = manager.createContext(6, params)
      
      expect(content).toContain('None — discussion stayed within phase scope')
    })
  })

  describe('createAssumptions', () => {
    it('should generate valid ASSUMPTIONS.md content', () => {
      const assumptions: AssumptionEntry[] = [
        {
          statement: 'Users have Node.js installed',
          validation_status: 'unvalidated',
          confidence: 'high',
          impact: 'System will not work without Node.js',
        },
      ]
      
      const content = manager.createAssumptions(6, assumptions)
      
      expect(content).toContain('# Phase 6: Assumptions')
      expect(content).toContain('| Statement | Status | Confidence | Impact |')
      expect(content).toContain('Users have Node.js installed')
      expect(content).toContain('unvalidated')
      expect(content).toContain('high')
    })
  })

  describe('createIssues', () => {
    it('should generate valid ISSUES.md content', () => {
      const issues: IssueEntry[] = [
        {
          severity: 'critical',
          description: 'Database connection fails',
          affectedAreas: ['Database', 'API'],
          mitigation: 'Add connection retry logic',
        },
        {
          severity: 'low',
          description: 'Minor UI issue',
          affectedAreas: ['UI'],
          mitigation: 'CSS fix',
        },
      ]
      
      const content = manager.createIssues(6, issues)
      
      expect(content).toContain('# Phase 6: Issues and Risks')
      expect(content).toContain('## Critical Priority Issues')
      expect(content).toContain('Database connection fails')
      expect(content).toContain('## Low Priority Issues')
      expect(content).toContain('## Summary')
    })

    it('should sort issues by severity', () => {
      const issues: IssueEntry[] = [
        { severity: 'low', description: 'Low issue', affectedAreas: [], mitigation: '' },
        { severity: 'critical', description: 'Critical issue', affectedAreas: [], mitigation: '' },
        { severity: 'medium', description: 'Medium issue', affectedAreas: [], mitigation: '' },
      ]
      
      const content = manager.createIssues(6, issues)
      
      const criticalPos = content.indexOf('Critical issue')
      const mediumPos = content.indexOf('Medium issue')
      const lowPos = content.indexOf('Low issue')
      
      expect(criticalPos).toBeLessThan(mediumPos)
      expect(mediumPos).toBeLessThan(lowPos)
    })
  })

  describe('createDiscovery', () => {
    it('should generate valid DISCOVERY.md content', () => {
      const params: DiscoveryParams = {
        topic: 'Authentication methods',
        depth: 'standard',
        summary: 'JWT is recommended',
        findings: ['JWT is stateless', 'OAuth2 is complex'],
        optionsConsidered: ['JWT', 'OAuth2', 'Session-based'],
        recommendation: 'Use JWT for simplicity',
        references: ['https://jwt.io'],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('# Phase 6: Discovery - Authentication methods')
      expect(content).toContain('**Depth:** standard')
      expect(content).toContain('## Summary')
      expect(content).toContain('JWT is recommended')
      expect(content).toContain('## Findings')
      expect(content).toContain('## Options Considered')
      expect(content).toContain('## Recommendation')
      expect(content).toContain('## References')
    })
  })
})
