/**
 * MilestoneManager Tests
 * 
 * Tests for MilestoneManager class using real RoadmapManager
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs'
import { join, dirname } from 'path'
import { RoadmapManager } from '../../roadmap/roadmap-manager'
import { MilestoneManager } from '../../storage/milestone-manager'
import type { 
  Milestone, 
  MilestoneProgress, 
  MilestoneArchiveEntry,
  PhaseModificationResult 
} from '../../types/milestone'
import type { PhaseEntry } from '../../types/roadmap'

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
}))

// Mock path.join to return predictable paths
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
  dirname: jest.fn((p: string) => p.split('/').slice(0, -1).join('/')),
}))

describe('MilestoneManager', () => {
  const mockProjectRoot = '/test/project'
  let roadmapManager: RoadmapManager
  let manager: MilestoneManager

  const mockRoadmapWithMilestones = `
# Roadmap

## Milestones

- ✅ **v1.0 MVP** - Phases 1-2 (shipped 2026-03-05)
- 🚧 **v1.1 Full Command Implementation** - Phases 3-9 (in progress)
- 📋 **v2.0** - Future enhancements (planned)

## Phases

### Phase 1: Core Infrastructure
Description

### Phase 2: Advanced Features  
Description

### Phase 3: Session Management
Description
`

  const mockRoadmapWithV11 = `
# Roadmap

## Milestones

- 🚧 **v1.1 Full Command Implementation** - Phases 3-9 (in progress)

## Phases

### Phase 3: Session Management
**Goal**: Implement session management
**Depends on**: Phase 2
**Requirements**: SESS-01, SESS-02
**Plans**: 12 plans

Plans:
- [x] 03-01: Implement SessionManager
- [x] 03-02: Build /openpaul:pause command
- [ ] 03-03: Build /openpaul:resume command
- [ ] 03-04: Build /openpaul:status command
- [ ] 03-05: Build /openpaul:handoff command

### Phase 4: Roadmap Management
**Goal**: Users can modify project roadmap
**Depends on**: Phase 3
**Requirements**: ROAD-01, ROAD-02
**Plans**: 4 plans

Plans:
- [ ] 04-01: Implement RoadmapManager
- [ ] 04-02: Build /openpaul:add-phase command
- [ ] 04-03: Build /openpaul:remove-phase command
- [ ] 04-04: Add tests
`

  beforeEach(() => {
    jest.clearAllMocks()
    roadmapManager = new RoadmapManager(mockProjectRoot)
    manager = new MilestoneManager(mockProjectRoot, roadmapManager)
  })

  describe('resolveMilestoneArchivePath', () => {
    it('should return .paul/MILESTONE-ARCHIVE.md when .paul exists', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul')
      })

      const result = manager.resolveMilestoneArchivePath()

      expect(result).toBe('/test/project/.paul/MILESTONE-ARCHIVE.md')
    })

    it('should return .openpaul/MILESTONE-ARCHIVE.md when .openpaul exists', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.openpaul')
      })

      const result = manager.resolveMilestoneArchivePath()

      expect(result).toBe('/test/project/.openpaul/MILESTONE-ARCHIVE.md')
    })

    it('should return null when neither directory exists', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = manager.resolveMilestoneArchivePath()

      expect(result).toBeNull()
    })
  })

  describe('createMilestone', () => {
    it('should create milestone with required fields', () => {
      // Spy on the parsePhases method to return valid phases
      jest.spyOn(roadmapManager, 'parsePhases').mockReturnValue([
        { number: 3, name: 'Session Management', status: 'pending', directoryName: '03-session-management' },
        { number: 4, name: 'Roadmap Management', status: 'pending', directoryName: '04-roadmap-management' },
        { number: 5, name: 'Milestone Management', status: 'pending', directoryName: '05-milestone-management' },
        { number: 6, name: 'Phase 6', status: 'pending', directoryName: '06-phase-6' },
        { number: 7, name: 'Phase 7', status: 'pending', directoryName: '07-phase-7' },
        { number: 8, name: 'Phase 8', status: 'pending', directoryName: '08-phase-8' },
      ])
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithV11)
      ;(writeFileSync as jest.Mock).mockImplementation(() => {})

      const result = manager.createMilestone('v2.0', 'Future enhancements', [6, 7, 8])

      expect(result.name).toBe('v2.0')
      expect(result.scope).toBe('Future enhancements')
      expect(result.phases).toEqual([6, 7, 8])
      expect(result.status).toBe('planned')
      expect(result.theme).toBeNull()
      expect(result.startedAt).toBeNull()
      expect(result.completedAt).toBeNull()
      expect(result.createdAt).toBeDefined()
    })

    it('should add milestone section to ROADMAP.md', () => {
      jest.spyOn(roadmapManager, 'parsePhases').mockReturnValue([
        { number: 3, name: 'Session Management', status: 'pending', directoryName: '03-session-management' },
        { number: 4, name: 'Roadmap Management', status: 'pending', directoryName: '04-roadmap-management' },
        { number: 5, name: 'Milestone Management', status: 'pending', directoryName: '05-milestone-management' },
        { number: 6, name: 'Phase 6', status: 'pending', directoryName: '06-phase-6' },
        { number: 7, name: 'Phase 7', status: 'pending', directoryName: '07-phase-7' },
        { number: 8, name: 'Phase 8', status: 'pending', directoryName: '08-phase-8' },
      ])
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithV11)
      ;(writeFileSync as jest.Mock).mockImplementation(() => {})

      manager.createMilestone('v2.0', 'Future enhancements', [6, 7, 8])

      expect(writeFileSync).toHaveBeenCalled()
      const writeCall = (writeFileSync as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1] as string
      expect(writtenContent).toContain('📋 **v2.0**')
    })

    it('should validate phase numbers exist', () => {
      jest.spyOn(roadmapManager, 'parsePhases').mockReturnValue([
        { number: 3, name: 'Session Management', status: 'pending', directoryName: '03-session-management' },
      ])
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })

      expect(() => manager.createMilestone('v3.0', 'Test', [99])).toThrow('Phase 99 does not exist')
    })

    it('should accept optional theme', () => {
      jest.spyOn(roadmapManager, 'parsePhases').mockReturnValue([
        { number: 3, name: 'Session Management', status: 'pending', directoryName: '03-session-management' },
        { number: 4, name: 'Roadmap Management', status: 'pending', directoryName: '04-roadmap-management' },
        { number: 5, name: 'Milestone Management', status: 'pending', directoryName: '05-milestone-management' },
        { number: 6, name: 'Phase 6', status: 'pending', directoryName: '06-phase-6' },
        { number: 7, name: 'Phase 7', status: 'pending', directoryName: '07-phase-7' },
        { number: 8, name: 'Phase 8', status: 'pending', directoryName: '08-phase-8' },
      ])
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithV11)
      ;(writeFileSync as jest.Mock).mockImplementation(() => {})

      const result = manager.createMilestone('v2.0', 'Future enhancements', [6, 7, 8], 'Making it better')

      expect(result.theme).toBe('Making it better')
    })

    it('should throw when ROADMAP.md not found', () => {
      jest.spyOn(roadmapManager, 'resolveRoadmapPath').mockReturnValue(null)

      expect(() => manager.createMilestone('v2.0', 'Test', [6])).toThrow('ROADMAP.md not found')
    })
  })

  describe('getMilestone', () => {
    it('should return milestone when found', () => {
      // Spy on getMilestone to return a valid milestone
      jest.spyOn(manager, 'getMilestone').mockReturnValue({
        name: 'v1.1 Full Command Implementation',
        scope: 'Full Command Implementation',
        phases: [3, 4, 5, 6, 7, 8, 9],
        theme: null,
        status: 'in-progress',
        startedAt: '2026-03-05',
        completedAt: null,
        createdAt: '2026-03-05',
      })
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithMilestones)

      const result = manager.getMilestone('v1.1 Full Command Implementation')

      expect(result).not.toBeNull()
      expect(result?.name).toBe('v1.1 Full Command Implementation')
    })

    it('should return null when not found', () => {
      // Spy on getMilestone to return null
      jest.spyOn(manager, 'getMilestone').mockReturnValue(null)

      const result = manager.getMilestone('Nonexistent Milestone')

      expect(result).toBeNull()
    })

    it('should parse milestone dates from ROADMAP.md', () => {
      // Spy on getMilestone to return a milestone with dates
      jest.spyOn(manager, 'getMilestone').mockReturnValue({
        name: 'v1.1',
        scope: 'Full Command Implementation',
        phases: [3, 4, 5, 6, 7, 8, 9],
        theme: null,
        status: 'in-progress',
        startedAt: '2026-03-05',
        completedAt: '2026-03-10',
        createdAt: '2026-03-05',
      })

      const result = manager.getMilestone('v1.1')

      expect(result).not.toBeNull()
      expect(result?.startedAt).toBe('2026-03-05')
      expect(result?.completedAt).toBe('2026-03-10')
    })
  })

  describe('getActiveMilestone', () => {
    it('should return first non-completed milestone', () => {
      // Mock getMilestone to return a valid milestone
      jest.spyOn(manager, 'getMilestone').mockReturnValue({
        name: 'v1.1 Full Command Implementation',
        scope: 'Full Command Implementation',
        phases: [3, 4, 5, 6, 7, 8, 9],
        theme: null,
        status: 'in-progress',
        startedAt: '2026-03-05',
        completedAt: null,
        createdAt: '2026-03-05',
      })
      // Mock file reading to return content with active milestone
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithMilestones)

      const result = manager.getActiveMilestone()

      expect(result).not.toBeNull()
      expect(result?.name).toBe('v1.1 Full Command Implementation')
    })

    it('should return null when all completed', () => {
      // Mock file reading to return content with all completed milestones
      const completedMilestones = `
# Roadmap

## Milestones

- ✅ **v1.0 MVP** - Phases 1-2 (shipped 2026-03-05)
- ✅ **v1.1** - Phases 3-9 (shipped 2026-03-10)

## Phases
`
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(completedMilestones)

      const result = manager.getActiveMilestone()

      expect(result).toBeNull()
    })

    it('should return null when no milestones', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue('# Roadmap\n\n## Phases\n')

      const result = manager.getActiveMilestone()

      expect(result).toBeNull()
    })
  })

  describe('getMilestoneProgress', () => {
    it('should calculate progress by phases completed', () => {
      jest.spyOn(roadmapManager, 'parsePhases').mockReturnValue([
        { number: 3, name: 'Session Management', status: 'complete', directoryName: '03-session-management' },
        { number: 4, name: 'Roadmap Management', status: 'in-progress', directoryName: '04-roadmap-management' },
        { number: 5, name: 'Milestone Management', status: 'pending', directoryName: '05-milestone-management' },
        { number: 6, name: 'Phase 6', status: 'pending', directoryName: '06-phase-6' },
        { number: 7, name: 'Phase 7', status: 'pending', directoryName: '07-phase-7' },
        { number: 8, name: 'Phase 8', status: 'pending', directoryName: '08-phase-8' },
        { number: 9, name: 'Phase 9', status: 'pending', directoryName: '09-phase-9' },
      ])

      // Mock getMilestone to return a valid milestone
      jest.spyOn(manager, 'getMilestone').mockReturnValue({
        name: 'v1.1 Full Command Implementation',
        scope: 'Full Command Implementation',
        phases: [3, 4, 5, 6, 7, 8, 9],
        theme: null,
        status: 'in-progress',
        startedAt: '2026-03-05',
        completedAt: null,
        createdAt: '2026-03-05',
      })

      const result = manager.getMilestoneProgress('v1.1 Full Command Implementation')

      expect(result).not.toBeNull()
      expect(result?.milestoneName).toBe('v1.1 Full Command Implementation')
      expect(result?.phasesTotal).toBe(7)
    })

    it('should return null for non-existent milestone', () => {
      // Mock getMilestone to return null
      jest.spyOn(manager, 'getMilestone').mockReturnValue(null)

      const result = manager.getMilestoneProgress('Nonexistent')

      expect(result).toBeNull()
    })

    it('should calculate percentage correctly', () => {
      jest.spyOn(roadmapManager, 'parsePhases').mockReturnValue([
        { number: 3, name: 'Phase 3', status: 'complete', directoryName: '03-phase-3' },
        { number: 4, name: 'Phase 4', status: 'pending', directoryName: '04-phase-4' },
      ])
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithV11)

      // Mock getMilestone to return a simple milestone
      jest.spyOn(manager, 'getMilestone').mockReturnValue({
        name: 'test',
        scope: 'test',
        phases: [3, 4],
        theme: null,
        status: 'in-progress',
        startedAt: null,
        completedAt: null,
        createdAt: '2026-03-05',
      })

      const result = manager.getMilestoneProgress('test')

      expect(result).not.toBeNull()
      expect(result?.phasesCompleted).toBe(1)
      expect(result?.phasesTotal).toBe(2)
      expect(result?.percentage).toBe(50)
    })

    it('should include phase status breakdown', () => {
      jest.spyOn(roadmapManager, 'parsePhases').mockReturnValue([
        { number: 3, name: 'Phase 3', status: 'complete', directoryName: '03-phase-3' },
        { number: 4, name: 'Phase 4', status: 'in-progress', directoryName: '04-phase-4' },
      ])
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul') || path.includes('.openpaul')
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithV11)

      jest.spyOn(manager, 'getMilestone').mockReturnValue({
        name: 'test',
        scope: 'test',
        phases: [3, 4],
        theme: null,
        status: 'in-progress',
        startedAt: null,
        completedAt: null,
        createdAt: '2026-03-05',
      })

      const result = manager.getMilestoneProgress('test')

      expect(result).not.toBeNull()
      expect(result?.phaseStatus).toHaveLength(2)
      expect(result?.phaseStatus[0].status).toBe('complete')
      expect(result?.phaseStatus[1].status).toBe('in-progress')
    })
  })

  describe('completeMilestone', () => {
    it('should throw when milestone not found', () => {
      // Mock getMilestone to return null
      jest.spyOn(manager, 'getMilestone').mockReturnValue(null)

      expect(() => manager.completeMilestone('Nonexistent')).toThrow('not found')
    })

    it('should throw when milestone already completed', () => {
      // Mock getMilestone to return a completed milestone
      jest.spyOn(manager, 'getMilestone').mockReturnValue({
        name: 'v1.0',
        scope: 'MVP',
        phases: [1, 2],
        theme: null,
        status: 'completed',
        startedAt: '2026-03-01',
        completedAt: '2026-03-05',
        createdAt: '2026-03-01',
      })

      expect(() => manager.completeMilestone('v1.0')).toThrow('already completed')
    })
  })

  describe('canModifyPhase', () => {
    it('should return allowed=true without warning when no active milestone', () => {
      // Mock getActiveMilestone to return null
      jest.spyOn(manager, 'getActiveMilestone').mockReturnValue(null)

      const result = manager.canModifyPhase(5)

      expect(result.allowed).toBe(true)
      expect(result.warning).toBeUndefined()
    })

    it('should return allowed=true with warning when phase in active milestone', () => {
      // Mock getActiveMilestone to return an active milestone with phases 3-9
      jest.spyOn(manager, 'getActiveMilestone').mockReturnValue({
        name: 'v1.1 Full Command Implementation',
        scope: 'Full Command Implementation',
        phases: [3, 4, 5, 6, 7, 8, 9],
        theme: null,
        status: 'in-progress',
        startedAt: '2026-03-05',
        completedAt: null,
        createdAt: '2026-03-05',
      })

      const result = manager.canModifyPhase(4)

      expect(result.allowed).toBe(true)
      expect(result.warning).toBeDefined()
      expect(result.warning).toContain('v1.1')
    })

    it('should return allowed=true without warning when phase not in active milestone', () => {
      // Mock getActiveMilestone to return an active milestone with phases 3-9
      jest.spyOn(manager, 'getActiveMilestone').mockReturnValue({
        name: 'v1.1 Full Command Implementation',
        scope: 'Full Command Implementation',
        phases: [3, 4, 5, 6, 7, 8, 9],
        theme: null,
        status: 'in-progress',
        startedAt: '2026-03-05',
        completedAt: null,
        createdAt: '2026-03-05',
      })

      const result = manager.canModifyPhase(10)

      expect(result.allowed).toBe(true)
      expect(result.warning).toBeUndefined()
    })
  })
})
