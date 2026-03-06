/**
 * Diff Formatter Tests
 * 
 * Tests for diff formatting utilities
 */

import {
  formatFileDiff,
  formatDiff,
  formatStalenessWarning,
  type FileChange,
} from '../../output/diff-formatter'

describe('Diff Formatter', () => {
  describe('formatFileDiff', () => {
    it('should show added lines with + prefix', () => {
      const oldContent = 'line1\nline2'
      const newContent = 'line1\nline2\nline3'
      const result = formatFileDiff(oldContent, newContent)

      expect(result).toContain('  line1')
      expect(result).toContain('+ line3')
    })

    it('should show removed lines with - prefix', () => {
      const oldContent = 'line1\nline2\nline3'
      const newContent = 'line1\nline2'
      const result = formatFileDiff(oldContent, newContent)

      expect(result).toContain('  line1')
      expect(result).toContain('- line3')
    })

    it('should show unchanged lines with space prefix', () => {
      const oldContent = 'line1\nline2\nline3'
      const newContent = 'line1\nline2\nline3'
      const result = formatFileDiff(oldContent, newContent)

      expect(result).toContain('  line1')
      expect(result).toContain('  line2')
      expect(result).toContain('  line3')
      expect(result).not.toContain('+')
      expect(result).not.toContain('-')
    })

    it('should handle empty oldContent (new file)', () => {
      const oldContent = ''
      const newContent = 'line1\nline2'
      const result = formatFileDiff(oldContent, newContent)

      expect(result).toContain('+ line1')
      expect(result).toContain('+ line2')
    })

    it('should handle empty newContent (deleted file)', () => {
      const oldContent = 'line1\nline2'
      const newContent = ''
      const result = formatFileDiff(oldContent, newContent)

      expect(result).toContain('- line1')
      expect(result).toContain('- line2')
    })

    it('should handle no changes (identical content)', () => {
      const content = 'line1\nline2\nline3'
      const result = formatFileDiff(content, content)

      expect(result).toContain('  line1')
      expect(result).toContain('  line2')
      expect(result).toContain('  line3')
      expect(result).not.toContain('+')
      expect(result).not.toContain('-')
    })
  })

  describe('formatDiff', () => {
    it('should show summary of changes (modified, added, deleted counts)', () => {
      const changes: FileChange[] = [
        { type: 'modified', filePath: 'file1.ts' },
        { type: 'added', filePath: 'file2.ts' },
        { type: 'deleted', filePath: 'file3.ts' },
      ]
      const result = formatDiff(changes)

      expect(result).toContain('3 file(s) changed')
      expect(result).toContain('1 modified')
      expect(result).toContain('1 added')
      expect(result).toContain('1 deleted')
    })

    it('should include file paths with type indicators (M/A/D)', () => {
      const changes: FileChange[] = [
        { type: 'modified', filePath: 'src/file1.ts' },
        { type: 'added', filePath: 'src/file2.ts' },
        { type: 'deleted', filePath: 'src/file3.ts' },
      ]
      const result = formatDiff(changes)

      expect(result).toContain('M src/file1.ts')
      expect(result).toContain('A src/file2.ts')
      expect(result).toContain('D src/file3.ts')
    })

    it('should show full diff for small changes (< 50 lines)', () => {
      const changes: FileChange[] = [
        {
          type: 'modified',
          filePath: 'src/test.ts',
          diff: '+ line1\n+ line2',
        },
      ]
      const result = formatDiff(changes)

      expect(result).toContain('```')
      expect(result).toContain('+ line1')
      expect(result).toContain('+ line2')
    })

    it('should show summary for large changes (> 50 lines)', () => {
      const largeDiff = Array(60).fill('+ line').join('\n')
      const changes: FileChange[] = [
        {
          type: 'modified',
          filePath: 'src/large.ts',
          diff: largeDiff,
        },
      ]
      const result = formatDiff(changes)

      expect(result).toContain('(large file, run verbose for full diff)')
      expect(result).not.toContain('```')
    })

    it('should handle empty changes array', () => {
      const result = formatDiff([])

      expect(result).toBe('No changes since pause')
    })
  })

  describe('formatStalenessWarning', () => {
    it('should return warning for > 24 hours', () => {
      const result = formatStalenessWarning(25)

      expect(result).toContain('⚠️')
      expect(result).toContain('Session paused 25 hours ago')
    })

    it('should return empty string for fresh sessions', () => {
      const result = formatStalenessWarning(10)

      expect(result).toBe('')
    })

    it('should return warning at exactly 24 hours', () => {
      const result = formatStalenessWarning(24)

      expect(result).toBe('')
    })

    it('should round hours to nearest integer', () => {
      const result = formatStalenessWarning(25.7)

      expect(result).toContain('26 hours ago')
    })
  })
})
