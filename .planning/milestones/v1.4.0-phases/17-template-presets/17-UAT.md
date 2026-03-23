---
status: testing
phase: 17-template-presets
source: [17-01-SUMMARY.md, 17-02-SUMMARY.md]
started: 2026-03-22T19:00:00Z
updated: 2026-03-22T19:00:00Z
---

## Current Test

number: 1
name: Default to minimal preset
expected: |
  Run `npx openpaul` (no --preset flag) in a new directory.
  You should see "Defaulting to minimal" notice message.
  The preset "minimal" should be shown in the confirmation prompt.
awaiting: user response

## Tests

### 1. Default to minimal preset
expected: Run `npx openpaul` (no --preset flag) in a new directory. You should see "Defaulting to minimal" notice, and the confirmation prompt shows "preset: minimal".
result: pending

### 2. Use minimal preset explicitly
expected: Run `npx openpaul --preset minimal`. You should see "Preset: minimal" with its description. Confirmation shows "preset: minimal". After confirming, .opencode/ contains opencode.json and 4 .gitkeep files (agents, commands, rules, skills).
result: pending

### 3. Use full preset
expected: Run `npx openpaul --preset full`. You should see "Preset: full" with its description. Confirmation shows "preset: full". After confirming, .opencode/ contains opencode.json, tui.json, commands/example.md, rules/example.md, and 2 .gitkeep files (agents, skills).
result: pending

### 4. Unknown preset triggers selection
expected: Run `npx openpaul --preset unknown`. You should see "Unknown preset: unknown" notice, then an interactive selection prompt appears with "minimal" and "full" options.
result: pending

### 5. Existing .opencode shows overwrite warning
expected: In a directory that already has .opencode/, run `npx openpaul`. You should see "`.opencode/` already exists. Overwrite preset files?" confirmation prompt.
result: pending

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0

## Gaps

[none yet]
