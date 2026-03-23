# Phase 16: Scaffold Core - Research

**Researched:** 2026-03-20
**Domain:** CLI scaffolding with interactive prompts
**Confidence:** HIGH

## Summary

Phase 16 implements the core scaffolding logic for `npx openpaul`. The CLI already has argument parsing (commander), colored output (picocolors), and error handling from Phase 15. @inquirer/prompts is already installed. This phase adds interactive prompts for project name, directory creation, and state.json generation.

**Primary recommendation:** Extend existing `src/cli.ts` with scaffolding logic using @inquirer/prompts for input/confirm prompts, Node.js fs for directory creation, and the existing atomic write pattern for state.json.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Interactive Prompts:**
- Prompt for project name **only when `--name` flag not provided**
- Show directory name as default — user can press Enter to accept
- Basic validation: reject empty strings and problematic characters (`/`, `\`, `:`)
- Show confirmation prompt before proceeding: "Create OpenPAUL in './app' with project name 'my-project'?" (y/n)

**Directory Structure:**
- Create `.openpaul/` directory
- Create `state.json` with project metadata
- **Do NOT create `model-config.json`** — deferred to Phase 17 presets
- Keep minimal footprint for Phase 16; Phase 17 adds preset variations

**Existing Directory Handling:**
- When `.openpaul/` exists, show minimal warning: "`.openpaul/` already exists. Overwrite? (y/n)"
- If user declines: exit cleanly with code 0 (user cancelled, not an error)
- Add `--force` / `-f` flag to skip prompt and overwrite for CI/CD scenarios

**State.json Format:**
- Include schema `version` field (e.g., `"1.0"`) for future migrations
- Include `cliVersion` field tracking which CLI version created the file
- Include `name`, `createdAt`, `updatedAt` fields
- **Do NOT include `path`** — implicit from file location

### OpenCode's Discretion

- Exact wording of prompts and messages
- Error message styling
- How to derive default project name from directory (basename vs package.json fallback)

### Deferred Ideas (OUT OF SCOPE)

- `model-config.json` creation — Phase 17 Template Presets
- `--preset minimal` / `--preset full` options — Phase 17
- Additional template files (README, config stubs) — Phase 17

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAF-01 | CLI creates `.openpaul/` directory in target project | Node.js `fs.mkdirSync` with `{ recursive: true }`; existing `FileManager.ensurePaulDir()` pattern |
| SCAF-02 | CLI creates initial `state.json` with project name and timestamps | Zod schema for validation; `atomicWrite()` from `src/storage/atomic-writes.ts` |
| INT-01 | CLI prompts for project name if not provided via argument | @inquirer/prompts `input()` with `default` and `validate` options |
| INT-02 | CLI detects existing `.openpaul/` directory and warns user | `fs.existsSync()` check; @inquirer/prompts `confirm()` for overwrite prompt |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @inquirer/prompts | ^8.3.2 | Interactive prompts | Already installed; modern ESM API; minimal dependencies |
| commander | ^14.0.3 | CLI argument parsing | Already in use; `--force` flag easy to add |
| picocolors | ^1.1.1 | Colored output | Already in use via `src/cli/output.ts` |
| zod | ^3.22.0 | Schema validation | Already in use; validates state.json before write |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs (Node.js) | built-in | Directory/file operations | All file system operations |
| path (Node.js) | built-in | Path manipulation | Resolving target paths, getting basename |
| os (Node.js) | built-in | Temp directory | atomicWrite uses `os.tmpdir()` |

### Already Installed (Phase 15)
- `commander` - CLI argument parsing
- `picocolors` - Colored output
- `@inquirer/prompts` - Interactive prompts
- `zod` - Schema validation

**Installation:** None required — all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure

Extend existing structure:
```
src/
├── cli.ts              # CLI entry point (extend with scaffolding)
├── cli/
│   ├── output.ts       # Output helpers (success, step, info, error)
│   ├── errors.ts       # Error handling (exitWithError, handleCliError)
│   └── scaffold.ts     # NEW: Scaffolding logic
├── storage/
│   └── atomic-writes.ts # Atomic file writes (reuse pattern)
└── types/
    └── state-file.ts   # NEW: Zod schema for state.json
```

### Pattern 1: @inquirer/prompts Input with Validation

**What:** Prompt for project name with default and validation
**When to use:** When `--name` flag not provided

```typescript
// Source: node_modules/@inquirer/prompts/README.md + TypeScript definitions
import { input, confirm } from '@inquirer/prompts'

const projectName = await input({
  message: 'Project name',
  default: 'my-project',
  validate: (value: string) => {
    if (!value.trim()) return 'Project name cannot be empty'
    if (/[\/\\:]/.test(value)) return 'Project name cannot contain /, \\, or :'
    return true
  }
})
```

### Pattern 2: Confirm Prompt for Overwrite

**What:** Ask user to confirm before overwriting existing directory
**When to use:** When `.openpaul/` exists and `--force` not provided

```typescript
// Source: node_modules/@inquirer/prompts/README.md
import { confirm } from '@inquirer/prompts'

const shouldOverwrite = await confirm({
  message: '`.openpaul/` already exists. Overwrite?',
  default: false
})

if (!shouldOverwrite) {
  process.exit(0) // Exit cleanly - user cancelled
}
```

### Pattern 3: Atomic Write for state.json

**What:** Write state.json using atomic pattern (temp file + rename)
**When to use:** Creating/updating state.json

```typescript
// Source: src/storage/atomic-writes.ts
import { atomicWrite } from './storage/atomic-writes.js'

interface StateFile {
  version: string
  cliVersion: string
  name: string
  createdAt: string
  updatedAt: string
}

const state: StateFile = {
  version: '1.0',
  cliVersion: pkg.version,
  name: projectName,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

await atomicWrite(
  join(targetPath, '.openpaul', 'state.json'),
  JSON.stringify(state, null, 2)
)
```

### Pattern 4: Default Project Name from Directory

**What:** Derive default name from target directory basename
**When to use:** When showing default in prompt

```typescript
// Source: Node.js path module
import { basename, resolve } from 'path'

function getDefaultProjectName(targetPath: string): string {
  const resolved = resolve(targetPath)
  return basename(resolved)
}
```

### Anti-Patterns to Avoid

- **Don't use synchronous inquirer:** The @inquirer/prompts API is async-only; use `await`
- **Don't throw on user cancel:** When user declines overwrite, use `process.exit(0)` not `throw`
- **Don't include path in state.json:** Per user constraint, path is implicit from location
- **Don't create model-config.json:** That's Phase 17

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive prompts | Custom readline | @inquirer/prompts | Already installed, handles edge cases (Ctrl+C, terminal sizing) |
| Atomic writes | Custom temp file logic | src/storage/atomic-writes.ts | Already implemented, handles cleanup on error |
| Validation | Manual if/else | zod + input.validate | Schema-based, consistent error messages |
| Colored output | Console escape codes | src/cli/output.ts | Consistent with existing CLI, uses picocolors |

**Key insight:** The project already has robust patterns for file operations and output. Reuse these rather than creating new implementations.

## Common Pitfalls

### Pitfall 1: Forgetting --force Flag Registration

**What goes wrong:** `--force` flag not added to commander, CI/CD scenarios fail
**Why it happens:** Easy to forget flag registration in commander setup
**How to avoid:** Add `-f, --force` option early in task list
**Warning signs:** `node dist/cli.js --force` shows "unknown option" error

### Pitfall 2: Exit Code Confusion

**What goes wrong:** Using exit(1) when user cancels, treating cancellation as error
**Why it happens:** Not distinguishing between "error" and "user chose not to continue"
**How to avoid:** Use `process.exit(0)` for user cancellation, `process.exit(1)` only for actual errors
**Warning signs:** CI/CD shows failure when user declines overwrite

### Pitfall 3: Path Resolution Issues

**What goes wrong:** Relative paths like `./app` not resolved correctly for basename
**Why it happens:** `basename('./app')` returns `'app'` but `basename('.')` returns `'.'`
**How to avoid:** Always `resolve()` path before getting basename: `basename(resolve(targetPath))`
**Warning signs:** Default project name shows as `.` instead of actual directory name

### Pitfall 4: Missing Directory Creation

**What goes wrong:** Attempting to write state.json before .openpaul/ exists
**Why it happens:** atomicWrite creates parent directory, but only for the file's dirname
**How to avoid:** Explicitly create `.openpaul/` directory first with `mkdirSync(path, { recursive: true })`
**Warning signs:** ENOENT error when writing state.json

## Code Examples

### CLI Action Handler Extension

```typescript
// Extending src/cli.ts action handler
import { input, confirm } from '@inquirer/prompts'
import { existsSync, mkdirSync } from 'fs'
import { resolve, basename, join } from 'path'
import { atomicWrite } from './storage/atomic-writes.js'
import { success, step, info, error } from './cli/output.js'
import { exitWithError } from './cli/errors.js'

program
  .option('-f, --force', 'skip prompts and overwrite existing files')
  .action(async (options) => {
    setVerbosity(options.verbose)
    
    const targetPath = resolve(options.path)
    const openpaulDir = join(targetPath, '.openpaul')
    
    // Check for existing directory
    if (existsSync(openpaulDir) && !options.force) {
      const shouldOverwrite = await confirm({
        message: '`.openpaul/` already exists. Overwrite?',
        default: false
      })
      if (!shouldOverwrite) {
        info('Operation cancelled')
        process.exit(0)
      }
    }
    
    // Get project name
    let projectName = options.name
    if (!projectName) {
      const defaultName = basename(targetPath)
      projectName = await input({
        message: 'Project name',
        default: defaultName,
        validate: (value) => {
          if (!value.trim()) return 'Project name cannot be empty'
          if (/[\/\\:]/.test(value)) return 'Project name cannot contain /, \\, or :'
          return true
        }
      })
    }
    
    // Confirmation (unless --force)
    if (!options.force) {
      const confirmed = await confirm({
        message: `Create OpenPAUL in '${targetPath}' with project name '${projectName}'?`,
        default: true
      })
      if (!confirmed) {
        info('Operation cancelled')
        process.exit(0)
      }
    }
    
    // Create directory
    step('Creating .openpaul/ directory...')
    mkdirSync(openpaulDir, { recursive: true })
    
    // Write state.json
    step('Creating state.json...')
    const state = {
      version: '1.0',
      cliVersion: pkg.version,
      name: projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await atomicWrite(join(openpaulDir, 'state.json'), JSON.stringify(state, null, 2))
    
    success('OpenPAUL initialized successfully!')
  })
```

### Zod Schema for state.json (Optional Enhancement)

```typescript
// src/types/state-file.ts
import { z } from 'zod'

export const StateFileSchema = z.object({
  version: z.literal('1.0'),
  cliVersion: z.string(),
  name: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type StateFile = z.infer<typeof StateFileSchema>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| inquirer (v8) | @inquirer/prompts (v8.3) | 2023 | ESM-native, smaller bundle, individual prompt packages |
| Callback-based prompts | Async/await | 2020+ | Cleaner code, better error handling |
| Manual exit codes | Explicit exit(0) for cancel | Best practice | CI/CD friendly |

**Deprecated/outdated:**
- `inquirer` package (old v8): Use `@inquirer/prompts` instead — modern ESM API
- `prompt-sync`: Synchronous prompts block event loop, poor UX

## Open Questions

1. **Should we check package.json for default name?**
   - What we know: CONTEXT.md says "OpenCode's Discretion: How to derive default project name from directory"
   - What's unclear: Should we fall back to package.json name field?
   - Recommendation: Start simple with `basename(resolve(targetPath))`. Add package.json fallback only if users request it.

2. **Should state.json use ISO strings or Unix timestamps?**
   - What we know: CONTEXT.md specifies `createdAt` and `updatedAt` but not format
   - What's unclear: ISO 8601 strings vs Unix milliseconds
   - Recommendation: Use ISO 8601 strings (`new Date().toISOString()`) — human-readable, standard JSON datetime format.

## Sources

### Primary (HIGH confidence)
- node_modules/@inquirer/prompts/README.md - Official inquirer prompts documentation
- node_modules/@inquirer/input/dist/index.d.ts - TypeScript definitions for input prompt
- node_modules/@inquirer/confirm/dist/index.d.ts - TypeScript definitions for confirm prompt
- src/storage/atomic-writes.ts - Existing atomic write implementation
- src/storage/file-manager.ts - Existing file management patterns

### Secondary (MEDIUM confidence)
- Node.js fs documentation (training knowledge, verified against Node.js 20 types)
- Existing codebase patterns (src/cli.ts, src/cli/output.ts, src/cli/errors.ts)

### Tertiary (LOW confidence)
- None required — all patterns verified from installed packages and existing code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Existing patterns well-established in codebase
- Pitfalls: HIGH - Based on common CLI development patterns

**Research date:** 2026-03-20
**Valid until:** 30 days - stable libraries, minimal API changes expected
