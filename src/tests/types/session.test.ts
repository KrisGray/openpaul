/**
 * SessionState Type Tests
 * 
 * Tests for SessionState type and schema validation
 */

import { SessionStateSchema } from '../../types/session'
import type { SessionState } from '../../types/session'

describe('SessionState type and schema validation', () => {
  const validSessionState: SessionState = {
    sessionId: 'session-1234567890',
    createdAt: Date.now(),
    pausedAt: Date.now(),
    phase: 'PLAN',
    phaseNumber: 1,
    workInProgress: ['Task 1', 'Task 2'],
    nextSteps: ['Continue with Task 3'],
    metadata: { key: 'value' },
    fileChecksums: { 'file1.ts': 'abc123' }
  }

  describe('valid SessionState', () => {
    it('should validate a complete valid SessionState', () => {
      const result = SessionStateSchema.safeParse(validSessionState)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validSessionState)
      }
    })

    it('should accept optional currentPlanId field', () => {
      const stateWithPlan = {
        ...validSessionState,
        currentPlanId: '03-01'
      }
      const result = SessionStateSchema.safeParse(stateWithPlan)
      expect(result.success).toBe(true)
    })

    it('should validate workInProgress as array of strings', () => {
      const state = {
        ...validSessionState,
        workInProgress: ['Item 1', 'Item 2', 'Item 3']
      }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should validate nextSteps as array of strings', () => {
      const state = {
        ...validSessionState,
        nextSteps: ['Step 1', 'Step 2']
      }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept metadata as Record<string, unknown>', () => {
      const state = {
        ...validSessionState,
        metadata: {
          stringKey: 'value',
          numberKey: 42,
          booleanKey: true,
          objectKey: { nested: 'value' },
          arrayKey: [1, 2, 3]
        }
      }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })
  })

  describe('sessionId validation', () => {
    it('should reject empty sessionId', () => {
      const state = { ...validSessionState, sessionId: '' }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('non-empty string')
      }
    })

    it('should reject missing sessionId', () => {
      const { sessionId, ...state } = validSessionState
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })
  })

  describe('timestamp validation', () => {
    it('should reject negative createdAt', () => {
      const state = { ...validSessionState, createdAt: -1 }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive number')
      }
    })

    it('should reject non-number createdAt', () => {
      const state = { ...validSessionState, createdAt: 'not-a-number' as any }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject negative pausedAt', () => {
      const state = { ...validSessionState, pausedAt: -1 }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive number')
      }
    })

    it('should reject non-number pausedAt', () => {
      const state = { ...validSessionState, pausedAt: 'not-a-number' as any }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })
  })

  describe('phase validation', () => {
    it('should reject invalid phase value', () => {
      const state = { ...validSessionState, phase: 'INVALID' as any }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should accept PLAN phase', () => {
      const state = { ...validSessionState, phase: 'PLAN' }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept APPLY phase', () => {
      const state = { ...validSessionState, phase: 'APPLY' }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept UNIFY phase', () => {
      const state = { ...validSessionState, phase: 'UNIFY' }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })
  })

  describe('phaseNumber validation', () => {
    it('should reject negative phaseNumber', () => {
      const state = { ...validSessionState, phaseNumber: -1 }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive integer')
      }
    })

    it('should reject non-integer phaseNumber', () => {
      const state = { ...validSessionState, phaseNumber: 1.5 }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject zero phaseNumber', () => {
      const state = { ...validSessionState, phaseNumber: 0 }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should accept valid positive integer phaseNumber', () => {
      const state = { ...validSessionState, phaseNumber: 5 }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })
  })

  describe('array field validation', () => {
    it('should reject workInProgress as non-array', () => {
      const state = { ...validSessionState, workInProgress: 'not-an-array' as any }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should reject nextSteps as non-array', () => {
      const state = { ...validSessionState, nextSteps: 'not-an-array' as any }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })

    it('should accept empty arrays', () => {
      const state = {
        ...validSessionState,
        workInProgress: [],
        nextSteps: []
      }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })
  })

  describe('fileChecksums validation', () => {
    it('should accept empty fileChecksums', () => {
      const state = { ...validSessionState, fileChecksums: {} }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should accept multiple file checksums', () => {
      const state = {
        ...validSessionState,
        fileChecksums: {
          'file1.ts': 'abc123',
          'file2.ts': 'def456',
          'file3.ts': 'ghi789'
        }
      }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(true)
    })

    it('should reject fileChecksums with non-string values', () => {
      const state = {
        ...validSessionState,
        fileChecksums: { 'file1.ts': 123 as any }
      }
      const result = SessionStateSchema.safeParse(state)
      expect(result.success).toBe(false)
    })
  })
})
