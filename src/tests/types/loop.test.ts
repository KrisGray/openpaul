import { isValidTransition, VALID_TRANSITIONS, LoopPhaseSchema } from '../../types/loop'

describe('loop types', () => {
  describe('isValidTransition', () => {
    it('should return true for valid transition PLAN → APPLY', () => {
      expect(isValidTransition('PLAN', 'APPLY')).toBe(true)
    })
    
    it('should return true for valid transition APPLY → UNIFY', () => {
      expect(isValidTransition('APPLY', 'UNIFY')).toBe(true)
    })
    
    it('should return true for valid transition UNIFY → PLAN', () => {
      expect(isValidTransition('UNIFY', 'PLAN')).toBe(true)
    })
    
    it('should return false for invalid transition PLAN → UNIFY', () => {
      expect(isValidTransition('PLAN', 'UNIFY')).toBe(false)
    })
    
    it('should return false for invalid transition PLAN → PLAN', () => {
      expect(isValidTransition('PLAN', 'PLAN')).toBe(false)
    })
    
    it('should return false for invalid transition APPLY → PLAN', () => {
      expect(isValidTransition('APPLY', 'PLAN')).toBe(false)
    })
    
    it('should return false for invalid transition APPLY → APPLY', () => {
      expect(isValidTransition('APPLY', 'APPLY')).toBe(false)
    })
    
    it('should return false for invalid transition UNIFY → APPLY', () => {
      expect(isValidTransition('UNIFY', 'APPLY')).toBe(false)
    })
    
    it('should return false for invalid transition UNIFY → UNIFY', () => {
      expect(isValidTransition('UNIFY', 'UNIFY')).toBe(false)
    })

    it('should return false when from phase is not in VALID_TRANSITIONS', () => {
      expect(isValidTransition('INVALID' as any, 'PLAN')).toBe(false)
    })

    it('should return false when to phase is not in allowed list', () => {
      expect(isValidTransition('PLAN', 'INVALID' as any)).toBe(false)
    })
  })
  
  describe('VALID_TRANSITIONS', () => {
    it('should have all 3 phases as keys', () => {
      expect(Object.keys(VALID_TRANSITIONS)).toEqual(
        expect.arrayContaining(['PLAN', 'APPLY', 'UNIFY'])
      )
      expect(Object.keys(VALID_TRANSITIONS)).toHaveLength(3)
    })
    
    it('should allow only APPLY from PLAN', () => {
      expect(VALID_TRANSITIONS.PLAN).toEqual(['APPLY'])
    })
    
    it('should allow only UNIFY from APPLY', () => {
      expect(VALID_TRANSITIONS.APPLY).toEqual(['UNIFY'])
    })
    
    it('should allow only PLAN from UNIFY', () => {
      expect(VALID_TRANSITIONS.UNIFY).toEqual(['PLAN'])
    })
  })
  
  describe('LoopPhaseSchema', () => {
    it('should validate PLAN phase', () => {
      expect(() => LoopPhaseSchema.parse('PLAN')).not.toThrow()
      expect(LoopPhaseSchema.parse('PLAN')).toBe('PLAN')
    })
    
    it('should validate APPLY phase', () => {
      expect(() => LoopPhaseSchema.parse('APPLY')).not.toThrow()
      expect(LoopPhaseSchema.parse('APPLY')).toBe('APPLY')
    })
    
    it('should validate UNIFY phase', () => {
      expect(() => LoopPhaseSchema.parse('UNIFY')).not.toThrow()
      expect(LoopPhaseSchema.parse('UNIFY')).toBe('UNIFY')
    })
    
    it('should reject invalid phase strings', () => {
      expect(() => LoopPhaseSchema.parse('INVALID')).toThrow()
    })
    
    it('should reject lowercase phase strings', () => {
      expect(() => LoopPhaseSchema.parse('plan')).toThrow()
    })
    
    it('should reject empty string', () => {
      expect(() => LoopPhaseSchema.parse('')).toThrow()
    })
    
    it('should reject numeric values', () => {
      expect(() => LoopPhaseSchema.parse(123 as any)).toThrow()
    })
    
    it('should reject null', () => {
      expect(() => LoopPhaseSchema.parse(null as any)).toThrow()
    })
    
    it('should reject undefined', () => {
      expect(() => LoopPhaseSchema.parse(undefined as any)).toThrow()
    })
  })
})
