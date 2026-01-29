---
name: paul:add-phase
description: Add a new phase to current milestone
argument-hint: "[phase-name]"
allowed-tools: [Read, Write, Edit, Bash]
---

<objective>
Add a new phase to the current milestone's roadmap.

**When to use:** Scope expansion during milestone, adding planned work.
</objective>

<execution_context>
@~/.claude/paul-framework/workflows/roadmap-management.md
</execution_context>

<context>
$ARGUMENTS

@.paul/PROJECT.md
@.paul/STATE.md
@.paul/ROADMAP.md
</context>

<process>
Follow workflow: @~/.claude/paul-framework/workflows/roadmap-management.md

Execute: **add-phase** operation
</process>

<success_criteria>
- [ ] Phase added to ROADMAP.md
- [ ] Phase directory created
- [ ] STATE.md updated with new phase
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** `commands/gsd/add-phase.md`

### Adapted from GSD
- Thin wrapper pattern (command delegates to workflow)
- YAML frontmatter structure
- Optional phase name argument
- @-reference pattern (execution_context for static, context for dynamic)
- Workflow delegation via `Follow workflow:` instruction

### PAUL Adaptations
- **Unified workflow:** Uses roadmap-management.md with operation specifier
- **Milestone-aware:** Adds phase to current active milestone
- **Directory creation:** Creates `.paul/phases/{phase}/` structure
