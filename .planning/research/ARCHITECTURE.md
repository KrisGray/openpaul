# Architecture Research: Session Management Integration

**Domain:** Session management integration with existing OpenPAUL TypeScript architecture
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

Session management (pause, resume, handoff, status) integrates cleanly into OpenPAUL's existing architecture by:

1. **Adding new commands** following the established command pattern
2. **Extending FileManager** to handle session files (handoffs, session state)
3. **Leveraging existing StateManager** for state persistence
4. **Using existing formatters** for consistent output
5. **Following the plugin tool registration pattern**

No architectural changes required—session management is a feature addition within existing patterns.

## Existing Architecture Overview

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Entry Point                        │
│                      (src/index.ts)                          │
│  Registers tools: init, plan, apply, unify, progress, help  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Commands Layer                          │
│                    (src/commands/*.ts)                       │
│  Each command: Zod schema + execute function + formatters   │
└─────────────────────────────────────────────────────────────┘
                              │
┌──────────────┬──────────────┴──────────────┬────────────────┐
│   State      │      Storage               │   Output       │
│  Manager     │    FileManager             │  Formatters    │
│              │   Atomic Writes            │                │
└──────────────┴────────────────────────────┴────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    File System Layer                         │
│  .paul/state-phase-N.json                                   │
│  .paul/phases/{phase}-{plan}-PLAN.json                      │
│  .paul/phases/{phase}-{plan}-SUMMARY.json                   │
│  .paul/model-config.json                                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `src/index.ts` | Plugin entry point, tool registration | OpenCode Plugin API with hooks |
| `src/commands/*.ts` | Command handlers with Zod validation | `tool()` helper from `@opencode-ai/plugin` |
| `src/state/state-manager.ts` | Load/save phase state, derive position | FileManager + state logic |
| `src/state/loop-enforcer.ts` | Enforce PLAN→APPLY→UNIFY transitions | State machine validation |
| `src/storage/file-manager.ts` | Read/write JSON files with validation | Zod schemas + atomic writes |
| `src/storage/atomic-writes.ts` | Zero-data-loss file writes | temp file + rename pattern |
| `src/output/formatter.ts` | Consistent output formatting | Markdown + emoji helpers |
| `src/output/error-formatter.ts` | Guided error messages | Structured error format |

## Session Management Integration Architecture

### Integration Pattern

Session management follows the **exact same pattern** as existing commands:

1. **Command Registration** — Add to `src/index.ts` tool object
2. **Command Implementation** — Create `src/commands/pause.ts`, etc.
3. **File Operations** — Extend `FileManager` for session files
4. **Output Formatting** — Use existing formatters

### New Files Required

```
src/
├── commands/
│   ├── pause.ts         # /paul:pause command
│   ├── resume.ts        # /paul:resume command
│   └── handoff.ts       # /paul:handoff command
├── storage/
│   └── file-manager.ts  # ADD: session file methods
└── types/
    └── session.ts       # NEW: Session types + Zod schemas
```

### Data Flow

#### Pause Flow

```
User: /paul:pause
    ↓
paulPause (pause.ts)
    │
    ├─→ FileManager.readPhaseState()
    ├─→ StateManager.getCurrentPosition()
    ├─→ FileManager.writeHandoff()
    ├─→ FileManager.writeSessionState()
    └─→ Formatter → Output
```

#### Resume Flow

```
User: /paul:resume [handoff-id]
    ↓
paulResume (resume.ts)
    │
    ├─→ FileManager.readSessionState()
    ├─→ FileManager.readHandoff() or auto-detect
    ├─→ StateManager.loadPhaseState()
    ├─→ FileManager.archiveHandoff()
    └─→ Formatter → Output
```

#### Handoff Flow

```
User: /paul:handoff
    ↓
paulHandoff (handoff.ts)
    │
    ├─→ FileManager.readPhaseState()
    ├─→ FileManager.readPlan()
    ├─→ FileManager.writeHandoff()
    └─→ Formatter → Output
```

## Session Data Model

### Session State (NEW)

**File:** `.paul/session-state.json`

```typescript
interface SessionState {
  paused: boolean
  pausedAt?: number
  handoffId?: string
  loopPosition: {
    phase: LoopPhase
    phaseNumber: number
    planId?: string
  }
  nextAction?: string
  createdAt: number
  lastUpdated: number
}

const SessionStateSchema = z.object({
  paused: z.boolean(),
  pausedAt: z.number().optional(),
  handoffId: z.string().optional(),
  loopPosition: z.object({
    phase: LoopPhaseSchema,
    phaseNumber: z.number().int().positive(),
    planId: z.string().optional(),
  }),
  nextAction: z.string().optional(),
  createdAt: z.number(),
  lastUpdated: z.number(),
})
```

### Handoff Document (NEW)

**File:** `.paul/handoffs/HANDOFF-{id}.json`

```typescript
interface Handoff {
  id: string
  createdAt: number
  status: 'paused' | 'blocked' | 'context-limit'
  
  // Context
  project: string
  coreValue: string
  phaseNumber: number
  planId?: string
  loopPosition: LoopPhase
  
  // Work state
  workCompleted: string[]
  workInProgress: string[]
  decisions: Array<{ decision: string; rationale: string }>
  blockers: string[]
  
  // Next actions
  immediateNext: string
  subsequentActions: string[]
  
  // Files
  keyFiles: Array<{ path: string; purpose: string }>
}

const HandoffSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  status: z.enum(['paused', 'blocked', 'context-limit']),
  project: z.string(),
  coreValue: z.string(),
  phaseNumber: z.number().int().positive(),
  planId: z.string().optional(),
  loopPosition: LoopPhaseSchema,
  workCompleted: z.array(z.string()),
  workInProgress: z.array(z.string()),
  decisions: z.array(z.object({
    decision: z.string(),
    rationale: z.string(),
  })),
  blockers: z.array(z.string()),
  immediateNext: z.string(),
  subsequentActions: z.array(z.string()),
  keyFiles: z.array(z.object({
    path: z.string(),
    purpose: z.string(),
  })),
})
```

## Component Modifications

### 1. FileManager Extension

**Add to `src/storage/file-manager.ts`:**

```typescript
// NEW METHODS:

// Session state
private getSessionStatePath(): string
readSessionState(): SessionState | null
writeSessionState(state: SessionState): Promise<void>

// Handoffs
private getHandoffPath(id: string): string
private getHandoffsDir(): string
ensureHandoffsDir(): void
readHandoff(id: string): Handoff | null
writeHandoff(handoff: Handoff): Promise<void>
listHandoffs(): string[] // Returns IDs sorted by date desc
archiveHandoff(id: string): Promise<void>
deleteHandoff(id: string): Promise<void>
```

### 2. Plugin Registration

**Modify `src/index.ts`:**

```typescript
import { paulPause } from './commands/pause'
import { paulResume } from './commands/resume'
import { paulHandoff } from './commands/handoff'

export const PaulPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  // ... existing code ...
  
  return {
    tool: {
      // ... existing tools ...
      'paul:pause': paulPause,
      'paul:resume': paulResume,
      'paul:handoff': paulHandoff,
    }
  }
}
```

### 3. Commands Index

**Modify `src/commands/index.ts`:**

```typescript
// Session management commands
export { paulPause } from './pause'
export { paulResume } from './resume'
export { paulHandoff } from './handoff'
```

### 4. Type Exports

**Modify `src/types/index.ts`:**

```typescript
// Session types
export * from './session'
```

## Command Implementation Patterns

### Pattern: Command Structure

Follow the existing pattern from `plan.ts`:

```typescript
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { FileManager } from '../storage/file-manager'
import { StateManager } from '../state/state-manager'
import { formatGuidedError } from '../output/error-formatter'
import { formatHeader, formatBold } from '../output/formatter'

export const paulPause = tool({
  description: 'Create session handoff with current context',
  args: {
    // Zod schema for args
    reason: tool.schema.string().optional().describe('Pause reason'),
  },
  execute: async ({ reason }, context) => {
    try {
      // 1. Check initialization
      // 2. Load current state
      // 3. Gather session context
      // 4. Create handoff
      // 5. Update session state
      // 6. Format output
      
      return formatHeader(2, '⏸️ Session Paused') + ...
    } catch (error) {
      return formatGuidedError({...})
    }
  },
})
```

### Pattern: Error Handling

All session commands use `formatGuidedError()`:

```typescript
return formatGuidedError({
  title: 'Cannot Pause',
  message: '...',
  context: '...',
  suggestedFix: '...',
  nextSteps: ['...', '...'],
})
```

### Pattern: State Validation

Use Zod schemas before writing:

```typescript
const validated = SessionStateSchema.parse(state)
await fileManager.writeSessionState(validated)
```

## Integration Points with Existing Components

### StateManager Integration

```typescript
// Session commands USE StateManager (don't modify it)
const stateManager = new StateManager(context.directory)
const position = stateManager.getCurrentPosition()

// Session state is SEPARATE from phase state
// - Phase state: .paul/state-phase-N.json (existing)
// - Session state: .paul/session-state.json (new)
```

### LoopEnforcer Integration

```typescript
// Pause/resume don't change loop phase, but need to know it
const loopEnforcer = new LoopEnforcer()
const nextAction = loopEnforcer.getRequiredNextAction(currentPhase)

// Handoff includes loop position for context
handoff.loopPosition = currentPhase
```

### Formatter Integration

```typescript
// Use existing formatters for consistency
import { 
  formatHeader, 
  formatBold, 
  formatList,
  formatStatus 
} from '../output/formatter'

// Session-specific formatting reuses existing patterns
const output = [
  formatHeader(2, '⏸️ Session Paused'),
  '',
  formatBold('Handoff:') + ` .paul/handoffs/${handoffId}.json`,
  formatBold('Next:') + ' Run /paul:resume to continue',
].join('\n')
```

## File Storage Strategy

### Directory Structure

```
.paul/
├── state-phase-N.json      # Phase state (existing)
├── session-state.json      # Session state (NEW)
├── model-config.json       # Model config (existing)
├── handoffs/               # Handoff files (NEW)
│   ├── HANDOFF-2026-03-05-143022.json
│   ├── HANDOFF-2026-03-04-091531.json
│   └── archive/            # Consumed handoffs (NEW)
│       └── HANDOFF-2026-03-03-161822.json
└── phases/
    ├── {phase}-{plan}-PLAN.json
    └── {phase}-{plan}-SUMMARY.json
```

### File Naming Convention

```
Handoff ID format: {YYYY}-{MM}-{DD}-{HHMMSS}
Example: 2026-03-05-143022

File pattern: .paul/handoffs/HANDOFF-{id}.json
```

### Atomic Write Guarantee

All session files use existing `atomicWrite()`:

```typescript
await atomicWrite(filePath, JSON.stringify(data, null, 2))
```

## Status Command Deprecation

The `/paul:status` command is **deprecated** in favor of `/paul:progress`.

**Implementation:**

```typescript
// src/commands/status.ts (DEPRECATED)
export const paulStatus = tool({
  description: 'DEPRECATED - Use /paul:progress instead',
  execute: async (_, context) => {
    return [
      formatHeader(2, '⚠️ Deprecated Command'),
      '',
      '/paul:status is deprecated.',
      'Use /paul:progress for current loop status.',
      '',
      formatBold('Example:') + ' /paul:progress',
      formatBold('Verbose:') + ' /paul:progress --verbose',
    ].join('\n')
  },
})
```

## Build Order (Dependencies)

### Phase 1: Types & Storage (No Dependencies)

1. **`src/types/session.ts`** — NEW
   - SessionState interface + Zod schema
   - Handoff interface + Zod schema
   - No dependencies

2. **`src/storage/file-manager.ts`** — MODIFY
   - Add session state methods
   - Add handoff methods
   - Depends on: session types

### Phase 2: Commands (Depend on Phase 1)

3. **`src/commands/pause.ts`** — NEW
   - Depends on: FileManager, StateManager, formatters

4. **`src/commands/resume.ts`** — NEW
   - Depends on: FileManager, StateManager, formatters

5. **`src/commands/handoff.ts`** — NEW
   - Depends on: FileManager, StateManager, formatters

6. **`src/commands/status.ts`** — NEW (deprecation stub)
   - No dependencies

### Phase 3: Registration (Depends on Phase 2)

7. **`src/commands/index.ts`** — MODIFY
   - Export new commands

8. **`src/types/index.ts`** — MODIFY
   - Export session types

9. **`src/index.ts`** — MODIFY
   - Register new tools

### Phase 4: Tests (Depends on All)

10. **`src/tests/commands/pause.test.ts`** — NEW
11. **`src/tests/commands/resume.test.ts`** — NEW
12. **`src/tests/commands/handoff.test.ts`** — NEW
13. **`src/tests/storage/session-files.test.ts`** — NEW

## Architectural Patterns to Follow

### Pattern 1: Command Independence

Each session command is self-contained:

- Creates its own FileManager instance
- Creates its own StateManager instance
- Handles all errors internally
- Returns formatted string output

**Why:** Matches existing pattern, easy to test, no shared mutable state.

### Pattern 2: Single Responsibility

- `pause.ts` — Create handoff + mark paused
- `resume.ts` — Load handoff + clear paused + archive handoff
- `handoff.ts` — Create detailed handoff (without pausing)

**Why:** Clear purpose, composable, matches Unix philosophy.

### Pattern 3: Explicit State Transitions

```
Active → Paused (via /paul:pause)
Paused → Active (via /paul:resume)
Active → Active with handoff (via /paul:handoff)
```

**Why:** Prevents confusion, clear mental model, matches loop enforcer pattern.

### Pattern 4: File-Based Communication

Session state stored in files, not in memory:

```typescript
// GOOD
await fileManager.writeSessionState(state)
const state = fileManager.readSessionState()

// BAD (no in-memory session cache)
this.sessionState = state
```

**Why:** Survives process restarts, matches existing storage pattern, human-readable.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Modifying StateManager

❌ **Don't:** Add session methods to StateManager

```typescript
// BAD
class StateManager {
  // ... existing methods ...
  loadSessionState() { ... }
  saveSessionState() { ... }
}
```

✅ **Instead:** Keep FileManager as single source for file operations

```typescript
// GOOD
const fileManager = new FileManager(projectRoot)
const sessionState = fileManager.readSessionState()
```

**Why:** StateManager is for loop state. Session state is orthogonal. FileManager owns all file I/O.

### Anti-Pattern 2: Storing Session in Phase State

❌ **Don't:** Add session fields to State/PhaseState

```typescript
// BAD
interface State {
  // ... existing fields ...
  sessionPaused?: boolean
  handoffId?: string
}
```

✅ **Instead:** Separate session state file

```typescript
// GOOD
// .paul/state-phase-1.json — Loop state
// .paul/session-state.json — Session state (separate)
```

**Why:** Separation of concerns, cleaner migration, easier debugging.

### Anti-Pattern 3: Complex Handoff Parsing

❌ **Don't:** Parse handoff markdown templates

```typescript
// BAD
const handoff = parseHandoffMarkdown(content)
```

✅ **Instead:** Use JSON with Zod validation

```typescript
// GOOD
const handoff = HandoffSchema.parse(JSON.parse(content))
```

**Why:** Type safety, validation, matches existing pattern (Plans, Summaries are JSON).

### Anti-Pattern 4: Global Session Manager

❌ **Don't:** Create a SessionManager class

```typescript
// BAD
class SessionManager {
  private sessionState: SessionState
  // ... methods ...
}
```

✅ **Instead:** Use FileManager directly in commands

```typescript
// GOOD
const fileManager = new FileManager(context.directory)
const sessionState = fileManager.readSessionState()
```

**Why:** No shared state, matches command pattern, easier testing.

## Scalability Considerations

### Handoff Accumulation

| Handoffs | Strategy |
|----------|----------|
| 1-10 | Keep all in `.paul/handoffs/` |
| 10-50 | Archive consumed handoffs to `.paul/handoffs/archive/` |
| 50+ | Auto-cleanup handoffs older than 30 days |

**Implementation:**

```typescript
// In resume.ts after archiving:
async function cleanupOldHandoffs(fileManager: FileManager) {
  const handoffs = fileManager.listHandoffs()
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  
  for (const id of handoffs) {
    const handoff = fileManager.readHandoff(id)
    if (handoff && handoff.createdAt < thirtyDaysAgo) {
      await fileManager.deleteHandoff(id)
    }
  }
}
```

### Concurrent Session Protection

File locking not needed — OpenCode runs one command at a time.

If future needs arise, add to `atomic-writes.ts`:

```typescript
// Future: Lock file during critical operations
await withLock('.paul/session-state.json', async () => {
  await fileManager.writeSessionState(state)
})
```

## Sources

- OpenPAUL Source Code — v1.0 implementation (HIGH confidence)
- OpenCode Plugin API — `@opencode-ai/plugin` package (HIGH confidence)
- PAUL Workflows — `src/workflows/pause-work.md`, `src/workflows/resume-project.md` (HIGH confidence)
- Existing Command Patterns — `src/commands/plan.ts`, `src/commands/progress.ts` (HIGH confidence)

---

*Architecture research for: Session Management Integration*
*Researched: 2026-03-05*
