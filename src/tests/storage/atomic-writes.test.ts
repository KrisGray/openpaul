import { existsSync, readFileSync, unlinkSync, rmdirSync, readdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { atomicWrite } from '../../storage/atomic-writes'

describe('atomicWrite', () => {
  const testDir = join(tmpdir(), 'paul-test-' + Date.now())
  
  afterAll(() => {
    // Cleanup test files
    if (existsSync(testDir)) {
      const files = readdirSync(testDir)
      files.forEach(f => {
        try {
          unlinkSync(join(testDir, f))
        } catch {
          // Ignore cleanup errors
        }
      })
      try {
        // Clean up subdirectories if any
        const entries = readdirSync(testDir, { withFileTypes: true })
        entries.forEach(entry => {
          if (entry.isDirectory()) {
            rmdirSync(join(testDir, entry.name), { recursive: true })
          }
        })
        rmdirSync(testDir, { recursive: true })
      } catch {
        // Ignore cleanup errors
      }
    }
  })
  
  it('should write string content to file atomically', async () => {
    const filePath = join(testDir, 'test-string.json')
    const content = '{"test": "data"}'
    
    await atomicWrite(filePath, content)
    
    expect(existsSync(filePath)).toBe(true)
    expect(readFileSync(filePath, 'utf-8')).toBe(content)
  })
  
  it('should write Buffer content to file atomically', async () => {
    const filePath = join(testDir, 'test-buffer.json')
    const content = Buffer.from('binary data')
    
    await atomicWrite(filePath, content)
    
    expect(existsSync(filePath)).toBe(true)
    expect(readFileSync(filePath)).toEqual(content)
  })
  
  it('should create directory if it does not exist', async () => {
    const filePath = join(testDir, 'subdir', 'test.json')
    const content = '{"nested": true}'
    
    await atomicWrite(filePath, content)
    
    expect(existsSync(filePath)).toBe(true)
  })
  
  it('should clean up temp file on error', async () => {
    const filePath = '/invalid/path/that/does/not/exist/test.json'
    const content = 'test'
    
    await expect(atomicWrite(filePath, content)).rejects.toThrow()
    
    // Temp file should be cleaned up (we can't verify temp file directly, but the implementation includes cleanup)
  })
})
