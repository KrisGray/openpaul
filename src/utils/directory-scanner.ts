import { readdirSync, statSync, existsSync } from 'fs'
import { join, basename } from 'path'

export interface TreeNode {
  name: string
  type: 'file' | 'directory'
  path: string
  children?: TreeNode[]
}

export interface ScanOptions {
  maxDepth: number
  excludeDirs: string[]
}

const DEFAULT_OPTIONS: ScanOptions = {
  maxDepth: 5,
  excludeDirs: ['node_modules', '.git', 'dist', 'coverage', '.opencode', '.planning', '.paul', '.openpaul', '__pycache__', '.next', '.nuxt', 'build', 'out', '.cache'],
}

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
