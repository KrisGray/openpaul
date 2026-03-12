/**
 * Discuss Milestone Command Tests
 * 
 * Tests for /openpaul:discuss-milestone command functionality
 */

import { openpaulpaulDiscussMilestone } from '../../commands/discuss-milestone'
import { existsSync, mkdirSync } from 'fs'
import { atomicWrite } from '../../storage/atomic-writes'

// Mock dependencies
jest.mock('fs')
jest.mock('../../storage/atomic-writes')
jest.mock(
  '@opencode-ai/plugin',
  () => ({
    tool: (input: any) => input,
  }),
  { virtual: true }
)

describe('openpaulpaulDiscussMilestone command', () => {
  const mockDirectory = '/test/project'
  const toolContext = { directory: mockDirectory } as any

  beforeEach(() => {
    jest.clearAllMocks()

    // Default: .planning directory exists
    ;(existsSync as jest.Mock).mockImplementation((path: string) => {
      if (path.includes('.planning') && !path.includes('MILESTONE-CONTEXT')) {
        return true
      }
      return false
    })
    ;(mkdirSync as jest.Mock).mockReturnValue(undefined)
    ;(atomicWrite as jest.Mock).mockResolvedValue(undefined)
  })

  describe('successful context creation', () => {
    it('should create MILESTONE-CONTEXT.md with all fields', async () => {
      const result = await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
        scope: 'Full feature release',
        features: 'Auth,Payments,Dashboard',
        phases: '6,7,8',
        constraints: 'Must ship by Q2',
      }, toolContext)

      expect(result).toContain('Milestone Context Created')
      expect(result).toContain('v2.0')
      expect(result).toContain('.planning/MILESTONE-CONTEXT.md')
      expect(atomicWrite).toHaveBeenCalled()
    })

    it('should create file in .planning/ root (not phase directory)', async () => {
      await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
      }, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenPath = writeCall[0]
      
      expect(writtenPath).toContain('.planning')
      expect(writtenPath).toContain('MILESTONE-CONTEXT.md')
      expect(writtenPath).not.toContain('phases')
    })

    it('should handle minimal args (just name)', async () => {
      const result = await openpaulpaulDiscussMilestone.execute({
        name: 'v3.0',
      }, toolContext)

      expect(result).toContain('Milestone Context Created')
      
      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('v3.0')
      expect(writtenContent).toContain('To be defined')
      expect(writtenContent).toContain('To be determined')
    })

    it('should parse comma-separated features correctly', async () => {
      await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
        features: 'Feature A, Feature B , Feature C ',
      }, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('- Feature A')
      expect(writtenContent).toContain('- Feature B')
      expect(writtenContent).toContain('- Feature C')
    })

    it('should parse comma-separated phases correctly', async () => {
      await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
        phases: '6, 7, 8',
      }, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('- Phase 6')
      expect(writtenContent).toContain('- Phase 7')
      expect(writtenContent).toContain('- Phase 8')
    })

    it('should include all template sections', async () => {
      await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
        scope: 'Test scope',
        features: 'Feature 1',
        phases: '5',
        constraints: 'No constraints',
      }, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('# Milestone Context: v2.0')
      expect(writtenContent).toContain('## Goals')
      expect(writtenContent).toContain('## Features')
      expect(writtenContent).toContain('## Phase Mapping')
      expect(writtenContent).toContain('## Constraints')
      expect(writtenContent).toContain('## Open Questions')
      expect(writtenContent).toContain('Test scope')
      expect(writtenContent).toContain('No constraints')
    })

    it('should return formatted success message with next steps', async () => {
      const result = await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
      }, toolContext)

      expect(result).toContain('Milestone:')
      expect(result).toContain('File:')
      expect(result).toContain('Next Steps')
      expect(result).toContain('Review and edit MILESTONE-CONTEXT.md')
    })
  })

  describe('existing file handling', () => {
    it('should prompt to overwrite when file exists without --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('.planning')) {
          return true
        }
        return false
      })

      const result = await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
      }, toolContext)

      expect(result).toContain('Milestone Context Already Exists')
      expect(result).toContain('--overwrite')
      expect(atomicWrite).not.toHaveBeenCalled()
    })

    it('should overwrite with --overwrite flag', async () => {
      ;(existsSync as jest.Mock).mockImplementation((path: string) => {
        if (path.includes('.planning')) {
          return true
        }
        return false
      })

      const result = await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
        overwrite: true,
      }, toolContext)

      expect(result).toContain('Milestone Context Created')
      expect(atomicWrite).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should return error if .planning directory does not exist', async () => {
      ;(existsSync as jest.Mock).mockReturnValue(false)

      const result = await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
      }, toolContext)

      expect(result).toContain('Cannot Plan Milestone')
      expect(result).toContain('not been initialized')
      expect(result).toContain('/openpaul:init')
    })

    it('should return error for invalid milestone name', async () => {
      const result = await openpaulpaulDiscussMilestone.execute({
        name: '',
      }, toolContext)

      expect(result).toContain('Invalid Milestone Name')
      expect(result).toContain('required')
    })

    it('should return error for whitespace-only name', async () => {
      const result = await openpaulpaulDiscussMilestone.execute({
        name: '   ',
      }, toolContext)

      expect(result).toContain('Invalid Milestone Name')
    })

    it('should return formatted error on file write failure', async () => {
      ;(atomicWrite as jest.Mock).mockRejectedValue(new Error('Write failed'))

      const result = await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
      }, toolContext)

      expect(result).toContain('Milestone Planning Failed')
      expect(result).toContain('Write failed')
      expect(result).toContain('Troubleshooting')
    })
  })

  describe('template generation', () => {
    it('should generate template with correct structure', async () => {
      await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
        scope: 'Release new features',
        features: 'Auth,Payments',
        phases: '6,7',
        constraints: 'Ship by Q2 2024',
      }, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      // Check header
      expect(writtenContent).toContain('# Milestone Context: v2.0')
      
      // Check metadata
      expect(writtenContent).toContain('**Gathered:**')
      expect(writtenContent).toContain('**Status:** Planning')
      
      // Check sections
      expect(writtenContent).toContain('## Goals')
      expect(writtenContent).toContain('Release new features')
      
      expect(writtenContent).toContain('## Features')
      expect(writtenContent).toContain('- Auth')
      expect(writtenContent).toContain('- Payments')
      
      expect(writtenContent).toContain('## Phase Mapping')
      expect(writtenContent).toContain('- Phase 6')
      expect(writtenContent).toContain('- Phase 7')
      
      expect(writtenContent).toContain('## Constraints')
      expect(writtenContent).toContain('Ship by Q2 2024')
      
      // Check footer
      expect(writtenContent).toContain('*Context for upcoming milestone*')
      expect(writtenContent).toContain('*Created:')
    })

    it('should include open questions section', async () => {
      await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
      }, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('## Open Questions')
      expect(writtenContent).toContain('What dependencies exist between phases?')
      expect(writtenContent).toContain('What external integrations are required?')
      expect(writtenContent).toContain('What is the target completion date?')
    })

    it('should use defaults for missing optional fields', async () => {
      await openpaulpaulDiscussMilestone.execute({
        name: 'v2.0',
      }, toolContext)

      const writeCall = (atomicWrite as jest.Mock).mock.calls[0]
      const writtenContent = writeCall[1]
      
      expect(writtenContent).toContain('To be defined')
      expect(writtenContent).toContain('To be determined')
      expect(writtenContent).toContain('None specified')
    })
  })
})
