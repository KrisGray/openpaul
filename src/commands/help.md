---
name: openpaul:help
description: Show available OpenPAUL commands and usage guide
---

<objective>
Display the complete OpenPAUL command reference.

Output ONLY the reference content below. Do NOT add:

- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>

<reference>
# OpenPAUL Command Reference

**OpenPAUL** (Plan-Apply-Unify Loop) is a structured AI-assisted development framework for OpenCode.

## The Loop

Every unit of work follows this cycle:

```
┌─────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ UNIFY          │
│                                     │
│  Define    Execute    Reconcile     │
│  work      tasks      & close       │
└─────────────────────────────────────┘
```

**Never skip UNIFY.** Every plan needs a summary.

## Quick Start

1. `/openpaul:init` - Initialize OpenPAUL in your project
2. `/openpaul:plan` - Create a plan for your work
3. `/openpaul:apply` - Execute the approved plan
4. `/openpaul:unify` - Close the loop with summary

## Commands Overview

| Category | Commands |
|----------|----------|
| Core Loop | init, plan, apply, unify, help, status |
| Session | pause, resume, progress, handoff |
| Roadmap | add-phase, remove-phase |
| Milestone | milestone, complete-milestone, discuss-milestone |
| Pre-Planning | discuss, assumptions, discover, consider-issues |
| Research | research, research-phase |
| Specialized | flows, config, map-codebase |
| Quality | verify, plan-fix |

---

## Core Loop Commands

### `/openpaul:init`
Initialize OpenPAUL in a project.

- Creates `.openpaul/` directory structure
- Creates PROJECT.md, STATE.md, ROADMAP.md
- Prompts for project context and phases
- Optionally configures integrations (SonarQube, etc.)

Usage: `/openpaul:init`

---

### `/openpaul:plan [phase]`
Enter PLAN phase - create an executable plan.

- Reads current state from STATE.md
- Creates PLAN.md with tasks, acceptance criteria, boundaries
- Populates skills section from SPECIAL-FLOWS.md (if configured)
- Updates loop position

Usage: `/openpaul:plan` (auto-detects next phase)
Usage: `/openpaul:plan 3` (specific phase)

---

### `/openpaul:apply [plan-path]`
Execute an approved PLAN.md file.

- **Blocks if required skills not loaded** (from SPECIAL-FLOWS.md)
- Validates plan exists and hasn't been executed
- Executes tasks sequentially
- Handles checkpoints (decision, human-verify, human-action)
- Reports completion and prompts for UNIFY

Usage: `/openpaul:apply`
Usage: `/openpaul:apply .openpaul/phases/01-foundation/01-01-PLAN.md`

---

### `/openpaul:unify [plan-path]`
Reconcile plan vs actual and close the loop.

- Creates SUMMARY.md documenting what was built
- Audits skill invocations (if SPECIAL-FLOWS.md configured)
- Records decisions made, deferred issues
- Updates STATE.md with loop closure
- **Required** - never skip this step

Usage: `/openpaul:unify`
Usage: `/openpaul:unify .openpaul/phases/01-foundation/01-01-PLAN.md`

---

### `/openpaul:help`
Show this command reference.

Usage: `/openpaul:help`

---

### `/openpaul:status` *(deprecated)*
> Use `/openpaul:progress` instead.

Shows current loop position. Deprecated in favor of `/openpaul:progress` which provides better routing.

---

## Session Commands

### `/openpaul:pause [reason]`
Create handoff file and prepare for session break.

- Creates HANDOFF.md with complete context
- Updates STATE.md session continuity section
- Designed for context limits or multi-session work

Usage: `/openpaul:pause`
Usage: `/openpaul:pause "switching to other project"`

---

### `/openpaul:resume [handoff-path]`
Restore context from handoff and continue work.

- Reads STATE.md and any HANDOFF files
- Determines current loop position
- Suggests exactly ONE next action
- Archives consumed handoffs

Usage: `/openpaul:resume`
Usage: `/openpaul:resume .openpaul/HANDOFF-context.md`

---

### `/openpaul:progress [context]`
Smart status with routing - suggests ONE next action.

- Shows milestone and phase progress visually
- Displays current loop position
- Suggests exactly ONE next action (prevents decision fatigue)
- Accepts optional context to tailor suggestion
- Warns about context limits

Usage: `/openpaul:progress`
Usage: `/openpaul:progress "I only have 30 minutes"`

---

### `/openpaul:handoff [context]`
Generate comprehensive session handoff document.

- Creates detailed handoff for complex session breaks
- Captures decisions, progress, blockers, next steps
- More thorough than `/openpaul:pause`

Usage: `/openpaul:handoff`
Usage: `/openpaul:handoff "phase10-audit"`

---

## Roadmap Commands

### `/openpaul:add-phase <description>`
Append a new phase to the roadmap.

- Adds phase to end of ROADMAP.md
- Updates phase numbering
- Records in STATE.md decisions

Usage: `/openpaul:add-phase "API Authentication Layer"`

---

### `/openpaul:remove-phase <number>`
Remove a future (not started) phase from roadmap.

- Cannot remove completed or in-progress phases
- Renumbers subsequent phases
- Updates ROADMAP.md

Usage: `/openpaul:remove-phase 5`

---

## Milestone Commands

### `/openpaul:milestone <name>`
Create a new milestone with phases.

- Guides through milestone definition
- Creates phase structure
- Updates ROADMAP.md with milestone grouping

Usage: `/openpaul:milestone "v2.0 API Redesign"`

---

### `/openpaul:complete-milestone [version]`
Archive milestone, tag, and reorganize roadmap.

- Verifies all phases complete
- Creates git tag (if configured)
- Archives milestone to MILESTONES.md
- Evolves PROJECT.md for next milestone

Usage: `/openpaul:complete-milestone`
Usage: `/openpaul:complete-milestone v0.3`

---

### `/openpaul:discuss-milestone`
Explore and articulate vision before starting a milestone.

- Conversational exploration of goals
- Creates milestone context document
- Prepares for `/openpaul:milestone`

Usage: `/openpaul:discuss-milestone`

---

## Pre-Planning Commands

### `/openpaul:discuss <phase>`
Articulate vision and explore approach before planning.

- Conversational discussion of phase goals
- Creates CONTEXT.md capturing vision
- Prepares for `/openpaul:plan`

Usage: `/openpaul:discuss 3`
Usage: `/openpaul:discuss "authentication layer"`

---

### `/openpaul:assumptions <phase>`
Surface Claude's assumptions about a phase before planning.

- Shows what Claude would do if given free rein
- Identifies gaps in understanding
- Prevents misaligned planning

Usage: `/openpaul:assumptions 3`

---

### `/openpaul:discover <topic>`
Research technical options before planning a phase.

- Explores codebase for relevant patterns
- Documents findings for planning reference
- Lightweight alternative to full research

Usage: `/openpaul:discover "authentication patterns"`

---

### `/openpaul:consider-issues [source]`
Review deferred issues with codebase context, triage and route.

- Reads deferred issues from STATE.md or specified source
- Analyzes with current codebase context
- Suggests routing: fix now, defer, or close

Usage: `/openpaul:consider-issues`

---

## Research Commands

### `/openpaul:research <topic>`
Deploy research agents for documentation/web search.

- Spawns subagents for parallel research
- Gathers external documentation
- Creates RESEARCH.md with findings
- Main session vets and reviews results

Usage: `/openpaul:research "JWT best practices 2026"`

---

### `/openpaul:research-phase <number>`
Research unknowns for a phase using subagents.

- Identifies unknowns in phase scope
- Deploys research agents
- Synthesizes findings for planning

Usage: `/openpaul:research-phase 4`

---

## Specialized Commands

### `/openpaul:flows`
Configure specialized workflow integrations.

- Creates/updates SPECIAL-FLOWS.md
- Defines required skills per work type
- Skills are enforced at APPLY time

Usage: `/openpaul:flows`

---

### `/openpaul:config`
View or modify OpenPAUL configuration.

- Shows current config.md settings
- Allows toggling integrations
- Manages project-level settings

Usage: `/openpaul:config`

---

### `/openpaul:map-codebase`
Generate codebase map for context.

- Creates structured overview of project
- Identifies key files and patterns
- Useful for research and planning

Usage: `/openpaul:map-codebase`

---

## Quality Commands

### `/openpaul:verify`
Guide manual user acceptance testing of recently built features.

- Generates verification checklist from SUMMARY.md
- Guides through manual testing
- Records verification results

Usage: `/openpaul:verify`

---

### `/openpaul:plan-fix`
Plan fixes for UAT issues from verify.

- Reads issues identified during verify
- Creates targeted fix plan
- Smaller scope than full phase plan

Usage: `/openpaul:plan-fix`

---

## Files & Structure

```
.openpaul/
├── PROJECT.md           # Project context and value prop
├── ROADMAP.md           # Phase breakdown and milestones
├── STATE.md             # Loop position and session state
├── config.md            # Optional integrations config
├── SPECIAL-FLOWS.md     # Optional skill requirements
├── MILESTONES.md        # Completed milestone archive
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-features/
        ├── 02-01-PLAN.md
        └── 02-01-SUMMARY.md
```

## PLAN.md Structure

```markdown
---
phase: 01-foundation
plan: 01
type: execute
autonomous: true
---

<objective>
Goal, Purpose, Output
</objective>

<context>
@-references to relevant files
</context>

<skills>
Required skills from SPECIAL-FLOWS.md
</skills>

<acceptance_criteria>
Given/When/Then format
</acceptance_criteria>

<tasks>
<task type="auto">...</task>
</tasks>

<boundaries>
DO NOT CHANGE, SCOPE LIMITS
</boundaries>

<verification>
Completion checks
</verification>
```

## Task Types

| Type | Use For |
|------|---------|
| `auto` | Fully autonomous execution |
| `checkpoint:decision` | Choices requiring human input |
| `checkpoint:human-verify` | Visual/functional verification |
| `checkpoint:human-action` | Manual steps (rare) |

## Common Workflows

**Starting a new project:**
```
/openpaul:init
/openpaul:plan
# Approve plan
/openpaul:apply
/openpaul:unify
```

**Checking where you are:**
```
/openpaul:progress   # State + ONE next action (recommended)
```

**Resuming work (new session):**
```
/openpaul:resume     # Restores context, suggests next action
```

**Pausing work (before break):**
```
/openpaul:pause      # Creates handoff, updates state
```

**Pre-planning exploration:**
```
/openpaul:discuss 3       # Articulate vision
/openpaul:assumptions 3   # See Claude's assumptions
/openpaul:research "topic"  # Gather external info
/openpaul:plan 3          # Now create the plan
```

**Managing roadmap:**
```
/openpaul:add-phase "New Feature"    # Add phase
/openpaul:remove-phase 5             # Remove future phase
/openpaul:milestone "v2.0"           # Create milestone
/openpaul:complete-milestone         # Archive milestone
```

## Key Principles

1. **Loop must complete** - PLAN -> APPLY -> UNIFY, no shortcuts
2. **Commands are thin** - Logic lives in workflows
3. **State is tracked** - STATE.md knows where you are
4. **Boundaries are real** - Respect DO NOT CHANGE sections
5. **Acceptance criteria first** - Define done before starting
6. **Skills are enforced** - Required skills block APPLY until loaded

## Getting Help

- Run `/openpaul:progress` to see where you are and what to do next
- Read `.openpaul/PROJECT.md` for project context
- Read `.openpaul/STATE.md` for current position
- Check `.openpaul/ROADMAP.md` for phase overview

---

*OpenPAUL Framework v0.4+ | 26 commands | Last updated: 2026-01-29*
</reference>
