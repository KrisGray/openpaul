# PAUL Framework

**Plan-Apply-Unify Loop** — A structured AI-assisted development framework for Claude Code.

![Terminal](assets/terminal.svg)

## Philosophy

PAUL prioritizes **quality over speed-for-speed's-sake** and **in-session context efficiency**.

| Principle | Description |
|-----------|-------------|
| **Loop Integrity** | Every plan closes with UNIFY — mandatory closure, no orphan plans |
| **A.D.D.** | Acceptance-Driven Development: AC first, tasks reference AC-N, BDD format |
| **In-Session Context** | Minimize subagents for dev work; maximize in-session context quality |
| **CARL Symbiosis** | PAUL rules live in CARL domains, dynamically loaded by intent |
| **Modular Integrations** | Extensible architecture (SonarQube, future: linting, CI, etc.) |
| **Comprehensive** | A workflow for each dev situation — quality, not quantity trade-offs |

## Installation

```bash
npx paul-framework --global
```

Or install locally to a project:

```bash
npx paul-framework --local
```

## The Loop

Every unit of work follows this cycle:

```
┌─────────────────────────────────────┐
│  PLAN ──▶ APPLY ──▶ UNIFY          │
│                                     │
│  Define    Execute    Reconcile     │
│  work      tasks      & close       │
└─────────────────────────────────────┘
```

**Never skip UNIFY.** Every plan needs a summary.

## Quick Start

```bash
# 1. Initialize PAUL in your project
/paul:init

# 2. Create a plan
/paul:plan

# 3. Execute the plan (after approval)
/paul:apply .paul/phases/01-xxx/01-01-PLAN.md

# 4. Close the loop
/paul:unify .paul/phases/01-xxx/01-01-PLAN.md

# 5. Check your progress
/paul:status
```

## Commands

Run `/paul:help` for the complete command reference.

**Core Loop:**
- `/paul:init` — Initialize PAUL in a project
- `/paul:plan` — Create an executable plan
- `/paul:apply` — Execute an approved plan
- `/paul:unify` — Reconcile and close the loop
- `/paul:status` — Show current loop position
- `/paul:help` — Show command reference

## Project Structure

```
.paul/
├── PROJECT.md     # Project context
├── ROADMAP.md     # Phase breakdown
├── STATE.md       # Loop position & state
└── phases/
    └── 01-xxx/
        ├── 01-01-PLAN.md
        └── 01-01-SUMMARY.md
```

## Why PAUL?

**vs. ad-hoc AI coding:** PAUL adds structure without bureaucracy. You get traceability and quality gates while maintaining velocity.

**vs. GSD:** PAUL takes a different approach:
- **In-session context** over parallel subagents (subagents = ~70% quality for dev work)
- **Mandatory UNIFY** closes every loop (no orphan plans)
- **A.D.D.** elevates acceptance criteria to first-class citizens
- **CARL integration** for dynamic rule loading
- Same comprehensive coverage, different execution philosophy

**vs. traditional planning:** PAUL is designed for AI-assisted development. Plans are executable prompts, not documentation.

## Roadmap

See [ROADMAP.md](.paul/ROADMAP.md) for the version plan.

- **v0.1** — Core Loop (complete)
- **v0.2** — Session Continuity (complete)
- **v0.3** — Roadmap & Milestone Management (next)
- **v0.4** — Pre-Planning & Research
- **v1.0** — Production Release

## License

MIT

## Author

Chris Kahler — [Chris AI Systems](https://github.com/chriskahler)
