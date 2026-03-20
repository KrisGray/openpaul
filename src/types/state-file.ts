import { z } from 'zod'

/**
 * State File Schema
 *
 * Zod schema for validating state.json files.
 * This schema defines the structure for OpenPAUL project state.
 */
export const StateFileSchema = z.object({
  /** Schema version for future migrations */
  version: z.literal('1.0'),
  /** CLI version that created the file */
  cliVersion: z.string(),
  /** Project name */
  name: z.string().min(1),
  /** ISO datetime when project was created */
  createdAt: z.string().datetime(),
  /** ISO datetime when project was last updated */
  updatedAt: z.string().datetime(),
})

/**
 * State File Type
 *
 * Inferred type from StateFileSchema.
 * Represents the structure of a state.json file.
 */
export type StateFile = z.infer<typeof StateFileSchema>
