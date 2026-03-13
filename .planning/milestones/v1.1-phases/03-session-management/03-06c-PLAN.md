---
phase: 03-session-management
plan: 06c
type: execute
wave: 4
depends_on:
  - 03-00c
  - 03-01
  - 03-02
  - 03-03
  - 03-04
  - 03-05
files_modified:
  - src/tests/commands/status.test.ts
  - src/tests/commands/handoff.test.ts
autonomous: true
requirements:
  - SESS-01
  - SESS-02
  - SESS-03
  - SESS-04
must_haves:
  truths:
    - Status and handoff commands have comprehensive test coverage
    - Command tests cover success paths, error paths, and edge cases
    - All tests pass with Jest
    - Test coverage meets 80% threshold
  artifacts:
    - path: src/tests/commands/status.test.ts
      provides: /openpaul:status command tests
      min_lines: 40
      exports: ["describe"]
    - path: src/tests/commands/handoff.test.ts
      provides: /openpaul:handoff command tests
      min_lines: 30
      exports: ["describe"]
  key_links:
    - from: src/tests/commands/status.test.ts
      to: src/commands/status.ts
      via: "Status command testing"
      pattern: "status\\.execute"
    - from: src/tests/commands/handoff.test.ts
      to: src/commands/handoff.ts
      via: "Handoff command testing"
      pattern: "handoff\\.execute"
---

<objective>
Add comprehensive Jest tests for status and handoff commands to ensure reliability and maintainability.

Purpose: Verify all session status display and handoff functionality works correctly with proper test coverage for regression prevention.

Output: Jest test suites for status and handoff commands.
</objective>

<execution_context>
@./.opencode/get-shit-done/workflows/execute-plan.md
@./.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-session-management/03-CONTEXT.md
@.planning/phases/03-session-management/03-RESEARCH.md
@src/tests/commands/init.test.ts
@src/tests/commands/plan.test.ts
@src/commands/status.ts
@src/commands/handoff.ts
</context>

<tasks>

<task type="auto">
  <name>Create status command tests</name>
  <files>src/tests/commands/status.test.ts</files>
  <action>
Create src/tests/commands/status.test.ts:

Test setup:
- Mock StateManager, FileManager, SessionManager
- Create mock context.directory

Test cases:
1. status displays loop visualization with correct markers
2. status shows current phase and stage
3. status shows plan progress bar when in APPLY phase
4. status shows session info if paused (ID, timestamp)
5. status shows staleness warning for stale sessions
6. status shows "No active session" if not paused
7. status shows next action based on current phase
8. status verbose flag shows additional details
9. status returns "Not initialized" if .openpaul/ doesn't exist
10. status returns error if no active state
11. status uses correct loop markers (◉ ✓ ○)
12. status formats progress bar correctly

Follow existing test pattern from src/tests/commands/progress.test.ts. Mock all external dependencies.
  </action>
  <verify><automated>npm test -- --testPathPattern=commands/status.test.ts</automated></verify>
  <done>Status command tests cover loop display, session info, and verbose mode</done>
</task>

<task type="auto">
  <name>Create handoff command tests</name>
  <files>src/tests/commands/handoff.test.ts</files>
  <action>
Create src/tests/commands/handoff.test.ts:

Test setup:
- Mock StateManager, FileManager, SessionManager
- Mock readFileSync for template reading
- Create mock context.directory

Test cases:
1. handoff generates HANDOFF.md from template
2. handoff replaces all template variables correctly
3. handoff works with paused session (loads existing session)
4. handoff works without paused session (creates temporary session)
5. handoff writes HANDOFF.md to .openpaul/ directory
6. handoff returns formatted success message
7. handoff returns error if no active state (not initialized)
8. handoff returns formatted error on file write failure
9. handoff includes correct session ID and timestamp
10. handoff includes correct loop position markers

Follow existing test pattern from src/tests/commands/init.test.ts. Mock all external dependencies.
  </action>
  <verify><automated>npm test -- --testPathPattern=commands/handoff.test.ts</automated></verify>
  <done>Handoff command tests cover template replacement and file generation</done>
</task>

</tasks>

<verification>
Overall phase checks:
- Both test files created with descriptive test cases
- All tests pass: npm test
- Test coverage meets 80% threshold: npm run test:coverage
- Command tests cover success paths, error paths, and edge cases
- All tests use mocks for external dependencies
- Tests follow existing patterns from the codebase
</verification>

<success_criteria>
All session management tests passing with:
- Status command tests covering display, session info, verbose (12+ tests)
- Handoff command tests covering template replacement (10+ tests)
- All tests pass: npm test
- Test coverage meets 80% threshold
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-06c-SUMMARY.md`
</output>
