---
phase: 14-codecov-fix
plan: 01
subsystem: ci
tags: [github-actions, codecov, race-condition, workflow-run]

# Dependency graph
requires:
  - phase: 10-ci-workflow
    provides: test.yml workflow structure
  - phase: 11-e2e-tests
    provides: e2e-tests.yml workflow structure
provides:
  - Race-free codecov upload with dual-workflow verification
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wait/retry loop pattern for GitHub Actions workflow coordination"
    - "Dual-trigger workflow_run with graceful degradation"

key-files:
  created: []
  modified:
    - .github/workflows/codecov.yml

key-decisions:
  - "Exit 0 on timeout instead of failing - coverage is optional signal, not blocking requirement"
  - "30-minute max wait with 30-second poll interval balances thoroughness vs. resource usage"

patterns-established:
  - "Wait loop pattern: poll every 30s, max 30 min, exit 0 on timeout"
  - "Dual-trigger: workflow_run fires on either CI or E2E completion"

requirements-completed:
  - COV-01

# Metrics
duration: 1 min
completed: 2026-03-16
---

# Phase 14 Plan 01: Codecov Race Condition Fix Summary

**Fixed codecov.yml race condition with dual triggers and wait/retry loop, ensuring reliable coverage uploads regardless of which test workflow completes first.**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-16T17:51:36Z
- **Completed:** 2026-03-16T17:53:03Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Added E2E Tests to workflow_run trigger for dual-trigger support
- Implemented wait/retry loop (30 min max, 30s poll interval) to wait for both workflows
- Graceful exit (exit 0) on timeout instead of failing the build
- Handles failure and cancelled workflow states properly
- Clear logging of workflow status on each poll attempt

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix race condition with dual triggers and wait loop** - `2ca66f4` (fix)

**Plan metadata:** (final commit pending)

## Files Created/Modified
- `.github/workflows/codecov.yml` - Fixed race condition with dual triggers and wait loop

## Decisions Made
- **Exit 0 on timeout**: Coverage upload is a quality signal, not a blocking requirement. Failure to upload coverage should not fail the build.
- **30-minute max wait**: Balances allowing E2E tests time to complete vs. workflow resource usage. E2E tests typically complete within 10 minutes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
This gap closure phase is complete. The codecov workflow now reliably waits for both CI and E2E tests to complete before uploading coverage.

## Self-Check: PASSED

---
*Phase: 14-codecov-fix*
*Completed: 2026-03-16*
