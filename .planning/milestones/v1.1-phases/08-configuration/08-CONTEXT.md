# Phase 8: Configuration - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can manage project configuration, specialized flows, and codebase documentation via `/openpaul:config`, `/openpaul:flows`, and `/openpaul:map-codebase`.

</domain>

<decisions>
## Implementation Decisions

### Config scope and structure
- `.openpaul/config.md` uses YAML frontmatter with markdown notes.
- Top-level sections are `integrations`, `project`, and `preferences`.
- Config file uses explicit keys only (no implicit values).
- Unknown keys are rejected with clear errors.

### Config precedence and defaults
- Precedence order: CLI args > `.openpaul/config.md` > built-in defaults.
- Missing required values fail with a clear error listing required keys.
- Shallow merge by section (explicit keys only).
- Env var overrides are supported with highest precedence (e.g., `OPENPAUL_*`).

### Flow toggles behavior
- `SPECIAL-FLOWS.md` uses explicit `enabled:` and `disabled:` arrays.
- Unknown flow IDs are errors with a list of valid flows.
- Conflicts (same flow in both lists) are errors and must be resolved.
- `/openpaul:flows` does not allow ad-hoc flow definitions (predefined only).

### Codebase map depth
- `CODEBASE.md` must include: Structure, Stack, Conventions, Concerns, Integrations, Architecture.
- Detail level is medium (2–6 bullets per section), no code dumps.
- Mapping scope: top-level + key subdirectories; skip vendor/fixtures.
- Regeneration overwrites with a fresh snapshot and updates a “Last updated” timestamp.

### OpenCode's Discretion
- Exact wording and formatting within the required sections.
- The precise list of “key subdirectories” when mapping.

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-configuration*
*Context gathered: 2026-03-12*
