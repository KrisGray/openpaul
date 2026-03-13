/**
 * PrePlanningManager Tests
 * 
 * Comprehensive tests for PrePlanningManager class covering path resolution
 * and artifact generation for all pre-planning artifact types.
 */

import { existsSync } from 'fs'
import { join } from 'path'
import { PrePlanningManager } from '../../storage/pre-planning-manager'
import * as atomicWrites from '../../storage/atomic-writes'
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

jest.mock('../../storage/atomic-writes', () => ({
  atomicWrite: jest.fn(),
}))

describe('PrePlanningManager', () => {
  const mockProjectRoot = '/test/project'
  let manager: PrePlanningManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new PrePlanningManager(mockProjectRoot)
  })

  // ========================================
  // Path Resolution Tests
  // ========================================

  describe('resolvePhaseDir', () => {
    it('should find phase directory in .openpaul/phases/', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.openpaul/phases/06-phase-6')
      })
      
      const result = manager.resolvePhaseDir(6)
      expect(result).toBe('/test/project/.openpaul/phases/06-phase-6')
    })

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

    it('should prefer .openpaul over .paul and .planning', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        // All exist, but .openpaul should be checked first
        return path.includes('.openpaul/phases/06-phase-6') || 
               path.includes('.paul/phases/06-phase-6') ||
               path.includes('.planning/phases/06-phase-6')
      })
      
      const result = manager.resolvePhaseDir(6)
      expect(result).toBe('/test/project/.openpaul/phases/06-phase-6')
    })

    it('should prefer .paul over .planning when .openpaul does not exist', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('.openpaul')) return false
        return path.includes('.paul/phases/06-phase-6') || 
               path.includes('.planning/phases/06-phase-6')
      })
      
      const result = manager.resolvePhaseDir(6)
      expect(result).toBe('/test/project/.paul/phases/06-phase-6')
    })

    it('should return null when phase directory not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.resolvePhaseDir(99)
      expect(result).toBeNull()
    })

    it('should format phase directory name with zero padding', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('03-phase-3')
      })
      
      const result = manager.resolvePhaseDir(3)
      expect(result).toContain('03-phase-3')
    })

    it('should handle single digit phase numbers', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('01-phase-1')
      })
      
      const result = manager.resolvePhaseDir(1)
      expect(result).toContain('01-phase-1')
    })
  })

  describe('resolveContextPath', () => {
    it('should find existing CONTEXT.md', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') || path.includes('CONTEXT.md')
      })
      
      const result = manager.resolveContextPath(6)
      expect(result).toContain('CONTEXT.md')
    })

    it('should return null when phase directory not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.resolveContextPath(99)
      expect(result).toBeNull()
    })

    it('should return null when CONTEXT.md does not exist', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') && !path.includes('CONTEXT.md')
      })
      
      const result = manager.resolveContextPath(6)
      expect(result).toBeNull()
    })
  })

  describe('resolveAssumptionsPath', () => {
    it('should find existing ASSUMPTIONS.md', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') || path.includes('ASSUMPTIONS.md')
      })
      
      const result = manager.resolveAssumptionsPath(6)
      expect(result).toContain('ASSUMPTIONS.md')
    })

    it('should return null when phase directory not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.resolveAssumptionsPath(99)
      expect(result).toBeNull()
    })

    it('should return null when ASSUMPTIONS.md does not exist', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') && !path.includes('ASSUMPTIONS.md')
      })
      
      const result = manager.resolveAssumptionsPath(6)
      expect(result).toBeNull()
    })
  })

  describe('resolveIssuesPath', () => {
    it('should find existing ISSUES.md', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') || path.includes('ISSUES.md')
      })
      
      const result = manager.resolveIssuesPath(6)
      expect(result).toContain('ISSUES.md')
    })

    it('should return null when phase directory not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.resolveIssuesPath(99)
      expect(result).toBeNull()
    })

    it('should return null when ISSUES.md does not exist', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') && !path.includes('ISSUES.md')
      })
      
      const result = manager.resolveIssuesPath(6)
      expect(result).toBeNull()
    })
  })

  describe('resolveDiscoveryPath', () => {
    it('should find existing DISCOVERY.md', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') || path.includes('DISCOVERY.md')
      })
      
      const result = manager.resolveDiscoveryPath(6)
      expect(result).toContain('DISCOVERY.md')
    })

    it('should return null when phase directory not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const result = manager.resolveDiscoveryPath(99)
      expect(result).toBeNull()
    })

    it('should return null when DISCOVERY.md does not exist', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6') && !path.includes('DISCOVERY.md')
      })
      
      const result = manager.resolveDiscoveryPath(6)
      expect(result).toBeNull()
    })
  })

  // ========================================
  // Context Artifact Generation Tests
  // ========================================

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

    it('should handle empty decisions with default message', () => {
      const params: ContextParams = {
        decisions: [],
      }
      
      const content = manager.createContext(6, params)
      
      expect(content).toContain('- None yet')
    })

    it('should handle empty specifics with default message', () => {
      const params: ContextParams = {
        specifics: [],
      }
      
      const content = manager.createContext(6, params)
      
      const specificsSection = content.substring(
        content.indexOf('<specifics>'),
        content.indexOf('</specifics>')
      )
      expect(specificsSection).toContain('- None yet')
    })

    it('should include all decision entries', () => {
      const params: ContextParams = {
        decisions: [
          { title: 'Decision 1', description: 'Desc 1' },
          { title: 'Decision 2', description: 'Desc 2' },
        ],
      }
      
      const content = manager.createContext(6, params)
      
      expect(content).toContain('**Decision 1:** Desc 1')
      expect(content).toContain('**Decision 2:** Desc 2')
    })

    it('should include all specific ideas', () => {
      const params: ContextParams = {
        specifics: ['Idea 1', 'Idea 2', 'Idea 3'],
      }
      
      const content = manager.createContext(6, params)
      
      expect(content).toContain('- Idea 1')
      expect(content).toContain('- Idea 2')
      expect(content).toContain('- Idea 3')
    })

    it('should include phase number in footer', () => {
      const params: ContextParams = {}
      
      const content = manager.createContext(3, params)
      
      expect(content).toContain('*Phase 3 context gathered')
    })

    it('should handle empty params', () => {
      const content = manager.createContext(6, {})
      
      expect(content).toContain('# Phase 6: Context')
      expect(content).toContain('To be defined')
    })
  })

  // ========================================
  // Assumptions Artifact Generation Tests
  // ========================================

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

    it('should support validated status', () => {
      const assumptions: AssumptionEntry[] = [
        {
          statement: 'Test assumption',
          validation_status: 'validated',
          confidence: 'high',
          impact: 'Test impact',
        },
      ]
      
      const content = manager.createAssumptions(6, assumptions)
      
      expect(content).toContain('validated')
    })

    it('should support invalidated status', () => {
      const assumptions: AssumptionEntry[] = [
        {
          statement: 'Test assumption',
          validation_status: 'invalidated',
          confidence: 'high',
          impact: 'Test impact',
        },
      ]
      
      const content = manager.createAssumptions(6, assumptions)
      
      expect(content).toContain('invalidated')
    })

    it('should support all confidence levels', () => {
      const assumptions: AssumptionEntry[] = [
        { statement: 'High conf', validation_status: 'unvalidated', confidence: 'high', impact: 'impact' },
        { statement: 'Medium conf', validation_status: 'unvalidated', confidence: 'medium', impact: 'impact' },
        { statement: 'Low conf', validation_status: 'unvalidated', confidence: 'low', impact: 'impact' },
      ]
      
      const content = manager.createAssumptions(6, assumptions)
      
      expect(content).toContain('high')
      expect(content).toContain('medium')
      expect(content).toContain('low')
    })

    it('should include timestamps', () => {
      const assumptions: AssumptionEntry[] = [
        { statement: 'Test', validation_status: 'unvalidated', confidence: 'high', impact: 'impact' },
      ]
      
      const content = manager.createAssumptions(6, assumptions)
      
      expect(content).toContain('**Created:**')
      expect(content).toContain('**Updated:**')
    })

    it('should include validation notes section', () => {
      const assumptions: AssumptionEntry[] = [
        { statement: 'Test', validation_status: 'unvalidated', confidence: 'high', impact: 'impact' },
      ]
      
      const content = manager.createAssumptions(6, assumptions)
      
      expect(content).toContain('## Validation Notes')
    })

    it('should handle multiple assumptions', () => {
      const assumptions: AssumptionEntry[] = [
        { statement: 'First', validation_status: 'unvalidated', confidence: 'high', impact: 'impact1' },
        { statement: 'Second', validation_status: 'validated', confidence: 'medium', impact: 'impact2' },
      ]
      
      const content = manager.createAssumptions(6, assumptions)
      
      expect(content).toContain('First')
      expect(content).toContain('Second')
      expect(content).toContain('impact1')
      expect(content).toContain('impact2')
    })
  })

  // ========================================
  // Issues Artifact Generation Tests
  // ========================================

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

    it('should include all severity levels in summary', () => {
      const issues: IssueEntry[] = [
        { severity: 'critical', description: 'C', affectedAreas: [], mitigation: '' },
        { severity: 'high', description: 'H', affectedAreas: [], mitigation: '' },
        { severity: 'medium', description: 'M', affectedAreas: [], mitigation: '' },
        { severity: 'low', description: 'L', affectedAreas: [], mitigation: '' },
      ]
      
      const content = manager.createIssues(6, issues)
      
      const summaryStart = content.indexOf('## Summary')
      const summarySection = content.substring(summaryStart)
      
      expect(summarySection).toContain('Critical')
      expect(summarySection).toContain('High')
      expect(summarySection).toContain('Medium')
      expect(summarySection).toContain('Low')
    })

    it('should count issues correctly in summary', () => {
      const issues: IssueEntry[] = [
        { severity: 'critical', description: 'C1', affectedAreas: [], mitigation: '' },
        { severity: 'critical', description: 'C2', affectedAreas: [], mitigation: '' },
        { severity: 'high', description: 'H1', affectedAreas: [], mitigation: '' },
      ]
      
      const content = manager.createIssues(6, issues)
      
      const summaryStart = content.indexOf('## Summary')
      const summarySection = content.substring(summaryStart)
      
      expect(summarySection).toContain('| Critical | 2 |')
      expect(summarySection).toContain('| High | 1 |')
    })

    it('should include affected areas', () => {
      const issues: IssueEntry[] = [
        {
          severity: 'high',
          description: 'Test issue',
          affectedAreas: ['Database', 'API', 'Auth'],
          mitigation: 'Fix it',
        },
      ]
      
      const content = manager.createIssues(6, issues)
      
      expect(content).toContain('**Affected Areas:** Database, API, Auth')
    })

    it('should include mitigation strategies', () => {
      const issues: IssueEntry[] = [
        {
          severity: 'high',
          description: 'Test issue',
          affectedAreas: [],
          mitigation: 'Implement retry logic with exponential backoff',
        },
      ]
      
      const content = manager.createIssues(6, issues)
      
      expect(content).toContain('**Mitigation:** Implement retry logic with exponential backoff')
    })

    it('should include status in header', () => {
      const issues: IssueEntry[] = [
        { severity: 'low', description: 'L', affectedAreas: [], mitigation: '' },
      ]
      
      const content = manager.createIssues(6, issues)
      
      expect(content).toContain('**Status:** Open')
    })

    it('should handle high priority issues', () => {
      const issues: IssueEntry[] = [
        {
          severity: 'high',
          description: 'High priority issue',
          affectedAreas: ['Performance'],
          mitigation: 'Optimize queries',
        },
      ]
      
      const content = manager.createIssues(6, issues)
      
      expect(content).toContain('## High Priority Issues')
      expect(content).toContain('High priority issue')
    })

    it('should handle medium priority issues', () => {
      const issues: IssueEntry[] = [
        {
          severity: 'medium',
          description: 'Medium priority issue',
          affectedAreas: ['UX'],
          mitigation: 'Improve layout',
        },
      ]
      
      const content = manager.createIssues(6, issues)
      
      expect(content).toContain('## Medium Priority Issues')
      expect(content).toContain('Medium priority issue')
    })
  })

  // ========================================
  // Discovery Artifact Generation Tests
  // ========================================

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

    it('should support quick depth mode', () => {
      const params: DiscoveryParams = {
        topic: 'Quick research',
        depth: 'quick',
        summary: 'Quick summary',
        findings: ['Finding 1'],
        optionsConsidered: ['Option A'],
        recommendation: 'Go with A',
        references: [],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('**Depth:** quick')
    })

    it('should support deep depth mode', () => {
      const params: DiscoveryParams = {
        topic: 'Deep research',
        depth: 'deep',
        summary: 'Deep summary',
        findings: ['Finding 1', 'Finding 2', 'Finding 3'],
        optionsConsidered: ['Option A', 'Option B', 'Option C'],
        recommendation: 'Go with B',
        references: ['Ref 1', 'Ref 2'],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('**Depth:** deep')
    })

    it('should include all findings', () => {
      const params: DiscoveryParams = {
        topic: 'Test',
        depth: 'standard',
        summary: 'Summary',
        findings: ['Finding A', 'Finding B', 'Finding C'],
        optionsConsidered: [],
        recommendation: 'Rec',
        references: [],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('- Finding A')
      expect(content).toContain('- Finding B')
      expect(content).toContain('- Finding C')
    })

    it('should number options considered', () => {
      const params: DiscoveryParams = {
        topic: 'Test',
        depth: 'standard',
        summary: 'Summary',
        findings: [],
        optionsConsidered: ['JWT', 'OAuth'],
        recommendation: 'JWT',
        references: [],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('### Option 1: JWT')
      expect(content).toContain('### Option 2: OAuth')
    })

    it('should include all references', () => {
      const params: DiscoveryParams = {
        topic: 'Test',
        depth: 'standard',
        summary: 'Summary',
        findings: [],
        optionsConsidered: [],
        recommendation: 'Rec',
        references: ['https://example.com', 'https://docs.example.com'],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('- https://example.com')
      expect(content).toContain('- https://docs.example.com')
    })

    it('should omit references section when empty', () => {
      const params: DiscoveryParams = {
        topic: 'Test',
        depth: 'standard',
        summary: 'Summary',
        findings: [],
        optionsConsidered: [],
        recommendation: 'Rec',
        references: [],
      }
      
      const content = manager.createDiscovery(6, params)
      
      // The references section header should not appear
      const referencesCount = (content.match(/## References/g) || []).length
      expect(referencesCount).toBe(0)
    })

    it('should include topic in title', () => {
      const params: DiscoveryParams = {
        topic: 'Database Selection',
        depth: 'standard',
        summary: 'Summary',
        findings: [],
        optionsConsidered: [],
        recommendation: 'Rec',
        references: [],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('Discovery - Database Selection')
    })

    it('should include created timestamp', () => {
      const params: DiscoveryParams = {
        topic: 'Test',
        depth: 'standard',
        summary: 'Summary',
        findings: [],
        optionsConsidered: [],
        recommendation: 'Rec',
        references: [],
      }
      
      const content = manager.createDiscovery(6, params)
      
      expect(content).toContain('**Created:**')
    })
  })

  // ========================================
  // Write Methods Tests
  // ========================================

  describe('writeContext', () => {
    it('should write CONTEXT.md to phase directory', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6')
      })
      ;(atomicWrites.atomicWrite as jest.Mock).mockResolvedValue(undefined)
      
      const params: ContextParams = {
        domain: 'Test domain',
        decisions: [],
        specifics: [],
        deferred: [],
      }
      
      const result = await manager.writeContext(6, params)
      
      expect(result).toContain('CONTEXT.md')
      expect(atomicWrites.atomicWrite).toHaveBeenCalled()
    })

    it('should throw when phase directory not found', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const params: ContextParams = {}
      
      await expect(manager.writeContext(99, params)).rejects.toThrow('Phase 99 directory not found')
    })
  })

  describe('writeAssumptions', () => {
    it('should write ASSUMPTIONS.md to phase directory', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6')
      })
      ;(atomicWrites.atomicWrite as jest.Mock).mockResolvedValue(undefined)
      
      const assumptions: AssumptionEntry[] = [
        { statement: 'Test', validation_status: 'unvalidated', confidence: 'high', impact: 'impact' },
      ]
      
      const result = await manager.writeAssumptions(6, assumptions)
      
      expect(result).toContain('ASSUMPTIONS.md')
      expect(atomicWrites.atomicWrite).toHaveBeenCalled()
    })

    it('should throw when phase directory not found', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const assumptions: AssumptionEntry[] = []
      
      await expect(manager.writeAssumptions(99, assumptions)).rejects.toThrow('Phase 99 directory not found')
    })
  })

  describe('writeIssues', () => {
    it('should write ISSUES.md to phase directory', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6')
      })
      ;(atomicWrites.atomicWrite as jest.Mock).mockResolvedValue(undefined)
      
      const issues: IssueEntry[] = [
        { severity: 'high', description: 'Issue', affectedAreas: [], mitigation: 'Fix' },
      ]
      
      const result = await manager.writeIssues(6, issues)
      
      expect(result).toContain('ISSUES.md')
      expect(atomicWrites.atomicWrite).toHaveBeenCalled()
    })

    it('should throw when phase directory not found', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const issues: IssueEntry[] = []
      
      await expect(manager.writeIssues(99, issues)).rejects.toThrow('Phase 99 directory not found')
    })
  })

  describe('writeDiscovery', () => {
    it('should write DISCOVERY.md to phase directory', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6')
      })
      ;(atomicWrites.atomicWrite as jest.Mock).mockResolvedValue(undefined)
      
      const params: DiscoveryParams = {
        topic: 'Test',
        depth: 'standard',
        summary: 'Summary',
        findings: [],
        optionsConsidered: [],
        recommendation: 'Rec',
        references: [],
      }
      
      const result = await manager.writeDiscovery(6, params)
      
      expect(result).toContain('DISCOVERY.md')
      expect(atomicWrites.atomicWrite).toHaveBeenCalled()
    })

    it('should throw when phase directory not found', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)
      
      const params: DiscoveryParams = {
        topic: 'Test',
        depth: 'standard',
        summary: 'Summary',
        findings: [],
        optionsConsidered: [],
        recommendation: 'Rec',
        references: [],
      }
      
      await expect(manager.writeDiscovery(99, params)).rejects.toThrow('Phase 99 directory not found')
    })
  })

  // ========================================
  // Edge Cases and Error Handling
  // ========================================

  describe('Edge cases', () => {
    it('should handle empty arrays gracefully', () => {
      const content = manager.createAssumptions(6, [])
      expect(content).toContain('# Phase 6: Assumptions')
    })

    it('should handle empty issues array', () => {
      const content = manager.createIssues(6, [])
      expect(content).toContain('# Phase 6: Issues and Risks')
      expect(content).toContain('## Summary')
    })

    it('should handle phase number with multiple digits', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('12-phase-12')
      })
      
      const result = manager.resolvePhaseDir(12)
      expect(result).toContain('12-phase-12')
    })

    it('should write content with atomic writes', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('06-phase-6')
      })
      ;(atomicWrites.atomicWrite as jest.Mock).mockResolvedValue(undefined)
      
      const params: ContextParams = { domain: 'Test' }
      await manager.writeContext(6, params)
      
      const writeCall = (atomicWrites.atomicWrite as jest.Mock).mock.calls[0]
      expect(writeCall[1]).toContain('# Phase 6: Context')
      expect(writeCall[1]).toContain('Test')
    })
  })
})
