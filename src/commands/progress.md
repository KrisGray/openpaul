---
name: paul:progress
description: Smart status with routing - suggests exact next action
argument-hint:
allowed-tools: [Read]
---

<objective>
Show current progress and **route to the correct next action**. More actionable than status.

**When to use:** When unsure what to do next, or to get a quick progress check with guidance.
</objective>

<execution_context>
</execution_context>

<context>
@.paul/STATE.md
@.paul/ROADMAP.md
</context>

<process>

<step name="load_state">
Read `.paul/STATE.md` and `.paul/ROADMAP.md`:
- Current phase and total phases
- Current plan (if any)
- Loop position
- Roadmap progress
- Performance metrics (if tracked)
</step>

<step name="calculate_progress">
Determine overall progress:

**Milestone Progress:**
- Phases complete: X of Y
- Current phase progress: Z%
- Estimated remaining: [phases left]

**Current Loop:**
- Position: PLAN/APPLY/UNIFY
- Status: [what's happening]
</step>

<step name="determine_routing">
Based on state, determine exact next command:

| Situation | Route To |
|-----------|----------|
| No plan exists | `/paul:plan` |
| Plan awaiting approval | "Review plan, then approve" |
| Plan approved, not executed | `/paul:apply` |
| Applied, not unified | `/paul:unify` |
| Loop complete, more plans | `/paul:plan` |
| Phase complete | `/paul:plan` (next phase) |
| Milestone complete | "Ready for next milestone" |
| Context getting large | `/paul:pause` |
| Stuck or blocked | "Review blockers in STATE.md" |
</step>

<step name="display_progress">
Show progress with routing:

```
════════════════════════════════════════
PAUL PROGRESS
════════════════════════════════════════

Milestone: [name] - [X]% complete
├── Phase 1: [name] ████████████ Done
├── Phase 2: [name] ████████░░░░ 70%
├── Phase 3: [name] ░░░░░░░░░░░░ Pending
└── Phase 4: [name] ░░░░░░░░░░░░ Pending

Current Loop: Phase 2, Plan 02-03
┌─────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ UNIFY          │
│    ✓        ✓        ○             │
└─────────────────────────────────────┘

────────────────────────────────────────
▶ NEXT: /paul:unify
  Close the loop and update state.
────────────────────────────────────────
```
</step>

<step name="context_check">
If conversation is long, suggest pause:

```
⚠️ Context Advisory: This session is getting long.
   Consider running /paul:pause before context limit.
```
</step>

</process>

<success_criteria>
- [ ] Overall progress displayed
- [ ] Current loop position shown
- [ ] Exact next command suggested
- [ ] Context advisory shown if needed
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** N/A - PAUL Innovation

### PAUL Innovation
This is a **PAUL-native feature** combining:
- Status display (like /paul:status)
- Intelligent routing (determines what to do)
- Context awareness (warns about session length)

### Difference from /paul:status
- **status:** Shows current state objectively
- **progress:** Shows state AND tells you what to do next

### Design Philosophy
- **Action-oriented:** Every display ends with a clear next step
- **Context-aware:** Proactively suggests pause when needed
- **Visual progress:** Shows milestone completion at a glance
