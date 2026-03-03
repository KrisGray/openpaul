# Architecture

**Analysis Date:** 2026-03-03

## Pattern Overview

**Overall:** CLI Installation Framework with Prompt-Based Execution

**Key Characteristics:**
- Command-Workflow-Template separation (3-layer architecture)
- Markdown-based prompts executed by AI (Claude Code)
- Loop-driven development: PLAN → APPLY → UNIFY
- Installer pattern: Copies framework to Claude config directory

## Layers

**Command Layer:**
- Purpose: Defines slash commands and their contracts
- Location: `src/commands/`
- Contains: 26 markdown files defining `/paul:*` commands
- Depends on: Workflows, Templates
- Used by: Claude Code (after installation)
- Structure: YAML frontmatter + XML sections (objective, context, process, success_criteria)

**Workflow Layer:**
- Purpose: Detailed step-by-step execution instructions
- Location: `src/workflows/`
- Contains: 22 workflow files with granular process definitions
- Depends on: Templates, References
- Used by: Commands (via @-references)
- Structure: `<step>` elements with priority, validation, and output

**Template Layer:**
- Purpose: Defines file structures and formats for project artifacts
- Location: `src/templates/`
- Contains: 19 template files (PLAN.md, STATE.md, ROADMAP.md, etc.)
- Depends on: None (pure data definitions)
- Used by: Workflows for file creation
- Structure: Markdown with field descriptions and usage patterns

## Data Flow

**Installation Flow:**

1. User runs `npx paul-framework`
2. `bin/install.js` prompts for install location (global/local)
3. Framework copies `src/commands/` → `{claude-dir}/commands/paul/`
4. Framework copies `src/{templates,workflows,references,rules}/` → `{claude-dir}/paul-framework/`
5. Path replacement: `~/.claude/` references updated for install location

**Loop Execution Flow:**

1. `/paul:init` → Creates `.paul/` directory with PROJECT.md, STATE.md, ROADMAP.md
2. `/paul:plan` → Reads STATE.md, ROADMAP.md → Creates PLAN.md in phases directory
3. `/paul:apply` → Executes PLAN.md tasks sequentially → Updates files
4. `/paul:unify` → Creates SUMMARY.md → Updates STATE.md → Closes loop

**State Management:**
- STATE.md is the single source of truth
- Every command reads STATE.md first
- Every command updates STATE.md after execution
- Tracks: loop position, phase progress, decisions, blockers, session continuity

## Key Abstractions

**The Loop (PLAN-APPLY-UNIFY):**
- Purpose: Enforces structured development cycle
- Examples: `src/commands/plan.md`, `src/commands/apply.md`, `src/commands/unify.md`
- Pattern: Each phase has command file + workflow file + state transitions

**Acceptance Criteria:**
- Purpose: Define "done" before starting work
- Examples: `src/templates/PLAN.md` (AC-1, AC-2, AC-3 sections)
- Pattern: BDD Given/When/Then format, linked to task `<done>` criteria

**Task Definition:**
- Purpose: Atomic unit of execution
- Examples: `src/workflows/apply-phase.md` task handling
- Pattern: `<files>`, `<action>`, `<verify>`, `<done>` - all four required

**Checkpoint:**
- Purpose: Pause execution for human input
- Types: `checkpoint:decision`, `checkpoint:human-verify`, `checkpoint:human-action`
- Pattern: Blocking gates with resume signals

## Entry Points

**bin/install.js:**
- Location: `bin/install.js`
- Triggers: `npx paul-framework` or `npx paul-framework --global/--local`
- Responsibilities:
  - Parse CLI arguments
  - Prompt for install location
  - Copy framework files with path replacement
  - Report installation status

**Slash Commands (after install):**
- Location: `{claude-dir}/commands/paul/*.md`
- Triggers: `/paul:{command}` in Claude Code
- Responsibilities: Load workflow, read context, execute process

## Error Handling

**Strategy:** Fail-fast with explicit recovery options

**Patterns:**
- Validation gates at phase transitions (STATE.md consistency checks)
- Blocking checkpoints that require explicit user response
- Boundary protection (DO NOT CHANGE sections enforced)
- Deviation logging (plan vs actual recorded in STATE.md)
- Missing prerequisite handling (offer to create or direct to init)

## Cross-Cutting Concerns

**Logging:** STATE.md as session log + decision journal
**Validation:** Loop position verification, file existence checks, approval confirmation
**Authentication:** None (local CLI tool)
**State Persistence:** Markdown files in `.paul/` directory
**Context Management:** @-references load only needed context (avoid reflexive chaining)

## Module Communication

**Reference System:**
- Commands reference workflows: `@~/.claude/paul-framework/workflows/{name}.md`
- Workflows reference templates: `@~/.claude/paul-framework/templates/{name}.md`
- Workflows reference project files: `@.paul/STATE.md`, `@.paul/PROJECT.md`

**Path Replacement:**
- Source files use `~/.claude/` as placeholder
- Installer replaces with actual install path during copy

---

*Architecture analysis: 2026-03-03*
