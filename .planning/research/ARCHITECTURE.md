# Architecture Research: CLI Installer Integration

**Domain:** npm package CLI installer for TypeScript/ES Module plugin
**Researched:** 2026-03-20
**Confidence:** HIGH (npm docs, Node.js docs, verified create-* patterns)

## Executive Summary

Adding `npx openpaul` CLI installer to the existing TypeScript/OpenCode plugin requires:

1. **Single new source file**: `src/cli/install.ts` (TypeScript installer logic)
2. **Single package.json change**: Add `"bin"` field pointing to compiled output
3. **Build integration**: tsc already compiles src/ → dist/, no bundler needed
4. **Dual entry points**: Plugin via `main`, CLI via `bin` — coexist in same package

The key insight: The bin field should point to **compiled** output (`./dist/install.js`), not source TypeScript. This leverages the existing tsc build pipeline and maintains type safety throughout.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            User Workflow                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  npx openpaul ───────────────────────────────────────────────► CLI Installer │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                          npm Package                                         │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────────┐│
│  │ package.json│     │                    dist/                            ││
│  │   "bin":    │────►│  ┌─────────────┐  ┌─────────────────────────────┐   ││
│  │   {...}     │     │  │ install.js  │  │ index.js (plugin entry)     │   ││
│  └─────────────┘     │  └─────────────┘  │ + commands/                 │   ││
│                      │                    │ + types/                    │   ││
│                      └───────────────────┴─────────────────────────────┘   ││
└─────────────────────────────────────────────────────────────────────────────┘
```

## Recommended Architecture

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `src/cli/install.ts` | CLI installer implementation (TypeScript) | Source file, compiled by tsc |
| `dist/install.js` | Compiled CLI entry (auto-generated) | Build output, has shebang |
| `package.json#bin` | npm bin field mapping | Maps `openpaul` → `./dist/install.js` |
| `src/index.ts` | Plugin entry point (unchanged) | OpenCode plugin export |

### File Location Decision

**Recommended: `src/cli/install.ts` → `dist/install.js`**

Rationale:
1. **Type safety** — Full TypeScript for installer logic
2. **Build consistency** — Same tsc pipeline as existing plugin
3. **Single source of truth** — All src/ TypeScript, all dist/ compiled
4. **No bundler needed** — tsc already configured and working

**Alternative (NOT recommended): Root `bin/install.js`**
- Requires JavaScript (no TypeScript)
- Bypasses existing build pipeline
- Loses type safety for installer logic

### Project Structure After Integration

```
openpaul/
├── dist/                      # Compiled output (npm publishes this)
│   ├── index.js               # Plugin entry (existing)
│   ├── install.js             # CLI installer (NEW - compiled)
│   ├── commands/              # Command handlers (existing)
│   ├── types/                 # Type definitions (existing)
│   └── ...
├── src/
│   ├── index.ts               # Plugin entry (existing)
│   ├── cli/                   # NEW directory
│   │   └── install.ts         # CLI installer implementation
│   ├── commands/              # Command handlers (existing)
│   └── ...
├── package.json               # Modified: add "bin" field
└── tsconfig.json              # Unchanged (handles new src/cli/ automatically)
```

### package.json Changes

```json
{
  "name": "openpaul",
  "version": "1.3.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "openpaul": "./dist/install.js"
  },
  "files": [
    "dist",
    "README.md"
  ]
}
```

**Key points:**
- `"bin"` points to compiled output in `dist/`
- Package name `openpaul` becomes the CLI command
- `npx openpaul` downloads and executes `./dist/install.js`

## Architectural Patterns

### Pattern 1: Shebang in TypeScript Source

**What:** Include shebang in TypeScript source file; tsc preserves it in output.

**When to use:** When TypeScript compiles to a CLI entry point.

**Example:**
```typescript
// src/cli/install.ts
#!/usr/bin/env node

import { copyTemplateFiles } from './templates.js';
import { promptForProjectDetails } from './prompts.js';

async function main() {
  console.log('🚀 Initializing OpenPAUL project...');
  // Installer logic
}

main().catch((error) => {
  console.error('Installation failed:', error);
  process.exit(1);
});
```

**Trade-offs:**
- ✅ Works with tsc (preserves comments including shebang)
- ✅ Type safety for entire installer
- ✅ Consistent with existing build pipeline
- ⚠️ Shebang must be first line (no imports above it)

### Pattern 2: ES Module Path Resolution

**What:** Use `import.meta` for file path resolution in ES modules.

**When to use:** When needing to locate templates or resources relative to package.

**Example:**
```typescript
// src/cli/install.ts
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve templates relative to compiled CLI location
// dist/install.js -> dist/../src/templates (in dev)
// OR node_modules/openpaul/dist/install.js -> node_modules/openpaul/src/templates
const templatesDir = join(__dirname, '..', 'templates');
```

**Trade-offs:**
- ✅ Standard ES module pattern (Node.js 14+)
- ✅ Works regardless of installation location
- ✅ Node.js 20+ has `import.meta.dirname` shorthand
- ⚠️ Need to handle dev vs published paths

### Pattern 3: Dual Entry Points (Plugin + CLI)

**What:** Same package exports both a plugin and a CLI installer.

**When to use:** When package serves as both library/plugin and command-line tool.

**Structure:**
```
package.json:
├── "main": "dist/index.js"      # Plugin import entry
├── "bin": { "openpaul": "..." } # CLI command entry
└── "types": "dist/index.d.ts"   # TypeScript types
```

**Trade-offs:**
- ✅ Single package to publish/maintain
- ✅ `npm install openpaul` provides both
- ✅ `npx openpaul` works for one-off usage
- ⚠️ Slightly larger package (includes both)

**Precedents:**
- `create-next-app` uses this pattern (TypeScript → dist/)
- `create-react-app` uses this pattern (JavaScript at root)

## Data Flow

### npx Execution Flow

```
User: npx openpaul
    ↓
[npm resolves "openpaul" package]
    ↓
[Downloads/caches package from npm]
    ↓
[Reads package.json#bin.openpaul]
    ↓
[Executes ./dist/install.js with node]
    ↓
#!/usr/bin/env node  ← Shebang tells system to use Node
    ↓
[install.js runs installer logic]
    ↓
[Uses templates from package's src/templates/]
    ↓
[Copies/creates files in target project]
```

### Build Order Dependency

```
npm run build (tsc)
    ↓
    ├── src/index.ts → dist/index.js (plugin entry)
    ├── src/commands/*.ts → dist/commands/*.js
    ├── src/cli/install.ts → dist/install.js (NEW - CLI entry)
    └── (templates copied via files array in package.json)
```

**Critical:** `tsc` must run BEFORE `npm publish` because:
1. `bin` field points to `dist/install.js`
2. That file must exist for `npx openpaul` to work
3. `prepublishOnly` script already runs `npm run build`

## Integration Points

### New Files Required

| File | Purpose | Type |
|------|---------|------|
| `src/cli/install.ts` | CLI installer implementation | NEW |
| `dist/install.js` | Compiled CLI entry | Build output (auto-generated) |
| `dist/cli/` | Compiled CLI supporting modules | Build output (auto-generated) |

### Modified Files Required

| File | Change | Impact |
|------|--------|--------|
| `package.json` | Add `"bin": { "openpaul": "./dist/install.js" }` | Enables npx command |

### Unchanged Files (Integration Isolated)

| File | Reason |
|------|--------|
| `src/index.ts` | Plugin entry remains unchanged |
| `tsconfig.json` | Current config handles new src/cli/ directory (rootDir: ./src) |
| `package.json#main` | Points to dist/index.js (plugin) — no change |
| `package.json#files` | Already includes dist/ and src/templates |
| All `src/commands/*` | Existing plugin commands — no change |

## Interaction with dist/ Compilation

### How It Works

1. **Source**: `src/cli/install.ts` contains TypeScript with shebang
2. **Compile**: `tsc` compiles to `dist/cli/install.js` preserving shebang
3. **Bin field**: `package.json` points to `./dist/cli/install.js`
4. **npx**: Downloads package, executes the compiled JS with Node

### Build Script (No Changes Needed)

```json
{
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  }
}
```

The existing `tsc` build already:
- Compiles all `src/**/*.ts` to `dist/**/*.js`
- Preserves comments (including shebang)
- Generates source maps
- Outputs ES modules (type: "module")

### Verification: tsc Preserves Shebang

TypeScript's `tsc` compiler preserves comments by default. The shebang `#!/usr/bin/env node` is a comment and will be included at the top of the compiled output.

**Test this:**
```bash
# After adding src/cli/install.ts with shebang
npm run build
head -n1 dist/cli/install.js
# Should output: #!/usr/bin/env node
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Pointing bin to TypeScript Source

**What people do:** Set `"bin": "./src/cli/install.ts"`

**Why it's wrong:** Node.js cannot execute TypeScript directly; npx would fail.

**Do this instead:** Point to compiled output: `"bin": "./dist/install.js"`

### Anti-Pattern 2: Creating a Bundled Single File

**What people do:** Use webpack/esbuild/ncc to bundle everything into one file.

**Why it's unnecessary:** OpenPAUL is already structured for tsc compilation. The existing plugin architecture works with ES modules. No bundler needed.

**Do this instead:** Let tsc compile naturally; rely on `files` array in package.json.

### Anti-Pattern 3: Separate bin/ Directory at Root

**What people do:** Create `bin/install.js` as JavaScript outside src/.

**Why it's suboptimal:** 
- Bypasses TypeScript type checking
- Separate from existing code patterns
- Requires different tooling/testing approach

**Do this instead:** Put installer logic in `src/cli/` with TypeScript, compile to `dist/`.

## Sources

- **npm package.json bin field**: https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin
  - HIGH confidence - official npm documentation
  - Confirms bin maps command names to file paths
  - Files must start with `#!/usr/bin/env node`

- **npx command behavior**: https://docs.npmjs.com/cli/v10/commands/npx
  - HIGH confidence - official npm documentation
  - Confirms npx downloads, caches, and executes packages
  - Uses bin field to determine what to run

- **create-react-app package.json**: https://github.com/facebook/create-react-app
  - HIGH confidence - verified pattern from major project
  - Uses root `./index.js` with CommonJS (older pattern)

- **create-next-app package.json**: https://github.com/vercel/next.js
  - HIGH confidence - verified pattern from major project  
  - Uses TypeScript source compiled to `./dist/index.js`
  - Bin points to compiled output: `"bin": { "create-next-app": "./dist/index.js" }`
  - Uses ncc bundler (OpenPAUL doesn't need bundler)

- **Node.js ES Modules**: https://nodejs.org/api/esm.html
  - HIGH confidence - official Node.js documentation
  - Confirms `import.meta.url` for path resolution
  - Shebang works with ES modules

---
*Architecture research for: CLI installer integration with TypeScript/ES Module plugin*
*Researched: 2026-03-20*
