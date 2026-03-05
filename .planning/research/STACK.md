# Stack Research: PAUL Full Command Implementation

**Domain:** Development workflow management tool (OpenCode plugin)
**Researched:** 2026-03-05
**Overall confidence:** HIGH

## Executive Summary

OpenPAUL v1.1 requires implementing 20 remaining PAUL commands across 7 command categories. The existing stack (TypeScript, Jest, Zod, ES Modules, @opencode-ai/plugin) is **sufficient** for all remaining commands—no new external dependencies required. All commands build on established patterns: file-based JSON storage with atomic writes, Zod validation schemas, OpenCode plugin tool registration, and Node.js built-in modules.

The primary stack additions are **internal TypeScript types and FileManager extensions**, not external libraries. Commands manipulate Markdown files (ROADMAP.md, DISCOVERY.md, CONTEXT.md, etc.) using Node.js `fs` module with existing `atomic-write` pattern. Complex workflows (like `map-codebase` with parallel Explore agents) leverage OpenCode's existing `Task` tool with `subagent_type` parameter—no additional orchestration libraries needed.

Key differentiator from general dev tools: **structured file-based communication**. PAUL persists all state to JSON/Markdown files in `.paul/` directory, surviving process restarts and enabling multi-session workflows. Commands are self-contained, share no in-memory state, and communicate through files—following Unix philosophy but with type-safe schemas.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **TypeScript** | ^5.0.0 | Type safety, code quality | Enables compile-time error detection, IDE support, Zod schema integration. Already in stack, all existing patterns use TypeScript interfaces + Zod runtime validation. |
| **@opencode-ai/plugin** | ^1.2.0 | OpenCode plugin API, tool registration | Required for plugin development. Provides `tool()` helper, `Task` tool for subagents, hooks system. Already in stack, all commands follow this pattern. |
| **Zod** | ^3.22.0 | Runtime validation, schema definitions | Validates JSON state files on read/write. Prevents corruption, catches schema mismatches early. Already in stack, used for all state types (State, Plan, Session). |
| **Jest** | ^29.0.0 | Testing framework, test runner | TDD-friendly, TypeScript-native via `ts-jest`. Already in stack, configured with 80% coverage threshold. All existing tests use Jest. |
| **ES Modules** | ES2020 | Module system, import/export | Modern standard, better tree-shaking, native async support. Already in stack (`"type": "module"` in package.json). |

### Node.js Built-Ins (No new dependencies)

| Module | Purpose | When Used |
|--------|---------|-----------|
| **fs** (readFileSync, existsSync, mkdirSync) | File operations, JSON state persistence | All commands read/write `.paul/` directory files. Uses existing `atomic-writes.ts` wrapper. |
| **path** (join) | Path construction, cross-platform compatibility | All file path operations. Already in stack (imported in FileManager). |
| **crypto.randomUUID()** | Session ID generation | `pause` command creates unique session IDs. Built-in since Node.js 16.7.0. |
| **Date.now()** | Timestamps, file naming | All commands create timestamped files. No dependency needed. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **ts-jest** | ^29.0.0 | TypeScript preprocessor for Jest | Already in stack, enables running `.test.ts` files directly with type checking. |
| **@types/node** | ^20.0.0 | TypeScript type definitions for Node.js | Already in stack, provides type hints for `fs`, `path`, `crypto`. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Jest** | Unit testing, coverage | Configured with `ts-jest` preset, 80% coverage threshold. Run `npm test` for test suite, `npm run test:coverage` for coverage report. |
| **TypeScript compiler (tsc)** | Type checking, compilation to `dist/` | Run `npm run build` to compile. Source maps enabled for debugging. |
| **Atomic writes pattern** | File write safety, prevent corruption | Existing `src/storage/atomic-writes.ts` provides `atomicWrite()` helper. Use for ALL file writes. |

## Stack Additions by Command Category

### Session Management (4 commands): pause, resume, handoff, status

**No new dependencies required.**

**Stack needs:**
- **Type:** `SessionState` interface with Zod schema (loop position, timestamp, metadata)
- **Type:** `Handoff` interface with Zod schema (context, decisions, next action)
- **FileManager methods:** `readSessionState()`, `writeSessionState()`, `readHandoff()`, `writeHandoff()`, `listSessions()`, `archiveSession()`

**Patterns:**
- Session files: `.paul/sessions/{session-id}-SESSION.json`
- Handoff files: `.paul/sessions/{session-id}-HANDOFF.md`
- One active session per project (replaced on new `pause`)

### Roadmap Management (2 commands): add-phase, remove-phase

**No new dependencies required.**

**Stack needs:**
- **Markdown parsing:** Regex-based manipulation of ROADMAP.md tables and phase sections
- **Type:** `RoadmapPhase` interface (number, name, status, plans array)
- **FileManager methods:** `readRoadmap()`, `writeRoadmap()` (Markdown, not JSON)

**Patterns:**
- Parse ROADMAP.md using regex to extract phase table and details
- Insert/remove phase entries while renumbering subsequent phases
- Validate phase status before removal (cannot remove in-progress phases)

### Milestone Management (3 commands): milestone, complete-milestone, discuss-milestone

**No new dependencies required.**

**Stack needs:**
- **Type:** `Milestone` interface with Zod schema (name, version, phases, status)
- **Type:** `MilestoneArchive` interface (archived milestone data)
- **FileManager methods:** `readMilestone()`, `writeMilestone()`, `archiveMilestone()`
- **File operations:** Create `.paul/milestones/` directory, move phase artifacts to archive

**Patterns:**
- Active milestone: `.paul/MILESTONES.md` (Markdown)
- Archived milestones: `.paul/milestones/{version}/MILESTONE-ARCHIVE.md`
- `complete-milestone` moves all phase artifacts to milestone archive directory

### Pre-Planning (4 commands): discuss, assumptions, discover, consider-issues

**No new dependencies required.**

**Stack needs:**
- **Type:** `PhaseContext` interface with Zod schema (goals, approach, constraints, open questions)
- **Type:** `Discovery` interface with Zod schema (topic, options, recommendation, confidence)
- **Type:** `Issue` interface with Zod schema (id, type, description, impact, effort)
- **FileManager methods:** `readPhaseContext()`, `writePhaseContext()`, `readDiscovery()`, `writeDiscovery()`, `readIssues()`, `writeIssues()`
- **Template rendering:** Fill Markdown templates with command data

**Patterns:**
- `discuss`: Creates `.paul/phases/{NN-name}/CONTEXT.md` from discussion workflow
- `assumptions`: Creates `.paul/phases/{NN-name}/ASSUMPTIONS.md` with phase assumptions
- `discover`: Creates `.paul/phases/{NN-name}/DISCOVERY.md` with research findings
- `consider-issues`: Creates `.paul/ISSUES.md` (project-level) with deferred enhancements

**Templates:**
- `src/templates/CONTEXT.md` — Phase context template
- `src/templates/DISCOVERY.md` — Technical discovery template
- `src/templates/ISSUES.md` — Issues log template

### Research (2 commands): research, research-phase

**No new dependencies required.**

**Stack needs:**
- **Type:** `ResearchSummary` interface with Zod schema (domain, findings, stack, features, architecture, pitfalls)
- **FileManager methods:** `readResearch()`, `writeResearch()`, `listResearch()`
- **OpenCode Task tool:** Leverage `Task` tool with `subagent_type="Explore"` for research subagents

**Patterns:**
- `research`: Creates `.planning/research/SUMMARY.md` with ecosystem research
- `research-phase`: Creates `.planning/research/{topic}.md` (STACK.md, FEATURES.md, etc.)
- Research outputs follow defined templates (`.opencode/get-shit-done/templates/research-*/*.md`)

**OpenCode integration:**
```typescript
// Spawn research subagent
const { client } = context
await client.task.subagent({
  type: 'Explore',
  description: 'Research topic X',
  // Research findings collected via context output
})
```

### Quality (2 commands): verify, plan-fix

**No new dependencies required.**

**Stack needs:**
- **Type:** `VerificationReport` interface with Zod schema (checks, findings, status, recommendations)
- **Type:** `FixPlan` interface with Zod schema (issue, tasks, priority)
- **FileManager methods:** `readVerificationReport()`, `writeVerificationReport()`, `readFixPlan()`, `writeFixPlan()`
- **Template rendering:** Fill verification report templates

**Patterns:**
- `verify`: Runs quality checks (lint, tests, type checking), generates `.paul/verification-report.md`
- `plan-fix`: Creates plan to address issues found during verification
- Integration with external tools (SonarQube) via MCP servers (optional, configured in `config.md`)

**Templates:**
- `.opencode/get-shit-done/templates/verification-report.md` — Verification report template

### Configuration (3 commands): config, flows, map-codebase

**No new dependencies required.**

**Stack needs:**
- **Type:** `ProjectConfig` interface with Zod schema (project settings, integrations, preferences)
- **Type:** `SpecialFlow` interface with Zod schema (skill mappings, triggers, phase overrides)
- **FileManager methods:** `readConfig()`, `writeConfig()`, `readSpecialFlows()`, `writeSpecialFlows()`
- **OpenCode Task tool:** `map-codebase` spawns 4 parallel Explore agents with `run_in_background=true`

**Patterns:**
- `config`: Creates/modifies `.paul/config.md` with project settings and integrations
- `flows`: Creates/modifies `.paul/SPECIAL-FLOWS.md` with skill mappings
- `map-codebase`: Spawns parallel Explore agents, creates `.paul/codebase/` directory with 7 documents

**Parallel agent spawning (map-codebase):**
```typescript
const agents = [
  client.task.subagent({ type: 'Explore', run_in_background: true, description: 'Stack + Integrations' }),
  client.task.subagent({ type: 'Explore', run_in_background: true, description: 'Architecture + Structure' }),
  client.task.subagent({ type: 'Explore', run_in_background: true, description: 'Conventions + Testing' }),
  client.task.subagent({ type: 'Explore', run_in_background: true, description: 'Concerns' }),
]
// Wait for all agents, collect outputs via TaskOutput tool
```

**Templates:**
- `src/templates/config.md` — Project config template
- `src/templates/SPECIAL-FLOWS.md` — Special flows template
- `src/templates/codebase/*.md` — 7 codebase mapping documents (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS)

## Installation

```bash
# Core (already installed)
npm install @opencode-ai/plugin zod

# Dev dependencies (already installed)
npm install -D typescript jest @types/node @types/jest ts-jest

# No new packages required for v1.1 commands
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| **Built-in `crypto.randomUUID()`** | `uuid` package | `crypto.randomUUID()` is built-in since Node.js 16.7.0, cryptographically secure, zero-dependency. |
| **Node.js `fs` module** | `fs-extra` package | All required operations (read, write, mkdir) are in built-in `fs`. Existing `atomic-writes.ts` wrapper provides safety. |
| **Regex-based Markdown parsing** | `marked`, `remark` libraries | ROADMAP.md structure is predictable (tables, section headers). Regex is sufficient, lighter weight, no additional dependencies. |
| **Manual file operations** | `lowdb`, `json-file` packages | File-based JSON is simple enough with built-in `fs`. No need for database abstraction layer. |
| **OpenCode Task tool for subagents** | `execa`, `child_process` spawning | OpenCode's `Task` tool provides subagent orchestration with context management. No need for manual process spawning. |
| **Zod schemas** | `class-validator`, `io-ts` | Zod is already in stack, excellent TypeScript integration, runtime validation, schema-first approach. No migration needed. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **SQLite database** | Project explicitly uses file-based JSON for simplicity. Database adds complexity, migration burden. | File-based JSON in `.paul/` directory with atomic writes |
| **Markdown template engines** | (Handlebars, EJS, Pug) | Template filling is simple string replacement. No need for full template engine. | Manual string replacement with template placeholders |
| **ORM libraries** | (TypeORM, Prisma, Mongoose) | No relational database. State is simple JSON structures. | Direct JSON read/write with Zod validation |
| **External task orchestration** | (Bull, Agenda, Redis queues) | OpenCode's `Task` tool provides subagent orchestration. No external queue needed. | OpenCode `Task` tool with `run_in_background=true` |
| **CLI argument parsers** | (commander, yargs, meow) | Commands are OpenCode plugin tools, not standalone CLI. Zod validates parameters. | `tool()` helper from `@opencode-ai/plugin` with Zod schemas |
| **Git operations libraries** | (simple-git, nodegit) | Git operations happen in workflows (bash commands), not in plugin code. Plugin reads Git state from files. | Manual bash `git` commands in workflows, file-based state |

## Stack Patterns by Command Type

**If command manipulates Markdown files (ROADMAP.md, DISCOVERY.md, etc.):**
- Use regex-based parsing (tables, section headers, frontmatter)
- Manual string manipulation for insert/delete operations
- Validate against template structure
- Write with atomic write guarantee
- Because: Markdown structure is predictable, regex is sufficient, no heavy dependencies

**If command creates JSON state files:**
- Define TypeScript interface
- Create Zod schema for runtime validation
- Use FileManager methods for read/write
- Write with atomic write guarantee
- Because: Type safety + runtime validation prevents corruption, schema-first approach

**If command spawns subagents:**
- Use OpenCode `Task` tool with `subagent_type="Explore"`
- Set `run_in_background=true` for parallel execution
- Collect outputs via `TaskOutput` tool
- Wait for all agents before proceeding
- Because: OpenCode provides context-aware subagent orchestration, no external libraries needed

**If command requires file timestamps:**
- Use `Date.now()` for Unix timestamps
- Format as ISO strings for human readability
- Include in filenames: `{timestamp}-{name}.{ext}`
- Because: Node.js built-in, simple, sufficient for ordering

**If command requires unique IDs:**
- Use `crypto.randomUUID()` (Node.js 16.7.0+)
- No need for `uuid` package
- Because: Built-in, cryptographically secure, zero-dependency

## Version Compatibility

| Package | Compatible With | Notes |
|-----------|-----------------|-------|
| **@opencode-ai/plugin@^1.2.0** | TypeScript ^5.0.0, Node.js >=16.7.0 | Plugin API stable, all commands use `tool()` helper pattern |
| **zod@^3.22.0** | TypeScript ^5.0.0 | Zod schemas compile with TypeScript types, runtime validation |
| **jest@^29.0.0** | ts-jest@^29.0.0, TypeScript ^5.0.0 | Requires `ts-jest` for TypeScript test files |
| **typescript@^5.0.0** | Node.js >=16.7.0 | Target ES2020 for modern JavaScript features |
| **ts-jest@^29.0.0** | jest@^29.0.0, TypeScript ^5.0.0 | Required preprocessor for Jest TypeScript support |

**Critical: Node.js version requirement is >=16.7.0** for `crypto.randomUUID()` availability. This is already enforced in `package.json` (`"engines": { "node": ">=16.7.0" }`).

## Sources

### Primary (HIGH confidence)
- **OpenPAUL Source Code (v1.0)** — Existing architecture, command patterns, FileManager, StateManager, atomic writes, type definitions
- **OpenCode Plugin API (@opencode-ai/plugin@1.2.16)** — Tool registration, Task tool for subagents, hooks system, plugin lifecycle
- **Node.js v22.14.0 Documentation** — Built-in modules (fs, path, crypto), crypto.randomUUID() availability, file operations
- **Zod v3.25.76 Documentation** — Schema validation, TypeScript integration, runtime type checking
- **TypeScript v5.9.3 Documentation** — Type system, interface definitions, compilation to ES modules

### Secondary (MEDIUM confidence)
- **OpenPAUL Workflows** — Command specifications, template structures, file formats (ROADMAP.md, DISCOVERY.md, etc.)
- **Jest v29.7.0 Documentation** — Testing patterns, coverage configuration, ts-jest integration
- **Markdown Regex Patterns** — Table parsing, section header extraction, frontmatter parsing (derived from multiple markdown parsing resources)

### Tertiary (LOW confidence)
- **CLI Design Patterns** — Derived from command-line interface best practices (not dev-tool specific)
- **File-based State Management** — General patterns from stateless systems (not specific to PAUL workflow tools)

---

*Stack research for: PAUL Full Command Implementation (v1.1)*
*Researched: 2026-03-05*
*Ready for implementation: yes*
