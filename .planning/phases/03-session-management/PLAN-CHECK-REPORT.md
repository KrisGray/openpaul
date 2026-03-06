## ISSUES FOUND

**Phase:** 03-session-management
**Plans checked:** 6
**Issues:** 1 blocker, 0 warning(s), 0 info

### Blockers (must fix)

**1. [Dimension 8 - Nyquist Compliance] Implementation tasks verify against non-existent tests**

**Problem:**
Implementation tasks in Wave 1 (03-01) and Wave 2 (03-03) verify against test files that don't exist yet. Tests are created in Wave 4 (03-06), after all implementation is complete.

This violates the Nyquist-Shannon Sampling Theorem principle: code is being produced at high frequency (one task per commit) but feedback (automated tests) is provided at low frequency (deferred to Wave 4). Errors will be statistically missed because there's no automated verification between implementation and testing.

**Specific failures:**
- Plan 03-01, Task 1: Verifies with `npm test -- --testPathPattern=types/session.test.ts` (test file created in 03-06)
- Plan 03-01, Task 2: Verifies with `npm test -- --testPathPattern=storage/session-manager.test.ts` (test file created in 03-06)
- Plan 03-03, Task 1: Verifies with `npm test -- --testPathPattern=output/diff-formatter.test.ts` (test file created in 03-06)

**Why this is a blocker:**
- Nyquist requires test frequency ≥ code output frequency for proper error detection
- Current approach produces 5 implementation tasks without any automated test verification
- Build checks (`npm run build`) catch compilation errors only, not logic errors
- Deferring tests to Wave 4 creates a "black hole" period where errors can accumulate

**Required fixes:**

**Option 1 (Recommended): Create Wave 0 test scaffolding plan**
- Add new plan `03-00-PLAN.md` (Wave 0) that creates empty test files
- Test scaffolding plan depends on nothing, executes first
- Change Wave 1-2 task verify commands to reference Wave 0 scaffolding with `<automated>MISSING</automated>` pattern
- Wave 4 (03-06) then fills in the test implementations
- Wave 0 would depend on nothing (can run parallel to Phase 2 completion)

**Option 2: Move test scaffolding to start of Wave 1**
- Create first task in 03-01 as "Create test scaffolds for session management"
- This task creates all empty test files (types/session.test.ts, storage/session-manager.test.ts, etc.)
- Subsequent tasks in 03-01 and other waves can verify against existing scaffolds
- Adjust wave assignments if needed

**Option 3: Change verification to existing tests**
- For Wave 1-2 tasks, change verify commands to `npm test` (run existing test suite)
- Add "ensure existing tests still pass" to verify commands
- Wave 6 still adds comprehensive new tests
- This provides continuity but doesn't test new functionality

**Additional Nyquist concerns:**
- Wave 2 has 7 implementation tasks but only uses `npm run build` for verification (insufficient for logic errors)
- Should add unit-level tests in Wave 1 or 2 for each major implementation
- Or use existing test suite regression to catch breaking changes

---

### Structured Issues

```yaml
issue:
  dimension: nyquist_compliance
  severity: blocker
  description: "Implementation tasks verify against non-existent tests - Nyquist violation"
  plan: "03-01, 03-03"
  tasks: [1, 2, 1]
  fix_hint: "Create Wave 0 test scaffolding plan or move test file creation to Wave 1 before implementation tasks"
  nyquist_check: "Check 8a - Automated Verify Presence failed: tests referenced don't exist when task runs"
  sampling_violation: "Wave 1 (2 tasks) and Wave 2 (7 tasks) produce code without automated test verification"
```

---

### Recommendation

1 blocker requires revision. Return to planner with Nyquist compliance fixes.

**Suggested approach:**
1. Create `03-00-PLAN.md` (Wave 0) for test scaffolding
2. Update Wave 1-2 task verify commands to use `<automated>MISSING</automated>` pattern with references to Wave 0 test files
3. Wave 4 (03-06) then implements the actual test logic in the scaffolds
4. Or add unit-level tests to Wave 1-2 for immediate feedback on new functionality

This ensures the Nyquist sampling theorem is satisfied: tests exist (or are created) before or during implementation, providing continuous feedback at the same frequency as code output.
