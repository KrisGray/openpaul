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

```markdown
---
phase: 01-foundation
plan: 01
type: execute
autonomous: true
---

<objective>
What you're building and why.
</objective>

<context>
@-references to relevant files.
</context>

<acceptance_criteria>

## AC-1: Feature Works

Given [precondition]
When [action]
Then [outcome]
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>Task name</name>
  <files>path/to/file.ts</files>
  <action>Implementation details...</action>
  <verify>How to verify completion</verify>
  <done>AC-1 satisfied</done>
</task>
</tasks>

<boundaries>
## DO NOT CHANGE
- database/migrations/*
- src/lib/auth.ts
</boundaries>
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

OpenPAUL prompts you to describe what you want to build, then generates a structured PLAN.md.

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

Or specify a path:
```
/openpaul:apply .openpaul/phases/01-foundation/01-01-PLAN.md
```

---

## UNIFY

Close the loop (required!).

### What UNIFY Does

1. **Creates SUMMARY.md**
   - What was built
   - Plan vs actual comparison
   - Decisions made
   - Issues deferred

2. **Updates STATE.md**
   - Current position
   - Accumulated decisions
   - Next phase/plan

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
/openpaul:research <topic>  # Explore options
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
