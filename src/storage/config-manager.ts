import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { z } from 'zod'
import { parse, stringify } from 'yaml'

const ALLOWED_TOP_LEVEL_KEYS = ['project', 'integrations', 'preferences'] as const

const SonarQubeSchema = z.object({
  enabled: z.boolean(),
  url: z.string().optional(),
  projectKey: z.string().optional(),
  branch: z.string().optional(),
}).strict()

const IntegrationsSchema = z.object({
  sonarqube: SonarQubeSchema.optional(),
}).strict()

const PreferencesSchema = z.object({
  autoAdvance: z.boolean().optional(),
  parallelization: z.boolean().optional(),
  verbose: z.boolean().optional(),
}).strict()

const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
}).strict()

const ProjectConfigSchema = z.object({
  project: ProjectSchema,
  integrations: IntegrationsSchema.optional(),
  preferences: PreferencesSchema.optional(),
}).strict()

export type ProjectConfig = z.infer<typeof ProjectConfigSchema>

const DEFAULT_CONFIG: ProjectConfig = {
  project: {
    name: 'OpenPAUL Project',
    description: 'A project managed with OpenPAUL',
  },
  integrations: {
    sonarqube: {
      enabled: false,
      url: 'https://sonarqube.example.com',
      projectKey: 'openpaul-project',
      branch: 'main',
    },
  },
  preferences: {
    autoAdvance: false,
    parallelization: false,
    verbose: false,
  },
}

const ALLOWED_KEYS = new Set([
  'project',
  'project.name',
  'project.description',
  'integrations',
  'integrations.sonarqube',
  'integrations.sonarqube.enabled',
  'integrations.sonarqube.url',
  'integrations.sonarqube.projectKey',
  'integrations.sonarqube.branch',
  'preferences',
  'preferences.autoAdvance',
  'preferences.parallelization',
  'preferences.verbose',
])

const DEFAULT_TEMPLATE = `---
project:
  name: openpaul-project
  description: OpenPAUL-managed project
integrations:
  sonarqube:
    enabled: false
    url: https://sonarqube.example.com
    projectKey: openpaul-project
    branch: main
preferences:
  autoAdvance: false
  parallelization: false
  verbose: false
---
# OpenPAUL Configuration

This file uses YAML frontmatter for config values and markdown notes for guidance.

## Project

Defines the project identity used in OpenPAUL output and reports.

## Integrations

Toggle optional tooling integrations. Example below is SonarQube.

### SonarQube

- enabled: true when SonarQube is available
- url: SonarQube server URL
- projectKey: project identifier in SonarQube
- branch: default branch for scans

## Preferences

Controls optional CLI behavior (autoAdvance, parallelization, verbose).
`

const ALLOWED_KEYS_MESSAGE = `Allowed top-level keys: ${ALLOWED_TOP_LEVEL_KEYS.join(', ')}.`

const TEMPLATE_PATH_SEGMENTS = ['src', 'templates', 'config.md']

export class ConfigManager {
  private configPath: string
  private config: ProjectConfig | null = null
  private markdownBody: string | null = null

  constructor(private projectRoot: string) {
    this.configPath = this.resolveConfigPath()
  }

  private resolveConfigPath(): string {
    const openpaulConfig = join(this.projectRoot, '.openpaul', 'config.md')
    const paulConfig = join(this.projectRoot, '.paul', 'config.md')

    if (existsSync(openpaulConfig)) {
      return openpaulConfig
    }

    if (existsSync(paulConfig)) {
      const targetPath = openpaulConfig
      const targetDir = dirname(targetPath)
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true })
      }
      copyFileSync(paulConfig, targetPath)
      return targetPath
    }

    return openpaulConfig
  }

  private splitFrontmatter(content: string): { frontmatter: string; body: string } {
    const lines = content.split(/\r?\n/)

    if (lines.length === 0 || lines[0].trim() !== '---') {
      throw new Error('Config file missing YAML frontmatter. Expected "---" at start.')
    }

    const endIndex = lines.slice(1).findIndex(line => line.trim() === '---')
    if (endIndex === -1) {
      throw new Error('Config file missing closing "---" for YAML frontmatter.')
    }

    const frontmatterLines = lines.slice(1, endIndex + 1)
    const bodyLines = lines.slice(endIndex + 2)

    return {
      frontmatter: frontmatterLines.join('\n'),
      body: bodyLines.join('\n'),
    }
  }

  private parseFrontmatter(frontmatter: string): ProjectConfig {
    try {
      return parse(frontmatter) as ProjectConfig
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Invalid YAML frontmatter: ${message}`)
    }
  }

  private formatSchemaError(error: z.ZodError): string {
    const unrecognized = error.issues.find(issue => issue.code === 'unrecognized_keys')
    if (unrecognized && 'keys' in unrecognized) {
      const keys = (unrecognized as z.ZodUnrecognizedKeysIssue).keys
      return `Unknown config key(s): ${keys.join(', ')}. ${ALLOWED_KEYS_MESSAGE}`
    }

    const firstIssue = error.issues[0]
    if (!firstIssue) {
      return `Config validation failed. ${ALLOWED_KEYS_MESSAGE}`
    }

    const path = firstIssue.path.length > 0 ? ` at "${firstIssue.path.join('.')}"` : ''
    return `Invalid config value${path}: ${firstIssue.message}. ${ALLOWED_KEYS_MESSAGE}`
  }

  private readExistingBody(): string {
    if (!existsSync(this.configPath)) {
      return ''
    }

    const content = readFileSync(this.configPath, 'utf-8')
    const { body } = this.splitFrontmatter(content)
    return body
  }

  private buildConfigContent(frontmatter: string, body: string): string {
    const bodyContent = body.length > 0 ? `\n${body}` : '\n'
    return `---\n${frontmatter.trimEnd()}\n---${bodyContent}`
  }

  private assertAllowedKey(key: string): void {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`Unknown config key "${key}". ${ALLOWED_KEYS_MESSAGE}`)
    }
  }

  load(): ProjectConfig {
    if (this.config) {
      return this.config
    }

    if (!existsSync(this.configPath)) {
      this.config = { ...DEFAULT_CONFIG }
      return this.config
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8')
      const { frontmatter, body } = this.splitFrontmatter(content)
      const parsed = this.parseFrontmatter(frontmatter)
      const validated = ProjectConfigSchema.parse(parsed)
      this.config = validated
      this.markdownBody = body
      return this.config
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(this.formatSchemaError(error))
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to parse config: ${errorMessage}`)
    }
  }

  save(config?: ProjectConfig): void {
    const toSave = config || this.config || DEFAULT_CONFIG
    const dir = dirname(this.configPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
    const yamlContent = stringify(toSave, { indent: 2 })
    const body = this.markdownBody ?? this.readExistingBody()
    const content = this.buildConfigContent(yamlContent, body)
    writeFileSync(this.configPath, content, 'utf-8')
    this.config = toSave
  }

  get(key?: string): ProjectConfig | unknown {
    const config = this.load()
    if (!key) {
      return config
    }

    this.assertAllowedKey(key)

    const keys = key.split('.')
    let value: unknown = config
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return undefined
      }
    }
    return value
  }

  set(key: string, value: unknown): void {
    this.assertAllowedKey(key)

    const config = this.load()
    const keys = key.split('.')
    let current: Record<string, unknown> = config as unknown as Record<string, unknown>

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {}
      }
      current = current[k] as Record<string, unknown>
    }

    current[keys[keys.length - 1]] = value
    try {
      const validated = ProjectConfigSchema.parse(config)
      this.save(validated)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(this.formatSchemaError(error))
      }
      throw error
    }
  }

  getWithDefaults(key: string, defaultValue: unknown): unknown {
    const value = this.get(key)
    return value !== undefined ? value : defaultValue
  }

  validate(): { valid: boolean; errors: string[] } {
    try {
      this.load()
      return { valid: true, errors: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { valid: false, errors: [message] }
    }
  }

  static init(projectRoot: string): string {
    const configPath = join(projectRoot, '.openpaul', 'config.md')
    const dir = dirname(configPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    const templatePath = join(projectRoot, ...TEMPLATE_PATH_SEGMENTS)
    if (existsSync(templatePath)) {
      copyFileSync(templatePath, configPath)
    } else {
      writeFileSync(configPath, DEFAULT_TEMPLATE, 'utf-8')
    }

    return configPath
  }
}
