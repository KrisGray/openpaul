# Feature Landscape

**Domain:** Structured Development Workflow Management
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

Based on research of structured development tools, project management platforms, and the existing PAUL v1.0 core commands, I've identified the feature landscape for implementing the remaining 20 PAUL commands. These commands fall into 7 categories: Session Management, Roadmap Management, Milestone Management, Pre-Planning, Research, Quality, and Configuration.

Key findings:

1. **Session management** follows the "Handoff + Resume" pattern with comprehensive state capture (MEDIUM-HIGH confidence from AKF Partners and LobeHub research)
2. **Milestone tracking** is standard practice in project management with clear phase dependencies (HIGH confidence from Atlassian and ClickUp research)
3. **Pre-planning** workflows (discuss, assumptions, discover, consider-issues) are critical for reducing project risks (HIGH confidence from Acropolium discovery phase research)
4. **Research workflows** distinguish between information gathering (research) and decision-making (discover) with subagent parallelization (HIGH confidence from existing PAUL workflow patterns)
5. **Quality verification** emphasizes manual user testing guided by Claude with systematic issue capture (MEDIUM-HIGH confidence from QA process research)
6. **Configuration** focuses on project settings and integrations rather than complex workflow management (MEDIUM confidence from existing command patterns)

## Table Stakes

Features users expect in structured development tools. Missing these = product feels incomplete.

### Session Management

| Feature | Why Expected | Complexity | Notes |
|-----------|---------------|--------------|-------|
| **pause** - Create handoff file | Users need to stop mid-session and resume later | MEDIUM | HANDOFF.md structure: Current State, What Was Done, What's In Progress, What's Next, Resume Instructions. Follows "Handoff + Resume" pattern from AKF Partners: Capture State → Monitor for Return → Re-activate Context → Prompt Next Step |
| **resume** - Restore from handoff | Seamless session continuation without context loss | MEDIUM | Reads HANDOFF.md, loads STATE.md, restores context. Critical for multi-session workflows |
| **status** - Show current position | Users expect visibility into loop position and progress | LOW | Visual display: PLAN/APPLY/UNIFY loop with markers, current phase, plan status. Table stakes for any workflow tool |
| **handoff** - Explicit handoff creation | For team collaboration or explicit context saves | MEDIUM | Similar to pause but for user-requested handoffs (e.g., before passing work to another developer) |

### Roadmap Management

| Feature | Why Expected | Complexity | Notes |
|-----------|---------------|--------------|-------|
| **add-phase** - Add phase to roadmap | Projects evolve; new phases get added | MEDIUM | Adds phase to ROADMAP.md table, creates phase directory, updates STATE.md. Must handle phase numbering and dependencies |
| **remove-phase** - Remove phase from roadmap | Mistakes happen; scope changes | MEDIUM | Removes phase, renumbers subsequent phases, cleanup phase directory. Must warn about completed phases or dependencies |

### Milestone Management

| Feature | Why Expected | Complexity | Notes |
|-----------|---------------|--------------|-------|
| **milestone** - Create new milestone | Projects have natural breaks/deliverables | MEDIUM | Defines milestone with scope, phases, theme. Creates milestone section in ROADMAP.md, updates STATE.md. Standard practice per Atlassian research |
| **complete-milestone** - Mark milestone complete | Milestone closure is required milestone tracking | MEDIUM | Archives milestone to MILESTONE-ARCHIVE.md, updates ROADMAP.md progress. Includes summary of what was delivered |
| **discuss-milestone** - Plan upcoming milestone | Team alignment before starting work | MEDIUM | Creates MILESTONE-CONTEXT.md with Features, Scope, Phase Mapping, Constraints. Consumed by /paul:milestone command |

### Pre-Planning

| Feature | Why Expected | Complexity | Notes |
|-----------|---------------|--------------|-------|
| **discuss** - Explore phase goals | Users need to define "what" before "how" | MEDIUM | Creates CONTEXT.md with Goals, Approach, Constraints, Open Questions. Informative for /paul:plan. Critical for reducing misunderstandings per Acropolium research |
| **assumptions** - Capture and validate assumptions | Assumptions are major risk sources if unvalidated | MEDIUM | Creates ASSUMPTIONS.md listing assumptions with validation status (validated/unvalidated/pending). Reduces rework risk |
| **discover** - Research technical options | Pre-planning research before committing to implementation | HIGH | 3 depth levels: Quick (verbal, 2-5min), Standard (DISCOVERY.md, 15-30min), Deep (comprehensive, 1+hr). Distinct from /paul:research - Discovery makes decisions, Research gathers info |
| **consider-issues** - Identify potential blockers | Proactive issue identification reduces surprises | MEDIUM | Creates ISSUES.md with categorized risks (technical/dependency/scope) and mitigation strategies |

### Research

| Feature | Why Expected | Complexity | Notes |
|-----------|---------------|--------------|-------|
| **research** - User-specified topic research | Users need to investigate specific topics | HIGH | User specifies what to research, Claude executes research with proper verification. Returns findings with confidence levels |
| **research-phase** - Auto-detect and research phase unknowns | Users don't always know what needs researching | HIGH | Analyzes phase description, identifies unknowns, spawns parallel research agents (max 3 for token efficiency), consolidates into phase RESEARCH.md. Distinct from /paul:research - research-phase identifies unknowns, research investigates known topics |

### Quality

| Feature | Why Expected | Complexity | Notes |
|-----------|---------------|--------------|-------|
| **verify** - Manual user acceptance testing | Manual testing is table stakes for delivery | MEDIUM | USER performs all testing. Claude generates test checklist from SUMMARY.md acceptance criteria, guides through each test via AskUserQuestion, captures results in phase UAT-ISSUES.md. Anti-pattern: Don't run automated tests, don't make assumptions about results |
| **plan-fix** - Fix plan based on verification issues | Failed tests require plan fixes before closing loop | MEDIUM | Reads UAT-ISSUES.md, identifies issues that require plan updates, creates new plan or modifies existing plan, re-runs /paul:apply after fixes. Critical for loop closure integrity |

### Configuration

| Feature | Why Expected | Complexity | Notes |
|-----------|---------------|--------------|-------|
| **config** - Manage project configuration | Projects need configurable settings | MEDIUM | Manage integrations (SonarQube), project settings, preferences. YAML config in .paul/config.md. Can be run at any project lifecycle point |
| **flows** - Configure specialized flows | Some projects need custom workflows | LOW | Enable/disable specialized flows defined in SPECIAL-FLOWS.md. Simple toggle-based configuration |
| **map-codebase** - Document codebase structure | Understanding existing code is critical for onboarding | HIGH | Creates CODEBASE.md with structure, stack, conventions, concerns, integrations, architecture. Uses discovery approach to analyze codebase |

## Differentiators

Features that set PAUL apart from generic project management tools.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Loop-aware pause/resume** | PAUL-specific: capture exact loop position (PLAN/APPLY/UNIFY) and enforce it on resume | MEDIUM | Most tools don't have enforced workflow. Must prevent resuming mid-loop in wrong phase |
| **Discovery depth levels** | Adapt research effort to risk/complexity | MEDIUM | Quick (2-5min), Standard (15-30min), Deep (1+hr). Most tools don't offer granular depth control. Enables efficient use of Claude's capabilities |
| **Research-phase parallel subagents** | Identify and research unknowns automatically | HIGH | Analyzes phase, spawns up to 3 parallel research agents, consolidates findings. Reduces user cognitive load - they don't need to know what needs researching |
| **Assumption validation tracking** | Explicit assumption management reduces risk | MEDIUM | Most PM tools don't track assumptions as first-class citizens. PAUL treats assumptions with validation status, preventing silent failures |
| **Handoff-first architecture** | Session continuity as core feature | MEDIUM | HANDOFF.md as primary state transfer mechanism, not just an afterthought. Enables seamless multi-session and multi-developer workflows |
| **Milestone context handoffs** | Milestone discussion separate from creation | MEDIUM | /paul:discuss-milestone creates MILESTONE-CONTEXT.md that /paul:milestone consumes. Separates "what we're building" from "when/how we're building it" |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Automated testing in verify command** | Verify is for manual user acceptance testing, not automated test suites | Use existing CI/test infrastructure. Verify focuses on user perspective, not unit/integration tests |
| **Real-time collaboration** | PAUL is designed for structured, async workflows, not real-time collaboration | Use pause/handoff for async handoffs. Real-time collaboration increases complexity without clear benefit for PAUL's use case |
| **Complex dependency graphs** | Visual dependency management is complex and error-prone. Simple phase dependencies in ROADMAP.md sufficient | Maintain phase dependencies in ROADMAP.md. Avoid visual graph complexity that breaks when changes occur |
| **Built-in time tracking** | Time tracking is orthogonal to PAUL's core value of structured workflow | Use external time tracking if needed. PAUL focuses on what and how, not how long |
| **Web-based project views** | PAUL is CLI-first for developer ergonomics. Web UI adds deployment complexity | Keep CLI-first with markdown-based human-readable files. Export to web tools if needed, but don't build web UI |

## Feature Dependencies

```
[pause]
    └──requires──> [existing project with STATE.md]

[resume]
    └──requires──> [pause/handoff files]

[handoff]
    └──requires──> [existing project with STATE.md]
    └──enhances──> [pause] (explicit version)

[status]
    └──requires──> [existing project with STATE.md]

[add-phase]
    └──requires──> [existing milestone in ROADMAP.md]

[remove-phase]
    └──requires──> [existing milestone with phases]

[milestone]
    └──requires──> [existing project]
    └──enhanced by──> [discuss-milestone]

[complete-milestone]
    └──requires──> [existing milestone with completed phases]

[discuss-milestone]
    └──requires──> [existing project]

[discuss]
    └──requires──> [existing phase in ROADMAP.md]
    └──informs──> [plan]

[assumptions]
    └──requires──> [existing phase or project context]
    └──informs──> [plan]

[discover]
    └──requires──> [existing phase or project scope]
    └──informs──> [plan]

[consider-issues]
    └──requires──> [existing phase or project context]
    └──informs──> [plan]

[research]
    └──requires──> [existing project context]

[research-phase]
    └──requires──> [existing phase in ROADMAP.md]
    └──informs──> [plan]

[verify]
    └──requires──> [completed plan with SUMMARY.md]
    └──informs──> [plan-fix]

[plan-fix]
    └──requires──> [verify with issues in UAT-ISSUES.md]

[config]
    └──requires──> [existing project]

[flows]
    └──requires──> [existing project with SPECIAL-FLOWS.md]

[map-codebase]
    └──requires──> [existing codebase to map]
    └──informs──> [all planning and implementation]
```

## MVP Definition

### Launch With (v1.1 - Full Command Implementation)

Minimum viable product — what's needed to validate the complete PAUL workflow.

- [ ] **Session Management** (pause, resume, status) — Core session continuity is table stakes for multi-session workflows
- [ ] **Roadmap Management** (add-phase, remove-phase) — Basic roadmap manipulation is required for project evolution
- [ ] **Milestone Management** (milestone, complete-milestone) — Milestone lifecycle is core to PAUL's milestone-based approach
- [ ] **Pre-Planning** (discuss, discover) — Basic pre-planning reduces risk and improves plan quality
- [ ] **Research** (research, research-phase) — Research capabilities are table stakes for informed development
- [ ] **Quality** (verify, plan-fix) — Quality verification and plan fixes are required for loop closure

### Add After Validation (v1.2)

Features to add once core is working.

- [ ] **discuss-milestone** — Milestone discussion before creation improves alignment (defer: requires teams to find value in explicit milestone planning)
- [ ] **assumptions** — Assumption tracking reduces risk but may feel bureaucratic (defer: wait for user feedback on workflow overhead)
- [ ] **consider-issues** — Proactive issue identification is valuable but not critical (defer: verify users actually use it before investing)

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **flows** — Specialized flows are power features with niche use cases (defer: needs concrete user scenarios)
- [ ] **map-codebase** — Codebase mapping is valuable but time-consuming (defer: verify users actually use it for onboarding)

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| pause | HIGH | MEDIUM | P1 |
| resume | HIGH | MEDIUM | P1 |
| status | HIGH | LOW | P1 |
| add-phase | HIGH | MEDIUM | P1 |
| remove-phase | MEDIUM | MEDIUM | P2 |
| milestone | HIGH | MEDIUM | P1 |
| complete-milestone | HIGH | MEDIUM | P1 |
| discuss-milestone | MEDIUM | MEDIUM | P2 |
| discuss | HIGH | MEDIUM | P1 |
| discover | HIGH | HIGH | P1 |
| assumptions | MEDIUM | MEDIUM | P2 |
| consider-issues | MEDIUM | MEDIUM | P2 |
| research | HIGH | HIGH | P1 |
| research-phase | HIGH | HIGH | P1 |
| verify | HIGH | MEDIUM | P1 |
| plan-fix | HIGH | MEDIUM | P1 |
| config | MEDIUM | MEDIUM | P2 |
| flows | LOW | LOW | P3 |
| map-codebase | MEDIUM | HIGH | P2 |

**Priority key:**
- P1: Must have for v1.1 complete workflow
- P2: Should have for v1.2 or early v1.1.x
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Atlassian Jira | ClickUp | GitHub Projects | PAUL |
|---------|---------------|---------|----------------|------|
| **Session Management** | No (third-party apps) | No (third-party apps) | No | Native handoff/resume |
| **Milestone Tracking** | Yes (full-featured) | Yes (with goals) | Basic | Yes (milestone + phase hierarchy) |
| **Pre-Planning** | Issue templates only | Custom fields only | Issues/Wiki | Native discuss/discover/assumptions commands |
| **Research Integration** | No | AI research features | No | Native research with subagent parallelization |
| **Quality Verification** | QA workflows | Manual checklists | CI/CD integration | Native verify with user-guided UAT |
| **Configuration** | Extensive | Extensive | Minimal (actions) | Simple config with integrations |

**PAUL Differentiator:**
- Native session continuity (not a plugin)
- Research-first architecture (decision-making built into workflow)
- CLI-first design for developers
- Lightweight, human-readable markdown storage
- Structured loop enforcement (PLAN→APPLY→UNIFY)

## Phase Implementation Recommendations

### Phase A: Session Management (pause, resume, status, handoff)
**Why first:** Session continuity is foundational for all other commands. Users must be able to pause and resume reliably.
**Dependencies:** Requires existing STATE.md structure (from v1.0)
**Complexity:** MEDIUM - Handoff file structure, state restoration logic
**Risk:** Low - Follows established "Handoff + Resume" pattern

### Phase B: Roadmap & Milestone Management (add-phase, remove-phase, milestone, complete-milestone)
**Why second:** Milestone/phase structure is the container for all planning work.
**Dependencies:** ROADMAP.md structure from v1.0, Session Management
**Complexity:** MEDIUM - Phase numbering, dependencies, archiving
**Risk:** Low - Standard project management patterns

### Phase C: Pre-Planning (discuss, discover, assumptions, consider-issues)
**Why third:** Pre-planning improves plan quality and reduces rework.
**Dependencies:** Roadmap/Milestone structure
**Complexity:** HIGH - Discovery has 3 depth levels, assumption validation logic
**Risk:** MEDIUM - Discovery depth can be misused (too much or too little research)

### Phase D: Research (research, research-phase)
**Why fourth:** Research supports pre-planning and discovery.
**Dependencies:** Pre-planning workflows (to feed into)
**Complexity:** HIGH - Subagent orchestration, parallel research, consolidation
**Risk:** HIGH - Subagent orchestration is complex, token efficiency concerns

### Phase E: Quality (verify, plan-fix)
**Why fifth:** Quality is critical for loop closure.
**Dependencies:** Completed plans with SUMMARY.md
**Complexity:** MEDIUM - User-guided testing, issue capture, plan modification
**Risk:** MEDIUM - User compliance with manual testing

### Phase F: Configuration (config, flows, map-codebase)
**Why last:** Configuration is nice-to-have for core workflow.
**Dependencies:** None (standalone)
**Complexity:** LOW-MEDIUM - Config is simple, map-codebase is high effort
**Risk:** Low - Low risk if deferred

## Sources

**Session Management:**
- AKF Partners - "Agentic Pattern: Handoff + Resume" (https://akfpartners.com/growth-blog/agentic-pattern-handoff-resume) - HIGH confidence, 2025
- LobeHub Skills Marketplace - session-handoff skill documentation (https://lobehub.com/skills/itsar-vr-goatedskills-session-handoff) - MEDIUM confidence, 2026
- GitHub Issue #11455 - Claude Code session handoff feature request (https://github.com/anthropics/claude-code/issues/11455) - MEDIUM confidence, 2025

**Milestone Management:**
- Atlassian - "What are project milestones: benefits and examples" (https://www.atlassian.com/blog/project-management/project-milestones) - HIGH confidence, 2023
- ClickUp - "10 Best Project Milestone Tracking Software in 2026" (https://clickup.com/blog/milestone-tracking-software/) - MEDIUM confidence, 2025

**Pre-Planning:**
- Acropolium - "Discovery Phase in Software Development: Benefits, Steps, and Team Members" (https://acropolium.com/blog/discovery-phase-in-software-development-benefits-steps-and-team-members/) - HIGH confidence, 2024

**Quality Verification:**
- VirtuosoQA - "Software QA Process - 7 Stages, Best Practices, & Examples" (https://www.virtuosoqa.com/post/software-qa-process) - MEDIUM confidence, date unknown
- Monday.com - "Software Quality Assurance Best Practices: The 2026 Guide" (https://monday.com/blog/rnd/software-quality-assurance/) - MEDIUM confidence, 2025
- Reddit r/QualityAssurance - JIRA QA workflow discussion (https://www.reddit.com/r/QualityAssurance/comments/ixlry1/jira_qa_workflow/) - LOW confidence, 2020

**Existing PAUL Patterns:**
- OpenPAUL source code - Command and workflow implementations (/Users/kris/Repos/openpaul/src/commands/, /Users/kris/Repos/openpaul/src/workflows/) - HIGH confidence, internal
- OpenPAUL templates (/Users/kris/Repos/openpaul/src/templates/) - HIGH confidence, internal

---

*Feature research for: OpenPAUL - Remaining 20 Commands*
*Researched: 2026-03-05*
*Confidence: HIGH (based on external research + internal pattern analysis)*
