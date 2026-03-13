# Requirements: OpenPAUL

**Defined:** 2026-03-05
**Core Value:** Enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation, ensuring every plan closes properly with full traceability and context preservation.

## v1.1 Requirements

Requirements for full command implementation. Each maps to roadmap phases.

### Session Management

- [x] **SESS-01**: User can create session handoff with `/openpaul:pause` that captures current state, what was done, what's in progress, what's next, and resume instructions
- [x] **SESS-02**: User can restore session with `/openpaul:resume` that reads HANDOFF.md, loads STATE.md, and restores context
- [x] **SESS-03**: User can view current position with `/openpaul:status` that displays PLAN/APPLY/UNIFY loop with markers, current phase, and plan status
- [x] **SESS-04**: User can create explicit handoff with `/openpaul:handoff` for team collaboration or context saves

### Roadmap Management

- [x] **ROAD-01**: User can add phase to roadmap with `/openpaul:add-phase` that adds phase to ROADMAP.md table, creates phase directory, updates STATE.md
- [x] **ROAD-02**: User can remove phase from roadmap with `/openpaul:remove-phase` that removes phase, renumbers subsequent phases, cleans up phase directory

### Milestone Management

- [x] **MILE-01**: User can create new milestone with `/openpaul:milestone` that defines milestone with scope, phases, theme, creates milestone section in ROADMAP.md
- [x] **MILE-02**: User can mark milestone complete with `/openpaul:complete-milestone` that archives milestone to MILESTONE-ARCHIVE.md, updates ROADMAP.md progress
- [x] **MILE-03**: User can plan upcoming milestone with `/openpaul:discuss-milestone` that creates MILESTONE-CONTEXT.md with features, scope, phase mapping, constraints

### Pre-Planning

- [x] **PLAN-01**: User can explore phase goals with `/openpaul:discuss` that creates CONTEXT.md with goals, approach, constraints, open questions
- [x] **PLAN-02**: User can capture and validate assumptions with `/openpaul:assumptions` that creates ASSUMPTIONS.md listing assumptions with validation status
- [ ] **PLAN-03**: User can research technical options with `/openpaul:discover` that supports 3 depth levels: Quick (verbal, 2-5min), Standard (DISCOVERY.md, 15-30min), Deep (comprehensive, 1+hr)
- [x] **PLAN-04**: User can identify potential blockers with `/openpaul:consider-issues` that creates ISSUES.md with categorized risks and mitigation strategies

### Research

- [x] **RSCH-01**: User can research user-specified topics with `/openpaul:research` that executes research with proper verification and returns findings with confidence levels
- [x] **RSCH-02**: User can auto-detect and research phase unknowns with `/openpaul:research-phase` that analyzes phase description, identifies unknowns, spawns parallel research agents

### Quality

- [x] **QUAL-01**: User can perform manual acceptance testing with `/openpaul:verify` that generates test checklist from SUMMARY.md, guides through each test, captures results in phase UAT-ISSUES.md
- [x] **QUAL-02**: User can fix plans based on verification issues with `/openpaul:plan-fix` that reads UAT-ISSUES.md, identifies issues requiring plan updates, creates new or modifies existing plan

### Configuration

- [x] **CONF-01**: User can manage project configuration with `/openpaul:config` that manages integrations (SonarQube), project settings, preferences via YAML config in .openpaul/config.md
- [x] **CONF-02**: User can configure specialized flows with `/openpaul:flows` that enables/disables specialized workflows defined in SPECIAL-FLOWS.md
- [x] **CONF-03**: User can document codebase structure with `/openpaul:map-codebase` that creates CODEBASE.md with structure, stack, conventions, concerns, integrations, architecture

### Branding

- [x] **BRND-01**: All instances of "PAUL" replaced with "OpenPAUL" in documentation, command names, and user-facing text
- [x] **BRND-02**: All instances of "paul" replaced with "openpaul" in command names, file paths, and configuration

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

(None yet - all v1.1 requirements are in scope)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Automated testing in verify command | Verify is for manual user acceptance testing, not automated test suites |
| Real-time collaboration | OpenPAUL is designed for structured, async workflows, not real-time collaboration |
| Complex dependency graphs | Visual dependency management is complex and error-prone. Simple phase dependencies sufficient |
| Built-in time tracking | Time tracking is orthogonal to OpenPAUL's core value of structured workflow |
| Web-based project views | OpenPAUL is CLI-first for developer ergonomics. Web UI adds deployment complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SESS-01 | Phase 3 | Complete |
| SESS-02 | Phase 3 | Complete |
| SESS-03 | Phase 3 | Complete |
| SESS-04 | Phase 3 | Complete |
| ROAD-01 | Phase 4 | Complete |
| ROAD-02 | Phase 4 | Complete |
| MILE-01 | Phase 5 | Complete |
| MILE-02 | Phase 5 | Complete |
| MILE-03 | Phase 5 | Complete |
| PLAN-01 | Phase 6 | Complete |
| PLAN-02 | Phase 6 | Complete |
| PLAN-03 | Phase 6 | Pending |
| PLAN-04 | Phase 6 | Complete |
| RSCH-01 | Phase 6 | Complete |
| RSCH-02 | Phase 6 | Complete |
| QUAL-01 | Phase 7 | Complete |
| QUAL-02 | Phase 7 | Complete |
| CONF-01 | Phase 8 | Complete |
| CONF-02 | Phase 8 | Complete |
| CONF-03 | Phase 8 | Complete |
| BRND-01 | Phase 9 | Complete |
| BRND-02 | Phase 6 | Complete |

**Coverage:**
- v1.1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0
- Mapped for v1.1: 22/22 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after initial definition*
