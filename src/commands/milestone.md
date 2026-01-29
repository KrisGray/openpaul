---
name: paul:milestone
description: Create a new milestone in the project
argument-hint: "[milestone-name]"
allowed-tools: [Read, Write, Edit, Bash, Glob, AskUserQuestion]
---

<objective>
Create a new milestone with defined scope and phases.

**When to use:** Starting a new milestone cycle after completing the previous one.
</objective>

<execution_context>
@~/.claude/paul-framework/workflows/create-milestone.md
</execution_context>

<context>
$ARGUMENTS

@.paul/PROJECT.md
@.paul/STATE.md
@.paul/ROADMAP.md
</context>

<process>
Follow workflow: @~/.claude/paul-framework/workflows/create-milestone.md
</process>

<success_criteria>
- [ ] Milestone created in MILESTONES.md
- [ ] ROADMAP.md updated with milestone grouping
- [ ] STATE.md reflects new milestone
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** `commands/gsd/milestone.md`

### Adapted from GSD
- Thin wrapper pattern (command delegates to workflow)
- YAML frontmatter structure
- Optional argument for milestone name
- @-reference pattern (execution_context for static, context for dynamic)
- Workflow delegation via `Follow workflow:` instruction

### PAUL Adaptations
- **Directory structure:** References `.paul/` instead of `.planning/`
- **Simpler workflow:** Points to PAUL milestone workflow in `src/workflows/`
- **MILESTONES.md:** Uses PAUL's milestone tracking template
