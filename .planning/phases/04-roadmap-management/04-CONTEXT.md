# Phase 4: Roadmap Management - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Two CLI commands for modifying the project roadmap: /openpaul:add-phase inserts new phases at user-specified positions, /openpaul:remove-phase deletes phases with automatic renumbering of subsequent phases. Both commands enforce safety checks to prevent data loss and maintain roadmap integrity.

</domain>

<decisions>
## Implementation Decisions

### Phase naming and placement
- Name is required argument: /openpaul:add-phase "Search feature"
- Position specified with --after or --before flags: --after 4, --before 6
- Directory name auto-generated: "Search feature" → 05-search-feature (slugify + next available number)

### Removal safety and renumbering
- Cannot remove completed phases (block with error)
- Cannot remove current phase from STATE.md (block with error)
- Cannot remove phase with in-progress plans (block with error)
- All phase artifacts (plans, context, research) deleted on removal
- Renumbering only affects ROADMAP.md - references in other files are user's responsibility

### Command invocation and flags
- /openpaul:add-phase <name> --after <num> — both arguments required, errors if missing
- /openpaul:remove-phase <number> — phase number required
- No optional flags (--description, --force, --yes) — keep commands minimal
- Success output: brief confirmation only ("Added phase 5: Search feature", "Removed phase 5")

### Error handling and validation
- Non-existent phase: clear error message ("Phase X does not exist")
- Missing ROADMAP.md/STATE.md: error with guidance ("ROADMAP.md not found. Run /openpaul:init first")
- Phase dependencies: ignored during insertion — user handles dependency updates during planning
- All blocking errors are hard stops, no --force overrides

### OpenCode's Discretion
- Exact slug generation algorithm (lowercase, hyphens, special character handling)
- Error message formatting and consistency
- Whether to validate ROADMAP.md structure before mutation

</decisions>

<specifics>
## Specific Ideas

- Commands should feel surgical and predictable — no surprises, no side effects beyond stated behavior
- Safety checks prioritized over convenience — better to block than to lose work

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-roadmap-management*
*Context gathered: 2026-03-10*
