# Stack Research

**Domain:** Session Management Features
**Researched:** 2026-03-05
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| crypto (Node.js built-in) | v16.7.0+ | UUID generation for session IDs | Native to Node.js, zero dependencies, cryptographically secure UUIDs via `crypto.randomUUID()` |
| fs (Node.js built-in) | v16.7.0+ | File system operations | Already used for file-based storage, no additional dependencies needed |
| path (Node.js built-in) | v16.7.0+ | Path manipulation | Standard Node.js module, already in use |

### Existing Infrastructure (No Installation Required)

| Library | Version | Purpose | How It's Used |
|---------|---------|---------|---------------|
| TypeScript | ^5.0.0 | Type safety and compilation | Already configured, define session types with Zod schemas |
| Zod | ^3.22.0 | Runtime validation | Already installed, add session state schemas |
| Jest | ^29.0.0 | Testing framework | Already configured, test session management logic with TDD |
| @opencode-ai/plugin | ^1.2.0 | OpenCode plugin API | Already installed, session commands integrate with existing plugin architecture |

### Supporting Libraries (Already Available)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| FileManager (internal) | 1.0.0 | File-based JSON storage | Already implemented with atomic writes, extend for session storage |
| atomicWrite (internal) | 1.0.0 | Atomic file writes | Already implemented, use for session state persistence |
| StateManager (internal) | 1.0.0 | State management | May extend or create SessionManager for session-specific logic |

## Installation

```bash
# NO NEW DEPENDENCIES REQUIRED
# Session management uses only existing infrastructure:
# - crypto.randomUUID() (Node.js built-in)
# - Existing FileManager with atomic writes
# - Existing Zod schemas for validation
# - Existing Jest for testing
```

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| crypto.randomUUID() (built-in) | uuid package | Zero-dependency approach preferred. Built-in crypto module provides secure UUIDs without external package. |
| File-based JSON storage | SQLite database | Project explicitly states "File-based JSON only" in out-of-scope section. Atomic writes already implemented. |
| TypeScript objects | Markdown templates | Project explicitly avoids markdown templates for type safety (see PROJECT.md decisions). |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| uuid package | Node.js 16.7.0+ includes `crypto.randomUUID()` natively. No need for external dependency. | crypto.randomUUID() (built-in) |
| date-fns, dayjs, moment | Session management only needs simple timestamp operations (`Date.now()`, `toISOString()`). Date libraries add unnecessary weight. | Built-in Date methods |
| Markdown templating engines | Project explicitly uses TypeScript objects instead of markdown for type safety and validation. | TypeScript objects with Zod schemas |
| SQLite, LevelDB, or Other databases | Project explicitly uses file-based JSON storage for simplicity and version control. | File-based JSON with FileManager |
| Session middleware libraries (express-session, etc.) | OpenPAUL is a CLI plugin, not a web server. Sessions are file-based handoff documents. | File-based session storage |

## Stack Patterns by Variant

**If implementing session storage:**
- Use existing FileManager pattern
- Create `session-{uuid}.json` files in `.paul/sessions/` directory
- Follow atomic write pattern with Zod validation
- Example path: `.paul/sessions/session-a1b2c3d4-e5f6-7890.json`

**If implementing handoff documents:**
- Use TypeScript objects (not markdown)
- Generate structured JSON output
- Include: session metadata, current state, pending tasks, context summary
- No templating library needed - construct objects directly

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Node.js 16.7.0+ | crypto.randomUUID() | Built-in UUID generation available since v15.6.0 |
| TypeScript 5.0+ | ES Modules | Project uses ES modules, fully compatible |
| Zod 3.22+ | TypeScript 5.0+ | Runtime validation works with TypeScript types |

## Integration Points with Existing Architecture

### Session State Type Definition
```typescript
// Add to src/types/session.ts
export interface Session {
  id: string                    // UUID from crypto.randomUUID()
  phaseNumber: number
  state: State                   // Reuse existing State type
  createdAt: number              // Unix timestamp from Date.now()
  updatedAt: number              // Unix timestamp from Date.now()
  status: 'active' | 'paused' | 'resumed'
  metadata: {
    reason?: string           // Why session was paused
    handoffTo?: string         // Who to handoff to
    context: string            // Session context/summary
  }
}

export const SessionSchema = z.object({
  id: z.string().uuid(),
  phaseNumber: z.number().int().positive(),
  state: StateSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
  status: z.enum(['active', 'paused', 'resumed']),
  metadata: z.object({
    reason: z.string().optional(),
    handoffTo: z.string().optional(),
    context: z.string(),
  }),
})
```

### Session Storage in FileManager
```typescript
// Extend FileManager class
export class FileManager {
  // ... existing methods ...
  
  /**
   * Get session file path
   * Pattern: .paul/sessions/session-{uuid}.json
   */
  private getSessionPath(sessionId: string): string {
    return join(this.paulDir, 'sessions', `session-${sessionId}.json`)
  }
  
  /**
   * Write session with atomic writes
   */
  async writeSession(session: Session): Promise<void> {
    const filePath = this.getSessionPath(session.id)
    await this.writeJSON(filePath, session, SessionSchema)
  }
  
  /**
   * Read session
   */
  readSession(sessionId: string): Session | null {
    const filePath = this.getSessionPath(sessionId)
    return this.readJSON(filePath, SessionSchema)
  }
  
  /**
   * List all sessions
   */
  listSessions(): Session[] {
    const sessionsDir = join(this.paulDir, 'sessions')
    if (!existsSync(sessionsDir)) {
      return []
    }
    
    const files = readdirSync(sessionsDir)
      .filter(f => f.match(/session-.*\.json/))
      .sort()
    
    return files.map(file => {
      const sessionId = file.replace('session-', '').replace('.json', '')
      return this.readSession(sessionId)
    }).filter((s): s is Session) as Session[]
  }
}
```

### Command Implementation Pattern
```typescript
// Follow existing command pattern from src/commands/
export const pauseCommand = {
  name: 'pause',
  description: 'Create session handoff with current context',
  
  async execute(projectRoot: string, args: string[]): Promise<string> {
    const crypto = require('crypto')
    const sessionId = crypto.randomUUID()
    
    const stateManager = new StateManager(projectRoot)
    const currentState = stateManager.getCurrentPosition()
    
    if (!currentState) {
      return 'No active session to pause'
    }
    
    const session: Session = {
      id: sessionId,
      phaseNumber: currentState.phaseNumber,
      state: stateManager.loadPhaseState(currentState.phaseNumber)!,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'paused',
      metadata: {
        reason: args[0] || 'Manual pause',
        context: args.join(' '),
      },
    }
    
    const fileManager = new FileManager(projectRoot)
    await fileManager.writeSession(session)
    
    return `Session paused: ${sessionId}\nResume with: /paul:resume ${sessionId}`
  }
}
```

## Sources

- Node.js v22.14.0 Documentation — crypto.randomUUID() availability confirmed
- Node.js Documentation — Built-in crypto, fs, path modules
- OpenPAUL source code analysis — Existing infrastructure patterns (FileManager, StateManager, atomic writes, Zod validation)
- Project requirements (PROJECT.md) — TypeScript objects, file-based JSON storage, atomic writes

---

*Stack research for: Session Management Features*
*Researched: 2026-03-05*
