/**
 * DirectoryScanner Tests
 * 
 * Tests for directory-scanner utility
 */

import { join } from 'path'
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs'
import { scanDirectory, treeToMarkdown, countFiles, isCacheValid, loadCache, saveCache } from '../../utils/directory-scanner'

describe('DirectoryScanner', () => {
  const tempDir = join(__dirname, 'temp-scanner-test')

  beforeEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    mkdirSync(tempDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('scanDirectory', () => {
    it('should scan empty directory', () => {
      const result = scanDirectory(tempDir, { maxDepth: 3 })
      
      expect(result).not.toBeNull()
      expect(result?.name).toBe('temp-scanner-test')
      expect(result?.type).toBe('directory')
    })

    it('should scan directory with files', () => {
      writeFileSync(join(tempDir, 'file1.ts'), 'content')
      writeFileSync(join(tempDir, 'file2.ts'), 'content')

      const result = scanDirectory(tempDir, { maxDepth: 1 })
      
      expect(result?.children).toBeDefined()
      expect(result?.children?.length).toBe(2)
    })

    it('should respect maxDepth', () => {
      mkdirSync(join(tempDir, 'level1'))
      mkdirSync(join(tempDir, 'level1', 'level2'))
      writeFileSync(join(tempDir, 'level1', 'level2', 'file.ts'), 'content')

      const result = scanDirectory(tempDir, { maxDepth: 1 })
      
      expect(result?.children?.some(c => c.name === 'level1')).toBe(true)
    })

    it('should exclude directories', () => {
      mkdirSync(join(tempDir, 'node_modules'))
      writeFileSync(join(tempDir, 'node_modules', 'file.js'), 'content')
      writeFileSync(join(tempDir, 'src.ts'), 'content')

      const result = scanDirectory(tempDir, { maxDepth: 2, excludeDirs: ['node_modules'] })
      
      expect(result?.children?.some(c => c.name === 'node_modules')).toBe(false)
      expect(result?.children?.some(c => c.name === 'src.ts')).toBe(true)
    })
  })

  describe('treeToMarkdown', () => {
    it('should convert tree to markdown', () => {
      const tree = {
        name: 'root',
        type: 'directory' as const,
        path: '/root',
        children: [
          { name: 'file.ts', type: 'file' as const, path: '/root/file.ts' },
        ]
      }

      const result = treeToMarkdown(tree)
      
      expect(result).toContain('root/')
      expect(result).toContain('file.ts')
    })
  })

  describe('countFiles', () => {
    it('should count files and directories', () => {
      const tree = {
        name: 'root',
        type: 'directory' as const,
        path: '/root',
        children: [
          { name: 'file1.ts', type: 'file' as const, path: '/root/file1.ts' },
          { name: 'file2.ts', type: 'file' as const, path: '/root/file2.ts' },
          { name: 'subdir', type: 'directory' as const, path: '/root/subdir', children: [] },
        ]
      }

      const result = countFiles(tree)
      
      expect(result.files).toBe(2)
      expect(result.directories).toBe(2) // root + subdir
    })
  })

  describe('cache', () => {
    it('should save and load cache', () => {
      const entries = [
        { path: '/test/file.ts', mtime: Date.now(), size: 100 }
      ]

      saveCache(tempDir, entries)
      const cache = loadCache(tempDir)

      expect(cache).not.toBeNull()
      expect(cache?.entries).toHaveLength(1)
      expect(cache?.entries[0].path).toBe('/test/file.ts')
    })

    it('should check cache validity', () => {
      const entries = [
        { path: '/test/file.ts', mtime: Date.now(), size: 100 }
      ]

      saveCache(tempDir, entries)
      const valid = isCacheValid(tempDir)

      expect(valid).toBe(true)
    })
  })
})
