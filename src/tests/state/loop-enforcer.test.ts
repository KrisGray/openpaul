import { LoopEnforcer } from '../../state/loop-enforcer'
import { isValidTransition } from '../../types'
import type { LoopPhase } from '../../types'

describe('LoopEnforcer', () => {
  let enforcer: LoopEnforcer
  
  beforeEach(() => {
    enforcer = new LoopEnforcer()
  })
  
  describe('canTransition', () => {
    it('should allow PLAN → APPLY', () => {
      expect(enforcer.canTransition('PLAN', 'APPLY')).toBe(true)
    })
    
    it('should allow APPLY → UNIFY', () => {
      expect(enforcer.canTransition('APPLY', 'UNIFY')).toBe(true)
    })
    
    it('should allow UNIFY → PLAN', () => {
      expect(enforcer.canTransition('UNIFY', 'PLAN')).toBe(true)
    })
    
    it('should reject PLAN → UNIFY', () => {
      expect(enforcer.canTransition('PLAN', 'UNIFY')).toBe(false)
    })
    
    it('should reject APPLY → PLAN', () => {
      expect(enforcer.canTransition('APPLY', 'PLAN')).toBe(false)
    })
    
    it('should reject UNIFY → APPLY', () => {
      expect(enforcer.canTransition('UNIFY', 'APPLY')).toBe(false)
    })

    it('should mirror isValidTransition helper', () => {
      const cases: Array<[LoopPhase, LoopPhase]> = [
        ['PLAN', 'APPLY'],
        ['PLAN', 'UNIFY'],
        ['APPLY', 'UNIFY'],
        ['APPLY', 'PLAN'],
        ['UNIFY', 'PLAN'],
        ['UNIFY', 'APPLY'],
      ]

      cases.forEach(([from, to]) => {
        expect(enforcer.canTransition(from, to)).toBe(isValidTransition(from, to))
      })
    })
  })
  
  describe('enforceTransition', () => {
    it('should not throw for valid transitions', () => {
      expect(() => enforcer.enforceTransition('PLAN', 'APPLY')).not.toThrow()
      expect(() => enforcer.enforceTransition('APPLY', 'UNIFY')).not.toThrow()
      expect(() => enforcer.enforceTransition('UNIFY', 'PLAN')).not.toThrow()
    })
    
    it('should throw error with guidance for invalid transitions', () => {
      expect(() => enforcer.enforceTransition('PLAN', 'UNIFY')).toThrow(/Invalid transition/)
      expect(() => enforcer.enforceTransition('PLAN', 'UNIFY')).toThrow(/Valid next states/)
      expect(() => enforcer.enforceTransition('PLAN', 'UNIFY')).toThrow(/Next action/)
    })
    
    it('should include user-friendly error messages', () => {
      try {
        enforcer.enforceTransition('APPLY', 'PLAN')
        fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('Invalid transition')
        expect((error as Error).message).toContain('Current state')
        expect((error as Error).message).toContain('Valid next states')
        expect((error as Error).message).toContain('Run /paul:unify')
      }
    })
  })
  
  describe('getRequiredNextAction', () => {
    it('should return correct action for PLAN', () => {
      expect(enforcer.getRequiredNextAction('PLAN')).toContain('/paul:apply')
    })
    
    it('should return correct action for APPLY', () => {
      expect(enforcer.getRequiredNextAction('APPLY')).toContain('/paul:unify')
    })
    
    it('should return correct action for UNIFY', () => {
      expect(enforcer.getRequiredNextAction('UNIFY')).toContain('/paul:plan')
    })
  })
  
  describe('canStartNewLoop', () => {
    it('should allow starting new loop from UNIFY', () => {
      expect(enforcer.canStartNewLoop('UNIFY')).toBe(true)
    })
    
    it('should allow starting new loop from undefined', () => {
      expect(enforcer.canStartNewLoop(undefined as any)).toBe(true)
    })
    
    it('should not allow starting new loop from PLAN', () => {
      expect(enforcer.canStartNewLoop('PLAN')).toBe(false)
    })
    
    it('should not allow starting new loop from APPLY', () => {
      expect(enforcer.canStartNewLoop('APPLY')).toBe(false)
    })
  })
  
  describe('enforceCanStartNewLoop', () => {
    it('should not throw when can start new loop', () => {
      expect(() => enforcer.enforceCanStartNewLoop('UNIFY')).not.toThrow()
      expect(() => enforcer.enforceCanStartNewLoop(undefined)).not.toThrow()
    })
    
    it('should throw with guidance when cannot start new loop', () => {
      expect(() => enforcer.enforceCanStartNewLoop('PLAN')).toThrow(/Cannot start a new loop/)
      expect(() => enforcer.enforceCanStartNewLoop('APPLY')).toThrow(/complete the current loop first/)
    })
    
    it('should include currentPhase in error message when called with PLAN', () => {
      try {
        enforcer.enforceCanStartNewLoop('PLAN')
        fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('PLAN')
        expect((error as Error).message).toContain('Current state: PLAN')
        expect((error as Error).message).toContain('Run /paul:apply')
      }
    })
    
    it('should not throw when called with undefined (can start new loop)', () => {
      // undefined is a valid state to start a new loop - no error should be thrown
      expect(() => enforcer.enforceCanStartNewLoop(undefined)).not.toThrow()
    })
    
    it('should include APPLY in error message when called with APPLY', () => {
      try {
        enforcer.enforceCanStartNewLoop('APPLY')
        fail('Should have thrown')
      } catch (error) {
        expect((error as Error).message).toContain('APPLY')
        expect((error as Error).message).toContain('Current state: APPLY')
        expect((error as Error).message).toContain('Run /paul:unify')
      }
    })
  })
})
