---
status: diagnosed
trigger: "npm test gives these errors: 5 test suites failed, 34 passed, 47 total; Tests: 5 failed, 564 passed, 569 total"
created: 2026-03-12T14:15:00Z
updated: 2026-03-12T14:25:00Z
symptoms_prefilled: true
---

## Current Focus

hypothesis: Phase 9 branding update (paul → openpaul) left tests with outdated expectations and typos
test: Ran npm test and analyzed all failure categories
expecting: Tests should be updated to match new branding
next_action: Document root causes and fix categories

## Symptoms

expected: All npm test suites pass (93 tests)
actual: 5 test suites failed with 5 individual test failures; 10 test suites failed to run entirely
errors: |
  - Branding mismatch: Tests expect `/paul:` but code outputs `/openpaul:`
  - Missing mocks: @opencode-ai/plugin not mocked in some test files
  - Missing dependency: 'diff' package not installed
  - Typos in imports: openpaulpaulPlanFix instead of openpaulPlanFix
  - Cache validity: isCacheValid returns false unexpectedly
reproduction: npm test
started: After Phase 9 branding update (BRND-01)

## Eliminated

(No hypotheses eliminated yet - direct evidence found)

## Evidence

- timestamp: 2026-03-12T14:15:00Z
  checked: npm test output
  found: |
    **5 Test Failures (branding prefix mismatches):**
    1. handoff.test.ts:73 - expects '/paul:init' but code returns '/openpaul:init'
    2. pause.test.ts:124 - expects '/paul:resume' but code returns '/openpaul:resume'
    3. pause.test.ts:125 - expects '/paul:status' but code returns '/openpaul:status'
    4. pause.test.ts:171 - expects '/paul:resume' but code returns '/openpaul:resume'
    5. pause.test.ts:197 - expects '/paul:init' but code returns '/openpaul:init'
    
    **10 Test Suites Failed to Run:**
    - 5 suites: Cannot find module '@opencode-ai/plugin' (missing mock)
      - discuss.test.ts, assumptions.test.ts, research.test.ts, discover.test.ts, consider-issues.test.ts
    - 2 suites: Cannot find module 'diff' (missing dependency)
      - resume.test.ts, diff-formatter.test.ts
    - 3 suites: Typos in import names (openpaulpaul instead of openpaul)
      - plan-fix.test.ts:9 - openpaulpaulPlanFix
      - discuss-milestone.test.ts:7 - openpaulpaulDiscussMilestone
      - research-phase.test.ts:5 - openpaulpaulResearchPhase
    
    **1 Additional Test Failure:**
    - directory-scanner.test.ts:128 - isCacheValid returns false (needs investigation)
  implication: Phase 9 branding rename was incomplete - tests not updated

- timestamp: 2026-03-12T14:20:00Z
  checked: Test files for branding expectations
  found: Tests written before Phase 9 still expect `/paul:` prefix
  implication: All user-facing string tests need `/paul` → `/openpaul` updates

- timestamp: 2026-03-12T14:22:00Z
  checked: Test imports for typo patterns
  found: Find-replace error created "openpaulpaul" from "paulpaul" or similar
  implication: Manual review needed for all test imports

## Resolution

root_cause: |
  **5 Categories of Test Failures from Incomplete Phase 9 Branding:**
  
  1. **Branding Prefix Mismatches (5 tests)**: Tests expect `/paul:` but code now outputs `/openpaul:`
     - Files: handoff.test.ts, pause.test.ts
     - Fix: Update test expectations from `/paul:*` to `/openpaul:*`
  
  2. **Missing Plugin Mocks (5 suites)**: Commands import @opencode-ai/plugin without Jest mock
     - Files: discuss.test.ts, assumptions.test.ts, research.test.ts, discover.test.ts, consider-issues.test.ts
     - Fix: Add `jest.mock('@opencode-ai/plugin', ...)` like other test files
  
  3. **Missing Dependency (2 suites)**: 'diff' package imported but not installed
     - Files: resume.ts → diff-formatter.ts, diff-formatter.test.ts
     - Fix: Add 'diff' to package.json or mock it
  
  4. **Import Name Typos (3 suites)**: Find-replace created double prefixes
     - Files: plan-fix.test.ts, discuss-milestone.test.ts, research-phase.test.ts
     - Fix: Correct imports: openpaulpaul* → openpaul*
  
  5. **Cache Validity Logic (1 test)**: isCacheValid returns false for fresh cache
     - File: directory-scanner.test.ts
     - Fix: Investigate cache validity logic in directory-scanner.ts

fix: (empty until applied)
verification: (empty until verified)
files_changed: []
