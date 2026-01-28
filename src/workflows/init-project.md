<purpose>
Initialize PAUL structure in a new project. Creates .paul/ directory with PROJECT.md, ROADMAP.md, STATE.md, and phases/ directory. Gathers project context conversationally before routing to planning.
</purpose>

<when_to_use>
- Starting PAUL in a project that doesn't have .paul/ directory
- User explicitly requests project initialization
- Beginning a new project from scratch
</when_to_use>

<loop_context>
N/A - This is a setup workflow, not a loop phase.
After init, project is ready for first PLAN.
</loop_context>

<philosophy>
**Flow and momentum:** Init should feel like the natural start of work, not a chore.
- Ask questions conversationally
- Populate files from answers (user doesn't edit templates)
- End with ONE next action
- Build momentum into planning
</philosophy>

<process>

<step name="check_existing" priority="first">
1. Check if .paul/ directory exists:
   ```bash
   ls .paul/ 2>/dev/null
   ```
2. If exists:
   - "PAUL already initialized in this project."
   - Route to `/paul:resume` or `/paul:progress`
   - Exit this workflow
3. If not exists: proceed with initialization
</step>

<step name="create_structure">
Create directories first (gives immediate feedback):
```bash
mkdir -p .paul/phases
```

Display:
```
PAUL structure created.

Before planning, I need to understand what you're building.
```
</step>

<step name="gather_core_value">
**Ask ONE question at a time. Wait for response before next question.**

**Question 1: Core Value**
```
What's the core value this project delivers?

(Example: "Users can track expenses and see spending patterns")
```

Wait for user response. Store as `core_value`.
</step>

<step name="gather_description">
**Question 2: What are you building?**
```
What are you building? (1-2 sentences)

(Example: "A CLI tool for managing Docker containers")
```

Wait for user response. Store as `description`.
</step>

<step name="gather_project_name">
**Question 3: Project name**

Infer from:
1. Directory name
2. package.json name field
3. Ask if unclear

If obvious, confirm:
```
Project name: [inferred-name]

Is this correct? (yes/different name)
```

Store as `project_name`.
</step>

<step name="create_project_md">
Create `.paul/PROJECT.md` with gathered information:

```markdown
# Project: [project_name]

## Description
[description]

## Core Value
[core_value]

## Requirements

### Must Have
- [To be defined during planning]

### Should Have
- [To be defined during planning]

### Nice to Have
- [To be defined during planning]

## Constraints
- [To be identified during planning]

## Success Criteria
- [core_value] is achieved
- [To be refined during planning]

---
*Created: [timestamp]*
```

Note: Requirements and constraints are populated during planning, not init.
</step>

<step name="create_roadmap_md">
Create `.paul/ROADMAP.md`:

```markdown
# Roadmap: [project_name]

## Overview
[description]

## Current Milestone
**v0.1 Initial Release** (v0.1.0)
Status: Not started
Phases: 0 of TBD complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | TBD | TBD | Not started | - |

## Phase Details

Phases will be defined during `/paul:plan`.

---
*Roadmap created: [timestamp]*
```

Note: Phase details are populated during planning, not init.
</step>

<step name="create_state_md">
Create `.paul/STATE.md`:

```markdown
# Project State

## Project Reference

See: .paul/PROJECT.md (updated [timestamp])

**Core value:** [core_value]
**Current focus:** Project initialized — ready for planning

## Current Position

Milestone: v0.1 Initial Release
Phase: Not yet defined
Plan: None yet
Status: Ready to create roadmap and first PLAN
Last activity: [timestamp] — Project initialized

Progress:
- Milestone: [░░░░░░░░░░] 0%

## Loop Position

Current loop state:
```
PLAN ──▶ APPLY ──▶ UNIFY
  ○        ○        ○     [Ready for first PLAN]
```

## Accumulated Context

### Decisions
None yet.

### Deferred Issues
None yet.

### Blockers/Concerns
None yet.

## Session Continuity

Last session: [timestamp]
Stopped at: Project initialization complete
Next action: Run /paul:plan to define phases and first plan
Resume file: .paul/PROJECT.md

---
*STATE.md — Updated after every significant action*
```
</step>

<step name="confirm_and_route">
**Display confirmation with ONE next action:**

```
════════════════════════════════════════
PAUL INITIALIZED
════════════════════════════════════════

Project: [project_name]
Core value: [core_value]

Created:
  .paul/PROJECT.md    ✓
  .paul/ROADMAP.md    ✓
  .paul/STATE.md      ✓
  .paul/phases/       ✓

────────────────────────────────────────
▶ NEXT: /paul:plan
  Define your phases and create your first plan.
────────────────────────────────────────

Type "yes" to proceed, or ask questions first.
```

**Do NOT suggest multiple next steps.** ONE action only.
</step>

</process>

<output>
- `.paul/` directory structure
- `.paul/PROJECT.md` (populated from conversation)
- `.paul/ROADMAP.md` (skeleton for planning)
- `.paul/STATE.md` (initialized state)
- `.paul/phases/` (empty directory)
- Clear routing to `/paul:plan`
</output>

<error_handling>
**Permission denied:**
- Report filesystem error
- Ask user to check permissions

**User declines to answer:**
- Use "[TBD]" placeholder
- Note that planning will ask for this information

**Partial creation failure:**
- Report what was created vs failed
- Offer to retry or clean up
</error_handling>
