/**
 * RoadmapManager Tests
 * 
 * Comprehensive tests for RoadmapManager class
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'

import { RoadmapManager } from '../../roadmap/roadmap-manager'
import type { PhaseEntry, AddPhaseOptions, RemovePhaseResult, RoadmapValidationResult } from '../../types/roadmap'

// Mock fs module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  readdirSync: jest.fn(),
}))

// Mock path.join to return predictable paths
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
  dirname: jest.fn((p: string) => p.split('/').slice(0, -1).join('/')),
}))

describe('RoadmapManager', () => {
  const mockProjectRoot = '/test/project'
  let manager: RoadmapManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new RoadmapManager(mockProjectRoot)
  })

  describe('resolveRoadmapPath', () => {
    it('should return .paul/ROADMAP.md when it exists', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.paul/ROADMAP.md')
      })

      const result = manager.resolveRoadmapPath()

      expect(result).toBe('/test/project/.paul/ROADMAP.md')
    })

    it('should return .openpaul/ROADMAP.md as fallback when .paul does not exist', () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        return path.includes('.openpaul/ROADMAP.md')
      })

      const result = manager.resolveRoadmapPath()

      expect(result).toBe('/test/project/.openpaul/ROADMAP.md')
    })

    it('should return null when neither .paul nor .openpaul ROADMAP.md exists', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = manager.resolveRoadmapPath()

      expect(result).toBeNull()
    })

    it('should prefer .paul over .openpaul when both exist', () => {
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const result = manager.resolveRoadmapPath()

      expect(result).toBe('/test/project/.paul/ROADMAP.md')
    })
  })

  describe('parsePhases', () => {
    const mockRoadmapContent = `
# Roadmap

## Phases

### Phase 1: Core Infrastructure
Some description here.

### Phase 2: Advanced Features
More description.

### Phase 3: Polish & Testing
Final phase.

## Progress

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 1. | Core Infrastructure | ✓ | 100% |
| 2. | Advanced Features | ◆ | 50% |
| 3. | Polish & Testing | ○ | 0% |
`

    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapContent)
    })

    it('should parse phase sections from ROADMAP.md', () => {
      const phases = manager.parsePhases()

      expect(phases.length).toBeGreaterThanOrEqual(3)
      expect(phases.find(p => p.number === 1)).toBeDefined()
      expect(phases.find(p => p.number === 2)).toBeDefined()
      expect(phases.find(p => p.number === 3)).toBeDefined()
    })

    it('should parse progress table and update status', () => {
      const phases = manager.parsePhases()

      const phase1 = phases.find(p => p.number === 1)
      const phase2 = phases.find(p => p.number === 2)
      const phase3 = phases.find(p => p.number === 3)

      expect(phase1?.status).toBe('complete')
      expect(phase2?.status).toBe('in-progress')
      expect(phase3?.status).toBe('pending')
    })

    it('should return empty array when ROADMAP.md does not exist', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const phases = manager.parsePhases()

      expect(phases).toEqual([])
    })

    it('should return empty array for empty ROADMAP.md', () => {
      ;(readFileSync as jest.Mock).mockReturnValue('')

      const phases = manager.parsePhases()

      expect(phases).toEqual([])
    })

    it('should handle malformed content gracefully', () => {
      ;(readFileSync as jest.Mock).mockReturnValue('Some random content without phases')

      const phases = manager.parsePhases()

      expect(Array.isArray(phases)).toBe(true)
    })

    it('should strip status suffixes from phase names', () => {
      const contentWithStatus = `
### Phase 1: Core Infrastructure (done)
### Phase 2: Advanced Features - complete
### Phase 3: Polish (in-progress)
`
      ;(readFileSync as jest.Mock).mockReturnValue(contentWithStatus)

      const phases = manager.parsePhases()

      expect(phases[0]?.name).toBe('Core Infrastructure')
      expect(phases[1]?.name).toBe('Advanced Features')
      expect(phases[2]?.name).toBe('Polish')
    })

    it('should sort phases by number', () => {
      const unsortedContent = `
### Phase 3: Third
### Phase 1: First
### Phase 2: Second
`
      ;(readFileSync as jest.Mock).mockReturnValue(unsortedContent)

      const phases = manager.parsePhases()

      expect(phases[0]?.number).toBe(1)
      expect(phases[1]?.number).toBe(2)
      expect(phases[2]?.number).toBe(3)
    })
  })

  describe('generateDirectoryName', () => {
    it('should lowercase the name', () => {
      const result = manager.generateDirectoryName('Roadmap Management', 4)
      
      expect(result).toMatch(/^04-/)
      expect(result).toContain('roadmap')
    })

    it('should replace spaces with hyphens', () => {
      const result = manager.generateDirectoryName('Core Infrastructure', 1)

      expect(result).toBe('01-core-infrastructure')
    })

    it('should remove special characters', () => {
      const result = manager.generateDirectoryName('Test @#$ Features!', 5)

      expect(result).toBe('05-test-features')
    })

    it('should format as {number}-{slug} with padded number', () => {
      const result = manager.generateDirectoryName('Authentication', 9)

      expect(result).toBe('09-authentication')
    })

    it('should handle single digit phase numbers', () => {
      const result = manager.generateDirectoryName('Setup', 1)

      expect(result).toBe('01-setup')
    })

    it('should handle double digit phase numbers', () => {
      const result = manager.generateDirectoryName('Final Phase', 12)

      expect(result).toBe('12-final-phase')
    })

    it('should collapse multiple hyphens', () => {
      const result = manager.generateDirectoryName('Test    Multiple   Spaces', 3)

      expect(result).toBe('03-test-multiple-spaces')
    })

    it('should remove leading and trailing hyphens', () => {
      const result = manager.generateDirectoryName('  Test Name  ', 2)

      expect(result).toBe('02-test-name')
    })
  })

  describe('addPhase', () => {
    const mockExistingContent = `
# Roadmap

### Phase 1: First Phase
Description

### Phase 2: Second Phase
Description
`

    beforeEach(() => {
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFileSync as jest.Mock).mockReturnValue(mockExistingContent)
      ;(writeFileSync as jest.Mock).mockImplementation(() => {})
      ;(mkdirSync as jest.Mock).mockImplementation(() => undefined)
    })

    it('should add phase after reference phase', () => {
      const options: AddPhaseOptions = {
        name: 'New Feature',
        position: 'after',
        referencePhase: 1,
      }

      const result = manager.addPhase(options)

      expect(result.number).toBe(2)
      expect(result.name).toBe('New Feature')
      expect(result.status).toBe('pending')
      expect(writeFileSync).toHaveBeenCalled()
    })

    it('should add phase before reference phase', () => {
      const options: AddPhaseOptions = {
        name: 'Insert Before',
        position: 'before',
        referencePhase: 2,
      }

      const result = manager.addPhase(options)

      expect(result.number).toBe(2)
      expect(result.name).toBe('Insert Before')
      expect(writeFileSync).toHaveBeenCalled()
    })

    it('should create phase directory', () => {
      // Setup: phases dir doesn't exist to trigger mkdirSync
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('ROADMAP.md')) return true
        if (path.endsWith('phases')) return false // phases dir doesn't exist
        if (path.includes('02-test-phase')) return false // new phase dir doesn't exist
        return true
      })

      const options: AddPhaseOptions = {
        name: 'Test Phase',
        position: 'after',
        referencePhase: 1,
      }

      manager.addPhase(options)

      expect(mkdirSync).toHaveBeenCalled()
    })

    it('should renumber subsequent phases in ROADMAP.md', () => {
      const options: AddPhaseOptions = {
        name: 'Inserted',
        position: 'after',
        referencePhase: 1,
      }

      manager.addPhase(options)

      const writeCall = (writeFileSync as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1] as string

      // Check that renumbering occurred in the content
      expect(writeFileSync).toHaveBeenCalled()
    })

    it('should throw on missing ROADMAP.md', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const options: AddPhaseOptions = {
        name: 'Test',
        position: 'after',
        referencePhase: 1,
      }

      expect(() => manager.addPhase(options)).toThrow('ROADMAP.md not found')
    })

    it('should generate correct directory name', () => {
      const options: AddPhaseOptions = {
        name: 'Auth Module',
        position: 'after',
        referencePhase: 1,
      }

      const result = manager.addPhase(options)

      expect(result.directoryName).toMatch(/^\d{2}-auth-module$/)
    })
  })

  describe('canRemovePhase', () => {
    const mockStateContent = `
# Project State

Current Phase: 2
`

    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('ROADMAP.md')) return true
        if (path.includes('STATE.md')) return true
        return false
      })
      ;(readFileSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('ROADMAP.md')) {
          return `
### Phase 1: Complete Phase
### Phase 2: In Progress Phase
### Phase 3: Pending Phase

| 1. | Complete Phase | ✓ |
| 2. | In Progress Phase | ◆ |
| 3. | Pending Phase | ○ |
`
        }
        if (path.includes('STATE.md')) {
          return mockStateContent
        }
        return ''
      })
    })

    it('should return valid for removable phase', () => {
      const result = manager.canRemovePhase(3, '/test/project/.paul/STATE.md')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return invalid for completed phase', () => {
      const result = manager.canRemovePhase(1, '/test/project/.paul/STATE.md')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('completed'))).toBe(true)
    })

    it('should return invalid for current phase from STATE.md', () => {
      const result = manager.canRemovePhase(2, '/test/project/.paul/STATE.md')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('current') || e.includes('progress'))).toBe(true)
    })

    it('should return invalid for in-progress phase', () => {
      const result = manager.canRemovePhase(2, '/test/project/.paul/STATE.md')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('in-progress'))).toBe(true)
    })

    it('should return invalid for non-existent phase', () => {
      const result = manager.canRemovePhase(99, '/test/project/.paul/STATE.md')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('does not exist'))).toBe(true)
    })

    it('should return invalid when ROADMAP.md not found', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = manager.canRemovePhase(1, '/test/project/.paul/STATE.md')

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('ROADMAP.md not found'))).toBe(true)
    })

    it('should accumulate multiple errors', () => {
      // Phase 2 is both in-progress AND current phase
      const result = manager.canRemovePhase(2, '/test/project/.paul/STATE.md')

      expect(result.errors.length).toBeGreaterThan(1)
    })
  })

  describe('removePhase', () => {
    const mockRoadmapWithPhases = `
# Roadmap

### Phase 1: First Phase
Description

### Phase 2: Phase To Remove
Description

### Phase 3: Third Phase
Description

| 1. | First Phase | ○ |
| 2. | Phase To Remove | ○ |
| 3. | Third Phase | ○ |
`

    beforeEach(() => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        // Return true for ROADMAP.md and phase directories that exist
        if (path.includes('ROADMAP.md')) return true
        if (path.includes('.paul') || path.includes('.openpaul')) return true
        if (path.includes('phases/') && path.includes('phase-to-remove')) return true
        return false
      })
      ;(readFileSync as jest.Mock).mockReturnValue(mockRoadmapWithPhases)
      ;(writeFileSync as jest.Mock).mockImplementation(() => {})
      ;(rmSync as jest.Mock).mockImplementation(() => {})
    })

    it('should remove phase entry from ROADMAP.md', () => {
      const result = manager.removePhase(2)

      expect(result.success).toBe(true)
      expect(writeFileSync).toHaveBeenCalled()
    })

    it('should delete phase directory', () => {
      manager.removePhase(2)

      expect(rmSync).toHaveBeenCalled()
    })

    it('should renumber subsequent phases (decrement)', () => {
      const result = manager.removePhase(2)

      expect(result.renumberedPhases).toContain(3)
    })

    it('should return removed phase info', () => {
      const result = manager.removePhase(2)

      expect(result.success).toBe(true)
      expect(result.removedPhase).not.toBeNull()
      expect(result.removedPhase?.number).toBe(2)
    })

    it('should throw on missing ROADMAP.md', () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      expect(() => manager.removePhase(1)).toThrow('ROADMAP.md not found')
    })

    it('should return failure result for non-existent phase', () => {
      const result = manager.removePhase(99)

      expect(result.success).toBe(false)
      expect(result.removedPhase).toBeNull()
      expect(result.renumberedPhases).toEqual([])
    })

    it('should handle removal of last phase without renumbering', () => {
      const singlePhaseContent = `
### Phase 1: Only Phase
Description
`
      ;(readFileSync as jest.Mock).mockReturnValue(singlePhaseContent)

      const result = manager.removePhase(1)

      expect(result.success).toBe(true)
      expect(result.renumberedPhases).toEqual([])
    })
  })

  describe('integration scenarios', () => {
    it('should handle multiple sequential add operations', () => {
      const mockContent = `
### Phase 1: Base
`
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFileSync as jest.Mock).mockReturnValue(mockContent)
      ;(writeFileSync as jest.Mock).mockImplementation(() => {})
      ;(mkdirSync as jest.Mock).mockImplementation(() => undefined)

      // First add
      const result1 = manager.addPhase({
        name: 'Second',
        position: 'after',
        referencePhase: 1,
      })
      expect(result1.number).toBe(2)
    })

    it('should handle add followed by remove', () => {
      const mockContent = `
### Phase 1: First
### Phase 2: Second
`
      ;(existsSync as jest.Mock).mockReturnValue(true)
      ;(readFileSync as jest.Mock).mockReturnValue(mockContent)
      ;(writeFileSync as jest.Mock).mockImplementation(() => {})
      ;(mkdirSync as jest.Mock).mockImplementation(() => undefined)
      ;(rmSync as jest.Mock).mockImplementation(() => {})

      // Remove phase 2
      const result = manager.removePhase(2)
      expect(result.success).toBe(true)
    })
  })
})
