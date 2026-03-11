import { z } from 'zod'

/**
 * UAT Result - Outcome of a UAT test item
 */
export type UATResult = 'pass' | 'fail' | 'skip'

export const UATResultSchema = z.enum(['pass', 'fail', 'skip'])

/**
 * UAT Severity - Severity level for issues
 */
export type UATSeverity = 'critical' | 'major' | 'minor'

export const UATSeveritySchema = z.enum(['critical', 'major', 'minor'])

/**
 * UAT Category - Category of UAT test
 */
export type UATCategory = 'functional' | 'visual' | 'performance' | 'configuration'

export const UATCategorySchema = z.enum(['functional', 'visual', 'performance', 'configuration'])

/**
 * UAT Item - Individual test item from must_haves truths
 */
export interface UATItem {
  id: number
  description: string // the truth from must_haves
  result: UATResult
  notes?: string
  testedAt?: number // timestamp
}

export const UATItemSchema = z.object({
  id: z.number().int().positive(),
  description: z.string().min(1),
  result: UATResultSchema,
  notes: z.string().optional(),
  testedAt: z.number().int().nonnegative().optional(),
})

/**
 * UAT Issue - Failed item with details
 */
export interface UATIssue {
  id: number
  itemDescription: string
  status: 'open' | 'fixed' | 'wontfix'
  severity: UATSeverity
  category: UATCategory
  description: string // user-provided issue description
  suggestedFix?: string
  sourcePlanId: string // the plan that created the failing artifact
  fixPlanId?: string // assigned by plan-fix
  createdAt: number
}

export const UATIssueSchema = z.object({
  id: z.number().int().positive(),
  itemDescription: z.string().min(1),
  status: z.enum(['open', 'fixed', 'wontfix']),
  severity: UATSeveritySchema,
  category: UATCategorySchema,
  description: z.string().min(1),
  suggestedFix: z.string().optional(),
  sourcePlanId: z.string().min(1),
  fixPlanId: z.string().optional(),
  createdAt: z.number().int().nonnegative(),
})

/**
 * UAT Summary - Summary counts
 */
export interface UATSummary {
  passed: number
  failed: number
  skipped: number
  total: number
}

export const UATSummarySchema = z.object({
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})

/**
 * UAT - UAT results file content
 */
export interface UAT {
  phaseNumber: number
  planId: string
  testedAt: number
  status: 'complete' | 'partial' | 'in-progress'
  items: UATItem[]
  summary: UATSummary
}

export const UATSchema = z.object({
  phaseNumber: z.number().int().positive(),
  planId: z.string().min(1),
  testedAt: z.number().int().nonnegative(),
  status: z.enum(['complete', 'partial', 'in-progress']),
  items: z.array(UATItemSchema),
  summary: UATSummarySchema,
})

/**
 * UAT Issues - UAT issues file content
 */
export interface UATIssues {
  phaseNumber: number
  sourcePlanId: string
  createdAt: number
  issues: UATIssue[]
}

export const UATIssuesSchema = z.object({
  phaseNumber: z.number().int().positive(),
  sourcePlanId: z.string().min(1),
  createdAt: z.number().int().nonnegative(),
  issues: z.array(UATIssueSchema),
})
