---
phase: 02-core-loop-commands
plan: "07"
subsystem: commands
tags: [plan, dependencies, execution-graph, guided-errors, zod]

# Dependency graph
requires:
  - phase: 01-core-infrastructure
    provides: Core types, FileManager, LoopEnforcer, formatter utilities
provides:
  - Plan schema fields for criteria, boundaries, dependencies, and execution graph
  - /paul:plan dependency detection with guided error handling and rollback
  - Execution graph formatter and updated plan command tests
affects:
  - Phase 02: Core Loop Commands (plan/apply/unify flows)
  - Phase 03: Session Management (plan structure reuse)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - File-overlap dependency detection with wave-based execution graph
    - Guided error formatting with retry/backoff and rollback on write failures

key-files:
  created: []
  modified:
    - src/types/plan.ts
    - src/commands/plan.ts
    - src/output/formatter.ts
    - src/tests/commands/plan.test.ts

key-decisions:
  - "Execution graph derived from file-overlap task dependencies and wave ordering"
  - "Plan write failures retry transient filesystem errors and rollback partial plan files"

patterns-established:
  - "Plan metadata includes criteria/boundaries with dependency graph output"
  - "Guided error output used for plan creation failures"

requirements-completed: [CORE-02]

# Metrics
duration: 5 min
completed: 2026-03-05
---

# Phase 2 Plan 07: Plan Schema & Dependency Graph Summary

**/paul:plan now captures criteria/boundaries, derives file-overlap dependencies, and renders an execution graph with guided error recovery.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-05T11:31:55Z
- **Completed:** 2026-03-05T11:37:40Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Expanded plan schema to include criteria, boundaries, and execution graph metadata with safe defaults
- Added dependency detection, execution graph generation, and guided error handling to /paul:plan
- Updated output formatter and tests to validate execution graph rendering and error guidance

## Task Commits

Each task was committed atomically:

1. **task 1: extend plan schema for criteria, boundaries, and execution graph** - `e6cf370` (feat)
2. **task 2: add criteria/boundaries args and dependency graph generation in /paul:plan** - `d839346` (feat)
3. **task 3: update plan output formatting and tests for execution graph** - `85f8ef9` (feat)

**Plan metadata:** Will be committed in final step

## Files Created/Modified
- `src/types/plan.ts` - Added plan metadata fields and relaxed schema defaults
- `src/commands/plan.ts` - Criteria/boundary capture, dependency graph generation, guided errors with retry/rollback
- `src/output/formatter.ts` - Execution graph rendering utility
- `src/tests/commands/plan.test.ts` - Tests for criteria persistence, dependency graph output, and guided errors

## Decisions Made
- Execution graph computed from file-overlap dependencies and displayed as wave transitions
- Plan creation failures use guided errors with retry/backoff for transient filesystem issues

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- TypeScript inferred optional defaults for Plan schema fields; aligned Plan interfaces to allow optional metadata to match schema defaults.
- State advance-plan reported "last_plan" due to STATE.md listing 6 total plans for Phase 02; progress recalculation still updated successfully.
- Requirements mark-complete could not find CORE-02 in REQUIREMENTS.md (needs manual reconciliation).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan command now stores criteria/boundaries and renders dependency graphs
- Ready to proceed with next Phase 02 gap closures

---
*Phase: 02-core-loop-commands*
*Completed: 2026-03-05*

## Self-Check: PASSED
