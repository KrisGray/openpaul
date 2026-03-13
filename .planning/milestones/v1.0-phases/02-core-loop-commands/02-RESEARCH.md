# Phase 2: Core Loop Commands - Research

**Researched:** 2026-03-04
**Domain:** OpenCode Plugin Tools, Command Implementation, CLI Output Formatting, State Management
**Confidence:** HIGH

## Summary

Phase 2 implements the six core workflow commands that users interact with to plan work, execute plans, and close loops: `/paul:init`, `/paul:plan`, `/paul:apply`, `/paul:unify`, `/paul:progress`, and `/paul:help`. These commands must integrate with OpenCode's tool system, manage state through the existing StateManager and LoopEnforcer, and produce rich, adaptive output as specified in CONTEXT.md.

The commands are registered as OpenCode tools using the `tool()` helper from `@opencode-ai/plugin`. Each command returns a string output that OpenCode renders to the user. The existing Phase 1 infrastructure (types, storage, state management, loop enforcement) provides the foundation for command implementation.

**Primary recommendation:** Use the OpenCode `tool()` function to register commands with Zod-validated arguments, leverage existing StateManager/LoopEnforcer for state transitions, and implement output formatters that produce rich text with adaptive detail levels as specified in CONTEXT.md.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Command Output Format:**
- Rich text format with headers, emojis, bold/italic for structure
- Most flexible for varying content types, easy to scan, works well in chat interfaces
- Adaptive detail varies by command type:
  - `/paul:plan` shows full plan details
  - `/paul:progress` shows concise status
  - `/paul:apply` shows task-by-task progress
- Smart formatting adapts to content:
  - Short content: Inline
  - Medium content: Line breaks with indentation
  - Long content: Collapsible or separate sections
  - Code: Code blocks with syntax highlighting
- Minimal emojis for status indicators (✅ ⏳ ⏸️ ❌)
- Visual progress bars for counts: `[███░░░] 1/3 tasks`

**Error Handling & Recovery:**
- Guided errors include: error message + context + suggested fix + next steps
- Smart retry depends on error type:
  - Transient errors (file locks, network): Auto-retry with backoff
  - Validation errors: Manual retry after fix
  - State errors: Manual retry with guidance
  - Fatal errors: No retry, clear explanation
- Context-aware rollback preserves work:
  - Plan creation failure: Rollback (no partial plans)
  - Apply task failure: Save progress, pause at failure point
  - Unify failure: Keep state, allow manual fix
  - Init failure: Rollback partially created files
- Provides options: resume, skip task, or rollback
- Severity-based communication:
  - Info (suggestions): Subtle, after main output
  - Warnings (non-critical): Visible but not blocking
  - Errors (critical): Prominent, stop execution

**Plan Structure & Display:**
- Adaptive structure scales with complexity:
  - Simple plans (1-3 tasks): Minimal structure
  - Medium plans (4-10 tasks): Standard structure
  - Complex plans (10+ tasks): Detailed structure with all sections
- Task metadata visibility configurable with flags:
  - Default view: Name + status + one-line description (scannable)
  - Verbose view (--verbose): All task metadata (files, verify, done)
  - Specific task (--task N): Full details for single task
- Auto-detected dependencies from file changes
- Visual execution graph shows parallel opportunities
- Context-aware display based on plan stage

**Loop State Visualization:**
- Compact + contextual one-line summary: `📍 Loop: PLAN → APPLY (Task 2/5) → UNIFY`
- Smart context relevant to current stage
- Guided transitions with milestone feel
- Context-aware guidance based on project state

### OpenCode's Discretion

- Exact command implementation structure
- Output formatting utility organization
- Error class hierarchy details
- Internal helper function design

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope (core workflow commands only)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | User can initialize OpenPAUL with `/paul:init` (creates .paul/ directory) | OpenCode tool registration, FileManager.ensurePaulDir(), template file copying |
| CORE-02 | User can create executable plans with `/paul:plan` (PLAN.json with tasks, criteria, boundaries) | Plan type definition (src/types/plan.ts), plan storage pattern, adaptive output formatting |
| CORE-03 | User can execute approved plans with `/paul:apply` (sequential task execution with verification) | LoopEnforcer transitions, task execution pattern, progress tracking |
| CORE-04 | User can close loops with `/paul:unify` (SUMMARY.json, plan vs actual comparison) | Summary template, state transition to UNIFY→PLAN, reconciliation logic |
| CORE-05 | User can view current status with `/paul:progress` (loop position, next action, blockers) | StateManager.getCurrentPosition(), LoopEnforcer.getRequiredNextAction() |
| CORE-06 | User can view command reference with `/paul:help` (all 26 commands with descriptions) | CommandType enum (src/types/command.ts), command descriptions |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @opencode-ai/plugin | >=1.2.0 | Tool registration and execution | Official OpenCode plugin API, provides `tool()` helper |
| Zod | >=3.22.0 | Command argument validation | Already used for types, natural fit for tool args |
| TypeScript | >=5.0.0 | Type-safe command handlers | Existing codebase standard |

### Supporting (from Phase 1)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jest | >=29.0.0 | Command testing | All command unit tests |
| Node.js fs | >=16.7.0 | File operations | Plan/state file management |

### Existing Infrastructure (Reuse)
| Module | Purpose | Location |
|--------|---------|----------|
| StateManager | Load/save state, get current position | src/state/state-manager.ts |
| LoopEnforcer | Validate transitions, get next action | src/state/loop-enforcer.ts |
| FileManager | Atomic file operations, .paul directory | src/storage/file-manager.ts |
| Types | Plan, State, Command, LoopPhase | src/types/*.ts |

**No new dependencies required** — Phase 1 infrastructure is sufficient.

## Architecture Patterns

### Recommended Project Structure (Phase 2 Addition)
```
src/
├── commands/               # Command implementations (NEW)
│   ├── index.ts           # Command registration, exports all commands
│   ├── init.ts            # /paul:init implementation
│   ├── plan.ts            # /paul:plan implementation
│   ├── apply.ts           # /paul:apply implementation
│   ├── unify.ts           # /paul:unify implementation
│   ├── progress.ts        # /paul:progress implementation
│   └── help.ts            # /paul:help implementation
├── output/                 # Output formatting (NEW)
│   ├── formatter.ts       # Rich text output utilities
│   ├── progress-bar.ts    # Visual progress bars
│   └── error-formatter.ts # Guided error formatting
├── types/                  # Existing types (no changes)
├── storage/                # Existing storage (no changes)
├── state/                  # Existing state management (no changes)
└── index.ts               # Plugin entry (add tool registration)
```

### Pattern 1: OpenCode Tool Registration
**What:** Use `tool()` helper to register commands with Zod-validated arguments
**When to use:** All six core commands
**Example:**
```typescript
// Source: @opencode-ai/plugin API
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'

export const paulInit = tool({
  description: 'Initialize OpenPAUL in the current project. Creates .paul/ directory with default configuration.',
  args: {
    force: z.boolean().optional().describe('Reinitialize even if .paul/ exists'),
  },
  async execute(args, context) {
    // Command implementation
    // context.directory = project root
    // context.worktree = worktree root
    // context.sessionID, context.messageID, context.agent
    return '✅ OpenPAUL initialized successfully...'
  },
})
```

### Pattern 2: Command Handler Structure
**What:** Each command as a self-contained module with execute function
**When to use:** All commands for consistency
**Example:**
```typescript
// src/commands/progress.ts
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { StateManager } from '../state/state-manager'
import { formatProgress } from '../output/formatter'

export const paulProgress = tool({
  description: 'View current loop status, position, and next action.',
  args: {
    verbose: z.boolean().optional().describe('Show detailed status'),
  },
  async execute(args, context) {
    const stateManager = new StateManager(context.directory)
    const position = stateManager.getCurrentPosition()
    
    if (!position) {
      return formatProgress.notInitialized()
    }
    
    const nextAction = stateManager.getRequiredNextAction(position.phase)
    return formatProgress.current(position, nextAction, args.verbose)
  },
})
```

### Pattern 3: Rich Output Formatting
**What:** Dedicated output formatters that produce structured rich text
**When to use:** All command output
**Example:**
```typescript
// src/output/formatter.ts
export function formatPlan(plan: Plan, verbosity: 'default' | 'verbose' | 'task'): string {
  const header = `# 📋 Plan: ${plan.phase}-${plan.plan}`
  const meta = `\n**Type:** ${plan.type} | **Wave:** ${plan.wave} | **Tasks:** ${plan.tasks.length}`
  
  if (verbosity === 'default') {
    const taskList = plan.tasks.map((t, i) => 
      `${i + 1}. **${t.name}** — ${t.done.slice(0, 60)}...`
    ).join('\n')
    return `${header}${meta}\n\n## Tasks\n${taskList}`
  }
  
  // verbose and task variants...
}
```

### Pattern 4: Guided Error Output
**What:** Structured error output with context and next steps
**When to use:** All error conditions
**Example:**
```typescript
// src/output/error-formatter.ts
export function formatLoopError(
  error: LoopEnforcerError,
  currentState: LoopPhase
): string {
  return `## ❌ Invalid Loop Transition

**Current state:** ${currentState}
**Attempted:** ${error.attempted}
**Reason:** ${error.message}

### What to do next
${error.nextAction}

### Quick help
- Run \`/paul:help\` for command reference
- Run \`/paul:progress\` to see current status
`
}
```

### Pattern 5: Progress Bar Utility
**What:** Reusable progress bar generator for counts
**When to use:** Task progress, phase completion, etc.
**Example:**
```typescript
// src/output/progress-bar.ts
export function progressBar(current: number, total: number, width = 10): string {
  const filled = Math.round((current / total) * width)
  const empty = width - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `[${bar}] ${current}/${total}`
}

// Output: [███░░░░░░░] 3/10
```

### Pattern 6: Tool Registration in Plugin Entry
**What:** Register all commands in the plugin's returned hooks
**When to use:** src/index.ts
**Example:**
```typescript
// src/index.ts
import type { Plugin } from '@opencode-ai/plugin'
import { paulInit } from './commands/init'
import { paulPlan } from './commands/plan'
import { paulApply } from './commands/apply'
import { paulUnify } from './commands/unify'
import { paulProgress } from './commands/progress'
import { paulHelp } from './commands/help'

export const PaulPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  await client.app.log({
    body: {
      service: 'paul-plugin',
      level: 'info',
      message: 'PAUL plugin initialized',
      extra: { project: project.id, directory },
    },
  })
  
  return {
    tool: {
      'paul:init': paulInit,
      'paul:plan': paulPlan,
      'paul:apply': paulApply,
      'paul:unify': paulUnify,
      'paul:progress': paulProgress,
      'paul:help': paulHelp,
    },
  }
}
```

### Anti-Patterns to Avoid
- **Throwing raw errors without formatting** — Always use guided error formatter
- **Synchronous operations in tools** — All tools must be async
- **Hardcoded output strings** — Use formatters for consistency
- **Bypassing LoopEnforcer** — Always validate transitions before state changes

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool registration | Custom command system | @opencode-ai/plugin `tool()` | Official API, handles validation, error handling |
| State transitions | Manual state checks | LoopEnforcer | Centralized enforcement, clear error messages |
| File operations | Direct fs calls | FileManager | Atomic writes, Zod validation, error handling |
| Output formatting | String concatenation | Formatter utilities | Consistent styling, adaptive detail |

## Common Pitfalls

### Pitfall 1: Missing Tool Context Directory
**What goes wrong:** Commands use `process.cwd()` instead of `context.directory`
**Why it happens:** Developer assumes current working directory is project root
**How to avoid:** Always use `context.directory` from tool context for project root
**Warning signs:** Commands fail when OpenCode runs from different directory

### Pitfall 2: Inconsistent Output Format
**What goes wrong:** Each command has different output style
**Why it happens:** No shared formatter utilities, each command formats independently
**How to avoid:** Use shared formatter module, define output templates
**Warning signs:** Commands feel disjointed, inconsistent emoji usage

### Pitfall 3: Skipping Loop Enforcement
**What goes wrong:** Commands allow invalid state transitions
**Why it happens:** Direct state manipulation without LoopEnforcer check
**How to avoid:** Always call LoopEnforcer before state changes
**Warning signs:** Users can run apply without plan, skip unify, etc.

### Pitfall 4: Not Handling Missing State
**What goes wrong:** Commands crash when .paul/ doesn't exist
**Why it happens:** Assuming state always exists, not checking getCurrentPosition()
**How to avoid:** Always check for null/undefined state, provide guidance
**Warning signs:** Crashes on fresh project, confusing error messages

### Pitfall 5: Overly Verbose Output
**What goes wrong:** Commands output too much information
**Why it happens:** Not implementing adaptive detail levels from CONTEXT.md
**How to avoid:** Default to concise, add --verbose flag for details
**Warning signs:** Output scrolls off screen, users can't find key info

## Code Examples

### Init Command Implementation
```typescript
// src/commands/init.ts
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { FileManager } from '../storage/file-manager'
import { createDefaultModelConfig } from '../types/model-config'

export const paulInit = tool({
  description: 'Initialize OpenPAUL in the current project. Creates .paul/ directory with default configuration.',
  args: {
    force: z.boolean().optional().describe('Reinitialize even if .paul/ exists'),
  },
  async execute(args, context) {
    const fileManager = new FileManager(context.directory)
    
    // Check if already initialized
    const paulDir = join(context.directory, '.paul')
    if (existsSync(paulDir) && !args.force) {
      return `## ⚠️ Already Initialized

OpenPAUL is already initialized in this project.

- Use \`/paul:progress\` to see current status
- Use \`/paul:init --force\` to reinitialize
`
    }
    
    // Create .paul directory structure
    fileManager.ensurePaulDir()
    
    // Create default model config
    await fileManager.writeModelConfig(createDefaultModelConfig())
    
    // Create initial state for phase 1
    await fileManager.writePhaseState(1, {
      phase: 'UNIFY', // Start ready for new loop
      phaseNumber: 1,
      lastUpdated: Date.now(),
      metadata: {},
    })
    
    return `## ✅ OpenPAUL Initialized

Created \`.paul/\` directory with:
- \`model-config.json\` — Model configuration
- \`state-phase-1.json\` — Initial state

### Next Steps
Run \`/paul:plan\` to create your first plan.
`
  },
})
```

### Progress Command Implementation
```typescript
// src/commands/progress.ts
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { StateManager } from '../state/state-manager'
import { progressBar } from '../output/progress-bar'

export const paulProgress = tool({
  description: 'View current loop status, position, and next action.',
  args: {
    verbose: z.boolean().optional().describe('Show detailed status'),
  },
  async execute(args, context) {
    const stateManager = new StateManager(context.directory)
    const position = stateManager.getCurrentPosition()
    
    if (!position) {
      return `## 📍 OpenPAUL Status

**Status:** Not initialized

### What to do
Run \`/paul:init\` to set up OpenPAUL in this project.
`
    }
    
    const nextAction = stateManager.getRequiredNextAction(position.phase)
    const loopVisual = formatLoopVisual(position.phase)
    
    if (!args.verbose) {
      return `## 📍 Loop: ${loopVisual}

**Phase:** ${position.phaseNumber}
**Next:** ${nextAction}
`
    }
    
    // Verbose output with more details
    const state = stateManager.loadPhaseState(position.phaseNumber)
    return `## 📍 Loop: ${loopVisual}

**Phase:** ${position.phaseNumber}
**Stage:** ${position.phase}
**Last updated:** ${new Date(state?.lastUpdated || 0).toISOString()}

### Next Action
${nextAction}

### Quick Commands
- \`/paul:plan\` — Create a new plan
- \`/paul:apply\` — Execute current plan  
- \`/paul:unify\` — Close the loop
`
  },
})

function formatLoopVisual(phase: LoopPhase): string {
  const stages = { PLAN: '◉', APPLY: '○', UNIFY: '○' }
  if (phase === 'APPLY') { stages.PLAN = '✓'; stages.APPLY = '◉' }
  if (phase === 'UNIFY') { stages.PLAN = '✓'; stages.APPLY = '✓'; stages.UNIFY = '◉' }
  return `PLAN → APPLY → UNIFY (${stages.PLAN} ${stages.APPLY} ${stages.UNIFY})`
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Console.log output | Structured rich text | Phase 2 | Better readability, adaptive detail |
| Raw error messages | Guided errors with next steps | Phase 2 | Users know how to fix issues |
| Manual state checks | LoopEnforcer validation | Phase 1 | Prevents invalid transitions |

**Deprecated/outdated:**
- Plain text output: Use rich formatting with headers and structure
- Generic errors: Always include context and next action

## Open Questions

1. **Plan File Storage Location**
   - What we know: Phase 1 uses `state-phase-N.json` in `.paul/`
   - What's unclear: Where plan files should be stored (PLAN.json vs embedded in state)
   - Recommendation: Store plans as `.paul/phases/{phase}-{plan}-PLAN.json` for isolation, reference from state

2. **Command Output Character Limits**
   - What we know: OpenCode renders tool output as messages
   - What's unclear: Is there a practical limit to output length
   - Recommendation: Default to concise (<2000 chars), use --verbose for details

## Validation Architecture

Note: `workflow.nyquist_validation` is not set in `.planning/config.json`, so this section is informational only.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x |
| Config file | jest.config.cjs |
| Quick run command | `npm test` |
| Full suite command | `npm run test:coverage` |
| Estimated runtime | ~5-10 seconds |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-01 | /paul:init creates .paul/ directory | unit | `npm test -- commands/init` | ❌ Wave 0 gap |
| CORE-02 | /paul:plan creates valid PLAN.json | unit | `npm test -- commands/plan` | ❌ Wave 0 gap |
| CORE-03 | /paul:apply executes tasks sequentially | unit | `npm test -- commands/apply` | ❌ Wave 0 gap |
| CORE-04 | /paul:unify creates SUMMARY.json | unit | `npm test -- commands/unify` | ❌ Wave 0 gap |
| CORE-05 | /paul:progress shows current state | unit | `npm test -- commands/progress` | ❌ Wave 0 gap |
| CORE-06 | /paul:help lists all 26 commands | unit | `npm test -- commands/help` | ❌ Wave 0 gap |

### Wave 0 Gaps (must be created before implementation)
- [ ] `src/tests/commands/init.test.ts` — covers CORE-01
- [ ] `src/tests/commands/plan.test.ts` — covers CORE-02
- [ ] `src/tests/commands/apply.test.ts` — covers CORE-03
- [ ] `src/tests/commands/unify.test.ts` — covers CORE-04
- [ ] `src/tests/commands/progress.test.ts` — covers CORE-05
- [ ] `src/tests/commands/help.test.ts` — covers CORE-06
- [ ] `src/tests/output/formatter.test.ts` — output formatting utilities

## Sources

### Primary (HIGH confidence)
- @opencode-ai/plugin types — node_modules/@opencode-ai/plugin/dist/*.d.ts — Tool registration, context types
- Phase 1 implementation — src/state/*.ts, src/storage/*.ts, src/types/*.ts — Existing infrastructure
- CONTEXT.md — .planning/phases/02-core-loop-commands/02-CONTEXT.md — User decisions

### Secondary (MEDIUM confidence)
- Jest documentation — https://jestjs.io/ — Testing patterns
- Zod documentation — https://zod.dev/ — Schema validation

### Tertiary (LOW confidence)
- None — research based on existing codebase and official docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All dependencies already installed and used
- Architecture: HIGH — Patterns established in Phase 1, tool API well-defined
- Pitfalls: HIGH — Based on existing codebase patterns and CONTEXT.md decisions

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days — stable APIs, existing codebase)
