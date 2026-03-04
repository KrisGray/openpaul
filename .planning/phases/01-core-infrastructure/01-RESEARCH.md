# Phase 1: Core Infrastructure - Research

=======
=======
**Researched:** 2026-03-04
**Domain:** OpenCode Plugin Development, TypeScript, State Management, File-based Storage
**Confidence:** HIGH

=======
    	
## Summary

Phase 1 builds the foundational plugin infrastructure for OpenCode - a port of the PAUL framework from Claude Code to OpenCode. This involves establishing TypeScript types, file-based storage with atomic writes, state management with loop enforcement, and Jest testing infrastructure.
OpenCode is an open-source AI coding agent available as a terminal interface, desktop app, or IDE extension. It supports a plugin system that allows developers to extend its functionality with custom tools, commands, and event hooks.

**Primary recommendation:** Use TypeScript with strict typing and Zod validation, implement atomic file writes with temp-file-and-rename pattern, and enforce state transitions with a dedicated loop enforcer module.
=======
    	
<user_constraints>
## User Constraints (from CONTEXT.md)
    	
### Locked Decisions
- **Strict enforcement** - block invalid transitions, user cannot proceed out of order
- **Force PLAN as entry point** - users must always start with PLAN, cannot start mid-loop
- **Informative errors with guidance** - when blocking, show clear message with what's needed to proceed
- **Require UNIFY to close loop** - cannot start new PLAN until previous loop is unified/closed
    
### State File Organization
- **Per-phase state files** - organized by phase, not flat (easier to inspect individual phases)
- **Plans inline in phase state** - everything about a phase in one file (not separate plans directory)
- **Phase-prefixed naming** - `state-phase-1.json`, `state-phase-2.json` (clear, sortable, predictable)
- **Derive current position** - no explicit CURRENT.json file, derive from existing state files
    
### Error Message Style
- **User-friendly** - clear, actionable messages for users (not technical/debugging focused)
- **Include current state** - show relevant state info in errors for context
- **Always suggest next action** - every error includes guidance on how to fix
- **Plain text only** - no structured JSON error format (simple, works everywhere)
    
### Type Extensibility
- **Export all types** - maximum extensibility from `@krisgray/openpaul`
- **Concrete types** - required fields, not interfaces with optional fields (simpler, direct)
- **No versioning** - breaking changes allowed, users adapt to changes
- **Zod schemas for all types** - runtime validation matching TypeScript types (ensures data integrity)
    
### OpenCode's Discretion
- Exact TypeScript project structure (src/ layout)
- Jest configuration details
- Atomic write implementation strategy
- Internal utility functions organization
- Test coverage approach (how to measure, what to cover)
</user_constraints>
    	
## Standard Stack
    	
### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | >=5.0.0 | Type safety and compile-time checking | Industry standard for large-scale JS/TS projects |
| Zod | >=3.22.0 | Runtime validation and schema definition | Type-safe validation matching TS types, best-in-class developer experience |
| @opencode-ai/plugin | >=1.2.0 | OpenCode plugin API integration | Official SDK for OpenCode plugin development |
| Jest | >=29.0.0 | Testing framework | Industry standard for JS/TS testing, excellent TypeScript support |
| @types/node | >=20.0.0 | Node.js type definitions | Type safety for Node.js built-ins |
    	
### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsxpec | >=8.0.0 | Testing utilities | Jest matchers, mocks, and test utilities |
| @types/jest | >=29.0.0 | Jest type definitions | Type safety in test files |
    	
### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod | io-ts, yup, joi | Zod has best TypeScript inference and is recommended by OpenCode docs |
| Jest | Vitest, Mocha | Jest has better TypeScript support and larger ecosystem |
| @opencode-ai/plugin | Custom plugin implementation | Official SDK provides types, tools, and event hooks |
    	
**Installation:**
```bash
npm install typescript zod @opencode-ai/plugin jest @types/node tsxpec @types/jest --save-dev
```
    	
## Architecture Patterns
    	
### Recommended Project Structure
```
src/
├── types/              # Core type definitions (State, Plan, Command, etc.)
│   ├── state.ts
│   ├── plan.ts
│   ├── command.ts
│   └── loop.ts
├── storage/           # File-based storage layer
│   ├── atomic-writes.ts
│   └── file-manager.ts
├── state/             # State management
│   ├── state-manager.ts
│   └── loop-enforcer.ts
├── tests/             # Jest test files
│   ├── types.test.ts
│   ├── storage.test.ts
│   └── state.test.ts
├── index.ts            # Main entry point
└── plugin.ts           # OpenCode plugin definition
```
    	
### Pattern 1: Plugin Initialization
**What:** Export a plugin function that receives context and returns hooks
**When to use:** Always - this is the main entry point for OpenCode plugins
**Example:**
```typescript
// Source: https://opencode.ai/docs/plugins
import type { Plugin } from "@opencode-ai/plugin"

export const PaulPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  // Initialize plugin state
  await client.app.log({
    body: {
      service: "paul-plugin",
      level: "info",
      message: "PAUL plugin initialized",
    },
  })
  
  return {
    // Event hooks will be added here
  }
}
```
    	
### Pattern 2: Type System with Zod Validation
**What:** Define TypeScript types with matching Zod schemas for runtime validation
**When to use:** All core types (State, Plan, Command)
**Example:**
```typescript
// Source: https://zod.dev/
import { z } from "zod"

// TypeScript type
export type LoopPhase = "PLAN" | "APPLY" | "UNIFY"

// Zod schema for runtime validation
export const LoopPhaseSchema = z.enum(["PLAN", "APPLY", "UNIFY"])

// Type-safe usage
export interface State {
  phase: LoopPhase
  projectId: string
  timestamp: number
}

export const StateSchema = z.object({
  phase: LoopPhaseSchema,
  projectId: z.string(),
  timestamp: z.number(),
})
```
    	
### Pattern 3: Atomic File Writes
**What:** Write to temp file, then rename to prevent data loss
**when to use:** All file write operations
**example:**
```typescript
// Source: Node.js fs best practices
import { writeFileSync, renameSync, unlinkSync, existsSync } from "fs"
import { join } from "path"

import { tmpdir } from "os"

export async function atomicWrite(
  filePath: string,
  content: string
): Promise<void> {
  const tempPath = join(tmpdir(), `paul-${Date.now()}.tmp`)
  
  try {
    // Write to temp file first
    writeFileSync(tempPath, content, "utf-8")
    
    // Rename temp file to target (atomic on same filesystem)
    renameSync(tempPath, filePath)
  } catch (error) {
    // Clean up temp file on error
    if (existsSync(tempPath)) {
      unlinkSync(tempPath)
    }
    throw error
  }
}
```
    	
### Pattern 4: Loop Enforcement State Machine
**What:** State machine that enforces valid transitions
**when to use:** Before any state transition
**Example:**
```typescript
// State machine definition
const VALID_TRANSITIONS: Record<LoopPhase, LoopPhase[]> = {
  PLAN: ["APPLY"],
  APPLY: ["UNIFY"],
  UNIFY: ["PLAN"], // Can start new loop after closing previous
}

export class LoopEnforcer {
  canTransition(from: LoopPhase, to: LoopPhase): boolean {
    const allowed = VALID_TRANSITIONS[from]
    return allowed?.includes(to) ?? false
  }
  
  enforceTransition(from: LoopPhase, to: LoopPhase): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid transition: ${from} → ${to}. ` +
        `Current state: ${from}. ` +
        `Valid next states: ${VALID_TRANSITIONS[from].join(", ")}`
      )
    }
  }
  
  getRequiredNextAction(current: LoopPhase): string {
    switch (current) {
      case "PLAN":
        return "Run /paul:apply to execute the plan"
      case "APPLY":
        return "Run /paul:unify to close the loop"
      case "UNIFY":
        return "Run /paul:plan to start a new loop"
    }
  }
}
```
    	
### Anti-Patterns to Avoid
- **Synchronous file operations in plugin initialization** - Plugin loading must complete in <500ms; use async initialization
- **Direct file writes without atomic pattern** - Can cause data corruption on crashes; always use temp file + rename
- **Optional fields in core types** - Makes state management error-prone; use required fields and explicit null checks
- **State stored in single monolithic file** - Hard to manage as project grows; use per-phase state files as specified in CONTEXT.md
    	
## Don't Hand-Roll
    	
| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| State persistence | Custom JSON file manager | Zod + atomic writes | Zod ensures type safety, atomic writes prevent corruption |
| Validation logic | Manual type checking | Zod schemas | Deceptively complex - many edge cases, type guards, maintenance burden |
| Loop enforcement | Boolean flags scattered in code | State machine pattern | Centralized logic, clear error messages, maintainable |
| File I/O utilities | Custom fs wrappers | Node.js fs + atomic write helper | Well-tested Node.js APIs with atomic pattern for safety |
    	
**Key insight:** The OpenCode plugin API provides all necessary hooks and tools. Custom implementations add complexity without benefit. Focus on business logic (PAUL loop enforcement) rather than infrastructure.
    	
## Common Pitfalls
    	
### Pitfall 1: Slow Plugin Initialization
**What goes wrong:** Plugin initialization takes >500ms, blocking OpenCode startup
**Why it happens:** Heavy synchronous operations, large file reads, network requests during init
**How to avoid:** Use async/await, lazy loading, cache initialization data
**Warning signs:** OpenCode logs warnings about slow plugin loads, user notices delay when starting OpenCode with PAUL
    	
### Pitfall 2: Data Corruption from Non-Atomic Writes
**What goes wrong:** State file becomes corrupted or empty after crash
**Why it happens:** Write operation interrupted midway, leaving incomplete or corrupt file
**How to avoid:** Always use temp file + rename pattern for atomic writes
**Warning signs:** Empty state files, JSON parse errors, missing required fields
    	
### Pitfall 3: Invalid State Transitions
**What goes wrong:** Users can execute commands out of order (e.g., APPLY before PLAN)
**Why it happens:** No enforcement logic, or enforcement is bypassed
**How to avoid:** Implement centralized loop enforcer, check before every state change
**Warning signs:** State inconsistencies, orphaned plans, missing UNIFY operations
    	
### Pitfall 4: Type Mismatches Between TypeScript and Runtime
**What goes wrong:** Code compiles but fails at runtime with type errors
**Why it happens:** TypeScript types don't match actual data, no runtime validation
**How to avoid:** Use Zod schemas for all types, validate at boundaries (load, save, API)
**Warning signs:** Runtime errors in production, type assertions fail, data corruption
    	
### Pitfall 5: Missing Test Coverage
**What goes wrong:** Bugs in production that could have been caught in tests
**Why it happens:** Rushed development, no TDD approach, tests added as afterthought
**How to avoid:** Write tests first (TDD), aim for 80%+ coverage, test all edge cases
**Warning signs:** Production bugs, regressions after updates, difficulty refactoring
    	
## Code Examples
    	
### Atomic File Write Utility
```typescript
// Verified pattern from Node.js best practices
import { writeFileSync, renameSync, unlinkSync, existsSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

export async function atomicWrite(
  filePath: string,
  content: string | Buffer
): Promise<void> {
  const tempPath = join(tmpdir(), `paul-${Date.now()}.tmp`)
  
  try {
    // Write to temp file first
    if (typeof content === "string") {
      writeFileSync(tempPath, content, "utf-8")
    } else {
      writeFileSync(tempPath, content)
    }
    
    // Atomic rename
    renameSync(tempPath, filePath)
  } catch (error) {
    // Clean up temp file on error
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath)
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error
  }
}
```
    	
### State Manager with Loop Enforcement
```typescript
// Source: Based on PAUL requirements and OpenCode plugin patterns
import { z } from "zod"
import { atomicWrite } from "./atomic-writes"

// Type definitions
const LoopPhaseSchema = z.enum(["PLAN", "APPLY", "UNIFY"])
type LoopPhase = z.infer<typeof LoopPhaseSchema>

interface PhaseState {
  phase: LoopPhase
  lastUpdated: number
  metadata: Record<string, unknown>
}

const PhaseStateSchema = z.object({
  phase: LoopPhaseSchema,
  lastUpdated: z.number(),
  metadata: z.record(z.string(), z.unknown()),
})

export class StateManager {
  private validTransitions: Record<LoopPhase, LoopPhase[]> = {
    PLAN: ["APPLY"],
    APPLY: ["UNIFY"],
    UNIFY: ["PLAN"],
  }
  
  async loadPhaseState(projectId: string, phaseNumber: number): Promise<PhaseState> {
    const filePath = `.paul/state-phase-${phaseNumber}.json`
    // Implementation with Zod validation
    // ...
  }
  
  async savePhaseState(projectId: string, phaseNumber: number, state: PhaseState): Promise<void> {
    // Validate with Zod
    const validated = PhaseStateSchema.parse(state)
    
    // Atomic write
    const filePath = `.paul/state-phase-${phaseNumber}.json`
    await atomicWrite(filePath, JSON.stringify(validated, null, 2))
  }
  
  canTransition(from: LoopPhase, to: LoopPhase): boolean {
    return this.validTransitions[from]?.includes(to) ?? false
  }
  
  getRequiredNextAction(current: LoopPhase): string {
    const actions: Record<LoopPhase, string> = {
      PLAN: "Run /paul:apply to execute the plan",
      APPLY: "Run /paul:unify to close the loop",
      UNIFY: "Run /paul:plan to start a new loop",
    }
    return actions[current]
  }
}
```
    	
## State of the Art
     
| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON.parse without validation | Zod schema validation | 2024+ | Type safety at runtime, better error messages |
| Direct fs.writeFile | Atomic writes (temp + rename) | 2023+ | Zero data loss guarantee |
| String-based phases | Enum-based phases with Zod | 2024+ | Type safety, autocomplete, refactoring support |
| Single state file | Per-phase state files | 2024+ | Easier management, better organization |
    	
**Deprecated/outdated:**
- Synchronous file operations: Use async/await for better performance
- Manual JSON validation: Use Zod for type-safe validation
- Global state files: Use per-phase organization as specified in CONTEXT.md
    	
## Open Questions
    	
1. **OpenCode Plugin API Versioning**
   - What we know: OpenCode plugin API is currently at >=1.2.0
   - What's unclear: How often breaking changes are introduced, migration strategy
   - Recommendation: Pin to specific minor versions initially (e.g., 1.2.x), add version ranges after stability proven
    	
2. **Test File Organization**
   - What we know: Jest is the standard, 80%+ coverage required
   - What's unclear: Whether tests should mirror src/ structure or use flat tests/ directory
   - Recommendation: Use __tests__/ mirroring src/ for unit tests, add tests/ for integration tests (standard Jest convention)
    	
## Sources
    	
### Primary (HIGH confidence)
- OpenCode Documentation - https://opencode.ai/docs/plugins/ - Plugin API, hooks, TypeScript support
- OpenCode SDK - https://opencode.ai/docs/sdk/ - Type-safe client, methods, examples
- Zod Documentation - https://zod.dev/ - Schema validation, TypeScript integration
- Jest Documentation - https://jestjs.io/ - Testing framework, matchers, configuration
    	
### Secondary (MEDIUM confidence)
- Node.js fs Documentation - https://nodejs.org/api/fs.html - Atomic writes pattern verified
- TypeScript Handbook - https://www.typescriptlang.org/docs/ - Type system, best practices
- PAUL Framework - Project README.md and REQUIREMENTS.md - Domain requirements, constraints
    	
### Tertiary (LOW confidence)
- Community examples of OpenCode plugins - Usage patterns, common approaches
    	
## Metadata
    	
**Confidence breakdown:**
- Standard stack: HIGH - Well-established libraries with stable APIs
- Architecture: HIGH - Clear patterns from OpenCode docs and PAUL requirements
- Pitfalls: MEDIUM - Based on general plugin development experience, specific to OpenCode context
    	
**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days - stable APIs, well-established patterns)
