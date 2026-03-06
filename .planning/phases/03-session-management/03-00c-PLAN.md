---
phase: 03-session-management
plan: 00c
type: execute
wave: 0
depends_on: []
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
    - Test scaffolds exist for status and handoff commands
    - Test files have proper describe blocks for Jest
    - Test scaffolds can run without errors (even with zero passing tests)
    - Test scaffolds establish the test file structure before implementation
  artifacts:
    - path: src/tests/commands/status.test.ts
      provides: Test scaffold for /openpaul:status command
      min_lines: 5
      exports: ["describe"]
    - path: src/tests/commands/handoff.test.ts
      provides: Test scaffold for /openpaul:handoff command
      min_lines: 5
      exports: ["describe"]
  key_links:
    - from: src/tests/commands/status.test.ts
      to: src/commands/status.ts
      via: "Future test implementation will validate status command"
      pattern: "status"
    - from: src/tests/commands/handoff.test.ts
      to: src/commands/handoff.ts
      via: "Future test implementation will validate handoff command"
      pattern: "handoff"
---

<objective>
Create test scaffolds for status and handoff commands to satisfy Nyquist compliance by ensuring tests exist before implementation begins.

Purpose: Establish test file structure for session status display and handoff commands before implementation waves.

Output: Empty test files with describe blocks for status and handoff commands.
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
  <name>Create status command test scaffold</name>
  <files>src/tests/commands/status.test.ts</files>
  <action>
Create src/tests/commands/status.test.ts with empty test scaffold:

- Add describe block: "/openpaul:status command"
- Add TODO comment: "Tests to be implemented in plan 03-06c"
- No actual test cases yet

Follow existing test pattern from src/tests/commands/init.test.ts for describe structure.
  </action>
  <verify>npm test -- --testPathPattern=commands/status.test.ts (scaffold runs without errors)</verify>
  <done>Status command test scaffold created with describe block</done>
</task>

<task type="auto">
  <name>Create handoff command test scaffold</name>
  <files>src/tests/commands/handoff.test.ts</files>
  <action>
Create src/tests/commands/handoff.test.ts with empty test scaffold:

- Add describe block: "/openpaul:handoff command"
- Add TODO comment: "Tests to be implemented in plan 03-06c"
- No actual test cases yet

Follow existing test pattern from src/tests/commands/init.test.ts for describe structure.
  </action>
  <verify>npm test -- --testPathPattern=commands/handoff.test.ts (scaffold runs without errors)</verify>
  <done>Handoff command test scaffold created with describe block</done>
</task>

</tasks>

<verification>
Overall phase checks:
- Both test scaffold files created with describe blocks
- All test scaffolds run without errors: npm test
- Test scaffolds are empty (no failing tests, no passing tests)
- Test scaffolds establish file structure for plan 03-06c implementation
</verification>

<success_criteria>
Test scaffolds created with:
- 2 test files with describe blocks (status command, handoff command)
- Each scaffold runs without errors (Jest recognizes describe blocks)
- TODO comments indicating tests will be implemented in plan 03-06c
- Scaffolds satisfy Nyquist compliance (tests exist before implementation)
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-00c-SUMMARY.md`
</output>
