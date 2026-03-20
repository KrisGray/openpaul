# Project Research Summary

**Project:** OpenPAUL CLI Installer (v2.0 Milestone)
**Domain:** npm CLI installer for existing TypeScript plugin
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

OpenPAUL needs to add `npx openpaul` CLI installer capability to its existing TypeScript/ESM npm package. This is a **scaffolding/init tool** pattern, similar to `create-next-app` or `create-vite`, but for initializing OpenPAUL configuration in *existing* projects rather than creating new ones.

**Recommended approach:** Add a `bin` field to package.json pointing to compiled TypeScript output (`dist/cli.js`), using `commander` for argument parsing. Start with a minimal non-interactive implementation that scaffolds `.paul/state.json`, then optionally add `@clack/prompts` for interactive flows. TypeScript preserves the `#!/usr/bin/env node` shebang, so no bundler or separate JavaScript entry point is needed.

**Key risks:** (1) Bin file not built before publish — must enforce `prepublishOnly` runs build, (2) Cross-platform line endings — CRLF breaks on Linux/macOS, (3) ESM module resolution — OpenPAUL uses `"type": "module"`, bin must import correctly.

## Key Findings

### Recommended Stack

The CLI installer is lightweight — it needs only argument parsing and file scaffolding. OpenPAUL's existing TypeScript build pipeline handles compilation.

**Core technologies:**
- **commander ^14.0.0** — CLI argument parsing with auto-generated help, TypeScript support, 276M weekly downloads, zero deps
- **Node.js shebang** — `#!/usr/bin/env node` preserved by TypeScript, no dependency needed

**Conditional additions:**
- **@clack/prompts ^1.1.0** — Interactive prompts if needed (14x smaller than inquirer, minimal UI)
- **picocolors ^1.1.0** — Terminal colors if needed (14x smaller than chalk, zero deps)

**Avoid:** execa (unnecessary), ora (brings chalk transitively), ts-node in bin (not production-ready), shelljs (bloat)

### Expected Features

**Must have (table stakes):**
- `npx openpaul` execution — users expect create-* style invocation
- Help flag (`--help`) — standard CLI expectation
- Version flag (`--version`) — standard CLI expectation
- Project path argument — `npx openpaul [path]`, defaults to current dir
- Scaffold `.paul/state.json` — creates initial project state
- Clear error/success messages — colored output for feedback

**Should have (competitive):**
- Non-interactive mode (`--yes`) — CI/automation friendly, skips prompts
- Verbose mode (`--verbose`) — debug visibility
- Existing project detection — warn if `.paul/` already exists

**Defer (v2+):**
- Dry run mode — preview without writing
- Template presets — minimal/full setups
- Custom templates — user-defined scaffolds

**Anti-features (do NOT implement):**
- Git initialization — OpenPAUL is for *existing* projects
- Package manager selection — OpenPAUL doesn't install dependencies

### Architecture Approach

Add **one source file** (`src/cli/install.ts`) and **one package.json field** (`bin`). The existing TypeScript build compiles `src/cli/install.ts` → `dist/cli/install.js`, and npm handles executable permissions on install.

**Major components:**
1. **src/cli/install.ts** — CLI installer implementation (TypeScript with shebang)
2. **dist/cli/install.js** — Compiled entry point (auto-generated, has shebang)
3. **package.json#bin** — Maps `openpaul` command to `./dist/cli/install.js`
4. **src/index.ts** — Plugin entry point (unchanged)

**Key pattern:** Dual entry points in same package. Plugin via `main: dist/index.js`, CLI via `bin: { openpaul: ./dist/cli/install.js }`. Both coexist — `npm install openpaul` provides plugin import, `npx openpaul` runs installer.

### Critical Pitfalls

1. **Bin file not built before publish** — Add `prepublishOnly: npm run build`, verify with `npm pack`
2. **CRLF line endings** — Add `.gitattributes` with `*.js text eol=lf`, breaks Linux/macOS otherwise
3. **Missing shebang** — Must be literal first line `#!/usr/bin/env node`, no BOM or leading spaces
4. **Files array excludes dist/** — Bin wrapper auto-included but compiled target is not; must list `dist` in `files`
5. **ESM import path** — Use `.js` extension in imports (`import { x } from './module.js'`), required for ES modules

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: CLI Foundation
**Rationale:** Establish the bin field, shebang, and build integration before adding features. This is the infrastructure that everything else depends on.
**Delivers:** Working `npx openpaul --version` command, verified build pipeline
**Addresses:** npx execution, help flag, version flag from FEATURES.md
**Avoids:** Pitfalls CLI-1 (shebang), CLI-2 (not built), CLI-3 (line endings), CLI-4 (ESM), CLI-5 (files array)

**Tasks:**
- Add `bin` field to package.json
- Create `src/cli/install.ts` with shebang and minimal stub
- Add `.gitattributes` for LF line endings
- Verify `npm pack` includes dist/cli/install.js
- Add prepublishOnly script enforcement

### Phase 2: Scaffold Command
**Rationale:** With CLI working, implement the core init functionality that creates `.paul/` structure.
**Delivers:** `npx openpaul init [path]` that scaffolds initial project state
**Uses:** commander for argument parsing, existing FileManager patterns
**Implements:** Core scaffolding logic, error/success feedback

**Tasks:**
- Implement `init` subcommand with commander
- Create scaffold logic for `.paul/state.json`
- Add project path argument handling
- Implement clear error messages with colored output
- Handle existing project detection (warn if `.paul/` exists)

### Phase 3: Interactive Mode (Optional)
**Rationale:** After core works, add guided setup experience. This can be deferred based on user feedback.
**Delivers:** Interactive prompts for project configuration
**Uses:** @clack/prompts, commander
**Implements:** Guided setup flow with defaults

**Tasks:**
- Add @clack/prompts dependency
- Implement interactive prompt flow
- Add `--yes` flag for non-interactive bypass
- Test CI/automation use case

### Phase 4: Polish & Documentation
**Rationale:** Final testing across platforms, documentation, and edge case handling.
**Delivers:** Production-ready, documented CLI installer
**Implements:** Cross-platform verification, README updates

**Tasks:**
- Test on Windows, Linux, macOS (or CI matrix)
- Update README with CLI usage documentation
- Add `npx openpaul` examples to docs
- Verify plugin import still works (dual entry points)
- Add E2E test in CI

### Phase Ordering Rationale

- **Foundation first** — Without bin working, nothing else matters. This phase has the most pitfalls.
- **Scaffold second** — Core value proposition. Users need `init` command to work.
- **Interactive optional** — Can ship without it; add based on feedback. Non-interactive mode is CI-friendly.
- **Polish last** — Cross-platform testing and docs after functionality is complete.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Scaffold file structure — need to confirm exactly what `.paul/state.json` should contain and what other files to create
- **Phase 3:** Interactive flow design — need to decide which prompts are valuable vs. noise

Phases with standard patterns (skip research-phase):
- **Phase 1:** Well-documented npm bin patterns, commander usage is straightforward
- **Phase 4:** Standard testing and documentation practices

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | npm official docs, verified package downloads, TypeScript shebang preservation confirmed |
| Features | HIGH | Official docs from create-next-app, create-vite, create-t3-app; clear patterns established |
| Architecture | HIGH | npm bin documentation, create-next-app source verified, ESM patterns documented |
| Pitfalls | HIGH | npm docs, GitHub issues (#4597, #7302), Stack Overflow with 18+ upvotes |

**Overall confidence:** HIGH

All sources are official documentation (npm, Node.js) or verified open-source implementations (create-next-app, create-vite). CLI installer patterns are well-established in the JavaScript ecosystem.

### Gaps to Address

No significant gaps. Research is comprehensive for CLI installer implementation.

Minor items to validate during planning:
- **Exact state.json schema:** Confirm initial state structure matches OpenPAUL's expectations
- **Template files:** Decide if any template files should be scaffolded beyond state.json
- **Config.json:** FEATURES.md mentions optional config.json — decide if v1 needs it

## Sources

### Primary (HIGH confidence)
- **npmjs.com/package/commander** — Version 14.0.3, 276M weekly downloads, TypeScript support
- **npmjs.com/package/@clack/prompts** — Version 1.1.0, 3.7M weekly, minimal UI
- **docs.npmjs.com/cli/v10/configuring-npm/package-json#bin** — Official bin field documentation
- **docs.npmjs.com/cli/v10/commands/npx** — Official npx behavior documentation
- **docs.npmjs.com/cli/v10/commands/npm-exec** — npm exec/npx execution semantics
- **nextjs.org/docs/app/api-reference/cli/create-next-app** — create-next-app CLI reference
- **vite.dev/guide/#scaffolding-your-first-vite-project** — Vite scaffolding patterns
- **create.t3.gg/en/installation** — create-t3-app installation patterns

### Secondary (MEDIUM confidence)
- **npmjs.com/package/picocolors** — Version 1.1.1, 69M weekly, zero deps
- **npmjs.com/package/yargs** — Alternative to commander, heavier but feature-rich
- **npmtrends.com/commander-vs-oclif-vs-yargs** — Download comparison for stack decision
- **sandromaglione.com/articles/build-and-publish-an-npx-command-to-npm-with-typescript** — Shebang patterns blog

### Tertiary (verified patterns)
- **github.com/facebook/create-react-app** — Root bin/index.js pattern (older CommonJS)
- **github.com/vercel/next.js** — TypeScript → dist pattern (create-next-app uses this)
- **Stack Overflow: npm bin on Windows** — 18+ upvotes, CRLF/symlink issues
- **npm/cli GitHub Issue #4597** — Install fails if bin script doesn't exist
- **npm/cli GitHub Issue #7302** — npm publish behavior with bin field

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
