<loop_phases>

## Purpose

Explain the semantics of OpenPAUL's three loop phases: PLAN, APPLY, UNIFY. Every unit of work follows this loop. Skipping phases breaks traceability and increases risk.

## The Loop

```
    ┌─────────────────────────────────────────┐
    │                                         │
    ▼                                         │
  PLAN ────────► APPLY ────────► UNIFY ───────┘
    │              │               │
    │              │               │
 Define work   Execute work   Reconcile
 Get approval  Verify tasks   Update state
```

## PLAN Phase

**Purpose:** Define what will be built, how it will be verified, and what's out of scope.

**Artifacts Created:**
- `.openpaul/phases/{phase}-{plan}-PLAN.json`

**Activities:**
1. Analyze requirements and context
2. Define objective (Goal, Purpose, Output)
3. Write acceptance criteria (Given/When/Then)
4. Break down into tasks with Files, Action, Verify, Done
5. Set boundaries (DO NOT CHANGE, SCOPE LIMITS)
6. Define verification checklist
7. **Wait for approval before proceeding**

**Entry Condition:**
- Prior plan completed (UNIFY done) OR first plan
- ROADMAP indicates this phase is next

**Exit Condition:**
- `{phase}-{plan}-PLAN.json` created with all required sections
- User has approved the plan
- `state-phase-N.json` updated to PLAN phase

**Loop Position:**
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [PLAN complete, awaiting APPLY]
```

## APPLY Phase

**Purpose:** Execute the approved plan by completing tasks in order, verifying each.

**Artifacts Created:**
- Code/files specified in PLAN.json
- APPLY-LOG (optional, for complex plans)

**Activities:**
1. Read PLAN.json to load task definitions
2. For each task:
   - Execute the action
   - Run verification
   - Record result (pass/fail)
   - Stop at checkpoints, wait for human
3. Handle blockers by documenting and notifying
4. Track deviations from plan

**Entry Condition:**
- `{phase}-{plan}-PLAN.json` exists and is approved
- `state-phase-N.json` shows loop position at PLAN

**Exit Condition:**
- All tasks completed (or blocked with documentation)
- All verifications passed
- Ready for reconciliation

**Loop Position:**
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ○     [APPLY complete, ready for UNIFY]
```

## UNIFY Phase

**Purpose:** Reconcile what was planned vs. what was built. Close the loop.

**Artifacts Created:**
- `.openpaul/phases/{phase}-{plan}-SUMMARY.json`
- Updated `state-phase-N.json`
- Updated `STATE.md` (if present)
- Updated `ROADMAP.md` (if present and phase complete)

**Activities:**
1. Compare PLAN.json tasks to actual execution
2. Document what was built (files, lines)
3. Record acceptance criteria results (PASS/FAIL)
4. Note any deviations and why
5. Advance `state-phase-N.json` to UNIFY, then ready next phase for PLAN
6. Update `STATE.md` if present
7. Update ROADMAP.md if phase is complete

**Entry Condition:**
- APPLY phase complete (all tasks done or documented blockers)

**Exit Condition:**
- `{phase}-{plan}-SUMMARY.json` created with results
- `state-phase-N.json` advanced to UNIFY
- Loop closed, ready for next PLAN

**Loop Position:**
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [Loop complete, ready for next PLAN]
```

## Loop Invariants

**Never Skip PLAN:**
```
# BAD
"Let me just quickly implement this without a plan"

# GOOD
"Let me create a PLAN.json first, even for small work"
```
Why: No plan = no acceptance criteria = no way to verify completion.

**Never Execute Without Approval:**
```
# BAD
"I've written the plan, now executing..."

# GOOD
"Plan created. Ready to execute when you approve."
```
Why: Plans may have incorrect assumptions. Approval catches issues early.

**Always Close With UNIFY:**
```
# BAD
"Tasks done. Moving to next phase."

# GOOD
"Tasks done. Creating SUMMARY.json and advancing state."
```
Why: No UNIFY = no record of what was built = lost traceability.

## Phase Transitions

### PLAN → APPLY
Trigger: User approves plan (explicit signal)

Validation:
- [ ] PLAN.json has all required fields
- [ ] Acceptance criteria are testable
- [ ] Tasks have Files, Action, Verify, Done
- [ ] Boundaries are clear

### APPLY → UNIFY
Trigger: All tasks complete OR blockers documented

Validation:
- [ ] Each task verification passed (or blocker recorded)
- [ ] No skipped tasks
- [ ] Deviations noted

### UNIFY → PLAN (next)
Trigger: SUMMARY.json created, state-phase-N.json advanced

Validation:
- [ ] SUMMARY.json has AC results
- [ ] `state-phase-N.json` reflects new position
- [ ] ROADMAP.md updated if phase complete

## Visual Loop Position Format

STATE.md (if present) displays loop position visually:

```markdown
## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [Description of current state]
```
```

Symbols:
- `✓` = Phase complete
- `○` = Phase pending
- `►` = Currently in this phase (optional)

## Anti-Patterns

**Partial loops:**
```
PLAN → APPLY → (skip UNIFY) → PLAN
```
Why bad: No record of what was built. Can't track progress.

**Implicit approval:**
```
"I assume the plan is approved and will proceed"
```
Why bad: May execute on flawed assumptions. Always wait for explicit approval.

**UNIFY debt:**
```
"I'll write the SUMMARY later"
```
Why bad: Context degrades. Write SUMMARY immediately after APPLY.

</loop_phases>
