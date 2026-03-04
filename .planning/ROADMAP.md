# Roadmap: OpenPAUL

## Overview

OpenPAUL is a complete TypeScript rewrite of the PAUL system for the OpenCode platform. This roadmap delivers all 26 PAUL commands across 8 phases, starting with core infrastructure and the essential PLAN → APPLY → UNIFY loop, then expanding to session management, project planning, research capabilities, and finally polish and distribution. Each phase builds on the previous, ensuring a solid foundation before adding advanced features.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core Infrastructure** - Plugin foundation with types, storage, state management, and loop enforcement
- [ ] **Phase 2: Core Loop Commands** - Essential PLAN → APPLY → UNIFY workflow commands
- [ ] **Phase 3: Session Management** - Pause, resume, and handoff capabilities
- [ ] **Phase 4: Project Management** - Milestone tracking and codebase mapping
- [ ] **Phase 5: Planning Support** - Discussion, assumptions, discovery, and issue triage
- [ ] **Phase 6: Research & Quality** - Research agents and verification tools
- [ ] **Phase 7: Roadmap & Configuration** - Dynamic roadmap management and configuration
- [ ] **Phase 8: Rule Integration & Polish** - Final integration, documentation, and npm distribution

## Phase Details

### Phase 1: Core Infrastructure
**Goal**: Plugin foundation is ready for building and running commands
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-03, INFR-04, INFR-05, INFR-06, NFR-02, NFR-04, NFR-05, NFR-06
**Success Criteria** (what must be TRUE):
  1. Plugin loads in OpenCode without errors in under 500ms
  2. All core TypeScript types (State, Plan, Command) are defined and type-safe
  3. State can be saved to and loaded from JSON files reliably with atomic writes
  4. Loop enforcer prevents invalid PLAN → APPLY → UNIFY transitions
  5. Jest test framework is configured with 80%+ coverage target
  6. Model configuration system enables sub-stage model specialization
**Plans**: 9 plans (6 standard + 3 gap closure)

Plans:
- [ ] 01-01: Plugin initialization and TypeScript configuration
- [ ] 01-02: Type system and interfaces
- [ ] 01-03: File-based storage layer
- [ ] 01-04: State manager implementation
- [ ] 01-05: Loop enforcer and validation
- [ ] 01-06: Model configuration system for sub-stage specialization
- [ ] 01-07: [GAP] Error handling tests for atomic-writes.ts
- [ ] 01-08: [GAP] Edge case tests for state-manager and sub-stage
- [ ] 01-09: [GAP] Boundary tests for loop-enforcer and loop types

### Phase 2: Core Loop Commands
**Goal**: Users can execute the complete PLAN → APPLY → UNIFY workflow
**Depends on**: Phase 1
**Requirements**: CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06
**Success Criteria** (what must be TRUE):
  1. User can initialize a new OpenPAUL project with `/paul:init`
  2. User can create executable plans with tasks, criteria, and boundaries
  3. User can execute approved plans sequentially with task verification
  4. User can close loops and generate summaries comparing plan vs actual
  5. User can check current loop position and next action
  6. User can view reference documentation for all commands
**Plans**: TBD

Plans:
- [ ] 02-01: `/paul:init` command implementation
- [ ] 02-02: `/paul:plan` command implementation
- [ ] 02-03: `/paul:apply` command implementation
- [ ] 02-04: `/paul:unify` command implementation
- [ ] 02-05: `/paul:progress` and `/paul:help` commands

### Phase 3: Session Management
**Goal**: Users can pause work and seamlessly resume or handoff to future sessions
**Depends on**: Phase 2
**Requirements**: SESS-01, SESS-02, SESS-03, SESS-04
**Success Criteria** (what must be TRUE):
  1. User can pause work and create session handoff with context
  2. User can resume from a paused session without losing context
  3. User can generate comprehensive handoff documents for transfer
  4. `/paul:status` command shows deprecation notice and redirects to `/paul:progress`
**Plans**: TBD

Plans:
- [ ] 03-01: `/paul:pause` and `/paul:resume` commands
- [ ] 03-02: `/paul:handoff` command
- [ ] 03-03: `/paul:status` deprecation

### Phase 4: Project Management
**Goal**: Users can track milestones and understand project structure
**Depends on**: Phase 2
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04
**Success Criteria** (what must be TRUE):
  1. User can create milestones and associate them with phases
  2. User can complete milestones and archive them properly
  3. User can articulate and capture milestone vision in context files
  4. User can generate codebase structure overview for reference
**Plans**: TBD

Plans:
- [ ] 04-01: `/paul:milestone` and `/paul:complete-milestone` commands
- [ ] 04-02: `/paul:discuss-milestone` command
- [ ] 04-03: `/paul:map-codebase` command

### Phase 5: Planning Support
**Goal**: Users can explore, discuss, and triage before committing to execution
**Depends on**: Phase 2
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04
**Success Criteria** (what must be TRUE):
  1. User can capture planning discussions and decisions in context files
  2. User can review assumptions and intended approach for a phase
  3. User can explore options and review research before planning
  4. User can triage deferred issues based on effort and priority
**Plans**: TBD

Plans:
- [ ] 05-01: `/paul:discuss` and `/paul:assumptions` commands
- [ ] 05-02: `/paul:discover` command
- [ ] 05-03: `/paul:consider-issues` command

### Phase 6: Research & Quality
**Goal**: Users can investigate unknowns and verify implementation quality
**Depends on**: Phase 2
**Requirements**: RESQ-01, RESQ-02, RESQ-03, RESQ-04
**Success Criteria** (what must be TRUE):
  1. User can deploy research agents to investigate specific questions
  2. User can research phase-specific unknowns before planning
  3. User can verify acceptance criteria and log pass/fail results
  4. User can systematically plan fixes for UAT issues
**Plans**: TBD

Plans:
- [ ] 06-01: `/paul:research` and `/paul:research-phase` commands
- [ ] 06-02: `/paul:verify` command
- [ ] 06-03: `/paul:plan-fix` command

### Phase 7: Roadmap & Configuration
**Goal**: Users can dynamically manage roadmap and configure behavior
**Depends on**: Phase 2
**Requirements**: ROAD-01, ROAD-02, ROAD-03, ROAD-04
**Success Criteria** (what must be TRUE):
  1. User can append new phases to the roadmap
  2. User can remove future phases when plans change
  3. User can configure required skills for special workflows
  4. User can view and modify plugin configuration settings
**Plans**: TBD

Plans:
- [ ] 07-01: `/paul:add-phase` and `/paul:remove-phase` commands
- [ ] 07-02: `/paul:flows` and `/paul:config` commands

### Phase 8: Rule Integration & Polish
**Goal**: Plugin is production-ready with documentation and available on npm
**Depends on**: Phase 1
**Requirements**: RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, NFR-01, NFR-03
**Success Criteria** (what must be TRUE):
  1. PAUL domain rules are bundled and injected dynamically in CARL format
  2. Plugin integrates with OpenCode hooks system (session.created, tool.execute.before/after)
  3. All public functions have TSDoc documentation with examples
  4. README includes comprehensive installation and usage guide
  5. Plugin compiles without TypeScript errors
  6. Package is published to npm as @krisgray/openpaul
**Plans**: TBD

Plans:
- [ ] 08-01: PAUL rules integration and OpenCode hooks
- [ ] 08-02: Documentation (TSDoc and README)
- [ ] 08-03: Build optimization and npm publishing

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Infrastructure | 0/5 | Not started | - |
| 2. Core Loop Commands | 0/5 | Not started | - |
| 3. Session Management | 0/3 | Not started | - |
| 4. Project Management | 0/3 | Not started | - |
| 5. Planning Support | 0/3 | Not started | - |
| 6. Research & Quality | 0/3 | Not started | - |
| 7. Roadmap & Configuration | 0/2 | Not started | - |
| 8. Rule Integration & Polish | 0/3 | Not started | - |

---

*Roadmap created: 2026-03-04*
*Depth: comprehensive (8-12 phases)*
*Coverage: 38/38 requirements mapped ✓*
