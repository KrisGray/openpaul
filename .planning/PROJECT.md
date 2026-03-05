# OpenPAUL

## What This Is

OpenPAUL is a complete TypeScript rewrite of PAUL (Plan-Apply-Unify Loop) for the OpenCode platform. It provides structured AI-assisted development with enforced workflow discipline, bundling PAUL-specific rules for dynamic loading and using file-based JSON storage for project state management.

This is for OpenCode users who want structured AI-assisted development with enforced loop closure, explicit state management, and full type safety through TypeScript.

## Core Value

Enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation, ensuring every plan closes properly with full traceability and context preservation.

## Requirements

### Validated

- ✓ Core Loop Commands — v1.0 (All 6 core commands implemented: init, plan, apply, unify, progress, help)
- ✓ Core Infrastructure — v1.0 (All 6 infrastructure requirements implemented: TypeScript types, storage, state manager, loop enforcer, testing, model configuration)

### Active

- [ ] All 26 PAUL commands implemented in TypeScript
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

### Current State (After v1.0)

Shipped v1.0 with 19 plans, 38 requirements covered.
Tech stack: TypeScript, Jest, Zod, ES Modules.
Initial user testing showed good foundation for future features.

## Current Milestone: v1.1 Full Command Implementation

**Goal:** Implement all remaining PAUL commands for complete structured development workflow

**Target features:**
- Session Management (4): pause, resume, handoff, status
- Roadmap Management (2): add-phase, remove-phase
- Milestone Management (3): milestone, complete-milestone, discuss-milestone
- Pre-Planning (4): discuss, assumptions, discover, consider-issues
- Research (2): research, research-phase
- Quality (2): verify, plan-fix
- Configuration (3): config, flows, map-codebase

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Full TypeScript rewrite | Type safety, testability, modern tooling, better IDE support | ✓ Complete |
| Bundle PAUL rules in plugin | Single dependency, simpler installation, no separate CARL needed | ✓ Complete |
| TypeScript objects for templates | Type safety, validation, IDE support, no markdown parsing needed | ✓ Complete |
| File-based JSON storage | Simple, human-readable, version-controllable, no database overhead | ✓ Complete |
| Jest for all testing | Unified testing, TDD-friendly, TypeScript-native, better mocking | ✓ Complete |
| All 26 commands | Feature parity with original PAUL, complete structured development workflow | ⚠️ In Progress (v1.0 covers core commands) |
| CARL format for rules | Consistency with OpenCARL, familiar pattern, proven approach | ✓ Complete |
| No migration path | Clean break, no legacy baggage, simpler implementation | ✓ Complete |
| 8-week implementation | Comprehensive coverage, TDD approach, proper testing and documentation | ✓ Complete |

---
*Last updated: 2026-03-05 after v1.0 milestone*
