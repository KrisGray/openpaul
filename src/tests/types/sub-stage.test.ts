import { getParentPhase, SUB_STAGES_BY_PHASE } from '../../types/sub-stage'
import type { LoopPhase } from '../../types/loop'

describe('sub-stage', () => {
  describe('getParentPhase', () => {
    describe('PLAN sub-stages', () => {
      it('should return PLAN for plan-research', () => {
        expect(getParentPhase('plan-research')).toBe('PLAN')
      })

      it('should return PLAN for plan-blueprint', () => {
        expect(getParentPhase('plan-blueprint')).toBe('PLAN')
      })

      it('should return PLAN for plan-critique', () => {
        expect(getParentPhase('plan-critique')).toBe('PLAN')
      })
    })

    describe('APPLY sub-stages', () => {
      it('should return APPLY for apply-slicing', () => {
        expect(getParentPhase('apply-slicing')).toBe('APPLY')
      })

      it('should return APPLY for apply-codegen', () => {
        expect(getParentPhase('apply-codegen')).toBe('APPLY')
      })

      it('should return APPLY for apply-debug', () => {
        expect(getParentPhase('apply-debug')).toBe('APPLY')
      })
    })

    describe('UNIFY sub-stages', () => {
      it('should return UNIFY for unify-diff-analysis', () => {
        expect(getParentPhase('unify-diff-analysis')).toBe('UNIFY')
      })

      it('should return UNIFY for unify-verification', () => {
        expect(getParentPhase('unify-verification')).toBe('UNIFY')
      })

      it('should return UNIFY for unify-documentation', () => {
        expect(getParentPhase('unify-documentation')).toBe('UNIFY')
      })
    })
  })

  describe('SUB_STAGES_BY_PHASE', () => {
    it('should contain all PLAN sub-stages', () => {
      expect(SUB_STAGES_BY_PHASE.PLAN).toContain('plan-research')
      expect(SUB_STAGES_BY_PHASE.PLAN).toContain('plan-blueprint')
      expect(SUB_STAGES_BY_PHASE.PLAN).toContain('plan-critique')
      expect(SUB_STAGES_BY_PHASE.PLAN).toHaveLength(3)
    })

    it('should contain all APPLY sub-stages', () => {
      expect(SUB_STAGES_BY_PHASE.APPLY).toContain('apply-slicing')
      expect(SUB_STAGES_BY_PHASE.APPLY).toContain('apply-codegen')
      expect(SUB_STAGES_BY_PHASE.APPLY).toContain('apply-debug')
      expect(SUB_STAGES_BY_PHASE.APPLY).toHaveLength(3)
    })

    it('should contain all UNIFY sub-stages', () => {
      expect(SUB_STAGES_BY_PHASE.UNIFY).toContain('unify-diff-analysis')
      expect(SUB_STAGES_BY_PHASE.UNIFY).toContain('unify-verification')
      expect(SUB_STAGES_BY_PHASE.UNIFY).toContain('unify-documentation')
      expect(SUB_STAGES_BY_PHASE.UNIFY).toHaveLength(3)
    })
  })
})
