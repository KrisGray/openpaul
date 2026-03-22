---
phase: 17-template-presets
plan: 01
subsystem: cli
tags: [presets, templates, typescript, inquirer]

# Dependency graph
requires: []
provides:
  - PresetName type and Preset interface definitions
  - Minimal preset with essential OpenCode directory structure
  - Full preset with example command and rule
  - resolvePreset() function for preset selection logic
affects: [scaffold, cli-init]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Type-safe preset definitions with PresetName union type
    - Dynamic imports to avoid circular dependencies
    - Interactive selection via @inquirer/prompts select()

key-files:
  created:
    - src/cli/presets.ts
    - src/cli/templates/minimal.ts
    - src/cli/templates/full.ts
  modified: []

key-decisions:
  - "Dynamic imports in resolvePreset to avoid circular dependency with template files"
  - "PRESETS record updated at runtime with actual preset data from templates"
  - "Type assertion on select() result since inquirer returns string but values are PresetName"

patterns-established:
  - "Preset definitions export Preset objects with name, description, and files array"
  - "All preset files use relative paths from project root"
  - "JSON files formatted with 2-space indentation"

requirements-completed:
  - SCAF-03

# Metrics
duration: 2min
completed: 2026-03-22
---

# Phase 17 Plan 01: Preset Types and Templates Summary

**Type-safe preset definitions with minimal and full OpenCode configuration templates, including interactive preset selection for unknown values.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-22T18:40:49Z
- **Completed:** 2026-03-22T18:43:43Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created preset type system with PresetName, PresetFile, and Preset interfaces
- Implemented resolvePreset() with default, valid, and unknown preset handling
- Built minimal preset (5 files) with essential OpenCode directory structure
- Built full preset (6 files) with example command and rule

## Task Commits

Each task was committed atomically:

1. **Task 1: Create preset types and resolution module** - `ed41b14` (feat)
2. **Task 2: Create minimal preset template** - `4ecde40` (feat)
3. **Task 3: Create full preset template** - `664a35c` (feat)

**Plan metadata:** pending final commit

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified

- `src/cli/presets.ts` - Preset types, PRESETS record, isValidPreset type guard, resolvePreset function
- `src/cli/templates/minimal.ts` - Minimal preset with opencode.json + 4 .gitkeep files
- `src/cli/templates/full.ts` - Full preset with configs, example command/rule, and .gitkeep files

## Decisions Made

- Used dynamic imports in resolvePreset() to avoid circular dependency issues with template files
- Updated PRESETS record at runtime after loading templates rather than at module init
- Type assertion `as PresetName` on select() result since inquirer returns string but choices are limited to valid values

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Preset types and templates ready for CLI scaffold integration
- resolvePreset() can be imported by scaffold command to handle --preset flag
- Ready for Plan 02: Scaffold command preset integration

---
*Phase: 17-template-presets*
*Completed: 2026-03-22*

## Self-Check: PASSED

All files and commits verified:
- src/cli/presets.ts ✓
- src/cli/templates/minimal.ts ✓
- src/cli/templates/full.ts ✓
- Commit ed41b14 ✓
- Commit 4ecde40 ✓
- Commit 664a35c ✓
