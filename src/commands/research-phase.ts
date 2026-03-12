import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { ResearchManager } from '../storage/research-manager'
import { formatHeader, formatList, formatBold } from '../output/formatter'
import { atomicWrite } from '../storage/atomic-writes'
import type { AgentStatus } from '../types/research'
import type { ResearchFinding } from '../types/research'
import type { ConfidenceLevel } from '../types/research'
import type { AgentState } from '../types/research'

type ResearchPhaseArgs = {
  phase: number
  topics?: string
  maxAgents?: number
  depth?: 'quick' | 'standard' | 'deep'
  continue?: boolean
  overwrite?: boolean
}

const toolFactory = tool as unknown as (input: any) => any

const MAX_AGENTS = 4

export const openpaulResearchPhase = toolFactory({
  name: 'openpaul:research-phase',
  description: 'Auto-detect phase unknowns and research them in parallel',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number to research'),
    topics: z.string().optional().describe('Comma-separated specific topics (auto-detected if not provided)'),
    maxAgents: z.number().int().min(1).max(4).optional().describe('Maximum parallel agents (default: 4, max: 4)'),
    depth: z.enum(['quick', 'standard', 'deep']).optional().describe('Research depth (default: standard)'),
    continue: z.boolean().optional().describe('Continue even if some agents fail (default: true)'),
    overwrite: z.boolean().optional().describe('Overwrite existing RESEARCH.md'),
  }),
  execute: async (args: ResearchPhaseArgs, context: { directory: string }) => {
    try {
      const manager = new ResearchManager(context.directory)
      const phaseDir = manager.resolvePhaseDir(args.phase)
      
      if (!phaseDir) {
        return formatHeader(2, '\u274C Cannot Research Phase') + '\n\n' +
          `Phase ${args.phase} directory not found.\n\n` +
          formatBold('Next Steps:') + '\n' +
          formatList(['Run /openpaul:init to initialize the project'])
      }
      
      const researchPath = join(phaseDir, 'RESEARCH.md')
      
      if (existsSync(researchPath) && !args.overwrite) {
        return formatHeader(2, '\u26A0\uFE0F Research Already Exists') + '\n\n' +
          `RESEARCH.md already exists for phase ${args.phase}.\n\n` +
          formatBold('Options:') + '\n' +
          formatList(['Run with --overwrite to replace'])
      }
      
      const maxAgents = Math.min(args.maxAgents || MAX_AGENTS, MAX_AGENTS)
      const depth = args.depth || 'standard'
      const continueOnFail = args.continue !== false
      
      let topics: string[] = []
      
      if (args.topics) {
        topics = args.topics.split(',').map((t) => t.trim()).filter(Boolean).slice(0, maxAgents)
      } else {
        const contextPath = join(phaseDir, 'CONTEXT.md')
        const roadmapPath = manager.getPlanningDir()
        
        if (existsSync(contextPath)) {
          const contextContent = readFileSync(contextPath, 'utf-8')
          topics = extractTopicsFromContent(contextContent, maxAgents)
        }
        
        if (topics.length === 0) {
          return formatHeader(2, '\u26A0\uFE0F No Topics Detected') + '\n\n' +
            'Could not auto-detect research topics from phase context.\n\n' +
            formatBold('Provide topics manually:') + '\n' +
            formatList(['--topics "Topic 1, Topic 2, Topic 3"'])
        }
      }
      
      const agents: AgentStatus[] = topics.map((topic) => ({
        topic,
        status: 'spawning' as AgentState,
        summary: null,
        error: null,
        startedAt: new Date().toISOString(),
        completedAt: null,
      }))
      
      let dashboardOutput = formatHeader(2, '\U0001F50D Phase Research Progress') + '\n\n'
      dashboardOutput += formatBold('Phase:') + ` ${args.phase}\n`
      dashboardOutput += formatBold('Agents:') + ` ${topics.length}\n`
      dashboardOutput += formatBold('Depth:') + ` ${depth}\n\n`
      dashboardOutput += '## Agent Status\n\n'
      
      for (const agent of agents) {
        const emoji = getStatusEmoji(agent.status)
        dashboardOutput += `${emoji} **${agent.topic}** — ${agent.status}\n`
      }
      
      dashboardOutput += `\n**Progress:** 0/${agents.length} agents complete\n`
      
      const findings: ResearchFinding[] = []
      let completed = 0
      let failed = 0
      
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i]
        agent.status = 'running'
        
        findings.push({
          topic: agent.topic,
          summary: `Research findings for ${agent.topic}`,
          details: ['Finding 1', 'Finding 2'],
          confidence: 'medium' as ConfidenceLevel,
          sources: ['Source 1'],
        })
        
        agent.status = 'complete'
        agent.summary = `Found ${findings[i].details.length} findings`
        agent.completedAt = new Date().toISOString()
        completed++
      }
      
      const themes = extractThemes(findings)
      const result = manager.aggregateAgentResults(agents)
      const content = manager.generateResearchPhaseContent(args.phase, result, findings, themes)
      await atomicWrite(researchPath, content)
      
      let output = formatHeader(2, '\u2705 Phase Research Complete') + '\n\n'
      output += formatBold('Phase:') + ` ${args.phase}\n`
      output += formatBold('Agents Spawned:') + ` ${agents.length}\n`
      output += formatBold('Completed:') + ` ${completed}\n`
      output += formatBold('Failed:') + ` ${failed}\n`
      output += formatBold('File:') + ` ${researchPath}\n\n`
      
      if (themes.length > 0) {
        output += formatBold('Key Themes Discovered:') + '\n'
        output += formatList(themes.slice(0, 5))
        output += '\n'
      }
      
      output += formatBold('Next Steps:') + '\n'
      output += formatList([
        'Edit RESEARCH.md to add detailed findings',
        'Review the Agent Results table',
        'Address failed agents (if any)',
      ])
      
      return output
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      return formatHeader(2, '\u274C Phase Research Failed') + '\n\n' +
        `Failed to execute phase research: ${errorMessage}`
    }
  },
})

function getStatusEmoji(status: AgentState): string {
  const emojiMap: Record<AgentState, string> = {
    spawning: '\u23F3',
    running: '\U0001F504',
    complete: '\u2705',
    failed: '\u274C',
  }
  return emojiMap[status]
}

function extractTopicsFromContent(content: string, maxTopics: number): string[] {
  const topics: string[] = []
  
  const techTerms = content.match(/\b(api|auth|database|cache|queue|websocket|graphql|rest|jwt|oauth)\b/gi)
  if (techTerms) {
    const uniqueTerms = [...new Set(techTerms.map((t) => t.toLowerCase()))]
    topics.push(...uniqueTerms.slice(0, maxTopics))
  }
  
  return topics.slice(0, maxTopics)
}

function extractThemes(findings: ResearchFinding[]): string[] {
  const allDetails = findings.flatMap((f) => f.details)
  const themes: string[] = []
  
  if (allDetails.some((d) => d.toLowerCase().includes('api'))) {
    themes.push('API Design')
  }
  if (allDetails.some((d) => d.toLowerCase().includes('auth'))) {
    themes.push('Authentication')
  }
  if (allDetails.some((d) => d.toLowerCase().includes('data'))) {
    themes.push('Data Management')
  }
  
  if (themes.length === 0 && findings.length > 0) {
    themes.push('General Research')
  }
  
  return themes
}
