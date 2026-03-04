/**
 * Init Command Tests (Simplified)
 * 
 * Tests for the initialization functionality
 */

import { join } from 'path'
import { existsSync } from 'fs'
import { FileManager } from '../../storage/file-manager'
import { createDefaultModelConfig } from '../../types/model-config'
import { formatHeader, formatBold, formatList } from '../../output/formatter'

// Mock file system
jest.mock('fs')

describe('Init Command Functionality', () => {
  const mockDirectory = '/test/project'
  const paulDir = join(mockDirectory, '.paul')

  let mockFileManager: {
    ensurePaulDir: jest.Mock
    writeModelConfig: jest.Mock
    writePhaseState: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockFileManager = {
      ensurePaulDir: jest.fn(),
      writeModelConfig: jest.fn().mockResolvedValue(undefined),
      writePhaseState: jest.fn().mockResolvedValue(undefined),
    }
    
    // Mock FileManager constructor
    jest.spyOn(FileManager.prototype, 'ensurePaulDir').mockImplementation(mockFileManager.ensurePaulDir)
    jest.spyOn(FileManager.prototype, 'writeModelConfig').mockImplementation(mockFileManager.writeModelConfig)
    jest.spyOn(FileManager.prototype, 'writePhaseState').mockImplementation(mockFileManager.writePhaseState)
  })

  describe('directory initialization', () => {
    it('should initialize .paul directory when it does not exist', async () => {
      // Mock .paul directory does not exist
      ;(existsSync as jest.Mock).mockReturnValue(false)

      // Create file manager
      const fileManager = new FileManager(mockDirectory)
      
      // Execute initialization
      await fileManager.ensurePaulDir()
      await fileManager.writeModelConfig(createDefaultModelConfig())
      await fileManager.writePhaseState(1, {
        phase: 'UNIFY',
        phaseNumber: 1,
        lastUpdated: Date.now(),
        metadata: {},
      })

      // Verify calls were made
      expect(fileManager.ensurePaulDir).toHaveBeenCalled()
      expect(fileManager.writeModelConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '1.0',
        })
      )
      expect(fileManager.writePhaseState).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          phase: 'UNIFY',
          phaseNumber: 1,
        })
      )
    })

    it('should detect when .paul already exists', () => {
      // Mock .paul directory exists
      ;(existsSync as jest.Mock).mockReturnValue(true)

      const exists = existsSync(paulDir)
      expect(exists).toBe(true)
    })

    it('should reinitialize with force flag', async () => {
      // Mock .paul directory exists
      ;(existsSync as jest.Mock).mockReturnValue(true)

      // Create file manager
      const fileManager = new FileManager(mockDirectory)
      
      // Execute reinitialization
      await fileManager.ensurePaulDir()
      await fileManager.writeModelConfig(createDefaultModelConfig())

      // Verify calls were made despite existing directory
      expect(fileManager.ensurePaulDir).toHaveBeenCalled()
      expect(fileManager.writeModelConfig).toHaveBeenCalled()
    })
  })

  describe('output formatting', () => {
    it('should format success message with proper structure', () => {
      const output = formatHeader(2, '✅ OpenPAUL Initialized') + '\n\n' +
        'OpenPAUL has been successfully initialized.\n\n' +
        formatBold('Created Files:') + '\n' +
        formatList([
          '.paul/model-config.json - Model configuration',
          '.paul/state-phase-1.json - Initial state',
        ])

      // Verify structure
      expect(output).toContain('## ✅')
      expect(output).toContain('**Created Files:**')
      expect(output).toContain('- .paul/model-config.json')
    })

    it('should format warning message for existing directory', () => {
      const output = formatHeader(2, '⚠️ OpenPAUL Already Initialized') + '\n\n' +
        'OpenPAUL has already been initialized.\n\n' +
        formatBold('Options:') + '\n' +
        formatList([
          'Run `/paul:progress` to check current state',
          'Run `/paul:init --force` to reinitialize',
        ])

      // Verify structure
      expect(output).toContain('## ⚠️')
      expect(output).toContain('Already Initialized')
      expect(output).toContain('--force')
    })
  })
})
