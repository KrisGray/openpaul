---
name: paul:remove-phase
description: Remove a future (not started) phase
argument-hint: "<phase-number-or-name>"
allowed-tools: [Read, Write, Edit, Bash]
---

<objective>
Remove a future phase from the roadmap and clean up its directory.

**When to use:** Scope reduction, removing phases that haven't started.
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

Execute: **remove-phase** operation
</process>

<success_criteria>
- [ ] Phase removed from ROADMAP.md
- [ ] Phase directory cleaned up (if empty)
- [ ] Subsequent phases renumbered
- [ ] STATE.md updated
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** `commands/gsd/remove-phase.md`

### Adapted from GSD
- Thin wrapper pattern (command delegates to workflow)
- YAML frontmatter structure
- Required phase identifier argument
- @-reference pattern (execution_context for static, context for dynamic)
- Workflow delegation via `Follow workflow:` instruction

### PAUL Adaptations
- **Unified workflow:** Uses roadmap-management.md with operation specifier
- **Safety checks:** Prevents removal of in-progress or completed phases
- **Renumbering:** Automatically adjusts subsequent phase numbers
