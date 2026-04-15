# The Loop

The core workflow of OpenPAUL is the PLAN → APPLY → UNIFY loop.

## Overview

```
┌─────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ UNIFY          │
│                                     │
│  Define    Execute    Reconcile     │
│  work      tasks      & close       │
└─────────────────────────────────────┘
```

Every unit of work follows this cycle. **Never skip UNIFY.**

---

## PLAN

Create an executable plan with structured sections.

### Structure

```json
{
  "phase": "1",
  "plan": "01",
  "criteria": [
    "AC-1: Feature works",
    "AC-2: Errors handled"
  ],
  "tasks": [
    {
      "name": "Implement login endpoint",
      "files": ["src/api/auth/login.ts"],
      "action": "Add POST /auth/login with JWT response",
      "verify": "curl /auth/login returns 200",
      "done": "AC-1 satisfied"
    }
  ],
  "boundaries": ["DO NOT change database/migrations/*"]
}
```

### Key Sections

| Section | Purpose |
|---------|---------|
| objective | What and why |
| context | File references (@-syntax) |
| acceptance_criteria | Given/When/Then definitions |
| tasks | Sequential actions with verification |
| boundaries | What NOT to change |

### How to Create

```
/openpaul:plan
```

OpenPAUL prompts you to describe what you want to build, then generates a structured PLAN.json.

---

## APPLY

Execute the approved plan.

### Execution Rules

1. **Sequential** — Tasks run one at a time
2. **Verified** — Each task has a verify step
3. **Checkpointed** — Pause for human input when needed
4. **Logged** — Deviations are recorded

### Checkpoints

```
✓ Task 1: Create model (verified: tests pass)
✓ Task 2: Add endpoint (verified: curl returns 200)
⏸ Task 3: Checkpoint — Verify login flow manually?

YOU: approved

✓ Task 3: Login flow works
```

### How to Execute

```
/openpaul:apply
```

Or specify phase and plan:
```
/openpaul:apply --phase 1 --plan 01
```

---

## UNIFY

Close the loop (required!).

### What UNIFY Does

1. **Creates SUMMARY.json**
   - What was built
   - Plan vs actual comparison
   - Decisions made
   - Issues deferred

2. **Updates loop state**
   - Current position
   - Accumulated decisions
   - Next phase/plan
   - Updates STATE.md if present

3. **Logs Decisions**
   - Architecture choices
   - Trade-offs
   - Future considerations

### Why UNIFY Matters

| Without UNIFY | With UNIFY |
|---------------|------------|
| Orphan plans | Every plan closed |
| Lost decisions | Decisions logged |
| Drifted state | Reconciled state |
| No handoff | Clear summary |

### How to Close

```
/openpaul:unify
```

---

## Loop Integrity

The loop is not optional:

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete]
```

### Enforced Rules

- **No orphan plans** — Every PLAN gets a SUMMARY
- **State reconciliation** — UNIFY catches drift
- **Decision logging** — Choices are recorded

### With OpenCARL

OpenCARL can enforce loop discipline automatically:

```
# Detects .openpaul/ and loads rules
- Loop enforcement (no skipping UNIFY)
- Boundary protection (DO NOT CHANGE sections)
- State consistency checks
```

---

## Common Patterns

### New Feature

```
/openpaul:plan      # Describe the feature
[review plan]
/openpaul:apply     # Execute tasks
/openpaul:unify     # Close the loop
```

### Bug Fix

```
/openpaul:plan-fix  # Plan fixes for UAT issues
[review plan]
/openpaul:apply
/openpaul:unify
```

### Research First

```
Research can be done by asking the assistant directly, or use the research CLI tool.
[review findings]
/openpaul:plan              # Create informed plan
/openpaul:apply
/openpaul:unify
```

### Multi-Phase Project

```
/openpaul:milestone <name>  # Start milestone
/openpaul:plan              # Phase 1 plan
/openpaul:apply
/openpaul:unify
/openpaul:plan              # Phase 2 plan
...
/openpaul:complete-milestone  # Archive milestone
```
