import { z } from 'zod';
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
export declare function atomicWrite(filePath: string, content: string | Buffer): Promise<void>;
/**
 * Atomic Write with Validation
 *
 * Writes content to file with Zod validation before writing.
 *
 * @param filePath - Target file path
 * @param content - Object to serialize and write
 * @param schema - Zod schema for validation
 */
export declare function atomicWriteValidated<T>(filePath: string, content: T, schema: z.ZodSchema<T>): Promise<void>;
//# sourceMappingURL=atomic-writes.d.ts.map