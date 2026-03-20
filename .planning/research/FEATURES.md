# Feature Research: CLI Installer

**Domain:** NPX-based CLI installer/scaffolder for OpenCode plugin
**Researched:** 2026-03-20
**Confidence:** HIGH (official docs from npm, Next.js, Vite, create-t3-app)

## Executive Summary

CLI installers like `create-next-app`, `create-vite`, and `create-t3-app` follow a predictable pattern: they execute via `npx` or `npm create`, present interactive prompts (with non-interactive bypass options), scaffold files into a target directory, and optionally initialize git/install dependencies. For OpenPAUL, the CLI installer would initialize OpenPAUL configuration in a project, creating the necessary directory structure and state files.

**Key findings:**

1. **npx execution** requires `bin` field in package.json mapping command name to executable file with `#!/usr/bin/env node` shebang
2. **Interactive prompts** are table stakes — users expect guided setup with `@inquirer/prompts` or similar
3. **Non-interactive mode** (`--yes`) is critical for CI/automation and should skip all prompts using defaults
4. **No git/package manager handling** — OpenPAUL is for *existing* projects, not scaffolding new ones (anti-feature)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `npx openpaul` execution | Users expect `create-*` style invocation via npx/npm create | LOW | Requires `bin` field in package.json, shebang in entry file |
| Help flag (`-h`, `--help`) | Standard CLI expectation | LOW | Shows available options and usage |
| Version flag (`-v`, `--version`) | Standard CLI expectation | LOW | Outputs package version |
| Project path argument | Users specify where to initialize | LOW | `[project-path]` positional arg; defaults to current dir (`.`) |
| Interactive prompts | Users expect guided setup | MEDIUM | Use `@inquirer/prompts` or similar; asks for configuration choices |
| Error messages | Users need clear feedback on failures | LOW | Colored output (chalk), clear exit codes |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Non-interactive mode (`--yes`, `-y`) | CI/automation friendly, skips all prompts | LOW | Uses defaults or stored preferences |
| Template presets | Quick start with different configurations | MEDIUM | e.g., "minimal", "full", "team" setups |
| Skip dependency install (`--skip-install`) | Faster init, user installs manually | LOW | Useful in air-gapped or custom environments |
| Verbose mode (`--verbose`) | Debug visibility into what's happening | LOW | Shows all operations, useful for troubleshooting |
| Dry run (`--dry-run`) | Preview changes without writing files | MEDIUM | Shows what would be created |
| Existing project detection | Better UX when running in already-initialized project | MEDIUM | Detect existing `.paul/` and offer upgrade/reinit options |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Git initialization (`--git`) | Create-next-app does it | OpenPAUL is for *existing* projects, not new ones; git likely exists already | Skip git handling entirely |
| Package manager selection | Other scaffolders ask npm/yarn/pnpm | OpenPAUL doesn't install dependencies; it creates config files | No package manager interaction |
| Example/template from GitHub | Vite/Next.js support this | Adds network dependency, complexity for what's essentially config files | Built-in presets only |
| Force overwrite (`--force`) | "Just overwrite everything" | Destroys user state, data loss risk | Explicit confirmation prompts, backup option |

## Feature Dependencies

```
npx openpaul execution
    └──requires──> bin field in package.json
    └──requires──> shebang (#!/usr/bin/env node) in entry file

Interactive prompts
    └──requires──> @inquirer/prompts or similar library
    └──enhances──> Template presets (prompts ask which preset)

Non-interactive mode
    └──requires──> Default values for all prompts
    └──conflicts──> Interactive prompts (mutually exclusive per run)

Dry run mode
    └──requires──> Same logic as normal run, just skip write operations

Existing project detection
    └──requires──> File system checks for .paul/ directory
```

### Dependency Notes

- **npx execution requires bin field:** The `bin` field maps command name to executable file; `npx`/npm create uses this to know what to run
- **Interactive prompts require library:** `@inquirer/prompts` is modern, tree-shakeable, well-maintained alternative to legacy `inquirer`
- **Non-interactive conflicts with prompts:** When `--yes` is passed, skip all prompts and use defaults
- **Dry run enhances all features:** Same logic, just don't write files - useful for debugging

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Basic npx execution** — `npx openpaul` runs without errors
- [ ] **Help flag** — `npx openpaul --help` shows usage
- [ ] **Version flag** — `npx openpaul --version` shows version
- [ ] **Project path argument** — `npx openpaul [path]` or `npx openpaul .`
- [ ] **Interactive prompt for project name** — Asks "What is your project name?" if not provided
- [ ] **Scaffold .paul/ directory** — Creates `.paul/state.json` with initial state
- [ ] **Success/error feedback** — Clear colored output on completion or failure

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Non-interactive mode** — `--yes` flag skips prompts (trigger: CI usage requests)
- [ ] **Verbose mode** — `--verbose` shows detailed operations (trigger: debugging needs)
- [ ] **Template presets** — Offer "minimal" vs "full" initial configs (trigger: user feedback on complexity)
- [ ] **Existing project detection** — Warn if `.paul/` already exists (trigger: re-run confusion)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Dry run mode** — Preview without writing (defer: low demand, implementation cost)
- [ ] **Upgrade existing projects** — Migrate old state.json format (defer: need versioning first)
- [ ] **Custom templates** — User-defined template directories (defer: YAGNI until power users ask)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| npx execution | HIGH | LOW | P1 |
| Help flag | HIGH | LOW | P1 |
| Version flag | HIGH | LOW | P1 |
| Project path argument | HIGH | LOW | P1 |
| Interactive prompts | HIGH | MEDIUM | P1 |
| Scaffold .paul/ structure | HIGH | MEDIUM | P1 |
| Error/success feedback | HIGH | LOW | P1 |
| Non-interactive mode | MEDIUM | LOW | P2 |
| Verbose mode | LOW | LOW | P2 |
| Template presets | MEDIUM | MEDIUM | P2 |
| Existing project detection | MEDIUM | MEDIUM | P2 |
| Dry run | LOW | MEDIUM | P3 |
| Git initialization | LOW | LOW | ANTI-FEATURE |
| Package manager selection | LOW | LOW | ANTI-FEATURE |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | create-next-app | create-vite | create-t3-app | OpenPAUL Approach |
|---------|-----------------|-------------|---------------|-------------------|
| **Invocation** | `npm create next-app` | `npm create vite` | `npm create t3-app` | `npx openpaul` or `npm create openpaul` |
| **Path argument** | `[project-name]` optional | `[project-name]` optional | `[dir]` optional | `[project-path]` optional, default `.` |
| **Help flag** | `-h, --help` | `-h, --help` | (implicit) | `-h, --help` |
| **Version flag** | Not shown | `-v, --version` | Not shown | `-v, --version` |
| **Interactive mode** | Yes (prompts) | Yes (prompts) | Yes (prompts) | Yes (prompts) |
| **Non-interactive** | `--yes` | `--no-interactive` | `-y, --default` | `--yes, -y` |
| **Template selection** | `--example`, `--empty` | `--template` | Built-in packages | Built-in presets |
| **Package manager** | `--use-npm/pnpm/yarn/bun` | Auto-detect | Auto-detect | N/A (no deps) |
| **Git init** | `--disable-git` | No | `--noGit` | N/A (existing project) |
| **Skip install** | `--skip-install` | No | `--noInstall` | N/A (no deps) |
| **CI mode** | Implicit | `--no-interactive` | `--CI` | `--yes` |

## Technical Implementation Notes

### package.json bin Field

```json
{
  "bin": {
    "openpaul": "./dist/cli.js",
    "create-openpaul": "./dist/cli.js"
  }
}
```

Two entries enable both:
- `npx openpaul` — Direct command
- `npm create openpaul` — npm create convention

### Entry File Structure

```javascript
#!/usr/bin/env node
// dist/cli.js - compiled from src/cli.ts

import { parseArgs } from './args.js'
import { runInteractive } from './interactive.js'
import { scaffoldProject } from './scaffold.js'

async function main() {
  const args = parseArgs(process.argv.slice(2))
  
  if (args.help) { showHelp(); process.exit(0) }
  if (args.version) { showVersion(); process.exit(0) }
  
  const config = args.yes 
    ? getDefaultConfig() 
    : await runInteractive(args)
  
  await scaffoldProject(config)
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message)
  process.exit(1)
})
```

### Recommended Libraries

| Library | Purpose | Version | Why |
|---------|---------|---------|-----|
| `@inquirer/prompts` | Interactive prompts | ^5.x | Modern, tree-shakeable, well-typed |
| `chalk` | Colored output | ^5.x | Standard, ESM-native |
| `commander` | Argument parsing | ^12.x | Battle-tested, good TypeScript support |

**Alternative:** No external arg parser — use native `util.parseArgs` (Node 18+) for zero dependencies

### OpenPAUL-Specific Scaffold Files

When `npx openpaul` runs, it should create:

```
.paul/
├── state.json           # Initial project state
├── config.json          # User preferences (optional)
└── .gitignore           # Ignore patterns for paul files
```

**state.json initial structure:**
```json
{
  "version": "1.0.0",
  "projectName": "<from prompt or dir name>",
  "currentPhase": null,
  "currentMilestone": null,
  "loopPosition": "IDLE",
  "createdAt": "<ISO date>",
  "updatedAt": "<ISO date>"
}
```

## Sources

- **npm exec documentation** — https://docs.npmjs.com/cli/v10/commands/npm-exec (HIGH confidence)
- **create-next-app CLI reference** — https://nextjs.org/docs/app/api-reference/cli/create-next-app (HIGH confidence)
- **create-t3-app installation** — https://create.t3.gg/en/installation (HIGH confidence)
- **Vite getting started** — https://vite.dev/guide/#scaffolding-your-first-vite-project (HIGH confidence)
- **Building NPX CLI tools** — https://johnsedlak.com/blog/2025/03/building-an-npx-cli-tool (MEDIUM confidence, blog post)
- **npm bin field verification** — `npm view create-vite bin` and `npm view create-next-app bin` (HIGH confidence, direct npm queries)

---
*Feature research for: CLI Installer (OpenPAUL)*
*Researched: 2026-03-20*
