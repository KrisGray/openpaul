import { z } from 'zod'

export type ValidationStatus = 'unvalidated' | 'validated' | 'invalidated'

export const ValidationStatusSchema = z.enum(['unvalidated', 'validated', 'invalidated'])

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low'])

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low'

export const IssueSeveritySchema = z.enum(['critical', 'high', 'medium', 'low'])

export type DiscoveryDepth = 'quick' | 'standard' | 'deep'

export const DiscoveryDepthSchema = z.enum(['quick', 'standard', 'deep'])

export type ContextStatus = 'Ready for planning' | 'In progress' | 'Complete'

export const ContextStatusSchema = z.enum(['Ready for planning', 'In progress', 'Complete'])

export interface DecisionEntry {
  title: string
  description: string
}

export const DecisionEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
})

export interface ContextArtifact {
  phase: number
  gathered: string
  status: ContextStatus
  domain: string
  decisions: DecisionEntry[]
  specifics: string[]
  deferred: string[]
}

export const ContextArtifactSchema = z.object({
  phase: z.number().int().positive(),
  gathered: z.string().datetime(),
  status: ContextStatusSchema,
  domain: z.string(),
  decisions: z.array(DecisionEntrySchema),
  specifics: z.array(z.string()),
  deferred: z.array(z.string()),
})

export interface AssumptionEntry {
  statement: string
  validation_status: ValidationStatus
  confidence: ConfidenceLevel
  impact: string
}

export const AssumptionEntrySchema = z.object({
  statement: z.string().min(1),
  validation_status: ValidationStatusSchema,
  confidence: ConfidenceLevelSchema,
  impact: z.string().min(1),
})

export interface AssumptionsArtifact {
  phase: number
  assumptions: AssumptionEntry[]
  createdAt: string
  updatedAt: string
}

export const AssumptionsArtifactSchema = z.object({
  phase: z.number().int().positive(),
  assumptions: z.array(AssumptionEntrySchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export interface IssueEntry {
  severity: IssueSeverity
  description: string
  affectedAreas: string[]
  mitigation: string
}

export const IssueEntrySchema = z.object({
  severity: IssueSeveritySchema,
  description: z.string().min(1),
  affectedAreas: z.array(z.string()),
  mitigation: z.string().min(1),
})

export interface IssuesArtifact {
  phase: number
  issues: IssueEntry[]
  createdAt: string
}

export const IssuesArtifactSchema = z.object({
  phase: z.number().int().positive(),
  issues: z.array(IssueEntrySchema),
  createdAt: z.string().datetime(),
})

export interface DiscoveryArtifact {
  phase: number
  depth: DiscoveryDepth
  summary: string
  findings: string[]
  optionsConsidered: string[]
  recommendation: string
  references: string[]
  createdAt: string
}

export const DiscoveryArtifactSchema = z.object({
  phase: z.number().int().positive(),
  depth: DiscoveryDepthSchema,
  summary: z.string().min(1),
  findings: z.array(z.string()),
  optionsConsidered: z.array(z.string()),
  recommendation: z.string(),
  references: z.array(z.string()),
  createdAt: z.string().datetime(),
})

export interface ContextParams {
  domain?: string
  decisions?: DecisionEntry[]
  specifics?: string[]
  deferred?: string[]
}

export const ContextParamsSchema = z.object({
  domain: z.string().optional(),
  decisions: z.array(DecisionEntrySchema).optional(),
  specifics: z.array(z.string()).optional(),
  deferred: z.array(z.string()).optional(),
})

export interface DiscoveryParams {
  topic: string
  depth: DiscoveryDepth
  summary: string
  findings: string[]
  optionsConsidered: string[]
  recommendation: string
  references: string[]
}

export const DiscoveryParamsSchema = z.object({
  topic: z.string().min(1),
  depth: DiscoveryDepthSchema,
  summary: z.string().min(1),
  findings: z.array(z.string()),
  optionsConsidered: z.array(z.string()),
  recommendation: z.string(),
  references: z.array(z.string()),
})
