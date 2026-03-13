# Phase 5: Milestone Management - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can define, track, and complete project milestones. Three commands: `/openpaul:milestone` (create new), `/openpaul:complete-milestone` (archive completed), `/openpaul:discuss-milestone` (plan upcoming). Milestones organize phases into meaningful deliverables with progress tracking.

</domain>

<decisions>
## Implementation Decisions

### Output Format (Milestone Creation)

- **ROADMAP.md format:** Header + bullet list style (consistent with existing milestone sections)
- **Required fields:** Name + scope + phases — captures essential metadata: milestone name, what it delivers, which phases are included
- **Command mode:** Hybrid — interactive by default for discoverability, CLI args (`--name`, `--scope`, `--phases`) for scripting/automation
- **STATE.md update:** Prompt user after creation: "Update STATE.md to track this milestone?"

### Archive Structure (Complete Milestone)

- **Archive location:** `MILESTONE-ARCHIVE.md` — single accumulating file in `.planning/` that appends each completed milestone
- **Archive entry detail:** Summary + metrics — name, dates (start/completed), phases included, plans completed, total execution time, requirements addressed
- **Completed phases handling:** Collapse to `<details>` section in ROADMAP.md (consistent with existing v1.0 pattern)
- **Confirmation:** Yes, prompt for confirmation — show summary of what will be archived, ask user to confirm before proceeding

### Progress Calculation

- **Primary metric:** By phases completed — `Phase X/Y complete (Z%)` — granular, reflects actual work units
- **Display verbosity:** Configurable — default shows summary only (`v1.1: 2/7 phases (29%)`), `--verbose` flag shows detailed breakdown per phase
- **Auto-update:** Yes, on phase completion — ROADMAP.md milestone progress recalculates automatically when a phase completes (included in phase completion commit, no separate commit)
- **Current milestone display:** STATE.md only — keeps ROADMAP.md focused on roadmap content, STATE.md is single source of truth for current position

### Scope Validation

- **Phase modification in milestone:** Allow with warning — warn that modifying phases in active milestone may affect scope, but allow if user confirms
- **Scope verification timing:** At milestone end — prompt for scope review during `/openpaul:complete-milestone`, not during normal workflow
- **MILESTONE-CONTEXT.md purpose:** Plan upcoming milestone — pre-planning context for NEXT milestone before work begins (not documenting current milestone)
- **MILESTONE-CONTEXT.md location:** `.planning/` root — single file, consistent with ROADMAP.md, STATE.md, REQUIREMENTS.md; delete or archive when milestone becomes active

### OpenCode's Discretion

- Exact wording/formatting of warning messages
- Archive entry formatting and structure
- Progress bar visualization style
- Error handling for edge cases (milestone not found, already complete, etc.)

</decisions>

<specifics>
## Specific Ideas

- Consistent with existing ROADMAP.md pattern where completed milestones (v1.0 MVP) are collapsed into `<details>` sections
- Milestone progress should feel like a natural extension of STATE.md tracking
- Commands should work well in both interactive and scripted contexts

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-milestone-management*
*Context gathered: 2026-03-11*
