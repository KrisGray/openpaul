# Phase 8: Configuration - Research

**Researched:** 2026-03-11
**Domain:** CLI commands for project configuration, specialized flows, and codebase documentation
**Confidence:** HIGH

## Summary

Phase 8 implements three commands for configuration management: `/openpaul:config` for YAML-based project configuration, `/openpaul:flows` for specialized workflow management, and `/openpaul:map-codebase` for codebase documentation generation. The implementation leverages existing command patterns (tool factory, Zod validation), requires adding a YAML library (`yaml` by eemeli), and builds on existing templates (SPECIAL-FLOWS.md) and storage patterns (FileManager, atomic writes).

**Primary recommendation:** Use `yaml` library (eemeli) for YAML parsing/serialization. Follow existing command patterns from status.ts (file existence checks), complete-milestone.ts (confirmation flows), and verify.ts (file generation). Create separate managers for config and flows, reuse existing file structure.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONF-01 | User can manage project configuration with `/openpaul:config` that manages integrations (SonarQube), project settings, and preferences via YAML config in .openpaul/config.md | YAML library (`yaml`), FileManager patterns, template generation from init.ts |
| CONF-02 | User can configure specialized flows with `/openpaul:flows` that enables/disables specialized workflows defined in SPECIAL-FLOWS.md | SPECIAL-FLOWS.md template exists at src/templates/, flows enable/disable pattern from feature flags |
| CONF-03 | User can document codebase structure with `/openpaul:map-codebase` that creates CODEBASE.md with structure, stack, conventions, concerns, integrations, and architecture | File generation patterns, template system, fs for directory scanning |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @opencode-ai/plugin | ^1.2.0 | Tool registration | All commands use `tool()` factory |
| zod | ^3.22.0 | Schema validation | Command params, config validation |
| yaml | ^2.8.0 | YAML parsing/serialization | Modern, TypeScript-native, no dependencies |
| fs (Node) | built-in | File/directory operations | readdirSync, existsSync, statSync |
| path (Node) | built-in | Path handling | join, relative, basename |

### Supporting (existing codebase utilities)
| Utility | Location | Purpose | When to Use |
|---------|----------|---------|-------------|
| formatHeader, formatBold, formatList | src/output/formatter.ts | Consistent CLI output | All user-facing output |
| atomicWrite | src/storage/atomic-writes.ts | Safe file writes | Config files, CODEBASE.md |
| FileManager | src/storage/file-manager.ts | File I/O | Reading existing configurations |
| TemplateManager | src/storage/template-manager.ts | Template rendering | SPECIAL-FLOWS.md, CODEBASE.md |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| yaml | js-yaml | yaml is modern TypeScript-native; js-yamler is older but widely used |
| yaml | No library (regex) | Error-prone, not maintainable |
| Single config file | Multiple JSON files | Requirement specifies YAML in .openpaul/config.md |

**Installation:**
```bash
npm install yaml
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── commands/
│   ├── config.ts          # /openpaul:config command
│   ├── flows.ts           # /openpaul:flows command
│   ├── map-codebase.ts    # /openpaul:map-codebase command
│   └── index.ts           # Export new commands
├── storage/
│   ├── config-manager.ts  # YAML config read/write
│   └── flows-manager.ts  # Special flows management
├── types/
│   └── config.ts          # Config types (if needed)
└── tests/
    └── commands/
        ├── config.test.ts
        ├── flows.test.ts
        └── map-codebase.test.ts
```

### Pattern 1: Command Factory with Zod Validation
**What:** All commands use `tool()` factory with Zod schemas for parameter validation.
**When to use:** All new commands.
**Example:**
```typescript
// Source: src/commands/status.ts:23-28
export const paulConfig: ToolDefinition = tool({
  description: 'Manage project configuration',
  args: {
    action: tool.schema.enum(['get', 'set', 'list']).optional().describe('Action to perform'),
    key: tool.schema.string().optional().describe('Configuration key'),
    value: tool.schema.string().optional().describe('Configuration value'),
  },
  execute: async ({ action, key, value }, context) => {
    // Implementation
  },
})
```

### Pattern 2: Config File Location with Fallback
**What:** Check for .openpaul first, fall back to .paul for backwards compatibility.
**When to use:** All file path resolution.
**Example:**
```typescript
// Pattern from src/storage/pre-planning-manager.ts
function resolvePaulDir(projectRoot: string): string {
  const openpaulDir = join(projectRoot, '.openpaul')
  const paulDir = join(projectRoot, '.paul')
  
  if (existsSync(openpaulDir)) {
    return openpaulDir
  }
  return paulDir  // fallback
}
```

### Pattern 3: Template-Based File Generation
**What:** Use templates for generating files like SPECIAL-FLOWS.md and CODEBASE.md.
**When to use:** When generating structured markdown files.
**Example:**
```typescript
// Pattern from src/storage/milestone-manager.ts
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

function generateFromTemplate(templateName: string, data: Record<string, string>): string {
  const templatePath = join(process.cwd(), 'src', 'templates', templateName)
  let content = readFileSync(templatePath, 'utf-8')
  
  // Replace {{placeholders}} with data
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  
  return content
}
```

### Pattern 4: Directory Scanning for Codebase Mapping
**What:** Recursively scan directories to build codebase structure.
**When to use:** /openpaul:map-codebase implementation.
**Example:**
```typescript
function scanDirectory(dirPath: string, options: { maxDepth: number, exclude: string[] }): DirectoryNode {
  const entries = readdirSync(dirPath, { withFileTypes: true })
  
  return entries
    .filter(e => !options.exclude.includes(e.name))
    .map(entry => {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory() && options.maxDepth > 0) {
        return {
          name: entry.name,
          type: 'directory',
          children: scanDirectory(fullPath, { ...options, maxDepth: options.maxDepth - 1 })
        }
      }
      return { name: entry.name, type: entry.isDirectory() ? 'directory' : 'file' }
    })
}
```

### Anti-Patterns to Avoid
- **Don't hardcode .paul/.openpaul paths:** Use resolve function with fallback
- **Don't use interactive prompts:** OpenCode CLI doesn't support stdin - use flags
- **Don't overwrite without backup:** Use atomicWrite for safe file operations

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom regex parser | `yaml` library | Handles edge cases, type safety, YAML 1.1/1.2 |
| Config file I/O | Custom JSON/YAML read/write | ConfigManager class | Validation, defaults, atomic writes |
| File writes | fs.writeFileSync | atomicWrite | Zero data loss on crash |
| Template rendering | String replace | Template system | Cleaner, handles missing keys |

**Key insight:** All infrastructure exists except YAML library. Focus on command logic and config structure.

## Common Pitfalls

### Pitfall 1: .openpaul vs .paul Path Confusion
**What goes wrong:** Commands fail on projects using .paul directory.
**Why it happens:** Requirement specifies .openpaul but existing codebase uses .paul.
**How to avoid:** Check both .openpaul and .paul, prefer .openpaul if exists.
**Warning signs:** Commands work in new projects but fail in migrated ones.

```typescript
// Safe path resolution:
function resolveConfigPath(projectRoot: string): string {
  const openpaulConfig = join(projectRoot, '.openpaul', 'config.md')
  const paulConfig = join(projectRoot, '.paul', 'config.md')
  
  if (existsSync(openpaulConfig)) return openpaulConfig
  if (existsSync(paulConfig)) return paulConfig
  
  throw new Error('No config found. Run /openpaul:init first.')
}
```

### Pitfall 2: Invalid YAML Causes Silent Failures
**What goes wrong:** Malformed YAML crashes config loading with unclear errors.
**Why it happens:** Not validating YAML before saving, not showing parse errors.
**How to avoid:** Wrap YAML operations in try-catch, show actionable error messages.
**Warning signs:** "Failed to parse config" with no line number.

```typescript
// Safe YAML operations:
import { parse, stringify } from 'yaml'

function safeLoadConfig(content: string): Config {
  try {
    return parse(content) as Config
  } catch (error) {
    throw new Error(`Invalid YAML at line ${error.lineNumber}: ${error.message}`)
  }
}
```

### Pitfall 3: Map-Codebase Runs on Large Repos
**What goes wrong:** Scanning large monorepos causes timeout or memory issues.
**Why it happens:** No depth limit or exclude patterns on directory scan.
**How to avoid:** Add --max-depth flag, use exclude patterns (node_modules, .git).
**Warning signs:** Command hangs for >30 seconds.

```typescript
// Controlled directory scan:
const DEFAULT_EXCLUDES = ['node_modules', '.git', 'dist', 'coverage', '.opencode']
const DEFAULT_MAX_DEPTH = 5

function scanWithLimits(
  dir: string, 
  maxDepth: number = DEFAULT_MAX_DEPTH,
  exclude: string[] = DEFAULT_EXCLUDES
): TreeNode[] {
  if (maxDepth <= 0) return []
  
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => !exclude.includes(e.name))
    .map(entry => {
      // ... process with decrementing maxDepth
    })
}
```

## Code Examples

### config.yaml Format (CONF-01)
```yaml
# .openpaul/config.md
version: "1.0"
project:
  name: my-project
  description: My OpenPAUL project
  
integrations:
  sonar:
    enabled: true
    url: https://sonarcloud.io
    projectKey: my-org_my-project
    branch: main
    
preferences:
  defaultPhase: 1
  autoSave: true
  confirmDangerous: true
  
flows:
  - name: security-review
    enabled: true
    trigger: "@types security"
  - name: docs-update
    enabled: false
    trigger: "@types docs"
```

### /openpaul:config Command Structure
```typescript
// src/commands/config.ts
import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { parse, stringify } from 'yaml'
import { atomicWrite } from '../storage/atomic-writes'
import { formatHeader, formatBold, formatList } from '../output/formatter'

interface ProjectConfig {
  version: string
  project: { name: string; description?: string }
  integrations?: {
    sonar?: { enabled: boolean; url?: string; projectKey?: string; branch?: string }
  }
  preferences?: Record<string, unknown>
  flows?: Array<{ name: string; enabled: boolean; trigger?: string }>
}

export const paulConfig: ToolDefinition = tool({
  description: 'Manage project configuration',
  args: {
    action: tool.schema.enum(['get', 'set', 'list', 'init']).optional(),
    key: tool.schema.string().optional(),
    value: tool.schema.string().optional(),
  },
  execute: async ({ action, key, value }, context) => {
    const configPath = resolveConfigPath(context.directory)
    
    switch (action) {
      case 'list':
        return listConfig(configPath)
      case 'get':
        return getConfigValue(configPath, key)
      case 'set':
        return setConfigValue(configPath, key, value)
      case 'init':
      default:
        return initConfig(context.directory)
    }
  },
})
```

### /openpaul:flows Command Structure
```typescript
// src/commands/flows.ts
import { tool, type ToolDefinition } from '@opencode-ai/plugin'

export const paulFlows: ToolDefinition = tool({
  description: 'Configure specialized workflows',
  args: {
    action: tool.schema.enum(['list', 'enable', 'disable', 'create']).optional(),
    name: tool.schema.string().optional(),
  },
  execute: async ({ action, name }, context) => {
    const flowsPath = join(context.directory, '.openpaul', 'SPECIAL-FLOWS.md')
    
    switch (action) {
      case 'list':
        return listFlows(flowsPath)
      case 'enable':
        return setFlowEnabled(flowsPath, name, true)
      case 'disable':
        return setFlowEnabled(flowsPath, name, false)
      case 'create':
      default:
        return createFlowsFile(context.directory)
    }
  },
})
```

### /openpaul:map-codebase Command Structure
```typescript
// src/commands/map-codebase.ts
import { tool, type ToolDefinition } from '@opencode-ai/plugin'
import { readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'coverage', '.opencode', '.planning']
const MAX_DEPTH = 5

export const paulMapCodebase: ToolDefinition = tool({
  description: 'Document codebase structure',
  args: {
    output: tool.schema.string().optional().describe('Output file (default: CODEBASE.md)'),
    maxDepth: tool.schema.number().optional().describe('Max directory depth'),
  },
  execute: async ({ output, maxDepth }, context) => {
    const codebasePath = join(context.directory, output ?? 'CODEBASE.md')
    const structure = scanCodebase(context.directory, maxDepth ?? MAX_DEPTH)
    const content = generateCodebaseDoc(context.directory, structure)
    
    atomicWrite(codebasePath, content)
    
    return formatHeader(2, 'Codebase Mapped') + '\n\n' +
      `Created: ${codebasePath}\n` +
      formatBold('Structure:') + ` ${structure.totalFiles} files in ${structure.totalDirs} directories\n`
  },
})

function scanCodebase(root: string, maxDepth: number): CodebaseStructure {
  // Recursive scan with depth limiting
  // Returns tree structure + stats
}

function generateCodebaseDoc(root: string, structure: CodebaseStructure): string {
  // Generate markdown with:
  // - Project structure (tree)
  // - Tech stack (from package.json)
  // - Conventions (from tsconfig.json, .gitignore patterns)
  // - Concerns (from src organization)
  // - Integrations (from config files)
  // - Architecture (from README or inferred)
}
```

### CODEBASE.md Format (CONF-03)
```markdown
# Codebase Map

**Project:** my-project
**Generated:** 2026-03-11
**Version:** 1.0.0

---

## Structure

```
src/
├── commands/          # CLI commands
├── storage/           # Data managers
├── types/             # TypeScript types
└── tests/
    ├── commands/
    └── storage/
```

---

## Stack

| Category | Technology |
|----------|-------------|
| Language | TypeScript |
| Testing | Jest |
| Validation | Zod |
| Plugin | @opencode-ai/plugin |

---

## Conventions

- **Naming:** camelCase for files, PascalCase for classes
- **Testing:** *.test.ts pattern alongside source
- **Output:** Uses formatter.ts utilities

---

## Concerns

- CLI plugin for OpenCode
- File-based state management
- Phase-based workflow execution

---

## Integrations

- OpenCode plugin system
- File system (atomic writes)
- YAML configuration

---

## Architecture

Command → Manager → Storage → FileSystem

Commands receive user input, Managers handle business logic, Storage manages persistence.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON config | YAML config | This phase | More readable, supports comments |
| No flows system | SPECIAL-FLOWS.md | This phase | Track specialized workflows |
| Manual docs | map-codebase | This phase | Auto-generate codebase docs |

**Deprecated/outdated:**
- JSON for config: Replaced with YAML for better readability and comments

## Open Questions

1. **Should config be .md (markdown with YAML frontmatter) or .yaml?**
   - What we know: Requirement says ".openpaul/config.md" - implies markdown with YAML
   - What's unclear: Pure .yaml might be simpler
   - Recommendation: Use .md with YAML frontmatter to match requirement

2. **How to handle backwards compatibility with .paul directory?**
   - What we know: Existing projects use .paul, new requirement wants .openpaul
   - What's unclear: Should we migrate or support both?
   - Recommendation: Support both, prefer .openpaul, migrate on first write

3. **What should map-codebase include beyond structure?**
   - What we know: Requirement mentions structure, stack, conventions, concerns, integrations, architecture
   - What's unclear: How deep to go for each category
   - Recommendation: Start with surface-level, can be extended

## Sources

### Primary (HIGH confidence)
- src/commands/status.ts - File existence check pattern, command structure
- src/commands/complete-milestone.ts - Confirmation flow, file generation
- src/storage/file-manager.ts - File I/O patterns
- src/templates/SPECIAL-FLOWS.md - Existing template
- src/storage/model-config-manager.ts - Config loading patterns
- npmjs.com/package/yaml - YAML library documentation

### Secondary (MEDIUM confidence)
- Existing command exports in src/commands/index.ts - Command registration pattern

### Tertiary (LOW confidence)
- None - all patterns verified in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - YAML library verified, existing patterns apply
- Architecture: HIGH - Command patterns well-established
- Pitfalls: HIGH - Based on existing codebase patterns

**Research date:** 2026-03-11
**Valid until:** 30 days (stable codebase patterns)
