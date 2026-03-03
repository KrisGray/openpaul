# Codebase Structure

**Analysis Date:** 2026-03-03

## Directory Layout

```
openpaul/
├── bin/                    # CLI installer
│   └── install.js          # Main entry point
├── src/                    # Framework source (copied to user's Claude dir)
│   ├── commands/           # Slash command definitions (26 files)
│   ├── workflows/          # Execution workflows (22 files)
│   ├── templates/          # File templates (19 files)
│   │   └── codebase/       # Codebase analysis templates (7 files)
│   ├── references/         # Reference documentation (12 files)
│   ├── rules/              # Style/convention guidelines (5 files)
│   └── carl/               # CARL domain files (2 files)
├── .opencode/              # OpenCode integration
│   ├── agents/             # GSD agent definitions (12 agents)
│   ├── skills/             # Skill definitions
│   ├── commands/           # OpenCode commands
│   └── get-shit-done/      # GSD framework copy
├── .planning/              # Planning output directory
│   └── codebase/           # Codebase analysis output
├── assets/                 # Static assets (terminal.svg)
├── package.json            # npm package definition
├── README.md               # Documentation
├── LICENSE                 # MIT license
└── PAUL-VS-GSD.md          # Framework comparison doc
```

## Directory Purposes

**bin/:**
- Purpose: CLI entry point
- Contains: `install.js` (210 lines)
- Key files: `bin/install.js`

**src/commands/:**
- Purpose: Slash command definitions for Claude Code
- Contains: 26 markdown files with YAML frontmatter
- Key files: `init.md`, `plan.md`, `apply.md`, `unify.md`, `help.md`, `progress.md`
- Naming: lowercase, hyphenated (e.g., `plan-phase.md`, `complete-milestone.md`)

**src/workflows/:**
- Purpose: Detailed step-by-step execution instructions
- Contains: 22 markdown files with `<step>` elements
- Key files: `plan-phase.md`, `apply-phase.md`, `unify-phase.md`, `init-project.md`
- Naming: kebab-case, phase-focused (e.g., `create-milestone.md`, `quality-gate.md`)

**src/templates/:**
- Purpose: File structure definitions for project artifacts
- Contains: 19 files including codebase analysis templates
- Key files: `PLAN.md`, `STATE.md`, `ROADMAP.md`, `PROJECT.md`, `SUMMARY.md`
- Subdirectory: `codebase/` contains STACK.md, ARCHITECTURE.md, etc. templates

**src/references/:**
- Purpose: Reference documentation for concepts
- Contains: 12 markdown files explaining PAUL concepts
- Key files: `plan-format.md`, `checkpoints.md`, `tdd.md`, `git-strategy.md`

**src/rules/:**
- Purpose: Style and convention guidelines
- Contains: 5 markdown files
- Key files: `commands.md`, `workflows.md`, `templates.md`, `references.md`, `style.md`

**src/carl/:**
- Purpose: CARL domain definition for dynamic rule injection
- Contains: 2 files
- Key files: `PAUL` (domain rules), `PAUL.manifest` (installation manifest)

**.opencode/:**
- Purpose: OpenCode/GSD integration layer
- Contains: Agent definitions, skills, commands, GSD framework
- Key files: `agents/gsd-*.md` (12 agent definitions)
- Not packaged: This stays in repo, not installed to user systems

**.planning/:**
- Purpose: Output directory for analysis and planning
- Contains: Generated codebase analysis documents
- Key files: `codebase/ARCHITECTURE.md`, `codebase/STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `bin/install.js`: CLI installer (npm bin target)
- `src/commands/*.md`: Slash commands loaded by Claude Code

**Configuration:**
- `package.json`: npm package config (name, version, bin, files)
- `src/carl/PAUL`: CARL domain rules (14 rules)
- `src/carl/PAUL.manifest`: CARL installation manifest

**Core Logic:**
- `src/commands/`: Command contracts and process flows
- `src/workflows/`: Detailed execution steps
- `src/templates/`: File format definitions

**Documentation:**
- `README.md`: Main documentation (473 lines)
- `PAUL-VS-GSD.md`: Framework comparison
- `src/references/`: Concept documentation

**Testing:**
- Not applicable - no test files detected
- Framework is prompt-based, tested via usage

## Naming Conventions

**Files:**
- Commands: `lowercase.md` (e.g., `init.md`, `plan.md`, `apply.md`)
- Multi-word: `kebab-case.md` (e.g., `plan-phase.md`, `complete-milestone.md`)
- Templates: `UPPERCASE.md` (e.g., `PLAN.md`, `STATE.md`, `ROADMAP.md`)

**Directories:**
- Lowercase, hyphenated (e.g., `get-shit-done/`, `codebase/`)

**Frontmatter Fields:**
- kebab-case: `name`, `description`, `argument-hint`, `allowed-tools`

**XML Sections:**
- snake_case: `<objective>`, `<execution_context>`, `<success_criteria>`
- Step names: snake_case with name attribute

## Where to Add New Code

**New Command:**
- Command file: `src/commands/{command-name}.md`
- Workflow file: `src/workflows/{command-name}.md` (if complex)
- Update: `src/commands/help.md` to document new command

**New Workflow:**
- Implementation: `src/workflows/{workflow-name}.md`
- Reference from command: Add `@~/.claude/paul-framework/workflows/{name}.md`

**New Template:**
- Implementation: `src/templates/{TEMPLATE-NAME}.md`
- Reference from workflow: Add `@~/.claude/paul-framework/templates/{name}.md`

**New Reference Doc:**
- Implementation: `src/references/{topic}.md`
- Reference from workflow/command as needed

**New CARL Rule:**
- Add to: `src/carl/PAUL`
- Format: `PAUL_RULE_N=[rule content]`

**New Agent (OpenCode):**
- Implementation: `.opencode/agents/gsd-{agent-name}.md`

## Installation Output Structure

When users run `npx paul-framework --global`:

```
~/.claude/
├── commands/
│   └── paul/              # Copy of src/commands/
│       ├── init.md
│       ├── plan.md
│       ├── apply.md
│       └── ... (26 files)
└── paul-framework/        # Copy of src/{templates,workflows,references,rules}
    ├── templates/
    │   ├── PLAN.md
    │   ├── STATE.md
    │   └── codebase/
    ├── workflows/
    │   ├── plan-phase.md
    │   ├── apply-phase.md
    │   └── ...
    ├── references/
    │   ├── checkpoints.md
    │   └── ...
    └── rules/
        ├── commands.md
        └── ...
```

## Project Structure (after /paul:init)

When users initialize PAUL in a project:

```
{project}/
└── .paul/
    ├── PROJECT.md         # Project context and requirements
    ├── ROADMAP.md         # Phase breakdown and milestones
    ├── STATE.md           # Loop position and session state
    ├── config.md          # Optional integrations
    ├── SPECIAL-FLOWS.md   # Optional skill requirements
    └── phases/
        ├── 01-foundation/
        │   ├── 01-01-PLAN.md
        │   └── 01-01-SUMMARY.md
        └── 02-features/
            ├── 02-01-PLAN.md
            └── 02-01-SUMMARY.md
```

## Special Directories

**.opencode/:**
- Purpose: OpenCode integration with GSD agents
- Generated: No (maintained manually)
- Committed: Yes
- Not installed: Excluded from npm package

**.planning/:**
- Purpose: Output for codebase analysis and planning
- Generated: Yes (by analysis commands)
- Committed: Yes (serves as documentation)
- Consumed by: `/gsd-plan-phase`, `/gsd-execute-phase`

**.gitignore:**
- Excludes: `node_modules/`, `.DS_Store`, `.env*`
- Note: `.env` files present (marked to ignore)

---

*Structure analysis: 2026-03-03*
