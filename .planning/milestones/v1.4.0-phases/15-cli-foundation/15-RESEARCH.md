# Phase 15: CLI Foundation - Research

**Researched:** 2026-03-20
**Domain:** Node.js CLI development (argument parsing, colored output, executable scripts)
**Confidence:** HIGH

## Summary

This phase creates a standalone CLI entry point (`npx openpaul`) separate from the existing OpenCode plugin interface. The project currently exposes all functionality as plugin tools via `@opencode-ai/plugin`. The CLI needs a new `bin` entry point that uses `commander` for argument parsing and `picocolors` for terminal colors.

**Primary recommendation:** Create `src/cli.ts` as a separate entry point that parallels `src/index.ts` (plugin), using `commander` for args and `picocolors` for output. Compile to `dist/cli.js` with shebang preserved.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Output Style:**
- Incremental verbosity: silent by default, `-v` for more detail, `-vv` for everything
- Auto-detect terminal color support: use colors when supported, fall back to plain text
- One-line success message (e.g., "OpenPAUL initialized in ./my-project")
- Step messages for progress (e.g., "Creating .openpaul/..." then "Done")

**Flag Design:**
- Both short and long flags (e.g., `-h`/`--help`, `-n`/`--name`)
- Target directory via `--path` flag only (no positional argument)
- Standard naming: `--name`, `--path`, `--preset`, `--verbose`
- Default to current directory `.` when `--path` not specified
- Project name defaults to current directory name if `--name` not provided

**Execution Behavior:**
- Bare `npx openpaul` starts interactive mode
- Providing flags (`--name`, `--path`, `--preset`) skips prompts for those values
- `--interactive` flag explicitly enables interactive prompts
- No confirmation step before scaffolding
- Error and exit if `.openpaul/` directory already exists (no overwrite/merge)

**Error Handling:**
- Binary exit codes: 0 for success, 1 for any error
- Clean error messages only: red "Error:" prefix + message, no stack traces
- Unified error format: all errors use same format regardless of type
- Errors to stderr, success/progress to stdout

**Specific Ideas:**
- Use `commander` for argument parsing (already in roadmap notes)
- Use `picocolors` for colored output (already in roadmap notes)
- TypeScript shebang preserved during compilation

### OpenCode's Discretion

- Exact wording of success/error messages
- Specific color palette for output
- Interactive prompt wording and flow
- Help text formatting and examples

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLI-01 | User can run `npx openpaul` to execute the installer | `commander` for parsing, shebang for executable, `bin` field in package.json |
| CLI-02 | User can run `npx openpaul --help` to see usage information | `commander` built-in help via `.helpOption('-h', '--help')` |
| CLI-03 | User can run `npx openpaul --version` to see package version | `commander` built-in version via `.version()` reading from package.json |
| CLI-04 | User receives clear colored error messages on failure | `picocolors` for red error prefix, stderr output, exit code 1 |
| CLI-05 | User receives success confirmation after scaffolding completes | `picocolors` for green success message, one-line format |
| INT-03 | User can specify project path as positional argument (default: `.`) | `--path` option in commander with default value |
| INT-04 | User can provide project name via `--name` flag to skip prompt | `--name` option in commander, optional string |

</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `commander` | ^12.0.0 | CLI argument parsing | Most popular Node CLI framework, declarative API, built-in help/version |
| `picocolors` | ^1.0.0 | Terminal colors | Smallest footprint (1KB), faster than chalk, same API |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@inquirer/prompts` | ^7.0.0 | Interactive prompts | When bare `npx openpaul` runs without flags |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `commander` | `yargs` | yargs is more powerful but heavier; commander is simpler for this use case |
| `picocolors` | `chalk` | chalk is larger (~13KB vs 1KB) and slower; picocolors is the modern choice |
| `@inquirer/prompts` | `enquirer` | inquirer has better TypeScript support and active maintenance |

**Installation:**
```bash
npm install commander picocolors @inquirer/prompts
npm install -D @types/node
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── cli.ts              # NEW: CLI entry point with shebang
├── cli/
│   ├── index.ts        # CLI orchestration (parse args, route commands)
│   ├── output.ts       # Colored output utilities (wraps picocolors)
│   ├── errors.ts       # Unified error handling
│   └── interactive.ts  # Inquirer prompts for interactive mode
├── index.ts            # EXISTING: Plugin entry point (unchanged)
└── commands/           # EXISTING: Plugin tools (unchanged)
```

### Pattern 1: Dual Entry Points

**What:** Separate entry points for CLI (`bin/openpaul`) and plugin (`main`).

**When to use:** When a package serves both as an npm library and a CLI tool.

**Example:**
```json
// package.json
{
  "main": "dist/index.js",
  "bin": {
    "openpaul": "./dist/cli.js"
  }
}
```

### Pattern 2: Commander Program Definition

**What:** Declarative CLI definition with options and action handlers.

```typescript
#!/usr/bin/env node
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'))

const program = new Command()

program
  .name('openpaul')
  .description('OpenPAUL - Plan-Apply-Unify Loop for structured development')
  .version(pkg.version, '-v, --version', 'output the current version')
  .option('-n, --name <name>', 'project name (defaults to directory name)')
  .option('-p, --path <path>', 'target directory', '.')
  .option('--preset <preset>', 'configuration preset: minimal | full')
  .option('-i, --interactive', 'enable interactive prompts')
  .option('--verbose', 'enable verbose output')
  .action(async (options) => {
    // Handle execution
  })

program.parse()
```

### Pattern 3: Picocolors Terminal Output

**What:** Detect color support and format output appropriately.

```typescript
import pc from 'picocolors'

export function error(message: string): void {
  console.error(pc.red('Error:') + ' ' + message)
  process.exit(1)
}

export function success(message: string): void {
  console.log(pc.green('✓') + ' ' + message)
}

export function step(message: string): void {
  console.log(pc.gray('•') + ' ' + message)
}

export function info(message: string): void {
  if (process.env.VERBOSE) {
    console.log(pc.blue('ℹ') + ' ' + message)
  }
}
```

### Pattern 4: Auto Color Detection

**What:** picocolors automatically detects NO_COLOR and TTY support.

```typescript
// picocolors handles this internally:
// - Checks process.env.NO_COLOR
// - Checks process.env.FORCE_COLOR
// - Checks if stdout/stderr is TTY
import pc from 'picocolors'

// Colors automatically disabled when not supported
console.log(pc.green('Success')) // Plain text when piped
```

### Anti-Patterns to Avoid

- **Throwing in CLI code:** Use `process.exit(1)` with error message, not exceptions that show stack traces
- **Console.log for errors:** Use `console.error` (stderr) for error messages
- **Positional path argument:** Use `--path` flag only per locked decision
- **Overwriting existing .openpaul/:** Must error and exit, no merge/overwrite
- **Stack traces to users:** Catch all errors and format as clean messages

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument parsing | Custom argv parser | `commander` | Edge cases: -- separation, combined flags (-abc), value parsing |
| Help text | Manual string formatting | `commander` | Automatic generation, consistent formatting, --help/-h support |
| Version display | Reading package.json manually | `commander.version()` | Built-in, handles -v and --version |
| Terminal colors | ANSI escape codes | `picocolors` | TTY detection, NO_COLOR support, Windows compatibility |
| Interactive prompts | readline wrapper | `@inquirer/prompts` | Validation, cancellation, keyboard navigation |

**Key insight:** CLI parsing has many edge cases (combined flags, equals syntax, quoted values). Commander handles all of this correctly.

## Common Pitfalls

### Pitfall 1: Shebang Lost During Compilation

**What goes wrong:** TypeScript compiler removes or corrupts the `#!/usr/bin/env node` shebang.

**Why it happens:** TSC doesn't preserve shebangs by default.

**How to avoid:** Place shebang as FIRST LINE in `src/cli.ts` - TypeScript preserves it when it's the first line.

**Warning signs:** `env: node: No such file or directory` or syntax errors when running CLI.

### Pitfall 2: ES Module Import Issues

**What goes wrong:** `require is not defined` or import errors when CLI runs.

**Why it happens:** Package uses `"type": "module"` but CLI file isn't properly configured.

**How to avoid:** 
- Ensure `tsconfig.json` has `"module": "ESNext"` (already set)
- Use full imports with `.js` extension in TypeScript for local files
- Use `import pc from 'picocolors'` (default export)

**Warning signs:** Runtime import errors, "cannot use import statement" errors.

### Pitfall 3: Exit Code Not Propagating

**What goes wrong:** CLI always exits 0 even on error.

**Why it happens:** Async function throws but process.exit(1) never runs, or error is swallowed.

**How to avoid:** Wrap top-level async code and explicitly exit:
```typescript
program.parseAsync().catch((err) => {
  console.error(pc.red('Error:'), err.message)
  process.exit(1)
})
```

### Pitfall 4: Colors in Piped Output

**What goes wrong:** ANSI codes pollute piped output (e.g., `npx openpaul | head`).

**Why it happens:** Color library doesn't detect non-TTY output.

**How to avoid:** picocolors handles this automatically - no configuration needed.

**Warning signs:** `[32m✓[0m` appearing in log files or piped output.

### Pitfall 5: Version Not Reading from Package.json

**What goes wrong:** Hardcoded version in CLI code becomes outdated.

**Why it happens:** Developer forgets to update CLI version when bumping package version.

**How to avoid:** Read version from package.json at runtime using `import { createRequire } from 'module'` or ESM-compatible approach.

## Code Examples

### CLI Entry Point (src/cli.ts)

```typescript
#!/usr/bin/env node
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import pc from 'picocolors'
import { runInteractive } from './cli/interactive.js'
import { runScaffold } from './cli/scaffold.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgPath = join(__dirname, '../package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

const program = new Command()

program
  .name('openpaul')
  .description('Initialize OpenPAUL in your project')
  .version(pkg.version)
  .option('-n, --name <name>', 'project name')
  .option('-p, --path <path>', 'target directory', '.')
  .option('--preset <preset>', 'preset: minimal | full')
  .option('--verbose', 'verbose output')
  .option('-i, --interactive', 'force interactive mode')
  .addHelpText('after', `
Examples:
  $ npx openpaul                    # Interactive mode
  $ npx openpaul --name my-project  # Skip name prompt
  $ npx openpaul --path ./app       # Target directory
  $ npx openpaul --preset minimal   # Use minimal preset
`)
  .action(async (options) => {
    try {
      const isInteractive = options.interactive || (!options.name && !options.preset)
      
      if (isInteractive) {
        await runInteractive(options)
      } else {
        await runScaffold(options)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error(pc.red('Error:') + ' ' + message)
      process.exit(1)
    }
  })

program.parseAsync().catch((err) => {
  console.error(pc.red('Error:') + ' ' + err.message)
  process.exit(1)
})
```

### Error Handling Module (src/cli/errors.ts)

```typescript
import pc from 'picocolors'

export class CliError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CliError'
  }
}

export function exitWithError(message: string): never {
  console.error(pc.red('Error:') + ' ' + message)
  process.exit(1)
}

export function exitSuccess(message: string): never {
  console.log(message)
  process.exit(0)
}
```

### Verbose Output Pattern

```typescript
let verbosity = 0

export function setVerbosity(level: number): void {
  verbosity = level
}

export function log(message: string, minLevel = 1): void {
  if (verbosity >= minLevel) {
    console.log(message)
  }
}

export function debug(message: string): void {
  if (verbosity >= 2) {
    console.log(pc.gray('[debug]') + ' ' + message)
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `chalk` for colors | `picocolors` | ~2022 | Smaller bundle, faster, same API |
| `inquirer` (callbacks) | `@inquirer/prompts` (ESM) | ~2023 | Native ESM, promises, smaller |
| `yargs` with config objects | `commander` with fluent API | Established | Simpler, more readable |
| `fs.readFileSync` for package.json | `createRequire` or JSON imports | ~2021 | ESM compatible |

**Deprecated/outdated:**
- `chalk@4`: Use picocolors instead (chalk@5 is ESM but larger)
- `inquirer@8`: Use `@inquirer/prompts` for modern ESM support
- `meow`: Simpler but less featureful than commander

## Open Questions

1. **How to share code between CLI and plugin?**
   - What we know: Both need to scaffold .openpaul/ directory
   - What's unclear: Should CLI import from existing storage/ or duplicate logic
   - Recommendation: Create shared `src/core/` module that both entry points use

2. **Where does scaffolding logic live?**
   - What we know: Phase 16 will implement actual scaffolding
   - What's unclear: How much scaffolding code in Phase 15 vs Phase 16
   - Recommendation: Phase 15 creates CLI infrastructure only; Phase 16 adds scaffold implementation

3. **How to handle --verbose flag in programmatic API?**
   - What we know: CLI uses verbosity levels, plugin doesn't
   - What's unclear: Should shared code accept verbosity option
   - Recommendation: Pass verbosity to shared functions as optional parameter

## Sources

### Primary (HIGH confidence)

- commander npm page: https://www.npmjs.com/package/commander - API documentation, examples
- picocolors npm page: https://www.npmjs.com/package/picocolors - API, color detection behavior
- @inquirer/prompts npm page: https://www.npmjs.com/package/@inquirer/prompts - Prompt types, ESM usage
- OpenPAUL existing codebase: src/index.ts, src/commands/*.ts, src/output/formatter.ts

### Secondary (MEDIUM confidence)

- Node.js docs: https://nodejs.org/api/process.html#process_exit_codes - Exit code conventions
- 12-factor CLI apps: https://12factor.net/cli - CLI best practices

### Tertiary (LOW confidence)

None - all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - commander and picocolors are well-established, locked by CONTEXT.md
- Architecture: HIGH - Pattern is clear: dual entry points with shared core
- Pitfalls: HIGH - Common issues well-documented in library docs and community

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (stable libraries, 90 days)
