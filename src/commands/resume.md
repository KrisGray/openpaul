---
name: paul:resume
description: Restore context from handoff and continue work
argument-hint:
allowed-tools: [Read, Glob]
---

<objective>
Restore PAUL context after a session break, determine current position, and suggest exactly ONE next action.

**When to use:** Starting a new session on an existing PAUL project.
</objective>

<execution_context>
@~/.claude/paul-framework/workflows/resume-project.md
</execution_context>

<context>
@.paul/STATE.md
</context>

<process>
**Follow workflow: @~/.claude/paul-framework/workflows/resume-project.md**

The workflow implements:
1. Verify .paul/ exists
2. Find and load handoff (if recent)
3. Load STATE.md
4. Reconcile handoff vs STATE.md
5. Determine exactly ONE next action based on loop position
6. Display resume status with single routing

**Key behavior:** Suggest exactly ONE next action, not multiple options.
</process>

<success_criteria>
- [ ] Context restored from STATE.md and/or handoff
- [ ] Loop position correctly identified
- [ ] Exactly ONE next action suggested (not multiple options)
- [ ] User can proceed or redirect with context
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** Partial inspiration from implicit resume behavior

### Adapted from GSD
- Reading STATE.md for position
- Determining next action from state

### PAUL Innovations
- **Explicit handoff support:** Reads HANDOFF-*.md files
- **Loop-focused display:** Shows PLAN/APPLY/UNIFY position
- **Single next action:** ONE suggestion, not multiple options (prevents decision fatigue)
- **Reconciliation logic:** Handles handoff vs STATE.md conflicts

### Design Philosophy
- Zero-context friendly: Works even if session has no memory
- Self-routing: Determines what to do, doesn't just show state
- Decision fatigue prevention: ONE clear action, user can redirect
