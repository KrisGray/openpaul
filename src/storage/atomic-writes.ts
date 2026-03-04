import { writeFileSync, renameSync, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { z } from 'zod'

/**
 * Atomic File Write
 * 
 * Implements atomic writes using the temp file + rename pattern.
 * This ensures zero data loss by:
 * 1. Writing to a temporary file first
 * 2. Atomically renaming to target file (atomic on same filesystem)
 * 3. Cleaning up temp file on error
 * 
 * @param filePath - Target file path
 * @param content - Content to write (string or Buffer)
 * @throws Error if write or rename fails
 */
export async function atomicWrite(
  filePath: string,
  content: string | Buffer
): Promise<void> {
  // Ensure directory exists
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  
  // Generate temp file path
  const tempPath = join(tmpdir(), `paul-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`)
  
  try {
    // Write to temp file first
    if (typeof content === 'string') {
      writeFileSync(tempPath, content, 'utf-8')
    } else {
      writeFileSync(tempPath, content)
    }
    
    // Atomic rename (atomic on same filesystem)
    renameSync(tempPath, filePath)
  } catch (error) {
    // Clean up temp file on error
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath)
      } catch {
        // Ignore cleanup errors - original error is more important
      }
    }
    throw error
  }
}

/**
 * Atomic Write with Validation
 * 
 * Writes content to file with Zod validation before writing.
 * 
 * @param filePath - Target file path
 * @param content - Object to serialize and write
 * @param schema - Zod schema for validation
 */
export async function atomicWriteValidated<T>(
  filePath: string,
  content: T,
  schema: z.ZodSchema<T>
): Promise<void> {
  // Validate with Zod before writing
  const validated = schema.parse(content)
  
  // Serialize to JSON with pretty printing
  const jsonContent = JSON.stringify(validated, null, 2)
  
  // Use atomic write
  await atomicWrite(filePath, jsonContent)
}
