---
phase: 17-template-presets
plan: 02
subsystem: cli
tags: [cli, presets, scaffolding, commander, inquirer]

# Dependency graph
requires:
  - phase: 17-01
    provides: Preset types, resolvePreset function, minimal and full preset templates
provides:
  - generatePresetFiles function for creating .opencode/ directory structure
  - --preset CLI flag with minimal/full options
  - Preset integration in confirmation message and scaffolding flow
affects: [installer, cli-init]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CLI flag integration with commander options
    - Preset resolution before confirmation prompt
    - Overwrite warning for existing .opencode/ directory

key-files:
  created: []
  modified:
    - src/cli.ts
    - src/cli/scaffold.ts

key-decisions:
  - "Removed commander default value for --preset to allow resolvePreset to show 'Defaulting to minimal' message"
  - "Preset resolution happens after project name, before confirmation prompt"
  - "generatePresetFiles uses synchronous fs operations for simplicity"

patterns-established:
  - "CLI flags integrate with existing confirmation flow"
  - "Overwrite warnings use same pattern as .openpaul/ check"

requirements-completed:
  - SCAF-03
  - SCAF-04

# Metrics
duration: 4min
completed: 2026-03-22
---
# Phase 17 Plan 02: CLI Preset Integration Summary

**Complete --preset flag integration with CLI, connecting preset selection to scaffolding and confirmation flow.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-22T18:47:30Z
- **Completed:** 2026-03-22T18:51:30Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added generatePresetFiles function to scaffold module
- Integrated --preset flag with commander CLI options
- Wired preset to confirmation message and scaffolding execution
- Added .opencode/ overwrite warning for existing directories

## Task Commits

Each task was committed atomically:

1. **Task 1: Add generatePresetFiles function to scaffold** - `3b4a16b` (feat)
2. **Task 2: Add --preset flag to CLI** - `4bcb380` (feat)
3. **Task 3: Wire preset to confirmation and scaffolding** - `6c20de1` (feat)

**Plan metadata:** pending final commit

_Note: TDD tasks may have multiple commits (test -> feat -> refactor)_

## Files Created/Modified

- `src/cli.ts` - Added --preset flag, resolvePreset import, preset resolution, confirmation with preset name, .opencode overwrite check, generatePresetFiles call
- `src/cli/scaffold.ts` - Added generatePresetFiles function with Preset type import

## Decisions Made

- Removed commander default value for --preset so resolvePreset can show "Defaulting to minimal" when flag is omitted (matching must_haves requirement)
- Preset resolution happens after project name but before confirmation, allowing preset info to display before user confirms
- generatePresetFiles uses synchronous fs operations since file generation is fast and doesn't need async complexity

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed "Defaulting to minimal" message not appearing**
- **Found during:** Task 3 verification (testing default behavior)
- **Issue:** Commander's default value for --preset meant resolvePreset never received undefined, so "Defaulting to minimal" message was never shown
- **Fix:** Removed the default value from commander option, allowing resolvePreset to handle undefined case properly
- **Files modified:** src/cli.ts
- **Verification:** CLI shows "Defaulting to minimal" when --preset is omitted
- **Committed in:** 6c20de1 (task 3 commit, amended)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor fix to match must_haves requirement. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CLI preset integration complete
- All must_haves verified:
  - `npx openpaul --preset minimal` works
  - `npx openpaul --preset full` works
  - `npx openpaul` defaults to minimal with "Defaulting to minimal" message
  - Confirmation shows preset name
  - .opencode/ overwrite warning shown when directory exists
  - Preset files generated to .opencode/ directory

---
*Phase: 17-template-presets*
*Completed: 2026-03-22*

## Self-Check: PASSED

All files and commits verified:
- src/cli.ts modified with preset integration
- src/cli/scaffold.ts modified with generatePresetFiles function
- Commit 3b4a16b (task 1)
- Commit 4bcb380 (task 2)
- Commit 6c20de1 (task 3)
