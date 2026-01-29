---
name: paul:discuss-milestone
description: Explore and articulate next milestone vision
argument-hint: ""
allowed-tools: [Read, Write, AskUserQuestion]
---

<objective>
Facilitate vision discussion for the next milestone and create context handoff.

**When to use:** Before creating a new milestone, when scope needs exploration.
</objective>

<execution_context>
@~/.claude/paul-framework/workflows/discuss-milestone.md
</execution_context>

<context>
@.paul/PROJECT.md
@.paul/STATE.md
@.paul/ROADMAP.md
@.paul/MILESTONES.md
</context>

<process>
Follow workflow: @~/.claude/paul-framework/workflows/discuss-milestone.md
</process>

<success_criteria>
- [ ] MILESTONE-CONTEXT.md created with vision
- [ ] Key themes and goals articulated
- [ ] Ready for /paul:milestone command
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** `commands/gsd/discuss.md` (generalized discussion command)

### Adapted from GSD
- Thin wrapper pattern (command delegates to workflow)
- YAML frontmatter structure
- No arguments (interactive discussion)
- @-reference pattern (execution_context for static, context for dynamic)
- Workflow delegation via `Follow workflow:` instruction

### PAUL Adaptations
- **Milestone-focused:** Specialized for milestone vision discussions
- **Context handoff:** Creates MILESTONE-CONTEXT.md for downstream use
- **Interactive flow:** No arguments, relies on conversation
