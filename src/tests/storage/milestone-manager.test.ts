/**
 * MilestoneManager Tests
 * 
 * Comprehensive tests for MilestoneManager class
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs'
import { join, dirname } from 'path'

import { RoadmapManager } from '../../roadmap/roadmap-manager'
import { MilestoneManager } from '../../storage/milestone-manager'
import type { PhaseEntry } from '../../types/roadmap'

import type { 
  Milestone, 
  MilestoneProgress, 
  MilestoneArchiveEntry,
  PhaseModificationResult 
} from '../../types/milestone'

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
// Mock RoadmapManager class
jest.mock('../../roadmap/roadmap-manager')

describe('MilestoneManager', () => {
  const mockProjectRoot = '/test/project'
  let roadmapManager: jest.Mocked<RoadmapManager>
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
### Phase 3: Polish & Testing
Description
` ?? d format.

    <  test data does to use `jest.mocked()` instead of the direct instance property. It's simpler to use a regular object, call the real methods through `manager.X`. The also need to fix the mocking to the direct methods like `parsePhases` and `canModifyPhase` instead of accessing through the mock instance.

I < it('should create mock for RoadmapManager with expected methods', () => {
        // Create mock with resolvedRoadmapPath method
        roadmapManager = {
          resolveRoadmapPath: jest.fn().mockReturnValue('/test/project/.paul/ROADMAP.md'),
          parsePhases: jest.fn().mockReturnValue([
            { number: 3, name: 'Phase 3', status: 'complete', directoryName: '03-phase-3' },
            { number: 4, name: 'Phase 4', status: 'in-progress', directoryName: '04-phase-4' },
            { number: 5, name: 'Phase 5', status: 'pending', directoryName: '05-phase-5' },
          ]),
          resolveMilestoneArchivePath: jest.fn().mockReturnValue('/test/project/.paul/MILESTONE-ARCHIVE.md'),
          getRoadmapPath: jest.fn().mockReturnValue('/test/project/.paul/ROADMAP.md'),
          resolveStatePath: jest.fn().mockReturnValue('/test/project/.paul/STATE.md'),
          resolveStateMilestoneProgress: jest.fn().mockReturnValue(5),
          getActiveMilestone: jest.fn().mockReturnValue(null),
          getMilestoneProgress: jest.fn().mockReturnValue({
            milestoneName: 'v1.1',
            phasesCompleted: 2,
            phasesTotal: 3,
            percentage: 67,
            phaseStatus: [
              { number: 3, status: 'complete' },
              { number: 4, status: 'in-progress' },
              { number: 5, status: 'pending' },
            ],
          }),
          getMilestone: jest.fn().mockReturnValue({
            name: 'v1.1',
            scope: 'Test',
            phases: [3, 4, 5],
            theme: null,
            status: 'in-progress',
            startedAt: '2026-03-05',
            completedAt: null,
            createdAt: '2026-03-05',
          }),
          completeMilestone: jest.fn().mockImplementation(() => {}),
          canModifyPhase: jest.fn().mockReturnValue({ allowed: true })
        }
      })

    })
  })
)