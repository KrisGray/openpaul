---
name: openpaul:plan
description: Enter PLAN phase for current or new plan
argument-hint: "[phase-plan]"
allowed-tools: [Read, Write, Glob, AskUserQuestion]
---

<objective>
Create or continue a PLAN for the specified phase.

**When to use:** Starting new work or resuming incomplete plan.
</objective>

<execution_context>
@~/.claude/openpaul-framework/workflows/plan-phase.md
@~/.claude/openpaul-framework/templates/PLAN.md
@~/.claude/openpaul-framework/references/plan-format.md
</execution_context>

<context>
$ARGUMENTS

@.openpaul/PROJECT.md
@.openpaul/STATE.md
@.openpaul/ROADMAP.md
</context>

<process>
Follow workflow: @~/.claude/openpaul-framework/workflows/plan-phase.md
</process>

<success_criteria>
- [ ] PLAN.md created in correct phase directory
- [ ] All acceptance criteria defined
- [ ] STATE.md updated with loop position
</success_criteria>
