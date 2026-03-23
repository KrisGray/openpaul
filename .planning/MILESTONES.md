# Milestones

## v1.4.0 CLI Installer (Shipped: 2026-03-23)

**Phases completed:** 3 phases, 9 plans

**Key accomplishments:**
- CLI installer with `npx openpaul` entry point and commander integration
- Interactive scaffolding with @inquirer/prompts, project name validation, overwrite protection
- Template presets (minimal/full) with .opencode/ directory generation
- Verbosity flags (-v/-vv) with colored output via picocolors

---

## v1.2 CI/CD Pipeline (Shipped: 2026-03-17)

**Phases completed:** 5 phases, 6 plans

**Key accomplishments:**
- GitHub Actions CI workflow with test coverage artifacts
- Docker-based E2E testing with retry logic and failure artifacts
- Codecov integration with dual-workflow verification
- Automated npm publishing with OIDC trusted publishing and provenance

---

## v1.1 Full Command Implementation (Shipped: 2026-03-13)

**Phases completed:** 7 phases, 71 plans

**Key accomplishments:**
- Session Management: pause, resume, handoff, status commands
- Roadmap Management: add-phase, remove-phase commands
- Milestone Management: milestone, complete-milestone, discuss-milestone commands
- Pre-Planning: discuss, assumptions, discover, consider-issues commands
- Research: research, research-phase commands
- Quality: verify, plan-fix commands
- Configuration: flows, config, map-codebase commands
- Full OpenPAUL branding migration (paul → openpaul)
- Dual-path storage resolution (.openpaul/ primary, .paul/ fallback)

---

## v1.0 MVP (Shipped: 2026-03-05)

**Phases completed:** 2 phases, 23 plans

**Key accomplishments:**
- Core loop infrastructure: init, plan, apply, unify commands
- State management with STATE.md
- ROADMAP.md template and parsing
- Loop enforcement with mandatory reconciliation

---
