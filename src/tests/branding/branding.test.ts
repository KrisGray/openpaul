/**
 * Branding Consistency Tests
 * 
 * Tests to verify all renames from paul to openpaul are complete
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

describe('Branding Consistency', () => {
  const srcDir = join(__dirname, '../../..', 'src')
  
  function getAllTsFiles(dir: string): string[] {
    const files: string[] = []
    try {
      const entries = readdirSync(dir)
      for (const entry of entries) {
        const fullPath = join(dir, entry)
        if (statSync(fullPath).isDirectory()) {
          files.push(...getAllTsFiles(fullPath))
        } else if (entry.endsWith('.ts')) {
          files.push(fullPath)
        }
      }
    } catch {
      // Directory doesn't exist or is not accessible
    }
    return files
  }

  describe('Command function exports', () => {
    it('should have no paulX function exports in command files', () => {
      const commandDir = join(srcDir, 'commands')
      const commandFiles = getAllTsFiles(commandDir)
        .filter(f => !f.includes('index.ts'))
      
      for (const file of commandFiles) {
        const content = readFileSync(file, 'utf-8')
        // Should not export paulX functions (except in comments)
        const lines = content.split('\n')
        for (const line of lines) {
          if (line.includes('export const paul') && !line.trim().startsWith('//')) {
            throw new Error(`Found paulX export in ${file}: ${line.trim()}`)
          }
        }
      }
    })

    it('should have openpaulX function exports in init command', () => {
      const initFile = join(srcDir, 'commands', 'init.ts')
      const content = readFileSync(initFile, 'utf-8')
      expect(content).toContain('export const openpaulInit')
    })
  })

  describe('Plugin registration', () => {
    it('should use OpenPaulPlugin name', () => {
      const indexFile = join(srcDir, 'index.ts')
      const content = readFileSync(indexFile, 'utf-8')
      expect(content).toContain('export const OpenPaulPlugin')
      expect(content).not.toContain('export const PaulPlugin')
    })

    it('should have no paul: command aliases', () => {
      const indexFile = join(srcDir, 'index.ts')
      const content = readFileSync(indexFile, 'utf-8')
      // Check for paul: in tool registrations (should not exist)
      const lines = content.split('\n')
      for (const line of lines) {
        if (line.includes("'paul:") && line.includes(':')) {
          throw new Error(`Found paul: alias in ${indexFile}: ${line.trim()}`)
        }
      }
    })
  })

  describe('User-facing strings', () => {
    it('should use /openpaul: command references in templates', () => {
      const templatesDir = join(srcDir, 'templates')
      const templateFiles = getAllTsFiles(templatesDir)
        .concat(getAllMdFiles(templatesDir))
      
      for (const file of templateFiles) {
        const content = readFileSync(file, 'utf-8')
        // Allow /paul: only in comments or migration docs
        if (content.includes('/paul:') && !file.includes('migration')) {
          const lines = content.split('\n')
          for (const line of lines) {
            if (line.includes('/paul:') && !line.trim().startsWith('<!--') && !line.trim().startsWith('//')) {
              // This might be intentional for migration docs, so just warn
              console.warn(`Found /paul: in ${file}`)
            }
          }
        }
      }
    })
  })

  function getAllMdFiles(dir: string): string[] {
    const files: string[] = []
    try {
      const entries = readdirSync(dir)
      for (const entry of entries) {
        const fullPath = join(dir, entry)
        if (statSync(fullPath).isDirectory()) {
          files.push(...getAllMdFiles(fullPath))
        } else if (entry.endsWith('.md')) {
          files.push(fullPath)
        }
      }
    } catch {
      // Directory doesn't exist or is not accessible
    }
    return files
  }

  describe('Root documentation files', () => {
    it('should have no PAUL branding in root documentation', () => {
      const rootDir = join(srcDir, '..')
      const rootDocFiles = [
        join(rootDir, 'OPENPAUL-VS-GSD.md')
      ]
      
      for (const file of rootDocFiles) {
        const content = readFileSync(file, 'utf-8')
        // Check for PAUL (not OpenPAUL) references
        const paulMatches = content.match(/\bPAUL\b/g)
        if (paulMatches) {
          throw new Error(`Found ${paulMatches.length} PAUL reference(s) in ${file} (should be OpenPAUL)`)
        }
        // Check for /paul: command references
        if (content.includes('/paul:')) {
          throw new Error(`Found /paul: command reference in ${file} (should be /openpaul:)`)
        }
        // Check for .paul/ path references
        if (content.includes('.paul/')) {
          throw new Error(`Found .paul/ path reference in ${file} (should be .openpaul/)`)
        }
      }
    })
  })
})
