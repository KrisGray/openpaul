---
phase: 03-session-management
plan: 00b
type: execute
wave: 0
depends_on: []
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
    - Test scaffolds exist for diff-formatter, pause, and resume commands
    - Test files have proper describe blocks for Jest
    - Test scaffolds can run without errors (even with zero passing tests)
    - Test scaffolds establish the test file structure before implementation
  artifacts:
    - path: src/tests/output/diff-formatter.test.ts
      provides: Test scaffold for diff formatting utility
      min_lines: 5
      exports: ["describe"]
    - path: src/tests/commands/pause.test.ts
      provides: Test scaffold for /openpaul:pause command
      min_lines: 5
      exports: ["describe"]
    - path: src/tests/commands/resume.test.ts
      provides: Test scaffold for /openpaul:resume command
      min_lines: 5
      exports: ["describe"]
  key_links:
    - from: src/tests/output/diff-formatter.test.ts
      to: src/output/diff-formatter.ts
      via: "Future test implementation will validate diff formatter"
      pattern: "formatDiff"
    - from: src/tests/commands/pause.test.ts
      to: src/commands/pause.ts
      via: "Future test implementation will validate pause command"
      pattern: "pause"
    - from: src/tests/commands/resume.test.ts
      to: src/commands/resume.ts
      via: "Future test implementation will validate resume command"
      pattern: "resume"
---

<objective>
Create test scaffolds for diff-formatter, pause, and resume commands to satisfy Nyquist compliance by ensuring tests exist before implementation begins.

Purpose: Establish test file structure for output formatting and session pause/resume commands before implementation waves.

Output: Empty test files with describe blocks for diff-formatter utility and pause/resume commands.
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
</context>

<tasks>

<task type="auto">
  <name>Create diff-formatter test scaffold</name>
  <files>src/tests/output/diff-formatter.test.ts</files>
  <action>
Create src/tests/output/diff-formatter.test.ts with empty test scaffold:

- Add describe block: "diff-formatter utility"
- Add TODO comment: "Tests to be implemented in plan 03-06b"
- No actual test cases yet

Follow existing test pattern from src/tests/output/formatter.test.ts for describe structure.
  </action>
  <verify>npm test -- --testPathPattern=output/diff-formatter.test.ts (scaffold runs without errors)</verify>
  <done>Diff formatter test scaffold created with describe block</done>
</task>

<task type="auto">
  <name>Create pause command test scaffold</name>
  <files>src/tests/commands/pause.test.ts</files>
  <action>
Create src/tests/commands/pause.test.ts with empty test scaffold:

- Add describe block: "/openpaul:pause command"
- Add TODO comment: "Tests to be implemented in plan 03-06b"
- No actual test cases yet

Follow existing test pattern from src/tests/commands/init.test.ts for describe structure.
  </action>
  <verify>npm test -- --testPathPattern=commands/pause.test.ts (scaffold runs without errors)</verify>
  <done>Pause command test scaffold created with describe block</done>
</task>

<task type="auto">
  <name>Create resume command test scaffold</name>
  <files>src/tests/commands/resume.test.ts</files>
  <action>
Create src/tests/commands/resume.test.ts with empty test scaffold:

- Add describe block: "/openpaul:resume command"
- Add TODO comment: "Tests to be implemented in plan 03-06b"
- No actual test cases yet

Follow existing test pattern from src/tests/commands/init.test.ts for describe structure.
  </action>
  <verify>npm test -- --testPathPattern=commands/resume.test.ts (scaffold runs without errors)</verify>
  <done>Resume command test scaffold created with describe block</done>
</task>

</tasks>

<verification>
Overall phase checks:
- All 3 test scaffold files created with describe blocks
- All test scaffolds run without errors: npm test
- Test scaffolds are empty (no failing tests, no passing tests)
- Test scaffolds establish file structure for plan 03-06b implementation
</verification>

<success_criteria>
Test scaffolds created with:
- 3 test files with describe blocks (output, pause command, resume command)
- Each scaffold runs without errors (Jest recognizes describe blocks)
- TODO comments indicating tests will be implemented in plan 03-06b
- Scaffolds satisfy Nyquist compliance (tests exist before implementation)
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-00b-SUMMARY.md`
</output>
