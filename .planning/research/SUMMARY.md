# Project Research Summary

**Project:** PAUL Full Command Implementation (v1.1)
**Domain:** Development workflow management tool (OpenCode plugin)
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

OpenPAUL v1.1 requires implementing 26 remaining commands across 7 command categories to complete the structured development workflow system. Research indicates this is a **file-based state management plugin** for OpenCode that follows the "Handoff + Resume" pattern with enforced workflow loops (PLAN→APPLY→UNIFY). The recommended approach extends the existing v1.0 architecture through **7 new manager classes** (SessionManager, RoadmapManager, MilestoneManager, PrePlanningManager, ResearchManager, QualityManager, ConfigManager) with **no new external dependencies**—leveraging TypeScript, Zod, Jest, and Node.js built-in modules already in the stack.

Key risks center on **state corruption during roadmap mutations** (add-phase/remove-phase creating orphaned plans or breaking dependencies), **milestone synchronization drift** across multiple phases, and **pre-planning artifact accumulation** without cleanup. Mitigation strategies include: dependency graph management before exposing roadmap commands, milestone state computed from phases (not stored separately), cleanup strategy for research artifacts, and configuration hierarchy with precedence rules (defaults < config < flows < map-codebase). All file operations use existing atomic-write pattern, and Zod schemas provide runtime validation for all new state types.

## Key Findings

### Recommended Stack

**Summary:** No new external dependencies required. Existing TypeScript + Zod + Jest stack with Node.js built-ins sufficient for all 26 commands. Primary additions are internal TypeScript types and FileManager extensions.

**Core technologies:**
- **TypeScript ^5.0.0:** Type safety, IDE support, Zod schema integration — already in stack, all patterns use TypeScript interfaces + Zod runtime validation
- **@opencode-ai/plugin ^1.2.0:** OpenCode plugin API, tool registration, Task tool for subagents — required for plugin development, provides tool() helper and hooks
- **Zod ^3.22.0:** Runtime validation, schema definitions — validates JSON state files on read/write, prevents corruption
- **Jest ^29.0.0:** Testing framework, test runner — TDD-friendly, TypeScript-native via ts-jest, configured with 80% coverage threshold
- **ES Modules (ES2020):** Module system, import/export — modern standard, better tree-shaking, native async support

**Node.js built-ins (no new packages):**
- **fs, path:** File operations, path construction — all commands read/write .paul/ directory files
- **crypto.randomUUID():** Session ID generation — built-in since Node.js 16.7.0
- **Date.now():** Timestamps, file naming — no dependency needed

### Expected Features

**Summary:** 26 commands across 7 categories. MVP (v1.1) includes 15 core commands; 4 deferred to v1.2; 2 deferred to v2+.

**Must have (table stakes) — 15 commands:**
- **pause, resume, status** — session continuity for multi-session workflows (MEDIUM complexity)
- **add-phase, remove-phase** — basic roadmap manipulation for project evolution (MEDIUM complexity)
- **milestone, complete-milestone** — milestone lifecycle tracking (MEDIUM complexity)
- **discuss, discover** — pre-planning to reduce risk and improve plan quality (MEDIUM-HIGH complexity)
- **research, research-phase** — research capabilities for informed development (HIGH complexity)
- **verify, plan-fix** — quality verification and loop closure (MEDIUM complexity)

**Should have (differentiators) — 4 commands (v1.2):**
- **handoff** — explicit handoff for team collaboration (MEDIUM complexity)
- **discuss-milestone** — milestone discussion before creation improves alignment (MEDIUM complexity)
- **assumptions** — assumption tracking reduces risk but may feel bureaucratic (MEDIUM complexity)
- **consider-issues** — proactive issue identification (MEDIUM complexity)

**Defer (v2+):**
- **flows** — specialized flows are power features with niche use cases (LOW complexity)
- **map-codebase** — codebase mapping valuable but time-consuming (HIGH complexity)

**Key differentiators:**
- **Loop-aware pause/resume** — capture exact loop position (PLAN/APPLY/UNIFY) and enforce on resume
- **Discovery depth levels** — Quick (2-5min), Standard (15-30min), Deep (1+hr) adapts effort to risk/complexity
- **Research-phase parallel subagents** — identify and research unknowns automatically (max 3 for token efficiency)
- **Assumption validation tracking** — explicit assumption management with validation status
- **Handoff-first architecture** — HANDOFF.md as primary state transfer mechanism

### Architecture Approach

**Summary:** Extended architecture with 7 manager classes, FileManager extensions, and consistent patterns matching v1.0. No breaking changes to existing commands.

**Major components:**
1. **SessionManager** — track session state for pause/resume/handoff operations, save/restore session-state.json, handle handoff context transfer
2. **RoadmapManager** — parse and update ROADMAP.md (markdown, not JSON), add/remove phases, update milestone status, track phase completion
3. **MilestoneManager** — track milestone progress and completion, archive completed milestones, manage milestone context handoffs
4. **PrePlanningManager** — manage pre-planning artifacts (CONTEXT.md, ASSUMPTIONS.md, DISCOVERY.md, ISSUES.md) for phase-level planning
5. **ResearchManager** — coordinate research via subagents, save findings to RESEARCH.md, link research to plans
6. **QualityManager** — record verification results, create fix plans for failed verifications, track issue resolution
7. **ConfigManager** — manage plugin configuration, flow definitions, codebase mappings

**Key architectural patterns:**
- **Manager Pattern** — business logic separation from command execution, testable independently
- **Context Handoff Pattern** — temporary files for context transfer between commands (survives session clears)
- **State Validation Pattern** — validate state transitions before executing operations
- **Markdown Preservation Pattern** — parse and update markdown while preserving formatting (ROADMAP.md)
- **Atomic Multi-File Updates** — update multiple files atomically with rollback on failure

**Project structure:**
```
src/
├── commands/{category}/    # 26 new command files grouped by domain
├── managers/                # 7 new manager classes
├── storage/roadmap-parser.ts # specialized markdown parser
├── types/                   # new type definitions with Zod schemas
└── tests/                   # 26 new command tests + 7 manager tests
```

### Critical Pitfalls

**Top 5 most critical:**

1. **Phase Number Collisions During add-phase** — user adds phase 5 when phase 5 already exists, creating orphaned plans and state files. Avoid by validating uniqueness, offering append/insert modes, atomic multi-file updates, and gap detection.

2. **Orphaned Plans and State During remove-phase** — removing phase 3 leaves orphaned plan files and state, breaks dependencies. Avoid by dependency graph traversal, cascade delete with confirmation, orphan detection, and atomic cleanup.

3. **Phase Dependency Chain Corruption** — add/remove-phase breaks dependency chain defined in ROADMAP.md. Avoid by parsing ROADMAP.md into dependency graph, validating integrity, cascade updates on mutations, and graph validation command.

4. **Milestone State Desynchronization** — milestone marked "complete" but referenced phases still incomplete. Avoid by calculating milestone progress dynamically (view, not state), complete-milestone validates all phases done, milestone as computed view.

5. **Pre-Planning Artifacts Accumulate Without Cleanup** — discuss/assumptions/discover/consider-issues create research files that grow indefinitely. Avoid by retention policy (auto-archive after phase completes), per-phase directories, archive command, size warnings, link research to phase.

**Additional high-risk areas:**
- **Multiple Active Milestones** — enforce single active milestone constraint
- **Research Redundancy and Duplication** — clear command boundaries, deduplication on write
- **Verification State Not Persisted** — save results to .paul/verification.json for history
- **plan-fix Creates Infinite Loop** — root cause analysis, retry limit (3 attempts), history tracking
- **Configuration Hierarchy Ambiguity** — document precedence, merged config view, override warnings
- **map-codebase Performance Degradation** — incremental mapping, exclude patterns, progress feedback, caching

## Implications for Roadmap

Based on research, suggested phase structure for v1.1 implementation:

### Phase 1: Session Management (pause, resume, status)
**Rationale:** Session continuity is foundational for all other commands. Users must be able to pause and resume reliably before any complex workflow features are useful.

**Delivers:** SessionManager, session-state.json, handoff JSON files, pause/resume/handoff/status commands

**Addresses:** Table stakes features (pause, resume, status) from FEATURES.md

**Avoids:** Pitfalls #12-#18 (session-specific: serialization blind spots, orphaned files, incomplete context capture, handoff drift, race conditions)

**Features from FEATURES.md:** Session Management (pause, resume, status)

**Stack elements from STACK.md:** SessionManager, SessionState Zod schema, FileManager session methods, atomic writes

**Architecture component:** SessionManager

### Phase 2: Roadmap Management (add-phase, remove-phase)
**Rationale:** Roadmap/phase structure is the container for all planning work. Must build dependency graph infrastructure BEFORE exposing mutation commands to users.

**Delivers:** RoadmapManager, RoadmapParser, ROADMAP.md parsing/updating, add-phase, remove-phase commands

**Uses:** FileManager extensions, Zod schemas, atomic multi-file updates

**Implements:** RoadmapManager, MilestoneManager (basic)

**Addresses:** Table stakes features (add-phase, remove-phase) from FEATURES.md

**Avoids:** Pitfalls #1-#3 (phase number collisions, orphaned plans, dependency chain corruption)

**Research flag:** Requires `/gsd-research-phase` for dependency graph algorithms and ROADMAP.md markdown parsing edge cases. This is high-risk area with sparse dev-tool-specific documentation.

### Phase 3: Milestone Management (milestone, complete-milestone)
**Rationale:** Milestone tracking is core to PAUL's milestone-based approach. Requires completed roadmap management from Phase 2.

**Delivers:** MilestoneManager, milestone creation/completion commands, milestone progress tracking, milestone archiving

**Uses:** RoadmapManager (reads ROADMAP.md), PrePlanningManager (milestone context)

**Implements:** MilestoneManager milestone lifecycle

**Addresses:** Table stakes features (milestone, complete-milestone) from FEATURES.md

**Avoids:** Pitfalls #4-#5 (milestone desync, multiple active milestones)

**Research flag:** Milestone completion criteria validation requires research into project management best practices. Standard patterns available (Atlassian, ClickUp research HIGH confidence).

### Phase 4: Pre-Planning (discuss, discover)
**Rationale:** Pre-planning improves plan quality and reduces rework. Requires milestone structure from Phase 3.

**Delivers:** PrePlanningManager, discuss, discover commands, CONTEXT.md, DISCOVERY.md files, artifact cleanup strategy

**Uses:** FileManager pre-planning methods, Zod schemas for discussion/discovery

**Implements:** PrePlanningManager artifact management

**Addresses:** Table stakes features (discuss, discover) from FEATURES.md

**Avoids:** Pitfalls #6-#7 (artifact accumulation, research duplication)

**Research flag:** Discovery depth levels (Quick/Standard/Deep) require research into efficient research workflows. Acropolium research HIGH confidence on discovery phase benefits.

### Phase 5: Research (research, research-phase)
**Rationale:** Research supports pre-planning and discovery. Requires pre-planning workflows from Phase 4.

**Delivers:** ResearchManager, research, research-phase commands, parallel subagent spawning, RESEARCH.md files

**Uses:** OpenCode Task tool with subagent_type="Explore", FileManager research methods

**Implements:** ResearchManager subagent coordination

**Addresses:** Table stakes features (research, research-phase) from FEATURES.md

**Avoids:** Pitfall #7 (research duplication) via cross-referencing

**Research flag:** OpenCode API for subagent spawning with `run_in_background=true` requires verification. This is HIGH risk—may need adjustment based on actual API capabilities.

### Phase 6: Quality (verify, plan-fix)
**Rationale:** Quality is critical for loop closure. Requires completed plans with SUMMARY.md from earlier phases.

**Delivers:** QualityManager, verify, plan-fix commands, VERIFICATION.md, FIX-PLAN.md, verification history tracking

**Uses:** FileManager quality methods, Zod schemas for verification results

**Implements:** QualityManager verification tracking

**Addresses:** Table stakes features (verify, plan-fix) from FEATURES.md

**Avoids:** Pitfalls #8-#9 (verification not persisted, plan-fix infinite loop)

**Research flag:** Manual user acceptance testing workflow requires research into QA best practices. VirtuosoQA and Monday.com research MEDIUM-HIGH confidence.

### Phase 7: Configuration (config, flows)
**Rationale:** Configuration is nice-to-have for core workflow. Can be done after all core commands are stable.

**Delivers:** ConfigManager, config, flows commands, config.json, FLOWS.md, configuration hierarchy with precedence

**Uses:** FileManager config methods, Zod schemas for config

**Implements:** ConfigManager config management

**Addresses:** Should-have features (discuss-milestone, assumptions, consider-issues) from FEATURES.md

**Avoids:** Pitfall #10 (configuration hierarchy ambiguity)

**Research flag:** Configuration merge strategies well-documented (Webpack, ESLint patterns MEDIUM confidence). Skip `/gsd-research-phase`—standard patterns apply.

### Phase 8: Codebase Mapping (map-codebase)
**Rationale:** Codebase mapping is valuable but time-consuming. Non-critical for core workflow. Deferrable if time-constrained.

**Delivers:** map-codebase command, 7 codebase mapping documents (STACK, ARCHITECTURE, STRUCTURE, CONVENTIONS, TESTING, INTEGRATIONS, CONCERNS), incremental mapping, progress feedback

**Uses:** FileManager codebase map methods, file system scanning with exclude patterns, caching

**Implements:** ConfigManager codebase mapping

**Addresses:** Deferred feature (map-codebase) from FEATURES.md

**Avoids:** Pitfall #11 (performance degradation) via incremental mapping, progress indicators, size limits

**Research flag:** Large codebase scanning optimization requires research into incremental indexing patterns. Sourcegraph/GitHub Code Search patterns MEDIUM confidence.

### Phase Ordering Rationale

- **Phase 1 first:** Session commands depend only on existing v1.0 STATE.md. All other phases depend on session continuity working correctly.
- **Phase 2 before Phase 3:** Roadmap provides the milestone/phase structure container. Can't manage milestones without roadmap parsing working.
- **Phase 3 before Phase 4:** Milestones provide scope for pre-planning. Pre-planning commands need milestone context.
- **Phase 4 before Phase 5:** Pre-planning produces research needs. Research-phase depends on pre-planning workflows.
- **Phase 5 before Phase 6:** Research informs plan quality. Verify/plan-fix need completed plans (which may include research findings).
- **Phase 6 before Phase 7:** Quality verification core workflow. Configuration is enhancement, not foundation.
- **Phase 7 before Phase 8:** Configuration setup enables custom flows. Codebase mapping is a specialized flow.
- **Phase 8 last:** Codebase mapping is non-critical and high-effort. Can be deferred if needed.

**Grouping based on architecture patterns:**
- **Session Management (Phase 1):** Single manager, self-contained patterns
- **Roadmap + Milestone (Phases 2-3):** Shared RoadmapManager, dependency on ROADMAP.md parsing
- **Pre-Planning + Research (Phases 4-5):** Shared artifact management, both create research files
- **Quality + Configuration (Phases 6-8):** Quality uses verification results, Configuration manages everything

**How this avoids pitfalls:**
- **Dependency graph in Phase 2** prevents pitfalls #1-#3 (phase number collisions, orphaned plans, dependency corruption)
- **Cleanup strategy in Phase 4** prevents pitfalls #6-#7 (artifact accumulation, research duplication)
- **Verification persistence in Phase 6** prevents pitfalls #8-#9 (verification not persisted, plan-fix infinite loop)
- **Configuration hierarchy in Phase 7** prevents pitfall #10 (config ambiguity)
- **Incremental mapping in Phase 8** prevents pitfall #11 (map-codebase performance)

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 2 (Roadmap Management):** Dependency graph algorithms and ROADMAP.md markdown parsing edge cases. High-risk area with sparse dev-tool-specific documentation. Research graph theory basics, DAG validation, cascading delete patterns.

- **Phase 5 (Research):** OpenCode API for subagent spawning with `run_in_background=true` and `subagent_type="Explore"`. Requires verification of actual API capabilities. High risk—may need adjustment based on actual API. Research OpenCode Plugin API documentation thoroughly.

- **Phase 6 (Quality):** Manual user acceptance testing workflow and verification criteria definition. Need to research QA best practices for CLI tools. Research VirtuosoQA and Monday.com patterns more deeply.

- **Phase 8 (Codebase Mapping):** Large codebase scanning optimization and incremental indexing patterns. Map-codebase must handle 10k+ files within 30 seconds. Research Sourcegraph/GitHub Code Search patterns, file watching, incremental indexing.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Session Management):** Well-documented patterns from AKF Partners (Handoff + Resume), existing OpenPAUL v1.0 session code. HIGH confidence from existing implementation.

- **Phase 3 (Milestone Management):** Standard project management milestone tracking patterns. Atlassian and ClickUp research HIGH confidence. No niche implementation details.

- **Phase 4 (Pre-Planning):** Discovery phase patterns well-documented by Acropolium. Discussion/assumption management follows standard knowledge management patterns. HIGH confidence.

- **Phase 7 (Configuration):** Configuration merge strategies well-documented (Webpack config merging, ESLint config composition). MEDIUM confidence from multiple sources. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies already in stack, no new dependencies needed. Node.js built-ins well-documented. |
| Features | HIGH | 20 commands have clear definitions from workflow specifications. Differentiators well-researched against competitors (Atlassian, ClickUp, GitHub Projects). |
| Architecture | HIGH | Manager pattern consistent with v1.0 architecture. FileManager extensions clearly scoped. 7 managers with well-defined responsibilities. |
| Pitfalls | MEDIUM-HIGH | 18 detailed pitfalls with specific prevention strategies. Web research + domain expertise. Some high-risk areas (subagent spawning, ROADMAP.md parsing) require API verification. |

**Overall confidence:** HIGH (stack, features, architecture) + MEDIUM-HIGH (pitfalls due to API verification needs) = HIGH

### Gaps to Address

**Gaps requiring validation during implementation:**

- **OpenCode subagent API:** ResearchManager depends on OpenCode's `Task` tool with `subagent_type="Explore"` and `run_in_background=true`. Requires testing to verify actual API capabilities. If not supported, need fallback strategy (manual subagent orchestration or sequential research).

- **ROADMAP.md markdown parsing edge cases:** RoadmapParser must handle user-edited ROADMAP.md files while preserving formatting. Real-world ROADMAP.md files may have formatting variations, comments, or unexpected structures. Test with diverse ROADMAP.md samples during Phase 2.

- **Milestone completion criteria:** Validation rules for "all phases complete" need clarification. What constitutes "complete"? All plans done? All plans verified? All verification passed? Define during Phase 3 planning.

- **Verification criteria schema:** What constitutes a "pass" in verify command? Must define acceptance criteria format, automated checks, manual checks. User-provided examples or industry standards needed.

- **Incremental mapping algorithm:** map-codebase requires detecting changed files since last map. Need robust change detection strategy (file timestamps, git status, checksums). Test on large codebases (10k+ files) during Phase 8.

**How to handle during planning/execution:**

- **OpenCode subagent API:** Phase 5 planning includes spike task to test subagent spawning. If API not supported, plan B: sequential research or manual task orchestration. Document fallback in phase plan.

- **ROADMAP.md parsing:** Phase 2 includes comprehensive test suite for ROADMAPParser with diverse samples. Document supported ROADMAP.md format. Provide migration guide for unsupported formats.

- **Milestone completion criteria:** Phase 3 planning defines completion criteria as configuration option (strict/standard/relaxed). Default to "all plans with SUMMARY.md marked complete". Allow per-milestone overrides.

- **Verification criteria schema:** Phase 6 planning defines VerificationCriteria interface with acceptance criteria array, automated checks (truths, artifacts), manual checks. Provide templates for common scenarios.

- **Incremental mapping:** Phase 8 planning includes performance testing task on large codebase. Test multiple change detection strategies. Document size limits and fallback to full scan if incremental fails.

## Sources

### Primary (HIGH confidence)
- **OpenPAUL Source Code (v1.0)** — Existing architecture, command patterns, FileManager, StateManager, atomic writes, type definitions
- **OpenCode Plugin API (@opencode-ai/plugin@1.2.16)** — Tool registration, Task tool for subagents, hooks system, plugin lifecycle
- **Node.js v22.14.0 Documentation** — Built-in modules (fs, path, crypto), crypto.randomUUID() availability, file operations
- **Zod v3.25.76 Documentation** — Schema validation, TypeScript integration, runtime type checking
- **TypeScript v5.9.3 Documentation** — Type system, interface definitions, compilation to ES modules
- **AKF Partners — "Agentic Pattern: Handoff + Resume"** — Session management patterns, state capture, context transfer
- **Atlassian — "What are project milestones: benefits and examples"** — Milestone tracking patterns, phase dependencies

### Secondary (MEDIUM confidence)
- **OpenPAUL Workflows** — Command specifications, template structures, file formats (ROADMAP.md, DISCOVERY.md, etc.)
- **Jest v29.7.0 Documentation** — Testing patterns, coverage configuration, ts-jest integration
- **Acropolium — "Discovery Phase in Software Development"** — Pre-planning benefits, discovery depth levels, risk reduction
- **ClickUp — "10 Best Project Milestone Tracking Software in 2026"** — Milestone management patterns, progress tracking
- **VirtuosoQA — "Software QA Process - 7 Stages, Best Practices"** — Verification workflows, acceptance testing
- **Monday.com — "Software Quality Assurance Best Practices"** — QA processes, verification criteria
- **Webpack config merging, ESLint config composition** — Configuration merge strategies, hierarchy patterns

### Tertiary (LOW confidence)
- **LobeHub Skills Marketplace** — Session-handoff skill documentation (derived from marketplace patterns)
- **GitHub Issue #11455** — Claude Code session handoff feature request (community discussion, not implementation)
- **Reddit r/QualityAssurance** — JIRA QA workflow discussion (anecdotal, not authoritative)
- **CLI Design Patterns** — Derived from command-line interface best practices (not dev-tool specific)
- **File-based State Management** — General patterns from stateless systems (not specific to PAUL workflow tools)
- **Sourcegraph/GitHub Code Search patterns** — Large codebase analysis patterns (inferred from tool behavior)

---

*Research completed: 2026-03-05*
*Ready for roadmap: yes*
*Next step: /gsd-roadmap to create implementation roadmap based on phase suggestions*
