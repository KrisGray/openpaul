/**
 * Add Phase Command Tests
 * 
 * Tests for the add-phase command functionality
 */

import { RoadmapManager } from '../../roadmap/roadmap-manager'
import { openpaulAddPhase } from '../../commands/add-phase'
import { formatHeader, formatBold, formatList } from '../../output/formatter'

// Mock dependencies
jest.mock('../../roadmap/roadmap-manager')
jest.mock(
  '@opencode-ai/plugin',
  () => {
    const chainable = {
      optional: () => chainable,
      describe: () => chainable,
    }
    const tool = (input: any) => input
    tool.schema = {
      boolean: () => chainable,
      string: () => chainable,
      number: () => chainable,
    }
    return { tool }
  },
  { virtual: true }
)

describe('Add Phase Command', () => {
  const mockDirectory = '/test/project'

  let mockRoadmapManager: {
    resolveRoadmapPath: jest.Mock
    addPhase: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockRoadmapManager = {
      resolveRoadmapPath: jest.fn(),
      addPhase: jest.fn(),
    }

    ;(RoadmapManager as jest.Mock).mockImplementation(() => mockRoadmapManager)
  })

  describe('success cases', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.addPhase.mockReturnValue({
        number: 3,
        name: 'New Feature',
        status: 'pending',
        directoryName: '03-new-feature',
      })
    })

    it('should add phase with --after flag', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'New Feature', after: 2, before: undefined },
        toolContext
      )

      expect(mockRoadmapManager.addPhase).toHaveBeenCalledWith({
        name: 'New Feature',
        position: 'after',
        referencePhase: 2,
      })
      expect(result).toContain('Phase Added')
      expect(result).toContain('3')
      expect(result).toContain('New Feature')
    })

    it('should add phase with --before flag', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Insert Before', after: undefined, before: 4 },
        toolContext
      )

      expect(mockRoadmapManager.addPhase).toHaveBeenCalledWith({
        name: 'Insert Before',
        position: 'before',
        referencePhase: 4,
      })
      expect(result).toContain('Phase Added')
    })

    it('should return brief confirmation message', async () => {
      // Override the mock to return 'Auth Module' as the name
      mockRoadmapManager.addPhase.mockReturnValue({
        number: 2,
        name: 'Auth Module',
        status: 'pending',
        directoryName: '02-auth-module',
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Auth Module', after: 1, before: undefined },
        toolContext
      )

      expect(result).toContain('Phase Added')
      expect(result).toContain('Auth Module')
      expect(result).toContain('Directory:')
    })

    it('should trim whitespace from phase name', async () => {
      const toolContext = { directory: mockDirectory } as any
      await openpaulAddPhase.execute(
        { name: '  Trimmed Name  ', after: 1, before: undefined },
        toolContext
      )

      expect(mockRoadmapManager.addPhase).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Trimmed Name',
        })
      )
    })
  })

  describe('error: both flags provided', () => {
    it('should return error when both --after and --before are provided', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Test Phase', after: 1, before: 2 },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('Cannot specify both --after and --before')
      expect(mockRoadmapManager.addPhase).not.toHaveBeenCalled()
    })
  })

  describe('error: neither flag provided', () => {
    it('should return error when neither --after nor --before are provided', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Test Phase', after: undefined, before: undefined },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('Exactly one of --after or --before must be provided')
      expect(mockRoadmapManager.addPhase).not.toHaveBeenCalled()
    })
  })

  describe('error: empty name', () => {
    it('should return error for empty name', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: '', after: 1, before: undefined },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('Phase name cannot be empty')
      expect(mockRoadmapManager.addPhase).not.toHaveBeenCalled()
    })

    it('should return error for whitespace-only name', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: '   ', after: 1, before: undefined },
        toolContext
      )

      expect(result).toContain('Invalid Arguments')
      expect(result).toContain('Phase name cannot be empty')
      expect(mockRoadmapManager.addPhase).not.toHaveBeenCalled()
    })
  })

  describe('error: ROADMAP.md not found', () => {
    it('should return error when ROADMAP.md does not exist', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue(null)

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Test Phase', after: 1, before: undefined },
        toolContext
      )

      expect(result).toContain('ROADMAP.md Not Found')
      expect(result).toContain('Run /openpaul:init first')
      expect(mockRoadmapManager.addPhase).not.toHaveBeenCalled()
    })
  })

  describe('error: reference phase does not exist', () => {
    it('should return error when RoadmapManager throws', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.addPhase.mockImplementation(() => {
        throw new Error('Reference phase 99 does not exist')
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Test Phase', after: 99, before: undefined },
        toolContext
      )

      expect(result).toContain('Add Phase Failed')
      expect(result).toContain('Reference phase 99 does not exist')
    })
  })

  describe('error: unexpected exception', () => {
    it('should handle unexpected errors gracefully', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.addPhase.mockImplementation(() => {
        throw new Error('Unexpected filesystem error')
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Test Phase', after: 1, before: undefined },
        toolContext
      )

      expect(result).toContain('Add Phase Failed')
      expect(result).toContain('Unexpected filesystem error')
      expect(result).toContain('Troubleshooting')
    })

    it('should handle non-Error exceptions', async () => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.addPhase.mockImplementation(() => {
        throw 'String error'
      })

      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Test Phase', after: 1, before: undefined },
        toolContext
      )

      expect(result).toContain('Add Phase Failed')
      expect(result).toContain('Unknown error occurred')
    })
  })

  describe('output formatting', () => {
    beforeEach(() => {
      mockRoadmapManager.resolveRoadmapPath.mockReturnValue('/test/project/.paul/ROADMAP.md')
      mockRoadmapManager.addPhase.mockReturnValue({
        number: 5,
        name: 'Search Feature',
        status: 'pending',
        directoryName: '05-search-feature',
      })
    })

    it('should include phase number in output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Search Feature', after: 4, before: undefined },
        toolContext
      )

      expect(result).toContain('5')
    })

    it('should include directory path in output', async () => {
      const toolContext = { directory: mockDirectory } as any
      const result = await openpaulAddPhase.execute(
        { name: 'Search Feature', after: 4, before: undefined },
        toolContext
      )

      expect(result).toContain('Directory:')
      expect(result).toContain('.paul/phases/05-search-feature')
    })
  })
})
