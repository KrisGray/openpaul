---
name: paul:resume
description: Restore context from handoff and continue work
argument-hint:
allowed-tools: [Read, Glob]
---

<objective>
Restore PAUL context after a session break, determine current position, and guide next action.

**When to use:** Starting a new session on an existing PAUL project.
</objective>

<execution_context>
</execution_context>

<context>
@.paul/STATE.md
@src/workflows/resume-project.md
</context>

<process>

<step name="verify_paul">
Check for PAUL project:
```bash
ls .paul/STATE.md 2>/dev/null
```
If not found: "No PAUL project found. Run /paul:init to start."
</step>

<step name="find_handoff">
Look for handoff files:
```bash
ls -t .paul/HANDOFF-*.md 2>/dev/null | head -1
```
If handoff exists and is recent, read it first.
</step>

<step name="load_state">
Read `.paul/STATE.md` and extract:
- Current Position (phase, plan, status)
- Loop Position (PLAN ✓/○, APPLY ✓/○, UNIFY ✓/○)
- Session Continuity section:
  - Last session timestamp
  - Stopped at
  - Next action
  - Resume context bullets
</step>

<step name="reconcile_context">
Compare handoff (if exists) with STATE.md:
- Use most recent information
- If conflict, trust STATE.md (it's the live state)
- Note any discrepancies
</step>

<step name="determine_action">
Based on loop position, determine next action:

| Loop State | Next Action |
|------------|-------------|
| `○○○` | Create PLAN for current phase |
| `✓○○` | Review existing PLAN, await approval |
| `✓✓○` | Run UNIFY to close loop |
| `✓✓✓` | Loop complete, ready for next phase/plan |

If Session Continuity has explicit "Next action", use that.
</step>

<step name="display_resume">
Show resume status:

```
════════════════════════════════════════
PAUL PROJECT RESUMED
════════════════════════════════════════

Project: [name]
Phase: [N] of [M] - [phase name]
Plan: [plan id or "None yet"]

Loop Position:
┌─────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ UNIFY          │
│   [✓/○]    [✓/○]    [✓/○]          │
└─────────────────────────────────────┘

Last Session: [timestamp]
Stopped at: [description]

Next Action: [what to do]
════════════════════════════════════════
```
</step>

<step name="offer_options">
Present options:

1. **Continue** - Proceed with suggested action
2. **Status** - Run /paul:status for full details
3. **Review plan** - Show current PLAN.md
4. **Override** - Do something else

Wait for user direction.
</step>

</process>

<success_criteria>
- [ ] Context restored from STATE.md and/or handoff
- [ ] Loop position correctly identified
- [ ] Next action suggested
- [ ] User informed and ready to proceed
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** Partial inspiration from implicit resume behavior

### Adapted from GSD
- Reading STATE.md for position
- Offering options after resume

### PAUL Innovations
- **Explicit handoff support:** Reads HANDOFF-*.md files
- **Loop-focused display:** Shows PLAN/APPLY/UNIFY position
- **Prescriptive guidance:** Tells user exactly what command to run
- **Reconciliation logic:** Handles handoff vs STATE.md conflicts

### Design Philosophy
- Zero-context friendly: Works even if session has no memory
- Self-routing: Determines what to do, doesn't just show state
