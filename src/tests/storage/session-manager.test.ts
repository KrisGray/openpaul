/**
 * SessionManager Tests
 * 
 * Tests for SessionManager class
 */

import { join } from 'path'
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { SessionManager } from '../../storage/session-manager'
import type { SessionState } from '../../types/session'

describe('SessionManager class', () => {
  const tempDir = join(__dirname, 'temp-sessions-test')
  const sessionsDir = join(tempDir, '.openpaul', 'SESSIONS')
  const currentSessionPath = join(tempDir, '.openpaul', 'CURRENT-SESSION')
  let sessionManager: SessionManager

  const createValidSession = (id: string): SessionState => ({
    sessionId: id,
    createdAt: Date.now(),
    pausedAt: Date.now(),
    phase: 'PLAN',
    phaseNumber: 1,
    workInProgress: ['Task 1'],
    nextSteps: ['Next step'],
    metadata: {},
    fileChecksums: {}
  })

  beforeEach(() => {
    // Clean up temp directory if it exists
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }

    // Create temp directory
    mkdirSync(tempDir, { recursive: true })

    // Create SessionManager instance
    sessionManager = new SessionManager(tempDir)
  })

  afterEach(() => {
    // Clean up temp directory after each test
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('saveSession', () => {
    it('should create session file with valid data', async () => {
      const session = createValidSession('test-session-1')

      await sessionManager.saveSession(session)

      const sessionPath = join(sessionsDir, 'test-session-1.json')
      expect(existsSync(sessionPath)).toBe(true)

      const savedData = JSON.parse(readFileSync(sessionPath, 'utf-8'))
      expect(savedData.sessionId).toBe('test-session-1')
      expect(savedData.phase).toBe('PLAN')
    })

    it('should update CURRENT-SESSION reference file', async () => {
      const session = createValidSession('test-session-2')

      await sessionManager.saveSession(session)

      expect(existsSync(currentSessionPath)).toBe(true)
      const currentId = readFileSync(currentSessionPath, 'utf-8').trim()
      expect(currentId).toBe('test-session-2')
    })

    it('should validate session state before saving', async () => {
      const invalidSession = {
        sessionId: '', // Invalid: empty string
        createdAt: Date.now(),
        pausedAt: Date.now(),
        phase: 'PLAN',
        phaseNumber: 1,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {}
      } as SessionState

      await expect(sessionManager.saveSession(invalidSession)).rejects.toThrow()
    })
  })

  describe('loadCurrentSession', () => {
    it('should load session from CURRENT-SESSION reference', async () => {
      const session = createValidSession('test-session-3')
      await sessionManager.saveSession(session)

      const loaded = sessionManager.loadCurrentSession()

      expect(loaded).not.toBeNull()
      expect(loaded?.sessionId).toBe('test-session-3')
      expect(loaded?.phase).toBe('PLAN')
    })

    it('should return null if no session exists', () => {
      const loaded = sessionManager.loadCurrentSession()
      expect(loaded).toBeNull()
    })

    it('should return null if session file is corrupted', async () => {
      // Create CURRENT-SESSION reference
      mkdirSync(join(tempDir, '.openpaul'), { recursive: true })
      writeFileSync(currentSessionPath, 'corrupted-session-id', 'utf-8')

      const loaded = sessionManager.loadCurrentSession()
      expect(loaded).toBeNull()
    })

    it('should return null if CURRENT-SESSION file is missing', () => {
      const loaded = sessionManager.loadCurrentSession()
      expect(loaded).toBeNull()
    })
  })

  describe('sessionExists', () => {
    it('should return true for existing session', async () => {
      const session = createValidSession('test-session-4')
      await sessionManager.saveSession(session)

      const exists = sessionManager.sessionExists('test-session-4')
      expect(exists).toBe(true)
    })

    it('should return false for non-existent session', () => {
      const exists = sessionManager.sessionExists('non-existent-session')
      expect(exists).toBe(false)
    })
  })

  describe('deleteSession', () => {
    it('should remove session file', async () => {
      const session = createValidSession('test-session-5')
      await sessionManager.saveSession(session)

      sessionManager.deleteSession('test-session-5')

      const exists = sessionManager.sessionExists('test-session-5')
      expect(exists).toBe(false)
    })

    it('should handle missing session gracefully', () => {
      // Should not throw error
      expect(() => sessionManager.deleteSession('non-existent-session')).not.toThrow()
    })
  })

  describe('getCurrentSessionId', () => {
    it('should return current session ID', async () => {
      const session = createValidSession('test-session-6')
      await sessionManager.saveSession(session)

      const sessionId = sessionManager.getCurrentSessionId()
      expect(sessionId).toBe('test-session-6')
    })

    it('should return null if no session', () => {
      const sessionId = sessionManager.getCurrentSessionId()
      expect(sessionId).toBeNull()
    })
  })

  describe('generateSessionId', () => {
    it('should create unique IDs', async () => {
      const id1 = sessionManager.generateSessionId()

      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2))

      const id2 = sessionManager.generateSessionId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^session-\d+$/)
      expect(id2).toMatch(/^session-\d+$/)
    })
  })

  describe('validateSessionState', () => {
    it('should return valid=true for fresh session', async () => {
      const session = createValidSession('test-session-7')
      await sessionManager.saveSession(session)

      const result = sessionManager.validateSessionState('test-session-7')

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should warn about stale sessions (> 24 hours)', async () => {
      // Create session with old pausedAt timestamp
      const oldTimestamp = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      const session: SessionState = {
        sessionId: 'test-session-8',
        createdAt: oldTimestamp,
        pausedAt: oldTimestamp,
        phase: 'PLAN',
        phaseNumber: 1,
        workInProgress: [],
        nextSteps: [],
        metadata: {},
        fileChecksums: {}
      }
      await sessionManager.saveSession(session)

      const result = sessionManager.validateSessionState('test-session-8')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('stale')
      expect(result.errors[0]).toContain('hours old')
    })

    it('should return errors for corrupted session', async () => {
      // Create session file with invalid JSON
      mkdirSync(sessionsDir, { recursive: true })
      const sessionPath = join(sessionsDir, 'corrupted-session.json')
      writeFileSync(sessionPath, 'invalid json {{{', 'utf-8')

      const result = sessionManager.validateSessionState('corrupted-session')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('validation failed')
    })

    it('should return errors for non-existent session', () => {
      const result = sessionManager.validateSessionState('non-existent')

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Session file not found: non-existent')
    })
  })
})
