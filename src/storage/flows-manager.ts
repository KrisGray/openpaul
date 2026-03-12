import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { parse, stringify } from 'yaml'

export interface FlowState {
  enabled: string[]
  disabled: string[]
}

const FLOW_CATALOG: Record<string, string> = {
  'security-review': 'Require an explicit security review for sensitive changes.',
  'docs-refresh': 'Trigger documentation updates for user-facing changes.',
  'release-audit': 'Run a release readiness audit before tagging releases.',
  'data-migration': 'Require migration checks for schema or data changes.',
}

const VALID_FLOW_IDS = Object.keys(FLOW_CATALOG)
const VALID_FLOW_MESSAGE = `Valid flow IDs: ${VALID_FLOW_IDS.join(', ')}.`

export class FlowsManager {
  private flowsPath: string
  private state: FlowState | null = null
  private markdownBody: string | null = null

  constructor(private projectRoot: string) {
    this.flowsPath = this.resolveFlowsPath()
  }

  private resolveFlowsPath(): string {
    const openpaulFlows = join(this.projectRoot, '.openpaul', 'SPECIAL-FLOWS.md')
    const paulFlows = join(this.projectRoot, '.paul', 'SPECIAL-FLOWS.md')

    if (existsSync(openpaulFlows)) {
      return openpaulFlows
    }

    if (existsSync(paulFlows)) {
      const targetPath = openpaulFlows
      const targetDir = dirname(targetPath)
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }
      copyFileSync(paulFlows, targetPath)
      return targetPath
    }

    return openpaulFlows
  }

  load(): FlowState {
    if (this.state) {
      return this.state
    }

    if (!existsSync(this.flowsPath)) {
      this.state = { enabled: [], disabled: [] }
      this.markdownBody = ''
      return this.state
    }

    const content = readFileSync(this.flowsPath, 'utf-8')
    const { frontmatter, body } = this.splitFrontmatter(content)
    const parsed = this.parseFrontmatter(frontmatter)
    const validated = this.validateFlowState(parsed)
    this.state = validated
    this.markdownBody = body
    return this.state
  }

  save(state?: FlowState): void {
    const toSave = state || this.state || { enabled: [], disabled: [] }
    const dir = dirname(this.flowsPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const yamlContent = stringify(toSave, { indent: 2 })
    const body = this.markdownBody ?? this.readExistingBody()
    const content = this.buildFlowsContent(yamlContent, body)
    writeFileSync(this.flowsPath, content, 'utf-8')
    this.state = toSave
  }

  private splitFrontmatter(content: string): { frontmatter: string; body: string } {
    const lines = content.split(/\r?\n/)

    if (lines.length === 0 || lines[0].trim() !== '---') {
      throw new Error('Flows file missing YAML frontmatter. Expected "---" at start.')
    }

    const endIndex = lines.slice(1).findIndex(line => line.trim() === '---')
    if (endIndex === -1) {
      throw new Error('Flows file missing closing "---" for YAML frontmatter.')
    }

    const frontmatterLines = lines.slice(1, endIndex + 1)
    const bodyLines = lines.slice(endIndex + 2)

    return {
      frontmatter: frontmatterLines.join('\n'),
      body: bodyLines.join('\n'),
    }
  }

  private parseFrontmatter(frontmatter: string): FlowState {
    try {
      const parsed = parse(frontmatter) as Record<string, unknown>
      const enabled = this.normalizeFlowList(parsed?.enabled, 'enabled')
      const disabled = this.normalizeFlowList(parsed?.disabled, 'disabled')
      return { enabled, disabled }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Invalid YAML frontmatter: ${message}`)
    }
  }

  private normalizeFlowList(value: unknown, label: string): string[] {
    if (value === undefined || value === null) {
      return []
    }

    if (!Array.isArray(value)) {
      throw new Error(`Flows frontmatter "${label}" must be an array. ${VALID_FLOW_MESSAGE}`)
    }

    return value
      .map(item => (typeof item === 'string' ? item.trim().toLowerCase() : ''))
      .filter(item => item.length > 0)
  }

  private validateFlowState(state: FlowState): FlowState {
    const unknown = [...state.enabled, ...state.disabled].filter(flow => !VALID_FLOW_IDS.includes(flow))
    if (unknown.length > 0) {
      throw new Error(`Unknown flow ID(s): ${unknown.join(', ')}. ${VALID_FLOW_MESSAGE}`)
    }

    const conflicts = state.enabled.filter(flow => state.disabled.includes(flow))
    if (conflicts.length > 0) {
      throw new Error(`Conflicting flow IDs in enabled and disabled: ${conflicts.join(', ')}. ${VALID_FLOW_MESSAGE}`)
    }

    return {
      enabled: this.unique(state.enabled),
      disabled: this.unique(state.disabled),
    }
  }

  private unique(values: string[]): string[] {
    const seen = new Set<string>()
    const result: string[] = []
    for (const value of values) {
      if (!seen.has(value)) {
        seen.add(value)
        result.push(value)
      }
    }
    return result
  }

  private readExistingBody(): string {
    if (!existsSync(this.flowsPath)) {
      return ''
    }

    const content = readFileSync(this.flowsPath, 'utf-8')
    const { body } = this.splitFrontmatter(content)
    return body
  }

  private buildFlowsContent(frontmatter: string, body: string): string {
    const bodyContent = body.length > 0 ? `\n${body}` : '\n'
    return `---\n${frontmatter.trimEnd()}\n---${bodyContent}`
  }

  list(): FlowState {
    return this.load()
  }

  enable(name: string): void {
    const normalized = this.normalizeFlowId(name)
    const state = this.load()
    const updated: FlowState = {
      enabled: this.unique([...state.enabled, normalized]),
      disabled: state.disabled.filter(flow => flow !== normalized),
    }
    const validated = this.validateFlowState(updated)
    this.save(validated)
  }

  disable(name: string): void {
    const normalized = this.normalizeFlowId(name)
    const state = this.load()
    const updated: FlowState = {
      enabled: state.enabled.filter(flow => flow !== normalized),
      disabled: this.unique([...state.disabled, normalized]),
    }
    const validated = this.validateFlowState(updated)
    this.save(validated)
  }

  private normalizeFlowId(name: string): string {
    const normalized = name.trim().toLowerCase()
    if (!normalized) {
      throw new Error(`Flow ID is required. ${VALID_FLOW_MESSAGE}`)
    }

    if (!VALID_FLOW_IDS.includes(normalized)) {
      throw new Error(`Unknown flow ID "${normalized}". ${VALID_FLOW_MESSAGE}`)
    }

    return normalized
  }

  getValidFlowIds(): string[] {
    return [...VALID_FLOW_IDS]
  }

  static init(projectRoot: string): string {
    const templatePath = join(projectRoot, 'src', 'templates', 'SPECIAL-FLOWS.md')
    const flowsPath = join(projectRoot, '.openpaul', 'SPECIAL-FLOWS.md')
    const dir = dirname(flowsPath)

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    if (existsSync(templatePath)) {
      copyFileSync(templatePath, flowsPath)
    } else {
      const defaultContent = `---
enabled: []
disabled:
  - security-review
  - docs-refresh
  - release-audit
  - data-migration
---
# Specialized Flows

**Project:** OpenPAUL Project
**Created:** ${new Date().toISOString()}
**Last Updated:** ${new Date().toISOString()}

---

## Flow Catalog

| Flow ID | Description |
|---------|-------------|
| security-review | Require an explicit security review for sensitive changes. |
| docs-refresh | Trigger documentation updates for user-facing changes. |
| release-audit | Run a release readiness audit before tagging releases. |
| data-migration | Require migration checks for schema or data changes. |

---

*Generated by /openpaul:flows*
`
      writeFileSync(flowsPath, defaultContent, 'utf-8')
    }

    return flowsPath
  }
}
