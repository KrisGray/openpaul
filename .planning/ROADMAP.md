# Roadmap: OpenPAUL

## Milestones

- ✅ **v1.0 MVP** - Phases 1-2 (shipped 2026-03-05)
- 🚧 **v1.1 Full Command Implementation** - Phases 3-9 (in progress)
- 📋 **v2.0** - Future enhancements (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-2) - SHIPPED 2026-03-05</summary>

### Phase 1: Core Loop Infrastructure
**Goal**: Implement PAUL loop commands and storage infrastructure
**Plans**: 13 plans

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
- [ ] 01-12: Configure Jest and plugin entry point
- [ ] 01-13: Implement loop enforcer logic

### Phase 2: Advanced Loop Features
**Goal**: Implement roadmapping and state visualization features
**Plans**: 8 plans

Plans:
- [x] 02-01: Create ROADMAP.md template and parsing logic
- [x] 02-02: Implement STATE.md template and management
- [x] 02-03: Build /openpaul:roadmap command for project roadmapping
- [x] 02-04: Build /openpaul:status command for state visualization
- [x] 02-05: Implement phase planning workflow
- [x] 02-06: Implement phase transition workflow
- [x] 02-07: Add validation for loop closure enforcement
- [x] 02-08: Create comprehensive test suite for loop features

</details>

### 🚧 v1.1 Full Command Implementation (In Progress)

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
**Plans**: 12 plans

 Plans:
- [ ] 03-00a: Create test scaffolds for SessionState and SessionManager
- [ ] 03-00b: Create test scaffolds for diff-formatter, pause, resume
- [ ] 03-00c: Create test scaffolds for status and handoff
- [ ] 03-01: Implement SessionManager for session state tracking
- [ ] 03-02: Build /openpaul:pause command
- [ ] 03-03: Build /openpaul:resume command
- [ ] 03-04: Build /openpaul:status command (enhanced version)
- [ ] 03-05: Build /openpaul:handoff command
- [ ] 03-06a: Implement tests for SessionState and SessionManager
- [ ] 03-06b: Implement tests for diff-formatter, pause, resume
- [ ] 03-06c: Implement tests for status and handoff
- [ ] 03-07: Add change detection to pause command (gap closure)

#### Phase 4: Roadmap Management
**Goal**: Users can modify project roadmap by adding and removing phases
**Depends on**: Phase 3
**Requirements**: ROAD-01, ROAD-02
**Success Criteria** (what must be TRUE):
  1. User can add phase to roadmap with `/openpaul:add-phase` that adds phase to ROADMAP.md table, creates phase directory, and updates STATE.md progress tracking
  2. User can remove phase from roadmap with `/openpaul:remove-phase` that removes phase entry, renumbers all subsequent phases, and cleans up phase directory and artifacts
**Plans**: TBD

Plans:
- [ ] 04-01: Implement RoadmapManager for phase management
- [ ] 04-02: Build /openpaul:add-phase command
- [ ] 04-03: Build /openpaul:remove-phase command
- [ ] 04-04: Add tests for roadmap mutation operations

#### Phase 5: Milestone Management
**Goal**: Users can define, track, and complete project milestones
**Depends on**: Phase 4
**Requirements**: MILE-01, MILE-02, MILE-03
**Success Criteria** (what must be TRUE):
  1. User can create new milestone with `/openpaul:milestone` that defines milestone with scope, phases, and theme, and creates milestone section in ROADMAP.md
  2. User can mark milestone complete with `/openpaul:complete-milestone` that archives milestone to MILESTONE-ARCHIVE.md and updates ROADMAP.md progress tracking
  3. User can plan upcoming milestone with `/openpaul:discuss-milestone` that creates MILESTONE-CONTEXT.md with features, scope, phase mapping, and constraints
**Plans**: 5 plans

Plans:
- [ ] 05-01: Implement MilestoneManager for milestone lifecycle
- [ ] 05-02: Build /openpaul:milestone command (create new milestones)
- [ ] 05-03: Build /openpaul:complete-milestone command (archive completed)
- [ ] 05-04: Build /openpaul:discuss-milestone command (plan upcoming)
- [ ] 05-05: Add integration tests for milestone management operations

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
**Plans**: 12 plans in 4 waves

Plans:
- [ ] 06-01: Create PrePlanningManager and types (Wave 1, PLAN-01/02/04)
- [ ] 06-02: Create ResearchManager and types (Wave 1, RSCH-01/02)
- [ ] 06-03: Build /openpaul:discuss command (Wave 2, PLAN-01, BRND-02)
- [ ] 06-04: Build /openpaul:assumptions command (Wave 2, PLAN-02, BRND-02)
- [ ] 06-05: Build /openpaul:discover command with depth modes (Wave 2, PLAN-03, BRND-02)
- [ ] 06-06: Build /openpaul:consider-issues command (Wave 2, PLAN-04, BRND-02)
- [ ] 06-07: Build /openpaul:research command (Wave 2, RSCH-01, BRND-02)
- [ ] 06-08: Build /openpaul:research-phase with parallel agents (Wave 2, RSCH-02, BRND-02)
- [ ] 06-09: PrePlanningManager tests (Wave 3)
- [ ] 06-10: ResearchManager tests (Wave 3)
- [ ] 06-11: Pre-planning command tests (Wave 3)
- [ ] 06-12: Research command tests + BRND-02 verification (Wave 4)

#### Phase 7: Quality
**Goal**: Users can verify plans and fix issues to close loops properly
**Depends on**: Phase 6
**Requirements**: QUAL-01, QUAL-02
**Success Criteria** (what must be TRUE):
  1. User can perform manual acceptance testing with `/openpaul:verify` that generates test checklist from SUMMARY.md, guides through each test, and captures results in phase UAT-ISSUES.md
  2. User can fix plans based on verification issues with `/openpaul:plan-fix` that reads UAT-ISSUES.md, identifies issues requiring plan updates, and creates new or modifies existing plan
**Plans**: 4 plans

Plans:
- [ ] 07-01: Create quality types and QualityManager (Wave 1)
- [ ] 07-02: Build /openpaul:verify command (Wave 2, QUAL-01)
- [ ] 07-03: Build /openpaul:plan-fix command (Wave 2, QUAL-02)
- [ ] 07-04: Add tests for quality commands (Wave 3)

#### Phase 8: Configuration
**Goal**: Users can manage project configuration, specialized flows, and codebase documentation
**Depends on**: Phase 7
**Requirements**: CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):
  1. User can manage project configuration with `/openpaul:config` that manages integrations (SonarQube), project settings, and preferences via YAML config in .openpaul/config.md
  2. User can configure specialized flows with `/openpaul:flows` that enables/disables specialized workflows defined in SPECIAL-FLOWS.md
  3. User can document codebase structure with `/openpaul:map-codebase` that creates CODEBASE.md with structure, stack, conventions, concerns, integrations, and architecture
**Plans**: TBD

Plans:
- [ ] 08-01: Implement ConfigManager for configuration management
- [ ] 08-02: Build /openpaul:config command
- [ ] 08-03: Build /openpaul:flows command
- [ ] 08-04: Build /openpaul:map-codebase command
- [ ] 08-05: Add configuration precedence resolution logic
- [ ] 08-06: Add incremental mapping for large codebases
- [ ] 08-07: Add tests for configuration operations

#### Phase 9: Documentation
**Goal**: All OpenPAUL documentation uses consistent "OpenPAUL" branding
**Depends on**: Phase 8
**Requirements**: BRND-01
**Success Criteria** (what must be TRUE):
  1. All instances of "PAUL" are replaced with "OpenPAUL" in documentation, command names, and user-facing text
  2. Codebase documentation includes comprehensive mapping of structure, stack, conventions, testing, integrations, and architecture
**Plans**: TBD

Plans:
- [ ] 09-01: Update all documentation to use "OpenPAUL" terminology
- [ ] 09-02: Update command names and file references to use "openpaul" prefix
- [ ] 09-03: Ensure all user-facing text uses consistent branding
- [ ] 09-04: Add tests to verify branding consistency

### 📋 v2.0 (Planned)

**Milestone Goal:** Future enhancements based on user feedback

(No phases defined yet)

## Progress

**Execution Order:**
Phases execute in numeric order: 3 → 4 → 5 → 6 → 7 → 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Core Loop Infrastructure | 9/13 | In Progress|  | 2026-03-05 |
| 2. Advanced Loop Features | v1.0 | 8/8 | Complete | 2026-03-05 |
| 3. Session Management | v1.1 | 0/12 | Not started | - |
| 4. Roadmap Management | v1.1 | 0/4 | Not started | - |
| 5. Milestone Management | v1.1 | 0/5 | Not started | - |
| 6. Pre-Planning + Research | v1.1 | 0/12 | Ready to execute | - |
| 7. Quality | v1.1 | 0/6 | Not started | - |
| 8. Configuration | v1.1 | 0/7 | Not started | - |
| 9. Documentation | v1.1 | 0/4 | Not started | - |

**Overall v1.1 Progress:** 0/50 plans (0%)

## Dependencies

```
Phase 3 (Session Management)
  └─> Phase 4 (Roadmap Management)
       └─> Phase 5 (Milestone Management)
            └─> Phase 6 (Pre-Planning + Research)
                 └─> Phase 7 (Quality)
                      └─> Phase 8 (Configuration)
                           └─> Phase 9 (Documentation)
```

## Milestone Tracking

**Milestone:** v1.1 Full Command Implementation

**Target:** All 22 remaining PAUL commands implemented

**Completion criteria:**
- [ ] All 7 phases complete (3-9)
- [ ] All 22 requirements verified and passing
  - [ ] All 50 plans implemented
- [ ] All commands tested with comprehensive Jest coverage
- [ ] Documentation updated with OpenPAUL branding
- [ ] npm package updated and published

**Started:** 2026-03-05
**Estimated completion:** TBD

## Notes

- All phases require comprehensive Jest test coverage following TDD approach
- All commands must include full docstring documentation
- All state management uses file-based JSON storage (.openpaul/ directory)
- All commands enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation
- Research phase (Phase 6) includes parallel subagent spawning via OpenCode Task tool
- Configuration phase (Phase 8) includes codebase mapping for documentation
- Branding phase (Phase 9) ensures all references use "OpenPAUL" and "openpaul"

---

*Roadmap created: 2026-03-05*
*Last updated: 2026-03-05 (revised to include Session Management in v1.1)*
