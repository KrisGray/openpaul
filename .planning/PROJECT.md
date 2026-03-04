# OpenPAUL

## What This Is

OpenPAUL is a complete TypeScript rewrite of PAUL (Plan-Apply-Unify Loop) for the OpenCode platform. It provides structured AI-assisted development with enforced workflow discipline, bundling PAUL-specific rules for dynamic loading and using file-based JSON storage for project state management.

This is for OpenCode users who want structured AI-assisted development with enforced loop closure, explicit state management, and full type safety through TypeScript.

## Core Value

Enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation, ensuring every plan closes properly with full traceability and context preservation.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] TypeScript plugin for OpenCode with full type safety
- [ ] All 26 PAUL commands implemented in TypeScript
  - Core Loop (6): init, plan, apply, unify, progress, help
  - Session Management (4): pause, resume, handoff, status
  - Roadmap Management (2): add-phase, remove-phase
  - Milestone Management (3): milestone, complete-milestone, discuss-milestone
  - Pre-Planning (4): discuss, assumptions, discover, consider-issues
  - Research (2): research, research-phase
  - Quality (2): verify. plan-fix
  - Configuration (3): flows. config. map-codebase
- [ ] PAUL-specific rules bundled and injected dynamically (like CARL domains)
- [ ] File-based JSON storage for project state (.paul/ directory structure)
- [ ] TypeScript object templates for PLAN, SUMMARY, STATE, ROADMAP, etc.
- [ ] Comprehensive Jest test coverage following TDD approach
- [ ] Full docstring documentation for all TypeScript functions
- [ ] npm package distribution (@krisgray/openpaul)

### Out of Scope

- Migration support from original PAUL markdown projects — Fresh start only, no backward compatibility needed
- Python components or pytest testing — Using TypeScript/Jest exclusively
- Database storage (SQLite, etc.) — File-based JSON only for simplicity
- Markdown template files — Using TypeScript objects instead for type safety
- Claude Code support — OpenCode only, no backward compatibility with Claude Code

## Context

### Original PAUL System

PAUL was originally built for Claude Code with these key characteristics:
- Markdown-based commands and templates
- CARL integration for PAUL-specific rules
- PLAN → APPLY → UNIFY loop with mandatory closure
- In-session context execution (minimizing subagents)
- Acceptance criteria as first-class citizens
- Explicit boundaries enforcement
- State management via STATE.md

### OpenCode Plugin Opportunity

OpenCode has a robust plugin system that provides:
- TypeScript support with strong typing
- Plugin API with hooks for events and custom tools
- Native fit for structured development workflows
- Better IDE support and testing through TypeScript

### Reference Implementation: OpenCARL

OpenCARL demonstrates the OpenCode plugin pattern:
- TypeScript plugin with hooks system
- Commands in `resources/commands/` directory
- Skills in `resources/skills/` directory
- Domain rules in `.carl-template/` directory
- npm distribution as `@krisgray/opencarl`
- Jest testing framework
- TypeScript compilation to `dist/plugin.js`

### OpenCode Plugin API

Based on OpenCode plugin documentation:
- Plugin entry point exports hooks object
- Custom tools via `tool()` helper
- Event hooks: session.created, session.compacted, tool.execute.before/after
- Context injection through hooks
- Zod schemas for validation

## Constraints

- **Platform:** OpenCode plugin system (not Claude Code) — Native integration with OpenCode's TypeScript plugin API
- **Language:** TypeScript exclusively (no Python components) — Full type safety, better tooling, maintainable codebase
- **Testing:** Jest framework with TDD approach — Tests first, 80%+ coverage target
- **Distribution:** npm package @krisgray/openpaul — Consistent with @krisgray/opencarl namespace
- **Storage:** File-based JSON (no databases) — Simple, human-readable, version-controllable
- **Compatibility:** Must integrate with OpenCode's plugin hooks system — Use @opencode-ai/plugin >=1.2.0

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full TypeScript rewrite | Type safety, testability, modern tooling, better IDE support | — Pending |
| Bundle PAUL rules in plugin | Single dependency, simpler installation, no separate CARL needed | — Pending |
| TypeScript objects for templates | Type safety, validation, IDE support, no markdown parsing needed | — Pending |
| File-based JSON storage | Simple, human-readable, version-controllable, no database overhead | — Pending |
| Jest for all testing | Unified testing, TDD-friendly, TypeScript-native, better mocking | — Pending |
| All 26 commands | Feature parity with original PAUL, complete structured development workflow | — Pending |
| CARL format for rules | Consistency with OpenCARL, familiar pattern, proven approach | — Pending |
| No migration path | Clean break, no legacy baggage, simpler implementation | — Pending |
| 8-week implementation | Comprehensive coverage, TDD approach, proper testing and documentation | — Pending |

---
*Last updated: 2025-03-04 after initialization*
