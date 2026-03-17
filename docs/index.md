# OpenPAUL Documentation

**Plan-Apply-Unify Loop** — Structured AI-assisted development for OpenCode.

---

## Quick Start

### The Core Loop in Action

Here's a complete workflow example showing OpenPAUL in action:

```
┌─────────────────────────────────────────────────────────────────┐
│  YOU: I need to add user authentication to my app              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Initialize OpenPAUL                                   │
│                                                                 │
│  /openpaul:init                                                 │
│                                                                 │
│  Creates: .openpaul/ directory with PROJECT.md, ROADMAP.md,    │
│  STATE.md, and phases/ folder                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Plan Your Work                                        │
│                                                                 │
│  /openpaul:plan                                                 │
│                                                                 │
│  OpenPAUL prompts you to describe what you want to build,      │
│  then generates a structured PLAN.md with:                      │
│  - Objective (what & why)                                       │
│  - Acceptance Criteria (Given/When/Then)                        │
│  - Tasks with files, actions, verification steps                │
│  - Boundaries (what NOT to change)                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Review & Approve                                       │
│                                                                 │
│  YOU: The plan looks good, let's do it                         │
│                                                                 │
│  (Or: "Actually, I also need password reset" → plan updated)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Execute the Plan                                       │
│                                                                 │
│  /openpaul:apply                                                │
│                                                                 │
│  Tasks execute sequentially:                                    │
│  ✓ Task 1: Create User model (verified: tests pass)            │
│  ✓ Task 2: Add login endpoint (verified: curl returns 200)     │
│  ✓ Task 3: Create login UI (verified: renders correctly)       │
│  ⏸ Task 4: Checkpoint — Verify login flow manually?            │
│                                                                 │
│  YOU: approved                                                   │
│                                                                 │
│  ✓ Task 5: Add session management                               │
│  ✓ All tasks complete                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Close the Loop (REQUIRED!)                            │
│                                                                 │
│  /openpaul:unify                                                │
│                                                                 │
│  Creates SUMMARY.md:                                            │
│  - What was built                                               │
│  - Plan vs actual comparison                                    │
│  - Decisions made                                               │
│  - Issues deferred                                              │
│                                                                 │
│  Updates STATE.md with:                                         │
│  - Current position                                             │
│  - Accumulated decisions                                        │
│  - Next phase/plan                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: Continue Development                                   │
│                                                                 │
│  /openpaul:progress                                             │
│                                                                 │
│  Shows: "Phase 1 complete. Next: Phase 2 - User Profile"       │
│  Suggests: ONE next action                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Real-World Example: Adding a Feature

```
YOU: /openpaul:plan

OpenPAUL: What would you like to build?

YOU: I need to add a dark mode toggle to my React app. It should:
- Remember the user's preference in localStorage
- Default to system preference on first visit
- Toggle without page reload

OpenPAUL: [Creates PLAN.md]

## Plan: Dark Mode Toggle

### Objective
Add a persistent dark mode toggle with system preference detection

### Acceptance Criteria
- **AC-1**: Given user visits app, When no preference stored, Then use system preference
- **AC-2**: Given user clicks toggle, When in light mode, Then switch to dark and save
- **AC-3**: Given user returns, When preference stored, Then apply saved preference

### Tasks
1. Create ThemeContext with useLocalStorage hook
2. Add CSS variables for dark/light themes
3. Create ThemeToggle component
4. Integrate into App.tsx

### Boundaries
- DO NOT change: auth-related components, API routes

YOU: Looks good. /openpaul:apply

OpenPAUL: [Executes tasks one by one with verification...]

YOU: /openpaul:unify

OpenPAUL: [Creates SUMMARY.md, updates STATE.md]

Done. Loop complete.
```

### Session Continuity

Resume work after a break:

```
[New session]

YOU: /openpaul:resume

OpenPAUL: 
## Session Restored

**Last Session:** 2024-01-15
**Stopped at:** Phase 2, Plan 3 - User Profile
**Status:** 2/4 tasks complete

**What was built:**
- Profile display component
- Edit profile form

**What's next:**
Task 3: Add avatar upload
  File: src/components/AvatarUpload.tsx
  Action: Create component with drag-drop and crop preview

**Suggested command:** /openpaul:apply .openpaul/phases/02-profile/02-03-PLAN.md
```

---

## Using OpenPAUL with OpenCARL

**OpenCARL** ([github.com/KrisGray/opencarl](https://github.com/KrisGray/opencarl)) is a dynamic rule injection system that loads rules based on context. Together, they create a powerful AI-assisted development experience.

### Why Use Both?

| OpenPAUL | OpenCARL |
|----------|----------|
| Structured workflow (PLAN → APPLY → UNIFY) | Dynamic rule injection |
| Guides planning & execution | Loads rules based on context |
| Ensures loop closure | Keeps context lean |
| State persistence | Preferences persistence |

**The synergy:** OpenCARL loads OpenPAUL-specific rules when you're working in an OpenPAUL project, enforcing workflow discipline without bloating every session.

### Installation (Both Extensions)

```bash
# Install both packages
npm install @krisgray/opencarl @krisgray/openpaul
```

```json
// opencode.json
{
  "plugin": [
    "@krisgray/opencarl",
    "@krisgray/openpaul"
  ]
}
```

### Combined Workflow Example

```
# 1. Initialize both systems
/openpaul:init
/opencarl setup

# 2. OpenCARL detects .openpaul/ directory
#    → Automatically loads OpenPAUL-specific rules:
#    - "Loop enforcement (PLAN → APPLY → UNIFY)"
#    - "Boundary protection for DO NOT CHANGE sections"
#    - "Verification required for every task"

# 3. Plan your work
/openpaul:plan

# OpenCARL injects planning rules:
# - "Define acceptance criteria before tasks"
# - "Every task needs files, action, verify, done"
# - "Set boundaries — what NOT to change"

# 4. Execute the plan
/openpaul:apply

# OpenCARL injects execution rules:
# - "Run tests after implementation changes"
# - "Verify each task before moving on"
# - "Log deviations from plan"

# 5. Close the loop (required!)
/openpaul:unify

# OpenCARL injects closure rules:
# - "Create SUMMARY.md documenting what was built"
# - "Compare plan vs actual"
# - "Record decisions for future sessions"
```

### Real-World Scenario: Feature Development with Both

```
YOU: /openpaul:plan

OpenPAUL: Creates plan structure...
OpenCARL: [Injects OpenPAUL + Development rules]
  ✓ DEVELOPMENT_RULE_0: Code over explanation - show, don't tell
  ✓ DEVELOPMENT_RULE_1: Prefer editing existing files over creating new
  ✓ OPENPAUL_RULE_0: Loop enforcement - no skipping UNIFY
  ✓ OPENPAUL_RULE_1: Every task needs verification

YOU: [Describe the feature you want]

OpenPAUL: Generates PLAN.md with:
  - Objective
  - Acceptance Criteria (Given/When/Then)
  - Tasks with verification steps
  - Boundaries

YOU: /openpaul:apply

OpenPAUL: Executes tasks sequentially...
OpenCARL: [Injects execution rules + context tracking]
  ✓ Running tests after changes
  ✓ Verifying each task
  ✓ Logging deviations

[... work happens ...]

OpenPAUL: Task complete. Checkpoint: Run tests?
YOU: yes

OpenPAUL: Tests pass. Next task...
OpenCARL: [Context depleting → Injects fresh session rules]

[... more work ...]

YOU: /openpaul:unify

OpenPAUL: Creates SUMMARY.md, updates STATE.md
OpenCARL: [Injects closure rules]
  ✓ Document what was built
  ✓ Compare plan vs actual
  ✓ Record decisions

Done. Loop complete. State preserved for next session.
```

### OpenPAUL-Specific Rules That OpenCARL Enforces

When OpenCARL detects you're working in an OpenPAUL project:

1. **Loop Enforcement** — No skipping UNIFY. Every plan needs closure.
2. **Boundary Protection** — `DO NOT CHANGE` sections in plans are sacred.
3. **AC-First Development** — Acceptance criteria defined before tasks.
4. **Verification Requirements** — Every task needs a verify step.
5. **State Consistency** — STATE.md must reflect reality after each phase.

These rules load automatically when you're in `.openpaul/` context and disappear when you're not.

---

## Core Commands

| Command | What it does |
|---------|--------------|
| `/openpaul:init` | Initialize OpenPAUL in a project |
| `/openpaul:plan [phase]` | Create an executable plan |
| `/openpaul:apply [path]` | Execute an approved plan |
| `/openpaul:unify [path]` | Reconcile and close the loop |
| `/openpaul:progress` | Show status + ONE next action |
| `/openpaul:resume` | Restore context and continue |
| `/openpaul:help` | Show complete command reference |

---

## Project Structure

```
.openpaul/
├── PROJECT.md           # Project context and requirements
├── ROADMAP.md           # Phase breakdown and milestones
├── STATE.md             # Loop position and session state
├── config.md            # Optional integrations
├── SPECIAL-FLOWS.md     # Optional skill requirements
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-features/
        ├── 02-01-PLAN.md
        └── 02-01-SUMMARY.md
```

---

## Further Reading

- [Commands Reference](../README.md#commands) — Complete command list
- [Philosophy](../README.md#philosophy) — Why OpenPAUL works this way
- [Comparison](../README.md#comparison) — OpenPAUL vs alternatives
- [OpenCARL Integration](https://github.com/KrisGray/opencarl) — Dynamic rule injection

---

*OpenPAUL — Quality over speed-for-speed's-sake.*
