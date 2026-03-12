import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { scanDirectory, countFiles, type TreeNode } from './directory-scanner'

interface PackageJson {
  name?: string
  version?: string
  description?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

interface CodebaseDoc {
  projectName: string
  version: string
  description: string
  generatedAt: string
  structure: string[]
  fileCounts: { files: number; directories: number }
  stack: { name: string; version: string; type: string }[]
  conventions: string[]
  concerns: string[]
  integrations: string[]
  architecture: string[]
}

export function generateCodebaseDoc(
  projectRoot: string,
  options: { maxDepth?: number; outputPath?: string } = {}
): CodebaseDoc {
  const maxDepth = options.maxDepth || 5
  const outputPath = options.outputPath || 'CODEBASE.md'

  const packageJson = loadPackageJson(projectRoot)
  const projectName = packageJson?.name || 'Unknown Project'
  const version = packageJson?.version || '1.0.0'
  const description = packageJson?.description || ''
  const generatedAt = new Date().toISOString()

  const rootTree = scanDirectory(projectRoot, { maxDepth })
  const fileCounts = rootTree ? countFiles(rootTree) : { files: 0, directories: 0 }
  const structure = buildStructureSummary(rootTree, fileCounts, maxDepth)
  const srcTree = findChildDirectory(rootTree, 'src')

  const stack = extractStack(packageJson)
  const conventions = extractConventions(projectRoot)
  const concerns = extractConcerns(srcTree ?? rootTree)
  const integrations = extractIntegrations(projectRoot, packageJson)
  const architecture = extractArchitecture(rootTree)

  return {
    projectName,
    version,
    description,
    generatedAt,
    structure,
    fileCounts,
    stack,
    conventions,
    concerns,
    integrations,
    architecture,
  }
}

function findChildDirectory(rootTree: TreeNode | null, name: string): TreeNode | null {
  if (!rootTree?.children) {
    return null
  }
  return rootTree.children.find(child => child.type === 'directory' && child.name === name) ?? null
}

function buildStructureSummary(
  rootTree: TreeNode | null,
  fileCounts: { files: number; directories: number },
  maxDepth: number
): string[] {
  if (!rootTree?.children) {
    return [
      'No directory structure detected.',
      `Scan depth: ${maxDepth}`,
    ]
  }

  const topLevelDirs = rootTree.children
    .filter(child => child.type === 'directory')
    .map(child => child.name)

  const keyDirectories = ['src', 'tests', 'test', '__tests__', 'docs', 'scripts', 'resources', 'templates']
  const presentKeyDirs = keyDirectories.filter(dir => topLevelDirs.includes(dir))

  const keyDirDetails = presentKeyDirs
    .map(dirName => {
      const dirNode = findChildDirectory(rootTree, dirName)
      const childDirs = dirNode?.children
        ?.filter(child => child.type === 'directory')
        .map(child => child.name) ?? []
      const limitedChildren = childDirs.slice(0, 4)
      const extraCount = childDirs.length - limitedChildren.length
      const childSummary = limitedChildren.length > 0
        ? `${limitedChildren.join(', ')}${extraCount > 0 ? ` (+${extraCount} more)` : ''}`
        : 'no subdirectories detected'
      return `${dirName}/: ${childSummary}`
    })
    .slice(0, 4)

  const topLevelSummary = topLevelDirs.length > 0
    ? `${topLevelDirs.slice(0, 6).join(', ')}${topLevelDirs.length > 6 ? ' (+more)' : ''}`
    : 'None detected'

  const summary: string[] = [
    `Root: ${rootTree.name}/`,
    `Top-level directories: ${topLevelSummary}`,
    `Key directories: ${presentKeyDirs.length > 0 ? presentKeyDirs.join(', ') : 'None detected'}`,
    `Scope: ${fileCounts.files} files across ${fileCounts.directories} directories (depth ${maxDepth})`,
  ]

  if (keyDirDetails.length > 0) {
    summary.push(`Key subdirectories: ${keyDirDetails.join(' | ')}`)
  }

  return summary.slice(0, 6)
}

function loadPackageJson(projectRoot: string): PackageJson | null {
  const packageJsonPath = join(projectRoot, 'package.json')
  if (!existsSync(packageJsonPath)) {
    return null
  }
  try {
    const content = readFileSync(packageJsonPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

function extractStack(packageJson: PackageJson | null): { name: string; version: string; type: string }[] {
  const stack: { name: string; version: string; type: string }[] = []

  if (!packageJson) {
    return stack
  }

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  const knownDeps: Record<string, string> = {
    'typescript': 'Language',
    'ts-node': 'Runtime',
    'jest': 'Testing',
    'vitest': 'Testing',
    'mocha': 'Testing',
    'eslint': 'Linting',
    'prettier': 'Formatting',
    'zod': 'Validation',
    'yaml': 'Config',
    'diff': 'Utilities',
    '@opencode-ai/plugin': 'Framework',
  }

  for (const [dep, type] of Object.entries(knownDeps)) {
    if (deps[dep]) {
      stack.push({
        name: dep,
        version: deps[dep] || 'latest',
        type,
      })
    }
  }

  return stack
}

function extractConventions(projectRoot: string): string[] {
  const conventions: string[] = []

  const tsconfigPath = join(projectRoot, 'tsconfig.json')
  if (existsSync(tsconfigPath)) {
    conventions.push('TypeScript for type safety')
  }

  const eslintPath = join(projectRoot, '.eslintrc.json')
  const eslintrcPath = join(projectRoot, '.eslintrc.js')
  if (existsSync(eslintPath) || existsSync(eslintrcPath)) {
    conventions.push('ESLint for code linting')
  }

  const prettierPath = join(projectRoot, '.prettierrc')
  if (existsSync(prettierPath)) {
    conventions.push('Prettier for code formatting')
  }

  const jestConfig = join(projectRoot, 'jest.config.js')
  const vitestConfig = join(projectRoot, 'vitest.config.ts')
  if (existsSync(jestConfig) || existsSync(vitestConfig)) {
    conventions.push('Unit testing with Jest/Vitest')
  }

  conventions.push('ESM modules (type: module)')

  return conventions
}

function extractConcerns(srcTree: TreeNode | null): string[] {
  const concerns: string[] = []

  if (!srcTree?.children) {
    return concerns
  }

  const topLevelDirs = srcTree.children
    .filter(c => c.type === 'directory')
    .map(c => c.name)

  const concernMap: Record<string, string> = {
    commands: 'CLI commands',
    storage: 'Data persistence',
    state: 'State management',
    utils: 'Utility functions',
    types: 'TypeScript types',
    output: 'Output formatting',
    roadmap: 'Roadmap management',
  }

  for (const [dir, concern] of Object.entries(concernMap)) {
    if (topLevelDirs.includes(dir)) {
      concerns.push(concern)
    }
  }

  return concerns
}

function extractIntegrations(projectRoot: string, packageJson: PackageJson | null): string[] {
  const integrations: string[] = []

  if (!packageJson) {
    return integrations
  }

  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies }

  const integrationMap: Record<string, string> = {
    '@opencode-ai/plugin': 'OpenCode AI',
  }

  for (const [dep, name] of Object.entries(integrationMap)) {
    if (deps[dep]) {
      integrations.push(name)
    }
  }

  return integrations
}

function extractArchitecture(rootTree: TreeNode | null): string[] {
  if (!rootTree?.children) {
    return ['Simple module structure', 'Single-level directory layout']
  }

  const srcTree = findChildDirectory(rootTree, 'src')
  const targetTree = srcTree ?? rootTree

  const hasCommands = targetTree.children?.some(c => c.type === 'directory' && c.name === 'commands') ?? false
  const hasStorage = targetTree.children?.some(c => c.type === 'directory' && c.name === 'storage') ?? false
  const hasState = targetTree.children?.some(c => c.type === 'directory' && c.name === 'state') ?? false
  const hasTypes = targetTree.children?.some(c => c.type === 'directory' && c.name === 'types') ?? false

  const architecture: string[] = []

  if (hasCommands && hasStorage && hasState) {
    architecture.push('Command → Manager → Storage pattern (three-layer architecture)')
  } else if (hasCommands) {
    architecture.push('Command-based architecture with command-focused entrypoints')
  } else {
    architecture.push('Module-based architecture with shared utilities')
  }

  if (hasCommands) {
    architecture.push('Command entrypoints live under src/commands')
  }

  if (hasStorage) {
    architecture.push('Persistence and file operations live under src/storage')
  }

  if (hasTypes) {
    architecture.push('Shared types organized under src/types')
  }

  return architecture.length >= 2 ? architecture.slice(0, 6) : architecture.concat('Architecture inferred from directory layout')
}

export function docToMarkdown(doc: CodebaseDoc): string {
  const stackItems = doc.stack.map(s => `${s.name} ${s.version} (${s.type})`)

  const structureList = formatBulletList(doc.structure, ['No structure available.', 'Scan may be limited by permissions.'])
  const stackList = formatBulletList(stackItems, ['No stack entries detected.', 'Review package.json for dependencies.'])
  const conventionsList = formatBulletList(doc.conventions, ['No conventions detected.', 'Review configuration files for standards.'])
  const concernsList = formatBulletList(doc.concerns, ['No concerns detected.', 'Directory layout did not indicate specific domains.'])
  const integrationsList = formatBulletList(doc.integrations, ['No integrations detected.', 'Check config files for external services.'])
  const architectureList = formatBulletList(doc.architecture, ['Architecture inferred from directory layout.', 'No additional architectural markers found.'])

  return `# Codebase Map

**Project:** ${doc.projectName}
**Version:** ${doc.version}
**Last updated:** ${doc.generatedAt}

---

## Structure

${structureList}

---

## Stack

${stackList}

---

## Conventions

${conventionsList}

---

## Concerns

${concernsList}

---

## Integrations

${integrationsList}

---

## Architecture

${architectureList}
`
}

function formatBulletList(items: string[], fallback: string[]): string {
  const normalized = normalizeList(items, fallback)
  return normalized.map(item => `- ${item}`).join('\n')
}

function normalizeList(items: string[], fallback: string[]): string[] {
  const trimmed = items.map(item => item.trim()).filter(Boolean)
  const base = trimmed.length > 0 ? trimmed : fallback
  if (base.length === 1) {
    return base.concat('Additional details not detected from repository metadata.').slice(0, 6)
  }
  if (base.length > 6) {
    const limited = base.slice(0, 5)
    const remaining = base.length - 5
    limited.push(`${base[5]} (+${remaining} more)`)
    return limited
  }
  return base
}
