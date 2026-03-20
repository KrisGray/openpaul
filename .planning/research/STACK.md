# Stack Research: CLI Installer

**Domain:** npm CLI installer for existing TypeScript plugin
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

For adding `npx openpaul` CLI installer to the existing TypeScript plugin, the core requirement is **npm bin configuration** — no heavy framework needed. OpenPAUL already has existing commands logic; the CLI just needs to expose them as a bin script. 

**Recommended approach:** Add `commander` for argument parsing (optional interactive flows with `@clack/prompts`), configure `bin` field in package.json, and use TypeScript's shebang preservation to create the executable entry point. No command execution libraries needed — use Node built-ins if spawning is required.

**Critical finding:** TypeScript 1.6+ preserves shebang lines, so `#!/usr/bin/env node` at the top of `src/cli.ts` will appear in compiled `dist/cli.js`. npm automatically handles chmod on install.

## Recommended Stack

### Core Technologies (Required)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **commander** | ^14.0.0 | CLI argument parsing | Most popular (276M weekly), built-in TypeScript, zero deps, simple API, auto-generated help |
| Node.js built-in | - | Shebang executable | No dependency needed: `#!/usr/bin/env node` at top of entry file |

### Supporting Libraries (Conditional)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@clack/prompts** | ^1.1.0 | Interactive prompts (select, confirm, spinner) | If installer needs interactive flows (project selection, confirmations, progress) |
| **picocolors** | ^1.1.0 | Terminal colors | If colored output needed — 14x smaller than chalk, zero deps, TypeScript included |
| Node.js `util.styleText` | 20.7.0+ | Built-in terminal colors | Alternative to picocolors if targeting Node 20.7+ only — zero dependency |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| TypeScript | Compile bin entry point | Use existing `tsc` build — output to `dist/cli.js` |
| Node.js chmod | Executable permissions | npm handles this automatically on install from `bin` field |

## Installation

```bash
# Core (required)
npm install commander

# Optional: interactive prompts
npm install @clack/prompts

# Optional: terminal colors (if not using Node.js built-in)
npm install picocolors
```

## npm Bin Configuration

### package.json Changes

```json
{
  "bin": {
    "openpaul": "./dist/cli.js"
  },
  "files": [
    "dist",
    "README.md",
    "src/commands",
    "src/templates",
    "src/references",
    "src/workflows",
    "src/rules"
  ]
}
```

### CLI Entry Point Pattern

```typescript
// src/cli.ts
#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { planCommand } from './commands/plan.js';
// ... other commands

const program = new Command();

program
  .name('openpaul')
  .description('Plan-Apply-Unify Loop for structured AI-assisted development')
  .version('1.3.0');

program.addCommand(initCommand);
program.addCommand(planCommand);
// ... add other commands

program.parse();
```

**Key points:**
- Shebang `#!/usr/bin/env node` must be FIRST line (TypeScript preserves it)
- ES Module imports require `.js` extension in paths
- Commander's `.command()` or `.addCommand()` for subcommands
- Call `program.parse()` at the end (no args needed = uses `process.argv`)

### Build Integration

```json
{
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

TypeScript compiles `src/cli.ts` → `dist/cli.js` preserving the shebang. npm handles chmod on install.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **commander** | yargs | If you need advanced middleware, i18n, or complex config file support — yargs is heavier (290KB vs 209KB) but more feature-rich |
| **commander** | oclif | If building a large multi-command CLI with plugins, auto-update, hooks — overkill for this use case |
| **commander** | minimist | If you only need raw argument parsing without help generation — too bare-bones for production CLI |
| **@clack/prompts** | @inquirer/prompts | If you need i18n support, more prompt types, or existing familiarity — @clack is smaller/simpler |
| **picocolors** | chalk | If you need chalk's extensive API (RGB, hex, nested styles) — picocolors covers 95% of use cases |
| **picocolors** | Node.js styleText | If targeting ONLY Node 20.7+ — picocolors has broader compatibility (Node 6+) |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **ts-node in bin** | Requires ts-node installed globally, slow startup, not production-ready | Compile to JS with `tsc`, ship `dist/cli.js` |
| **execa** (for this use case) | Adds 325KB for subprocess execution — OpenPAUL installer doesn't need to spawn other processes | Node.js `child_process` if truly needed |
| **ora** for spinners | Adds chalk dependency transitively | `@clack/prompts` spinner or custom with picocolors |
| **colors.js** | Modifies String.prototype (dangerous), not maintained | picocolors or Node.js styleText |
| **shelljs** | 400KB, introduces shell syntax in JS | execa if truly needed, or Node.js fs/path |
| **prompts** (terkelg) | Smaller ecosystem than @clack or inquirer | @clack/prompts |

## CLI Architecture Decision

### Option A: Minimal (Recommended for OpenPAUL)
```
commander only
├── Parse args
├── Route to existing command logic
└── No interactive prompts
```
**Best for:** Simple command-based CLI, scriptable, CI-friendly

### Option B: Interactive Installer
```
commander + @clack/prompts
├── Parse args
├── Interactive prompts for setup
├── Progress spinners
└── Styled output
```
**Best for:** First-run setup experience, onboarding flows

### Recommendation: Start with Option A
- OpenPAUL already has command logic
- `npx openpaul init` can be non-interactive (accept flags)
- Add @clack/prompts later if interactive setup is requested
- Keeps initial implementation simple and testable

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| commander@14.0.0 | Node 20+ | Existing package.json (Node >= 16.7.0) | ✅ Compatible |
| @clack/prompts@1.1.0 | Node 18+ | May require engines bump | ⚠️ Check if targeting Node 16 |
| picocolors@1.1.1 | Node 6+ | Full compatibility | ✅ |
| TypeScript 5.x | - | Existing setup | ✅ No changes needed |

## Testing CLI

```bash
# Local development
npm run build
node dist/cli.js --help

# Simulate npx (local)
npm link
openpaul --help

# Before publish
npm pack
npm install -g ./openpaul-1.3.0.tgz
openpaul --help
```

## Sources

- **npmjs.com/package/commander** — Version 14.0.3, 276M weekly downloads, TypeScript support — HIGH confidence
- **npmjs.com/package/@clack/prompts** — Version 1.1.0, 3.7M weekly, minimal UI — HIGH confidence  
- **npmjs.com/package/picocolors** — Version 1.1.1, 69M weekly, zero deps — HIGH confidence
- **npmjs.com/package/yargs** — Version 18.0.0, 148M weekly — HIGH confidence
- **npmjs.com/package/execa** — Version 9.6.1, 69M weekly — HIGH confidence (but NOT recommended for this use case)
- **npmtrends.com/commander-vs-oclif-vs-yargs** — Download comparison data — HIGH confidence
- **sandromaglione.com/articles/build-and-publish-an-npx-command-to-npm-with-typescript** — Shebang patterns — MEDIUM confidence

---
*Stack research for: OpenPAUL CLI Installer*
*Researched: 2026-03-20*
