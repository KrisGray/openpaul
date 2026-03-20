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
- ✓ CI/CD Pipeline — v1.2 (GitHub Actions: test.yml, e2e-tests.yml, codecov.yml, publish.yml with OIDC trusted publishing)

### Active

- [ ] v2.0 features (to be defined)

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

### Current State (After v1.2)

Shipped v1.2 CI/CD Pipeline with 5 phases, 6 plans, 20 requirements covered.
Tech stack: TypeScript, Jest, Zod, ES Modules, GitHub Actions, Docker, Codecov.
CI/CD: Automated testing, E2E tests, coverage reporting, npm publishing with OIDC.

## Current Milestone: v1.4.0 CLI Installer

**Goal:** Add `npx openpaul` CLI installer for initializing OpenPAUL in projects

**Target features:**
- npx execution with help/version flags
- Scaffold `.openpaul/` directory structure
- Template presets (minimal/full)
- Interactive prompts with existing project detection

## Next Milestone: v2.0

**Goal:** Future enhancements based on user feedback

**Potential features:**
- Enhanced E2E test coverage
- Matrix testing for parallel CI
- Release automation (changelog generation)
- Branch protection rules

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
| Node.js 20.x LTS for CI | Single version simplicity, LTS stability | ✓ Complete — v1.2 |
| Docker Node 20-bookworm-slim | Consistency with CI workflow, slim image size | ✓ Complete — v1.2 |
| OIDC trusted publishing | No NPM_TOKEN secret, better security, passwordless | ✓ Complete — v1.2 |
| 30-minute max wait for gates | Balance thoroughness vs resource usage | ✓ Complete — v1.2 |
| Graceful timeout (exit 0) | Coverage is optional signal, not blocking requirement | ✓ Complete — v1.2 |

---
*Last updated: 2026-03-20 after v1.4.0 milestone started*
