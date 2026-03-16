# Roadmap: OpenPAUL

 ## Milestones
        
        - ✅ **v1.0 MVP** - Phases 1-2 (shipped 2026-03-05)
        - ✅ **v1.1 Full Command Implementation** - Phases 3-9 (94/94 plans shipped 2026-03-13)
        - 🔵 **v1.2 CI/CD Pipeline** - Phases 10-13 (in progress)
        - 📋 **v2.0** - Future enhancements (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-2) - SHIPPED 2026-03-05</summary>

### Phase 1: Core Loop Infrastructure
**Goal**: Implement PAUL loop commands and storage infrastructure
**Plans**: 13 plans (13 complete)

Plans:
- [x] 01-01: Initialize project config (package.json, tsconfig)
- [x] 01-02: Define core loop/state/plan types
- [x] 01-03: Implement atomic writes and file manager
- [x] 01-04: Implement state manager for per-phase state
- [x] 01-05: Add loop enforcer test suite
- [x] 01-06: Implement model config system and sub-stage types
- [x] 01-07: Add atomic writes error handling tests
- [x] 01-08: Add state-manager edge case + sub-stage tests
- [x] 01-09: Add loop and loop-enforcer branch coverage tests
- [x] 01-10: Close remaining coverage gaps with defensive tests
- [x] 01-11: Define command types and exports
- [x] 01-12: Configure Jest and plugin entry point
- [x] 01-13: Implement loop enforcer logic

**Verified:** UAT complete (12/12 passed)

### Phase 2: Advanced Loop Features
**Goal**: Implement roadmapping and state visualization features
**Plans**: 10 plans (10 complete)

Plans:
- [x] 02-01: Create ROADMAP.md template and parsing logic
- [x] 02-02: Implement STATE.md template and management
- [x] 02-03: Build /openpaul:roadmap command for project roadmapping
- [x] 02-04: Build /openpaul:status command for state visualization
- [x] 02-05: Implement phase planning workflow
- [x] 02-06: Implement phase transition workflow
- [x] 02-07: Add validation for loop closure enforcement
- [x] 02-08: Create comprehensive test suite for loop features
- [x] 02-09: [reserved for future]
- [x] 02-10: Fix TypeScript compilation errors in apply/unify tests

**Verified:** UAT complete (6/6 passed)

</details>

### ✅ v1.1 Full Command Implementation - SHIPPED 2026-03-13

**Milestone Goal:** Implement all remaining PAUL commands (22 total) for complete structured development workflow

**Scope:**
- Session Management (4 commands)
- Roadmap Management (2 commands)
- Milestone Management (3 commands)
- Pre-Planning + Research (6 commands)
- Quality (2 commands)
- Configuration (3 commands)
- Documentation (2 commands)

#### Phase 3: Session Management
**Goal**: Users can pause and resume development sessions with full context preservation
**Depends on**: Phase 2
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04
**Success Criteria** (what must be TRUE):
  1. User can pause session with `/openpaul:pause` that captures current state, work done, work in progress, next steps, and resume instructions
  2. User can resume session with `/openpaul:resume` that loads HANDOFF.md and STATE.md, restores context to exact PAUL loop position
  3. User can view current position with `/openpaul:status` that displays PAUL loop with position markers, current phase, and plan completion status
  4. User can create explicit handoff with `/openpaul:handoff` for team collaboration that captures complete context transfer information
**Plans**: 14 plans (14 complete)

Plans:
- [x] 03-01: Implement SessionManager for session state tracking
- [x] 03-02: Build /openpaul:pause command
- [x] 03-03: Build /openpaul:resume command
- [x] 03-04: Build /openpaul:status command (enhanced version)
- [x] 03-05: Build /openpaul:handoff command
- [x] 03-06: Add tests for SessionManager
- [x] 03-07: Add tests for pause/resume commands
- [x] 03-08: Add tests for status/handoff commands
- [x] 03-09: [reserved]
- [x] 03-10: [reserved]
- [x] 03-11: [reserved]
- [x] 03-12: [reserved]
- [x] 03-13: [reserved]
- [x] 03-14: Add change detection to pause command

**Verified:** UAT complete (12/12 passed)

#### Phase 4: Roadmap Management
**Goal**: Users can modify project roadmap by adding and removing phases
**Depends on**: Phase 3
**Requirements**: ROAD-01, ROAD-02
**Success Criteria** (what must be TRUE):
  1. User can add phase to roadmap with `/openpaul:add-phase` that adds phase to ROADMAP.md table, creates phase directory, and updates STATE.md progress tracking
  2. User can remove phase from roadmap with `/openpaul:remove-phase` that removes phase entry, renumbers all subsequent phases, and cleans up phase directory and artifacts
**Plans**: 5 plans (5 complete)

Plans:
- [x] 04-01: Implement RoadmapManager for phase management
- [x] 04-02: Build /openpaul:add-phase command
- [x] 04-03: Build /openpaul:remove-phase command
- [x] 04-04: Add tests for roadmap mutation operations
- [x] 04-05: Integration tests for roadmap management

**Verified:** Passed (2026-03-13)

#### Phase 5: Milestone Management
**Goal**: Users can define, track, and complete project milestones
**Depends on**: Phase 4
**Requirements**: MILE-01, MILE-02, MILE-03
**Success Criteria** (what must be TRUE):
  1. User can create new milestone with `/openpaul:milestone` that defines milestone with scope, phases, and theme, and creates milestone section in ROADMAP.md
  2. User can mark milestone complete with `/openpaul:complete-milestone` that archives milestone to MILESTONE-ARCHIVE.md and updates ROADMAP.md progress tracking
  3. User can plan upcoming milestone with `/openpaul:discuss-milestone` that creates MILESTONE-CONTEXT.md with features, scope, phase mapping, and constraints
**Plans**: 5 plans (5 complete)

Plans:
- [x] 05-01: Implement MilestoneManager for milestone lifecycle
- [x] 05-02: Build /openpaul:milestone command (create new milestones)
- [x] 05-03: Build /openpaul:complete-milestone command (archive completed)
- [x] 05-04: Build /openpaul:discuss-milestone command (plan upcoming)
- [x] 05-05: Add integration tests for milestone management operations

**Verified:** Passed (2026-03-13)

#### Phase 6: Pre-Planning + Research
**Goal**: Users can conduct phase planning and research to improve plan quality
**Depends on**: Phase 5
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, RSCH-01, RSCH-02, BRND-02
**Success Criteria** (what must be TRUE):
  1. User can explore phase goals with `/openpaul:discuss` that creates CONTEXT.md with goals, approach, constraints, and open questions
  2. User can capture and validate assumptions with `/openpaul:assumptions` that creates ASSUMPTIONS.md listing assumptions with validation status
  3. User can research technical options with `/openpaul:discover` that supports 3 depth levels: Quick (verbal, 2-5min), Standard (DISCOVERY.md, 15-30min), Deep (comprehensive, 1+hr)
  4. User can identify potential blockers with `/openpaul:consider-issues` that creates ISSUES.md with categorized risks and mitigation strategies
  5. User can research user-specified topics with `/openpaul:research` that executes research with proper verification and returns findings with confidence levels
  6. User can auto-detect and research phase unknowns with `/openpaul:research-phase` that analyzes phase description, identifies unknowns, and spawns parallel research agents
  7. User can use commands with "openpaul" prefix in all command names (BRND-02)
**Plans**: 12 plans (12 complete)

Plans:
- [x] 06-01: Create PrePlanningManager and types (Wave 1, PLAN-01/02/04)
- [x] 06-02: Create ResearchManager and types (Wave 1, RSCH-01/02)
- [x] 06-03: Build /openpaul:discuss command (Wave 2, PLAN-01, BRND-02)
- [x] 06-04: Build /openpaul:assumptions command (Wave 2, PLAN-02, BRND-02)
- [x] 06-05: Build /openpaul:discover command with depth modes (Wave 2, PLAN-03, BRND-02)
- [x] 06-06: Build /openpaul:consider-issues command (Wave 2, PLAN-04, BRND-02)
- [x] 06-07: Build /openpaul:research command (Wave 2, RSCH-01, BRND-02)
- [x] 06-08: Build /openpaul:research-phase with parallel agents (Wave 2, RSCH-02, BRND-02)
- [x] 06-09: PrePlanningManager tests (Wave 3)
- [x] 06-10: ResearchManager tests (Wave 3)
- [x] 06-11: Pre-planning command tests (Wave 3)
- [x] 06-12: Research command tests + BRND-02 verification (Wave 4)

**Verified:** Passed (2026-03-13)

#### Phase 7: Quality
**Goal**: Users can verify plans and fix issues to close loops properly
**Depends on**: Phase 6 (executed out of order for tooling purposes)
**Requirements**: QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. User can perform manual acceptance testing with `/openpaul:verify` that generates test checklist from SUMMARY.md, guides through each test, and captures results in phase UAT-ISSUES.md
  2. User can fix plans based on verification issues with `/openpaul:plan-fix` that reads UAT-ISSUES.md, identifies issues requiring plan updates, and creates new or modifies existing plan
**Plans**: 11 plans (11 complete)

Plans:
- [x] 07-01: Create quality types and QualityManager (Wave 1)
- [x] 07-02: Build /openpaul:verify command (Wave 2, QUAL-01)
- [x] 07-03: Build /openpaul:plan-fix command (Wave 2, QUAL-02)
- [x] 07-04: Add tests for quality commands (Wave 3)
- [x] 07-05: Fix branding-related test failures
- [x] 07-06: Add diff dependency for diff-formatter
- [x] 07-07: Fix directory scanner cache validity
- [x] 07-08: Add Jest test suites for quality command workflows
- [x] 07-09: Resolve remaining UAT test failures and confirm full suite passes
- [x] 07-10: Add missing @opencode-ai/plugin mocks to command tests
- [x] 07-11: Add confirmation gate for plan-fix auto-execution

**Verified:** Passed (2026-03-13)

#### Phase 8: Configuration
**Goal**: Users can manage project configuration, specialized flows, and codebase documentation
**Depends on**: Phase 7
**Requirements**: CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):
  1. User can manage project configuration with `/openpaul:config` that manages integrations (SonarQube), project settings, and preferences via YAML config in .openpaul/config.md
  2. User can configure specialized flows with `/openpaul:flows` that enables/disables specialized workflows defined in SPECIAL-FLOWS.md
  3. User can document codebase structure with `/openpaul:map-codebase` that creates CODEBASE.md with structure, stack, conventions, concerns, integrations, and architecture
**Plans**: 6 plans (6 complete)

Plans:
- [x] 08-01-PLAN.md — ConfigManager + /openpaul:config command (CONF-01)
- [x] 08-02-PLAN.md — FlowsManager + /openpaul:flows command (CONF-02)
- [x] 08-03-PLAN.md — /openpaul:map-codebase command (CONF-03)
- [x] 08-04-PLAN.md — Config precedence and validation (CONF-01)
- [x] 08-05-PLAN.md — Incremental mapping for large codebases (CONF-03)
- [x] 08-06-PLAN.md — Tests for config, flows, map-codebase commands

**Verified:** Passed (2026-03-13)

#### Phase 9: Documentation
**Goal**: All OpenPAUL documentation uses consistent "OpenPAUL" branding
**Depends on**: Phase 8 (can execute independently - self-contained branding work)
**Requirements**: BRND-01
**Success Criteria** (what must be TRUE):
  1. All instances of "PAUL" replaced with "OpenPAUL" in documentation, command names, and user-facing text
  2. All paulX function exports renamed to openpaulX
  3. Plugin renamed to OpenPaulPlugin with only openpaul: command prefix
**Plans**: 18 plans (18 complete)

Plans:
- [x] 09-01-PLAN.md — Command function renames part 1 (paulX → openpaulX) — Wave 1
- [x] 09-02-PLAN.md — Storage dual-path resolution (.openpaul/ primary, .paul/ fallback) — Wave 1
- [x] 09-03-PLAN.md — Template rebranding part 1 — Wave 1
- [x] 09-04-PLAN.md — Tests and branding consistency verification — Wave 3
- [x] 09-05-PLAN.md — Update runtime user-facing strings to OpenPAUL — Wave 2
- [x] 09-06-PLAN.md — (reserved)
- [x] 09-07-PLAN.md — Command documentation rebranding part 1 — Wave 3
- [x] 09-08-PLAN.md — Root doc rebranding (OPENPAUL-VS-GSD.md) — Wave 1
- [x] 09-09-PLAN.md — Command function renames part 2 — Wave 1
- [x] 09-10-PLAN.md — Index files and plugin registration — Wave 2
- [x] 09-11-PLAN.md — Template rebranding part 2 — Wave 1
- [x] 09-12-PLAN.md — README and package.json rebranding — Wave 1
- [x] 09-13-PLAN.md — Runtime string updates part 2 — Wave 3
- [x] 09-14-PLAN.md — Command documentation rebranding part 2 — Wave 3
- [x] 09-15-PLAN.md — Workflow documentation rebranding part 1 — Wave 3
- [x] 09-16-PLAN.md — Workflow documentation rebranding part 2 — Wave 3
- [x] 09-17-PLAN.md — Reference documentation rebranding — Wave 3
- [x] 09-18-PLAN.md — Rule documentation rebranding — Wave 3

**Verified:** Passed (2026-03-13)

### 🔵 v1.2 CI/CD Pipeline - IN PROGRESS

**Milestone Goal:** Add GitHub Actions workflows for automated testing, E2E tests, coverage reporting, and npm publishing

**Scope:**
- CI Workflow (test.yml)
- E2E Tests (e2e-tests.yml with Docker)
- Codecov Integration (codecov.yml)
- Publish Workflow (publish.yml)

#### Phase 10: CI Workflow
**Goal**: Automated unit tests run on every push/PR with coverage artifacts
**Depends on**: Phase 9 (v1.1 complete)
**Requirements**: CI-01, CI-02, CI-03, CI-04, CI-05
**Success Criteria** (what must be TRUE):
  1. Unit tests run automatically on every push to main branch
  2. Unit tests run automatically on every pull request (non-draft PRs only)
  3. In-progress workflow runs cancel when new commits arrive on the same ref
  4. Coverage report generated via `npm run test:coverage` command
  5. Coverage artifacts uploaded for downstream codecov workflow to consume
**Plans**: 1 plan

Plans:
- [ ] 10-01-PLAN.md — Create test.yml workflow with triggers, concurrency, coverage artifacts

#### Phase 11: E2E Tests
**Goal**: E2E tests run in Docker container with OpenCode CLI for realistic testing
**Depends on**: Phase 10 (CI workflow provides base patterns)
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06
**Success Criteria** (what must be TRUE):
  1. E2E tests run in Docker container with OpenCode CLI pre-installed
  2. Docker image uses layer caching for faster subsequent runs
  3. E2E tests retry once on failure for flaky test resilience
  4. Failure artifacts (Docker logs, .openpaul state) uploaded for debugging
  5. E2E tests run on schedule (daily at 2am UTC) for regression detection
  6. E2E tests run on push to main and PRs (non-draft)
**Plans**: 2 plans

Plans:
- [ ] 11-01-PLAN.md — Create Dockerfile.e2e and E2E test scaffold (E2E-01, E2E-02)
- [ ] 11-02-PLAN.md — Create e2e-tests.yml workflow with retry and artifacts (E2E-03, E2E-04, E2E-05, E2E-06)

#### Phase 12: Codecov
**Goal**: Coverage reports uploaded to Codecov with PR comments for visibility
**Depends on**: Phase 10 (test.yml), Phase 11 (e2e-tests.yml)
**Requirements**: COV-01, COV-02, COV-03, COV-04, COV-05
**Success Criteria** (what must be TRUE):
  1. Codecov workflow runs AFTER both test.yml and e2e-tests.yml complete successfully
  2. Coverage artifacts downloaded from completed test.yml workflow
  3. Coverage uploaded to Codecov.io with token authentication
  4. PR coverage reports posted as comments showing coverage delta
  5. codecov.yml config file present with project-specific thresholds
**Plans**: 1 plan

Plans:
- [ ] 12-01-PLAN.md — Create codecov.yml workflow and configuration (COV-01 to COV-05)

#### Phase 13: Publish
**Goal**: npm package published automatically on GitHub release with quality gates
**Depends on**: Phase 10 (tests), Phase 11 (E2E), Phase 12 (codecov)
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04
**Success Criteria** (what must be TRUE):
  1. npm publish triggered automatically on GitHub release published event
  2. Publish workflow requires: unit tests + E2E tests + codecov all passing
  3. npm provenance enabled for supply chain security transparency
  4. Build (npm run build) runs before publish to ensure fresh dist/
**Plans**: 1 plan

Plans:
- [ ] 13-01-PLAN.md — Create publish.yml workflow with quality gates and provenance (PUB-01 to PUB-04)

#### Phase 14: Codecov Integration Fix
**Goal**: Fix race condition in codecov.yml dual-workflow verification
**Depends on**: Phase 12 (codecov)
**Requirements**: COV-01 (fix)
**Gap Closure**: Fixes integration gap from v1.2 audit
**Success Criteria** (what must be TRUE):
  1. Codecov workflow waits for BOTH test.yml AND e2e-tests.yml to complete before uploading
  2. Graceful timeout handling if E2E takes longer than expected
  3. Dual trigger support (test.yml OR e2e-tests.yml both trigger codecov.yml)
**Plans**: 1 plan

Plans:
- [x] 14-01-PLAN.md — Fix codecov.yml race condition with dual triggers and wait loop (complete)

### 📋 v2.0 (Planned)

**Milestone Goal:** Future enhancements based on user feedback

(No phases defined yet)

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 14 → 13

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Core Loop Infrastructure | v1.0 | 13/13 | Complete | 2026-03-04 |
| 2. Advanced Loop Features | v1.0 | 10/10 | Complete | 2026-03-05 |
| 3. Session Management | v1.1 | 14/14 | Complete | 2026-03-06 |
| 4. Roadmap Management | v1.1 | 5/5 | Complete | 2026-03-13 |
| 5. Milestone Management | v1.1 | 5/5 | Complete | 2026-03-13 |
| 6. Pre-Planning + Research | v1.1 | 12/12 | Complete | 2026-03-13 |
| 7. Quality | v1.1 | 11/11 | Complete | 2026-03-13 |
| 8. Configuration | v1.1 | 6/6 | Complete | 2026-03-13 |
| 9. Documentation | v1.1 | 18/18 | Complete | 2026-03-13 |
| 10. CI Workflow | v1.2 | 1/1 | Complete | 2026-03-16 |
| 11. E2E Tests | v1.2 | 2/2 | Complete | 2026-03-16 |
| 12. Codecov | v1.2 | 1/1 | Complete | 2026-03-16 |
| 14. Codecov Integration Fix | 1/1 | Complete    | 2026-03-16 | - |
| 13. Publish | v1.2 | 0/0 | Not started | - |

**Overall v1.2 Progress:** 4/5 phases complete (80%)

## Dependencies

```
Phase 3 (Session Management) - COMPLETE
  └─> Phase 4 (Roadmap Management) - COMPLETE
       └─> Phase 5 (Milestone Management) - COMPLETE
            └─> Phase 6 (Pre-Planning + Research) - COMPLETE

Phase 7 (Quality) - COMPLETE
Phase 8 (Configuration) - COMPLETE
Phase 9 (Documentation) - COMPLETE

--- v1.2 CI/CD Pipeline ---

Phase 10 (CI Workflow) - COMPLETE
  └─> Phase 11 (E2E Tests) - COMPLETE
       └─> Phase 12 (Codecov) - COMPLETE
            └─> Phase 14 (Codecov Integration Fix) - NOT STARTED (gap closure)
            └─> Phase 13 (Publish) - NOT STARTED (needs all above + fix)
```

## Milestone Tracking

**Milestone:** v1.2 CI/CD Pipeline

**Target:** Complete CI/CD infrastructure with 5 phases (10-14, 13 optional for later)

**Completion criteria:**
- [ ] All required phases complete (10-12, 14)
- [ ] All 16 requirements verified
  - [x] Phase 10: 5 requirements (CI Workflow) (completed 2026-03-16)
  - [x] Phase 11: 6 requirements (E2E Tests) (completed 2026-03-16)
  - [x] Phase 12: 5 requirements (Codecov) (completed 2026-03-16)
  - [x] Phase 14: COV-01 fix (Codecov race condition) (completed 2026-03-16)
- [ ] test.yml workflow runs on push/PR
- [ ] e2e-tests.yml runs in Docker with OpenCode CLI
- [ ] codecov.yml uploads coverage after tests pass (reliably)
- [ ] (Optional) publish.yml publishes to npm on release

**Started:** 2026-03-13
**Progress:** 4/5 phases (80%)

## Notes

- All phases require comprehensive Jest test coverage following TDD approach
- All commands must include full docstring documentation
- All state management uses file-based JSON storage (.openpaul/ directory)
- All commands enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation
- Research phase (Phase 6) includes parallel subagent spawning via OpenCode Task tool
- Configuration phase (Phase 8) includes codebase mapping for documentation
- Branding phase (Phase 9) ensures all references use "OpenPAUL" and "openpaul"
- v1.2 phases (10-13) implement GitHub Actions CI/CD pipeline
- CI workflow uses concurrency groups to cancel redundant runs
- E2E tests run in Docker for isolation and reproducibility
- Codecov workflow requires both unit and E2E tests to pass first
- Publish workflow gates npm publish behind all quality checks

---
*Roadmap created: 2026-03-05*
*Last updated: 2026-03-16 (gap closure phase 14 added from audit)*
