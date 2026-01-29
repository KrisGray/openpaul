---
name: paul:complete-milestone
description: Mark current milestone as complete
argument-hint: "[version]"
allowed-tools: [Read, Write, Edit, Bash, Glob]
---

<objective>
Complete the current milestone, archive it, and evolve PROJECT.md.

**When to use:** All phases in current milestone are complete and verified.
</objective>

<execution_context>
@~/.claude/paul-framework/workflows/complete-milestone.md
</execution_context>

<context>
$ARGUMENTS

@.paul/PROJECT.md
@.paul/STATE.md
@.paul/ROADMAP.md
@.paul/MILESTONES.md
</context>

<process>
Follow workflow: @~/.claude/paul-framework/workflows/complete-milestone.md
</process>

<success_criteria>
- [ ] Milestone archived with summary
- [ ] PROJECT.md evolved with learnings
- [ ] Git tag created for version
- [ ] STATE.md updated to reflect completion
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** `commands/gsd/complete-milestone.md`

### Adapted from GSD
- Thin wrapper pattern (command delegates to workflow)
- YAML frontmatter structure
- Optional version argument
- @-reference pattern (execution_context for static, context for dynamic)
- Workflow delegation via `Follow workflow:` instruction

### PAUL Adaptations
- **Archival structure:** Uses PAUL's milestone archive format
- **PROJECT evolution:** Captures key decisions and learnings
- **Git tagging:** Creates version tag for milestone boundary
