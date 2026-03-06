import { detectUncommittedChanges, detectModifiedFiles } from '../change-detector'
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

jest.mock('child_process', () => ({
  exec: jest.fn(),
}))

const mockExec = require('child_process').exec as jest.Mock

describe('change-detector', () => {
  describe('detectUncommittedChanges', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('returns no changes in clean git repo', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(null, { stdout: '', stderr: '' })
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(false)
      expect(result.files).toHaveLength(0)
    })

    it('detects modified files', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(null, { stdout: 'M  src/file.ts\n', stderr: '' })
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(true)
      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        path: 'src/file.ts',
        status: 'modified',
      })
    })

    it('detects added files', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(null, { stdout: 'A  src/new-file.ts\n', stderr: '' })
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(true)
      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        path: 'src/new-file.ts',
        status: 'added',
      })
    })

    it('detects deleted files', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(null, { stdout: 'D  src/deleted.ts\n', stderr: '' })
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(true)
      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        path: 'src/deleted.ts',
        status: 'deleted',
      })
    })

    it('detects untracked files', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(null, { stdout: '?? src/untracked.ts\n', stderr: '' })
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(true)
      expect(result.files).toHaveLength(1)
      expect(result.files[0]).toEqual({
        path: 'src/untracked.ts',
        status: 'untracked',
      })
    })

    it('handles non-git directory gracefully', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(new Error('Not a git repository'), null)
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(false)
      expect(result.files).toHaveLength(0)
    })

    it('handles git not installed gracefully', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(new Error('git: command not found'), null)
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(false)
      expect(result.files).toHaveLength(0)
    })

    it('handles multiple files at once', async () => {
      mockExec.mockImplementation((cmd: any, opts: any, callback: any) => {
        callback(null, {
          stdout: 'M  src/file1.ts\nA  src/file2.ts\n D src/file3.ts\n?? src/file4.ts\n',
          stderr: '',
        })
      })

      const result = await detectUncommittedChanges('/test/dir')

      expect(result.hasChanges).toBe(true)
      expect(result.files).toHaveLength(4)
      expect(result.files).toContainEqual({ path: 'src/file1.ts', status: 'modified' })
      expect(result.files).toContainEqual({ path: 'src/file2.ts', status: 'added' })
      expect(result.files).toContainEqual({ path: 'src/file3.ts', status: 'deleted' })
      expect(result.files).toContainEqual({ path: 'src/file4.ts', status: 'untracked' })
    })
  })

  describe('detectModifiedFiles', () => {
    let tempDir: string

    beforeEach(() => {
      tempDir = join(tmpdir(), `change-detector-test-${Date.now()}`)
      mkdirSync(tempDir, { recursive: true })
    })

    afterEach(() => {
      if (existsSync(tempDir)) {
        rmSync(tempDir, { recursive: true, force: true })
      }
    })

    it('returns no modifications when checksums match', async () => {
      const filePath = join(tempDir, 'test.txt')
      writeFileSync(filePath, 'test content')
      
      const crypto = require('crypto')
      const content = require('fs').readFileSync(filePath)
      const correctChecksum = crypto.createHash('sha256').update(content).digest('hex')
      
      const checksums: Record<string, string> = {
        [filePath]: correctChecksum,
      }

      const result = await detectModifiedFiles(tempDir, checksums)

      expect(result.hasModifications).toBe(false)
      expect(result.files).toHaveLength(0)
    })

    it('detects modified files with changed checksums', async () => {
      const filePath = join(tempDir, 'test.txt')
      writeFileSync(filePath, 'new content')
      
      const checksums: Record<string, string> = {
        [filePath]: 'old-checksum-value',
      }

      const result = await detectModifiedFiles(tempDir, checksums)

      expect(result.hasModifications).toBe(true)
      expect(result.files).toHaveLength(1)
      expect(result.files[0].path).toBe(filePath)
      expect(result.files[0].oldChecksum).toBe('old-checksum-value')
      expect(result.files[0].newChecksum).not.toBe('old-checksum-value')
    })

    it('handles missing files gracefully', async () => {
      const checksums: Record<string, string> = {
        '/nonexistent/file.txt': 'some-checksum',
      }

      const result = await detectModifiedFiles(tempDir, checksums)

      expect(result.hasModifications).toBe(false)
      expect(result.files).toHaveLength(0)
    })

    it('works with empty checksums object', async () => {
      const result = await detectModifiedFiles(tempDir, {})

      expect(result.hasModifications).toBe(false)
      expect(result.files).toHaveLength(0)
    })

    it('computes correct SHA256 checksums', async () => {
      const filePath = join(tempDir, 'checksum.txt')
      writeFileSync(filePath, 'test data')
      
      const checksums: Record<string, string> = {
        [filePath]: '916f0023c7e0b8f4c6e6f8a1d3b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
      }

      const result = await detectModifiedFiles(tempDir, checksums)

      expect(result.hasModifications).toBe(true)
      expect(result.files[0].oldChecksum).toBe(checksums[filePath])
      expect(result.files[0].newChecksum).toMatch(/^[a-f0-9]{64}$/)
    })

    it('handles multiple files with mixed states', async () => {
      const file1 = join(tempDir, 'unchanged.txt')
      const file2 = join(tempDir, 'changed.txt')
      const file3 = join(tempDir, 'another-changed.txt')
      
      writeFileSync(file1, 'same content')
      writeFileSync(file2, 'new content 2')
      writeFileSync(file3, 'new content 3')
      
      const crypto = require('crypto')
      const content1 = require('fs').readFileSync(file1)
      const correctChecksum1 = crypto.createHash('sha256').update(content1).digest('hex')
      
      const checksums: Record<string, string> = {
        [file1]: correctChecksum1,
        [file2]: 'old-checksum-2',
        [file3]: 'old-checksum-3',
      }

      const result = await detectModifiedFiles(tempDir, checksums)

      expect(result.hasModifications).toBe(true)
      expect(result.files).toHaveLength(2)
      expect(result.files.map(f => f.path)).toContain(file2)
      expect(result.files.map(f => f.path)).toContain(file3)
      expect(result.files.map(f => f.path)).not.toContain(file1)
    })
  })
})
