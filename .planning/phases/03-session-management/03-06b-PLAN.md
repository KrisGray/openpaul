---
phase: 03-session-management
plan: 06b
type: execute
wave: 4
depends_on:
  - 03-00b
  - 03-01
  - 03-02
  - 03-03
  - 03-04
  - 03-05
files_modified:
  - src/tests/output/diff-formatter.test.ts
  - src/tests/commands/pause.test.ts
  - src/tests/commands/resume.test.ts
autonomous: true
requirements:
  - SESS-01
  - SESS-02
  - SESS-03
  - SESS-04
must_haves:
  truths:
    - Diff-formatter, pause, and resume commands have comprehensive test coverage
    - Command tests cover success paths, error paths, and edge cases
    - All tests pass with Jest
    - Test coverage meets 80% threshold
  artifacts:
    - path: src/tests/output/diff-formatter.test.ts
      provides: Diff formatter tests
      min_lines: 30
      exports: ["describe"]
    - path: src/tests/commands/pause.test.ts
      provides: /openpaul:pause command tests
      min_lines: 40
      exports: ["describe"]
    - path: src/tests/commands/resume.test.ts
      provides: /openpaul:resume command tests
      min_lines: 40
      exports: ["describe"]
  key_links:
    - from: src/tests/output/diff-formatter.test.ts
      to: src/output/diff-formatter.ts
      via: "Diff formatter testing"
      pattern: "formatDiff"
    - from: src/tests/commands/pause.test.ts
      to: src/commands/pause.ts
      via: "Pause command testing"
      pattern: "pause\\.execute"
    - from: src/tests/commands/resume.test.ts
      to: src/commands/resume.ts
      via: "Resume command testing"
      pattern: "resume\\.execute"
---

<objective>
Add comprehensive Jest tests for diff-formatter, pause, and resume commands to ensure reliability and maintainability.

Purpose: Verify all output formatting and session pause/resume functionality works correctly with proper test coverage for regression prevention.

Output: Jest test suites for diff-formatter utility and pause/resume commands.
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
@src/output/diff-formatter.ts
@src/commands/pause.ts
@src/commands/resume.ts
</context>

<tasks>

<task type="auto">
  <name>Create diff-formatter tests</name>
  <files>src/tests/output/diff-formatter.test.ts</files>
  <action>
Create src/tests/output/diff-formatter.test.ts:

Test cases:
1. formatFileDiff shows added lines with + prefix
2. formatFileDiff shows removed lines with - prefix
3. formatFileDiff shows unchanged lines with space prefix
4. formatFileDiff handles empty oldContent (new file)
5. formatFileDiff handles empty newContent (deleted file)
6. formatFileDiff handles no changes (identical content)
7. formatDiff shows summary of changes (modified, added, deleted counts)
8. formatDiff includes file paths with type indicators (M/A/D)
9. formatDiff shows full diff for small changes (< 50 lines)
10. formatDiff shows summary for large changes (> 50 lines)
11. formatDiff handles empty changes array
12. formatStalenessWarning returns warning for > 24 hours
13. formatStalenessWarning returns empty string for fresh sessions

Follow existing test pattern from src/tests/output/formatter.test.ts.
  </action>
  <verify><automated>npm test -- --testPathPattern=output/diff-formatter.test.ts</automated></verify>
  <done>Diff formatter tests cover all formatting functions</done>
</task>

<task type="auto">
  <name>Create pause command tests</name>
  <files>src/tests/commands/pause.test.ts</files>
  <action>
Create src/tests/commands/pause.test.ts:

Test setup:
- Mock StateManager, FileManager, SessionManager
- Mock readFileSync for template reading
- Create mock context.directory

Test cases:
1. pause creates session state with correct fields
2. pause generates HANDOFF.md with template variables replaced
3. pause saves session via SessionManager.saveSession
4. pause updates CURRENT-SESSION reference
5. pause returns formatted success message
6. pause warns about overwriting recent session (< 24 hours)
7. pause returns error if no active state (not initialized)
8. pause returns formatted error on file write failure
9. pause captures correct loop position (phase, phaseNumber)
10. pause includes correct next steps in session state

Follow existing test pattern from src/tests/commands/init.test.ts. Mock all external dependencies.
  </action>
  <verify><automated>npm test -- --testPathPattern=commands/pause.test.ts</automated></verify>
  <done>Pause command tests cover success, warning, and error paths</done>
</task>

<task type="auto">
  <name>Create resume command tests</name>
  <files>src/tests/commands/resume.test.ts</files>
  <action>
Create src/tests/commands/resume.test.ts:

Test setup:
- Mock StateManager, SessionManager
- Create mock context.directory

Test cases:
1. resume loads session from SessionManager.loadCurrentSession
2. resume validates session state
3. resume shows session summary with loop position
4. resume shows staleness warning for old sessions (> 24 hours)
5. resume returns formatted success message
6. resume returns error if no session found
7. resume returns error if session validation fails
8. resume shows next action based on current phase
9. resume formats work in progress and next steps correctly
10. resume handles metadata parsing correctly

Follow existing test pattern from src/tests/commands/plan.test.ts. Mock all external dependencies.
  </action>
  <verify><automated>npm test -- --testPathPattern=commands/resume.test.ts</automated></verify>
  <done>Resume command tests cover session loading, validation, and display</done>
</task>

</tasks>

<verification>
Overall phase checks:
- All 3 test files created with descriptive test cases
- All tests pass: npm test
- Test coverage meets 80% threshold: npm run test:coverage
- Diff formatter tests cover all formatting functions
- Command tests cover success paths, error paths, and edge cases
- All tests use mocks for external dependencies
- Tests follow existing patterns from the codebase
</verification>

<success_criteria>
All session management tests passing with:
- Diff formatter tests covering all formatting functions (13+ tests)
- Pause command tests covering success, warning, error paths (10+ tests)
- Resume command tests covering session loading and validation (10+ tests)
- All tests pass: npm test
- Test coverage meets 80% threshold
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-06b-SUMMARY.md`
</output>
