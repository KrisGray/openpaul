---
phase: 03-session-management
plan: 06a
type: execute
wave: 4
depends_on:
  - 03-00a
  - 03-01
  - 03-02
  - 03-03
  - 03-04
  - 03-05
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
    - SessionState and SessionManager have comprehensive test coverage
    - SessionManager tests cover save, load, delete, validation operations
    - All tests pass with Jest
    - Test coverage meets 80% threshold
  artifacts:
    - path: src/tests/types/session.test.ts
      provides: SessionState type and schema tests
      min_lines: 20
      exports: ["describe"]
    - path: src/tests/storage/session-manager.test.ts
      provides: SessionManager class tests
      min_lines: 80
      exports: ["describe"]
  key_links:
    - from: src/tests/types/session.test.ts
      to: src/types/session.ts
      via: "SessionState and SessionStateSchema validation"
      pattern: "SessionStateSchema\\.parse"
    - from: src/tests/storage/session-manager.test.ts
      to: src/storage/session-manager.ts
      via: "SessionManager method testing"
      pattern: "sessionManager\\.(save|load|delete)"
---

<objective>
Add comprehensive Jest tests for SessionState and SessionManager to ensure reliability and maintainability.

Purpose: Verify all session state validation and storage functionality works correctly with proper test coverage for regression prevention.

Output: Jest test suites for SessionState types and SessionManager storage.
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
@src/types/session.ts
@src/storage/session-manager.ts
</context>

<tasks>

<task type="auto">
  <name>Create SessionState type tests</name>
  <files>src/tests/types/session.test.ts</files>
  <action>
Create src/tests/types/session.test.ts:

Test cases:
1. SessionState type validation with valid data
2. SessionStateSchema rejects invalid sessionId (empty string)
3. SessionStateSchema rejects invalid timestamps (negative, non-number)
4. SessionStateSchema rejects invalid phase (not in LoopPhase enum)
5. SessionStateSchema rejects invalid phaseNumber (negative, non-integer)
6. SessionStateSchema accepts optional currentPlanId
7. SessionStateSchema validates workInProgress as array of strings
8. SessionStateSchema validates nextSteps as array of strings
9. SessionStateSchema accepts metadata as Record<string, unknown>

Follow existing test pattern from src/tests/commands/init.test.ts.
  </action>
  <verify><automated>npm test -- --testPathPattern=types/session.test.ts</automated></verify>
  <done>SessionState type tests cover all schema validation rules</done>
</task>

<task type="auto">
  <name>Create SessionManager class tests</name>
  <files>src/tests/storage/session-manager.test.ts</files>
  <action>
Create src/tests/storage/session-manager.test.ts:

Test setup:
- Create temp directory for tests
- Create SessionManager instance with temp directory
- Cleanup after each test

Test cases:
1. saveSession creates session file with valid data
2. saveSession updates CURRENT-SESSION reference file
3. saveSession validates session state before saving
4. loadCurrentSession loads session from CURRENT-SESSION reference
5. loadCurrentSession returns null if no session exists
6. loadCurrentSession returns null if session file is corrupted
7. sessionExists returns true for existing session
8. sessionExists returns false for non-existent session
9. deleteSession removes session file
10. deleteSession handles missing session gracefully
11. getCurrentSessionId returns current session ID
12. getCurrentSessionId returns null if no session
13. generateSessionId creates unique IDs
14. validateSessionState returns valid=true for fresh session
15. validateSessionState warns about stale sessions (> 24 hours)
16. validateSessionState returns errors for corrupted session

Mock fs operations where needed. Follow existing test pattern from src/tests/storage tests.
  </action>
  <verify><automated>npm test -- --testPathPattern=storage/session-manager.test.ts</automated></verify>
  <done>SessionManager tests cover save, load, delete, validation operations</done>
</task>

</tasks>

<verification>
Overall phase checks:
- Both test files created with descriptive test cases
- All tests pass: npm test
- Test coverage meets 80% threshold: npm run test:coverage
- SessionState tests cover schema validation
- SessionManager tests cover all public methods
- All tests use mocks for external dependencies
- Tests follow existing patterns from the codebase
</verification>

<success_criteria>
All session management tests passing with:
- SessionState type tests covering all schema validation rules (8+ tests)
- SessionManager tests covering save, load, delete, validation (16+ tests)
- All tests pass: npm test
- Test coverage meets 80% threshold
</success_criteria>

<output>
After completion, create `.planning/phases/03-session-management/03-06a-SUMMARY.md`
</output>
