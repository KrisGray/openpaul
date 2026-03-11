import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'

export interface Flow {
  name: string
  enabled: boolean
  trigger?: string
}

export class FlowsManager {
  private flowsPath: string
  private flows: Flow[] = []

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

  load(): Flow[] {
    if (!existsSync(this.flowsPath)) {
      this.flows = []
      return this.flows
    }

    const content = readFileSync(this.flowsPath, 'utf-8')
    this.flows = this.parseFlowsFromMarkdown(content)
    return this.flows
  }

  private parseFlowsFromMarkdown(content: string): Flow[] {
    const flows: Flow[] = []
    const tableRegex = /\| Name \| Enabled \| Trigger \|\s*\|[-|\s]+\|[-|\s]+\|[-|\s]+\|\s*((?:\|[^\n]+\n?)+)/g
    
    const match = tableRegex.exec(content)
    if (!match) {
      return flows
    }

    const rows = match[1].trim().split('\n')
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(c => c)
      if (cells.length >= 2) {
        const name = cells[0]
        const enabled = cells[1].toLowerCase() === 'true' || cells[1] === '✓' || cells[1].toLowerCase() === 'yes'
        const trigger = cells[2] || undefined
        flows.push({ name, enabled, trigger })
      }
    }

    return flows
  }

  save(): void {
    const dir = dirname(this.flowsPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const content = this.generateFlowsMarkdown()
    writeFileSync(this.flowsPath, content, 'utf-8')
  }

  private generateFlowsMarkdown(): string {
    const rows = this.flows.map(flow => {
      const enabled = flow.enabled ? '✓' : '○'
      const trigger = flow.trigger || '-'
      return `| ${flow.name} | ${enabled} | ${trigger} |`
    }).join('\n')

    return `# Special Flows

**Project:** OpenPAUL Project
**Last Updated:** ${new Date().toISOString()}

---

## Flows

| Name | Enabled | Trigger |
|------|---------|---------|
${rows}

---

*Managed by /openpaul:flows*
`
  }

  list(): Flow[] {
    if (this.flows.length === 0) {
      this.load()
    }
    return this.flows
  }

  enable(name: string): boolean {
    this.load()
    const flow = this.flows.find(f => f.name.toLowerCase() === name.toLowerCase())
    if (!flow) {
      return false
    }
    flow.enabled = true
    this.save()
    return true
  }

  disable(name: string): boolean {
    this.load()
    const flow = this.flows.find(f => f.name.toLowerCase() === name.toLowerCase())
    if (!flow) {
      return false
    }
    flow.enabled = false
    this.save()
    return true
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
      const defaultContent = `# Special Flows

**Project:** OpenPAUL Project
**Last Updated:** ${new Date().toISOString()}

---

## Flows

| Name | Enabled | Trigger |
|------|---------|---------|
| security-review | ○ | - |
| docs-update | ○ | - |

---

*Managed by /openpaul:flows*
`
      writeFileSync(flowsPath, defaultContent, 'utf-8')
    }

    return flowsPath
  }
}
