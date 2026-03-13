---
phase: 03-session-management
plan: 00a
type: execute
wave: 0
depends_on: []
files_modified:
  - src/tests/types/session.test.ts
  - src/tests/storage/session-manager.test.ts
autonomous: true
requirements:
  - SESS-01
  - SESS-02
  - SESS-03
  - SESS-04
must_haves:
  truths:
    - Test scaffolds exist for SessionState and SessionManager
    - Test files have proper describe blocks for Jest
    - Test scaffolds can run without errors (even with zero passing tests)
    - Test scaffolds establish the test file structure before implementation
  artifacts:
    - path: src/tests/types/session.test.ts
      provides: Test scaffold for SessionState type and schema
      min_lines: 5
      exports: ["describe"]
    - path: src/tests/storage/session-manager.test.ts
      provides: Test scaffold for SessionManager class
      min_lines: 5
      exports: ["describe"]
  key_links:
    - from: src/tests/types/session.test.ts
      to: src/types/session.ts
      via: "Future test implementation will validate SessionState"
      pattern: "SessionStateSchema"
    - from: src/tests/storage/session-manager.test.ts
      to: src/storage/session-manager.ts
      via: "Future test implementation will validate SessionManager"
      pattern: "SessionManager"
---

<objective>
Create test scaffolds for SessionState and SessionManager to satisfy Nyquist compliance by ensuring tests exist before implementation begins.

Purpose: Establish test file structure for core session components before implementation waves.

Output: Empty test files with describe blocks for SessionState types and SessionManager storage.
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
  <name>Create SessionState test scaffold</name>
  <files>src/tests/types/session.test.ts</files>
  <action>
Create src/tests/types/session.test.ts with empty test scaffold:

- Add describe block: "SessionState type and schema validation"
- Add TODO comment: "Tests to be implemented in plan 03-06a"
- No actual test cases yet

Follow existing test pattern from src/tests/commands/init.test.ts for describe structure.
  </action>
  <verify>npm test -- --testPathPattern=types/session.test.ts (scaffold runs without errors)</verify>
  <done>SessionState test scaffold created with describe block</done>
</task>

<task type="auto">
  <name>Create SessionManager test scaffold</name>
  <files>src/tests/storage/session-manager.test.ts</files>
  <action>
Create src/tests/storage/session-manager.test.ts with empty test scaffold:

- Add describe block: "SessionManager class"
- Add TODO comment: "Tests to be implemented in plan 03-06a"
- No actual test cases yet

Follow existing test pattern from src/tests/commands/init.test.ts for describe structure.
  </action>
  <verify>npm test -- --testPathPattern=storage/session-manager.test.ts (scaffold runs without errors)</verify>
  <done>SessionManager test scaffold created with describe block</done>
</task>

</tasks>

<verification>
Overall phase checks:
- Both test scaffold files created with describe blocks
- All test scaffolds run without errors: npm test
- Test scaffolds are empty (no failing tests, no passing tests)
- Test scaffolds establish file structure for plan 03-06a implementation
</verification>

<success_criteria>
Test scaffolds created with:
- 2 test files with describe blocks (types, storage)
- Each scaffold runs without errors (Jest recognizes describe blocks)
- TODO comments indicating tests will be implemented in plan 03-06a
- Scaffolds satisfy Nyquist compliance (tests exist before implementation)
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-00a-SUMMARY.md`
</output>
