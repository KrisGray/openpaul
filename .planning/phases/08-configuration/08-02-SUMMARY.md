---
phase: 08-configuration
plan: 02
subsystem: flows
tags: [flows, workflow, commands]
requires: [CONF-02]
provides: [FlowsManager, /openpaul:flows]
affects: [flows-manager.ts, flows.ts]
tech_stack:
  added: []
  patterns: [markdown table parsing]
key_files:
  created:
    - src/storage/flows-manager.ts
    - src/commands/flows.ts
  modified:
    - src/index.ts
key_decisions: []
requirements_completed: [CONF-02]
duration: 2 min
completed: 2026-03-11
---

# Phase 8 Plan 2: FlowsManager and /openpaul:flows Command Summary

**Objective:** Implement FlowsManager and /openpaul:flows command for specialized workflow management.

## Summary

Created FlowsManager for special workflow management:
- FlowsManager class with load/save/list/enable/disable methods
- Markdown table parsing for flows storage
- Support for .openpaul/.paul path resolution with migration
- /openpaul:flows command with list/enable/disable/init actions
- Uses existing SPECIAL-FLOWS.md template

## Changes

- Created src/storage/flows-manager.ts
- Created src/commands/flows.ts
- Registered command in src/index.ts

## Issues Encountered

None

## Next Steps

Ready for 08-03 (map-codebase)
