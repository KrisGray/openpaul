# Phase 1: Core Infrastructure - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Foundational plugin layer that enables all other commands: TypeScript types, file-based storage, state management, and loop enforcement. No user-facing commands in this phase - purely infrastructure that Phase 2+ builds upon.

</domain>

<decisions>
## Implementation Decisions

### Loop Enforcement Style
- **Strict enforcement** - block invalid transitions, user cannot proceed out of order
- **Force PLAN as entry point** - users must always start with PLAN, cannot start mid-loop
- **Informative errors with guidance** - when blocking, show clear message with what's needed to proceed
- **Require UNIFY to close loop** - cannot start new PLAN until previous loop is unified/closed

### State File Organization
- **Per-phase state files** - organized by phase, not flat (easier to inspect individual phases)
- **Plans inline in phase state** - everything about a phase in one file (not separate plans directory)
- **Phase-prefixed naming** - `state-phase-1.json`, `state-phase-2.json` (clear, sortable, predictable)
- **Derive current position** - no explicit CURRENT.json file, derive from existing state files

### Error Message Style
- **User-friendly** - clear, actionable messages for users (not technical/debugging focused)
- **Include current state** - show relevant state info in errors for context
- **Always suggest next action** - every error includes guidance on how to fix
- **Plain text only** - no structured JSON error format (simple, works everywhere)

### Type Extensibility
- **Export all types** - maximum extensibility from `@krisgray/openpaul`
- **Concrete types** - required fields, not interfaces with optional fields (simpler, direct)
- **No versioning** - breaking changes allowed, users adapt to changes
- **Zod schemas for all types** - runtime validation matching TypeScript types (ensures data integrity)

### OpenCode's Discretion
- Exact TypeScript project structure (src/ layout)
- Jest configuration details
- Atomic write implementation strategy
- Internal utility functions organization
- Test coverage approach (how to measure, what to cover)

</decisions>

<specifics>
## Specific Ideas

- "Plugin should load in under 500ms with zero data loss" (from requirements INFR-01, NFR-02)
- "80%+ test coverage target" (from requirements INFR-06, NFR-04)
- Loop enforcement should feel strict but helpful - like a good linter that tells you exactly what to fix

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope (foundational infrastructure only)

</deferred>

---

*Phase: 01-core-infrastructure*
*Context gathered: 2026-03-04*
