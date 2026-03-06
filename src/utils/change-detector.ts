import { exec } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { createHash } from 'crypto'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface GitFileStatus {
  path: string
  status: 'modified' | 'added' | 'deleted' | 'untracked'
}

export interface GitChangeStatus {
  hasChanges: boolean
  files: GitFileStatus[]
}

export interface FileModification {
  path: string
  oldChecksum: string
  newChecksum: string
}

export interface ModifiedFileStatus {
  hasModifications: boolean
  files: FileModification[]
}

export async function detectUncommittedChanges(directory: string): Promise<GitChangeStatus> {
  try {
    const { stdout } = await execAsync('git status --porcelain', { cwd: directory })
    
    if (!stdout.trim()) {
      return { hasChanges: false, files: [] }
    }

    const files: GitFileStatus[] = stdout
      .trim()
      .split('\n')
      .map(line => {
        const statusCode = line.substring(0, 2)
        const filePath = line.substring(3)
        
        let status: GitFileStatus['status']
        if (statusCode === '??') {
          status = 'untracked'
        } else if (statusCode.includes('D')) {
          status = 'deleted'
        } else if (statusCode.includes('A')) {
          status = 'added'
        } else {
          status = 'modified'
        }

        return { path: filePath, status }
      })

    return { hasChanges: true, files }
  } catch {
    return { hasChanges: false, files: [] }
  }
}

export async function detectModifiedFiles(
  directory: string,
  fileChecksums: Record<string, string>
): Promise<ModifiedFileStatus> {
  const files: FileModification[] = []

  for (const [filePath, oldChecksum] of Object.entries(fileChecksums)) {
    if (existsSync(filePath)) {
      const newChecksum = computeFileChecksum(filePath)
      
      if (oldChecksum !== newChecksum) {
        files.push({
          path: filePath,
          oldChecksum,
          newChecksum,
        })
      }
    }
  }

  return {
    hasModifications: files.length > 0,
    files,
  }
}

function computeFileChecksum(filePath: string): string {
  const content = readFileSync(filePath)
  return createHash('sha256').update(content).digest('hex')
}
