# OpenPAUL Overview

**Plan-Apply-Unify Loop** — Structured AI-assisted development for OpenCode.

## What is OpenPAUL?

OpenPAUL gives your AI assistant structured workflow discipline. Instead of ad-hoc coding sessions that lose context and forget decisions, you follow a loop that ensures every unit of work is planned, executed, and closed properly.

## The Loop

```
┌─────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ UNIFY          │
│                                     │
│  Define    Execute    Reconcile     │
│  work      tasks      & close       │
└─────────────────────────────────────┘
```

### PLAN
Create an executable plan with:
- **Objective** — What you're building and why
- **Acceptance Criteria** — Given/When/Then definitions of done
- **Tasks** — Specific actions with files, verification, done criteria
- **Boundaries** — What NOT to change

### APPLY
Execute the approved plan:
- Tasks run sequentially
- Each task has verification
- Checkpoints pause for human input
- Deviations are logged

### UNIFY
Close the loop (required!):
- Create SUMMARY.md documenting what was built
- Compare plan vs actual
- Record decisions and deferred issues
- Update STATE.md

**Never skip UNIFY.** Every plan needs closure.

## How It Works

```
You: I want to add user authentication
   │
   ▼
/openpaul:plan
   │
   ▼
OpenPAUL generates PLAN.md with:
- Objective
- Acceptance Criteria (Given/When/Then)
- Tasks (files, actions, verify, done)
- Boundaries (DO NOT CHANGE sections)
   │
   ▼
You review and approve
   │
   ▼
/openpaul:apply
   │
   ▼
Tasks execute sequentially with verification
   │
   ▼
/openpaul:unify
   │
   ▼
SUMMARY.md created, STATE.md updated
Decisions logged for future sessions
```

## Core Concepts

### State Management
STATE.md tracks:
- Current phase and plan
- Loop position (PLAN/APPLY/UNIFY markers)
- Session continuity
- Accumulated decisions
- Blockers and deferred issues

### Acceptance-Driven Development
Acceptance criteria are first-class citizens:
1. **AC defined before tasks** — Know what "done" means
2. **Tasks reference AC** — Every task links to AC-1, AC-2, etc.
3. **Verification required** — Every task needs a verify step
4. **BDD format** — Given/When/Then for testability

### In-Session Context
OpenPAUL minimizes subagents for development work:
- Subagents are expensive (~2-3k tokens to spawn)
- They start fresh, research from scratch
- Results must be integrated back
- Quality gap (~70% vs in-session)

**When OpenPAUL does use subagents:**
- Discovery/exploration — Codebase mapping
- Research — Web searches, documentation gathering

For implementation, OpenPAUL keeps everything in-session.

## File Structure

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

## Quick Examples

### Initialize a Project
```bash
npx openpaul
```

### Create a Plan
```
/openpaul:plan
```
OpenPAUL prompts you to describe what you want to build, then generates a structured PLAN.md.

### Execute the Plan
```
/openpaul:apply
```
Tasks execute sequentially with verification at each step.

### Close the Loop
```
/openpaul:unify
```
Creates SUMMARY.md, updates STATE.md, records decisions.

### Resume After Break
```
/openpaul:resume
```
Reads STATE.md and suggests exactly ONE next action.

## With OpenCARL

For the best experience, use OpenPAUL with **OpenCARL** — a dynamic rule injection system:

```bash
# Initialize both
npx openpaul
npx opencarl --local
```

OpenCARL auto-loads OpenPAUL-specific rules when it detects `.openpaul/` directory:
- Loop enforcement (no skipping UNIFY)
- Boundary protection (DO NOT CHANGE sections)
- State consistency checks
- Verification requirements
