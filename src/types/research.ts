import { z } from 'zod'

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low'])

export type AgentState = 'spawning' | 'running' | 'complete' | 'failed'

export const AgentStateSchema = z.enum(['spawning', 'running', 'complete', 'failed'])

export interface AgentStatus {
  topic: string
  status: AgentState
  summary: string | null
  error: string | null
  startedAt: string
  completedAt: string | null
}

export const AgentStatusSchema = z.object({
  topic: z.string().min(1),
  status: AgentStateSchema,
  summary: z.string().nullable(),
  error: z.string().nullable(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
})

export interface ResearchFinding {
  topic: string
  summary: string
  details: string[]
  confidence: ConfidenceLevel
  sources: string[]
}

export const ResearchFindingSchema = z.object({
  topic: z.string().min(1),
  summary: z.string().min(1),
  details: z.array(z.string()),
  confidence: ConfidenceLevelSchema,
  sources: z.array(z.string()),
})

export interface ResearchResult {
  phase: number
  query: string
  findings: ResearchFinding[]
  confidence: ConfidenceLevel
  verified: boolean
  createdAt: string
}

export const ResearchResultSchema = z.object({
  phase: z.number().int().positive(),
  query: z.string().min(1),
  findings: z.array(ResearchFindingSchema),
  confidence: ConfidenceLevelSchema,
  verified: z.boolean(),
  createdAt: z.string().datetime(),
})

export interface ResearchPhaseResult {
  phase: number
  agentsSpawned: number
  agentsCompleted: number
  agentsFailed: number
  findings: ResearchFinding[]
  themes: string[]
  createdAt: string
}

export const ResearchPhaseResultSchema = z.object({
  phase: z.number().int().positive(),
  agentsSpawned: z.number().int().nonnegative(),
  agentsCompleted: z.number().int().nonnegative(),
  agentsFailed: z.number().int().nonnegative(),
  findings: z.array(ResearchFindingSchema),
  themes: z.array(z.string()),
  createdAt: z.string().datetime(),
})

export interface AgentDashboard {
  agents: AgentStatus[]
  completed: number
  total: number
  startTime: string
}

export const AgentDashboardSchema = z.object({
  agents: z.array(AgentStatusSchema),
  completed: z.number().int().nonnegative(),
  total: z.number().int().positive(),
  startTime: z.string().datetime(),
})
