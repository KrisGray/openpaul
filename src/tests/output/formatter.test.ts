import { 
  formatHeader,
  formatBold,
  formatItalic,
  formatCode,
  formatCodeBlock,
  formatList,
  formatKeyValue,
  formatStatus,
  type Status,
  type HeaderLevel
} from '../../output/formatter'
import { progressBar } from '../../output/progress-bar'
import { formatGuidedError } from '../../output/error-formatter'

describe('Output Formatting Utilities', () => {
  describe('progressBar', () => {
    it('should create a progress bar with 3 of 10 filled', () => {
      const result = progressBar(3, 10)
      expect(result).toBe('[███░░░░░░░] 3/10')
    })

    it('should create an empty progress bar', () => {
      const result = progressBar(0, 10)
      expect(result).toBe('[░░░░░░░░░░] 0/10')
    })

    it('should create a full progress bar', () => {
      const result = progressBar(10, 10)
      expect(result).toBe('[██████████] 10/10')
    })

    it('should handle custom width', () => {
      const result = progressBar(5, 10, 20)
      expect(result).toBe('[██████████░░░░░░░░░░] 5/10')
    })

    it('should clamp values to valid range', () => {
      expect(progressBar(-5, 10)).toBe('[░░░░░░░░░░] 0/10')
      expect(progressBar(15, 10)).toBe('[██████████] 10/10')
    })

    it('should handle zero total', () => {
      const result = progressBar(0, 0)
      expect(result).toBe('[░░░░░░░░░░] 0/0')
    })
  })

  describe('formatHeader', () => {
    it('should format level 1 header', () => {
      expect(formatHeader(1, 'Main Title')).toBe('# Main Title')
    })

    it('should format level 2 header', () => {
      expect(formatHeader(2, 'Section')).toBe('## Section')
    })

    it('should format level 3 header', () => {
      expect(formatHeader(3, 'Subsection')).toBe('### Subsection')
    })
  })

  describe('formatBold', () => {
    it('should wrap text in bold markers', () => {
      expect(formatBold('important')).toBe('**important**')
    })
  })

  describe('formatItalic', () => {
    it('should wrap text in italic markers', () => {
      expect(formatItalic('emphasis')).toBe('*emphasis*')
    })
  })

  describe('formatCode', () => {
    it('should wrap text in backticks', () => {
      expect(formatCode('variable')).toBe('`variable`')
    })
  })

  describe('formatCodeBlock', () => {
    it('should create code block without language', () => {
      const result = formatCodeBlock('const x = 1')
      expect(result).toBe('```\nconst x = 1\n```')
    })

    it('should create code block with language', () => {
      const result = formatCodeBlock('const x = 1', 'typescript')
      expect(result).toBe('```typescript\nconst x = 1\n```')
    })
  })

  describe('formatList', () => {
    it('should create unordered list', () => {
      const result = formatList(['item 1', 'item 2'])
      expect(result).toBe('- item 1\n- item 2')
    })

    it('should create ordered list', () => {
      const result = formatList(['first', 'second'], true)
      expect(result).toBe('1. first\n2. second')
    })
  })

  describe('formatKeyValue', () => {
    it('should format key-value pairs', () => {
      const result = formatKeyValue({ Name: 'John', Age: '30' })
      expect(result).toBe('**Name:** John\n**Age:** 30')
    })
  })

  describe('formatStatus', () => {
    it('should return success emoji', () => {
      expect(formatStatus('success')).toBe('✅')
    })

    it('should return in-progress emoji', () => {
      expect(formatStatus('in-progress')).toBe('⏳')
    })

    it('should return paused emoji', () => {
      expect(formatStatus('paused')).toBe('⏸️')
    })

    it('should return failed emoji', () => {
      expect(formatStatus('failed')).toBe('❌')
    })
  })

  describe('formatGuidedError', () => {
    it('should format error with all fields', () => {
      const result = formatGuidedError({
        title: 'Test Error',
        message: 'Something went wrong',
        context: 'Additional context',
        suggestedFix: 'Try this solution',
        nextSteps: ['Step 1', 'Step 2'],
      })

      expect(result).toContain('## ❌ Test Error')
      expect(result).toContain('Something went wrong')
      expect(result).toContain('### Context')
      expect(result).toContain('Additional context')
      expect(result).toContain('### Suggested Fix')
      expect(result).toContain('Try this solution')
      expect(result).toContain('### Next Steps')
      expect(result).toContain('1. Step 1')
      expect(result).toContain('2. Step 2')
      expect(result).toContain('/paul:help')
      expect(result).toContain('/paul:progress')
    })

    it('should format error without context', () => {
      const result = formatGuidedError({
        title: 'Simple Error',
        message: 'Error occurred',
        suggestedFix: 'Fix it',
        nextSteps: ['Do this'],
      })

      expect(result).toContain('## ❌ Simple Error')
      expect(result).not.toContain('### Context')
    })
  })
})
