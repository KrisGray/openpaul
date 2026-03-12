import { readdirSync, statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, basename, dirname } from 'path'

export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: TreeNode[]
}

export interface ScanOptions {
  maxDepth: number
  excludeDirs: string[]
  force?: boolean
  verbose?: boolean
}

export interface CacheEntry {
  path: string
  mtime: number
  size: number
}

export interface CacheData {
  version: string
  timestamp: number
  entries: CacheEntry[]
}

const DEFAULT_OPTIONS: ScanOptions = {
  maxDepth: 5,
  excludeDirs: ['node_modules', '.git', 'dist', 'coverage', 'fixtures', 'vendor', '.opencode', '.planning', '.paul', '.openpaul', '__pycache__', '.next', '.nuxt', 'build', 'out', '.cache'],
  force: false,
  verbose: false,
}

const CACHE_VERSION = '1.0'
const CACHE_FILE = '.openpaul/.codebase-cache.json'

export function scanDirectory(
  dir: string,
  options: Partial<ScanOptions> = {},
  currentDepth: number = 0
): TreeNode | null {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (currentDepth > opts.maxDepth) {
    return null
  }

  if (!existsSync(dir)) {
    return null
  }

  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return null
  }

  const node: TreeNode = {
    name: basename(dir),
    type: 'directory',
    path: dir,
    children: [],
  }

  for (const entry of entries) {
    if (opts.excludeDirs.includes(entry)) {
      continue
    }

    const fullPath = join(dir, entry)

    try {
      const stats = statSync(fullPath)

      if (stats.isDirectory()) {
        const childNode = scanDirectory(fullPath, opts, currentDepth + 1)
        if (childNode && childNode.children && childNode.children.length > 0) {
          node.children!.push(childNode)
        } else if (childNode && childNode.children?.length === 0) {
          node.children!.push(childNode)
        }
      } else if (stats.isFile()) {
        node.children!.push({
          name: entry,
          type: 'file',
          path: fullPath,
        })
      }
    } catch {
      continue
    }
  }

  node.children!.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name)
    }
    return a.type === 'directory' ? -1 : 1
  })

  return node
}

export function treeToMarkdown(node: TreeNode, prefix: string = '', isLast: boolean = true): string {
  let result = ''
  const connector = prefix === '' ? '' : isLast ? '└── ' : '├── '
  
  if (node.type === 'directory') {
    result += `${prefix}${connector}${node.name}/`
  } else {
    result += `${prefix}${connector}${node.name}`
  }

  if (node.children && node.children.length > 0) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ')
    node.children.forEach((child, index) => {
      const childIsLast = index === node.children!.length - 1
      result += '\n' + treeToMarkdown(child, childPrefix, childIsLast)
    })
  }

  return result
}

export function countFiles(node: TreeNode): { files: number; directories: number } {
  let files = 0
  let directories = 0

  if (node.type === 'directory') {
    directories++
    if (node.children) {
      for (const child of node.children) {
        const counts = countFiles(child)
        files += counts.files
        directories += counts.directories
      }
    }
  } else {
    files++
  }

  return { files, directories }
}

export function loadCache(projectRoot: string): CacheData | null {
  const cachePath = join(projectRoot, CACHE_FILE)
  if (!existsSync(cachePath)) {
    return null
  }
  try {
    const content = readFileSync(cachePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

export function saveCache(projectRoot: string, entries: CacheEntry[]): void {
  const cachePath = join(projectRoot, CACHE_FILE)
  const dir = dirname(cachePath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  const cache: CacheData = {
    version: CACHE_VERSION,
    timestamp: Date.now(),
    entries,
  }
  writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf-8')
}

export function isCacheValid(projectRoot: string, outputPath?: string): boolean {
  const cache = loadCache(projectRoot)
  if (!cache || cache.version !== CACHE_VERSION) {
    return false
  }

  if (!cache.timestamp || !Array.isArray(cache.entries) || cache.entries.length === 0) {
    return false
  }

  let latestEntryMtime = Number.NEGATIVE_INFINITY
  for (const entry of cache.entries) {
    if (!entry || typeof entry.path !== 'string' || typeof entry.mtime !== 'number' || typeof entry.size !== 'number') {
      return false
    }
    latestEntryMtime = Math.max(latestEntryMtime, entry.mtime)
  }

  if (!Number.isFinite(latestEntryMtime) || cache.timestamp < latestEntryMtime) {
    return false
  }

  if (outputPath) {
    if (!existsSync(outputPath)) {
      return false
    }

    const outputMtime = statSync(outputPath).mtimeMs
    if (outputMtime < cache.timestamp) {
      return false
    }
  }

  return true
}
