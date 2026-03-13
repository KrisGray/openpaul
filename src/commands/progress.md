---
name: openpaul:progress
description: Smart status with routing - suggests ONE next action
argument-hint: "[context]"
allowed-tools: [Read]
---

<objective>
Show current progress and **route to exactly ONE next action**. Prevents decision fatigue by suggesting a single best path.

**When to use:**
- Mid-session check on progress
- After `/openpaul:resume` for more context
- When unsure what to do next
- To get a tailored suggestion based on your current focus
</objective>

<execution_context>
</execution_context>

<context>
$ARGUMENTS

@.openpaul/STATE.md
@.openpaul/ROADMAP.md
</context>

<process>

<step name="load_state">
Read `.openpaul/STATE.md` and `.openpaul/ROADMAP.md`:
- Current phase and total phases
- Current plan (if any)
- Loop position (PLAN/APPLY/UNIFY markers)
- Roadmap progress
- Performance metrics (if tracked)
- Blockers or concerns
</step>

<step name="calculate_progress">
Determine overall progress:

**Milestone Progress:**
- Phases complete: X of Y
- Current phase progress: Z%

**Current Loop:**
- Position: PLAN/APPLY/UNIFY
- Status: [what's happening]
</step>

<step name="consider_user_context">
**If `[context]` argument provided:**

User has given additional context about their current focus or constraint.
Factor this into routing decision:
- "I need to fix a bug first" → prioritize that over planned work
- "I only have 30 minutes" → suggest smaller scope
- "I want to finish this phase" → stay on current path
- "I'm stuck on X" → suggest debug or research approach

**If no argument:** Use default routing based on state alone.
</step>

<step name="determine_routing">
Based on state (+ user context if provided), determine **ONE** next action:

**Default routing (no user context):**

| Situation | Single Suggestion |
|-----------|-------------------|
| No plan exists | `/openpaul:plan` |
| Plan awaiting approval | "Approve plan to proceed" |
| Plan approved, not executed | `/openpaul:apply [path]` |
| Applied, not unified | `/openpaul:unify [path]` |
| Loop complete, more phases | `/openpaul:plan` (next phase) |
| Milestone complete | "Create next milestone or ship" |
| Blockers present | "Address blocker: [specific]" |
| Context at DEEP/CRITICAL | `/openpaul:pause` |

**With user context:** Adjust suggestion to align with stated intent.

**IMPORTANT:** Suggest exactly ONE action. Not multiple options.
</step>

<step name="display_progress">
Show progress with single routing:

```
════════════════════════════════════════
OpenPAUL PROGRESS
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
▶ NEXT: /openpaul:unify .openpaul/phases/02-features/02-03-PLAN.md
  Close the loop and update state.
────────────────────────────────────────

Type "yes" to proceed, or provide context for a different suggestion.
```
</step>

<step name="context_advisory">
If context is at DEEP or CRITICAL bracket:

```
⚠️ Context Advisory: Session at [X]% capacity.
   Recommended: /openpaul:pause before continuing.
```
</step>

</process>

<success_criteria>
- [ ] Overall progress displayed visually
- [ ] Current loop position shown
- [ ] Exactly ONE next action suggested (not multiple)
- [ ] User context considered if provided
- [ ] Context advisory shown if needed
</success_criteria>
