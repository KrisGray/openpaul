---
name: openpaul:init
description: Initialize OpenPAUL in a project with conversational setup
argument-hint:
allowed-tools: [Read, Write, Bash, Glob, AskUserQuestion]
---

<objective>
Initialize the `.openpaul/` structure in a project directory through conversational setup.

**When to use:** Starting a new project with OpenPAUL, or adding OpenPAUL to an existing codebase.

Creates PROJECT.md, STATE.md, and ROADMAP.md populated from conversation - user does not manually edit templates.
</objective>

<execution_context>
@~/.claude/openpaul-framework/workflows/init-project.md
@~/.claude/openpaul-framework/templates/PROJECT.md
@~/.claude/openpaul-framework/templates/STATE.md
@~/.claude/openpaul-framework/templates/ROADMAP.md
</execution_context>

<context>
Current directory state (check for existing .openpaul/)
</context>

<process>
**Follow workflow: @~/.claude/openpaul-framework/workflows/init-project.md**

The workflow implements conversational setup:

1. Check for existing .openpaul/ (route to resume if exists)
2. Create directory structure
3. Ask: "What's the core value this project delivers?"
4. Ask: "What are you building?"
5. Confirm project name (infer from directory)
6. Populate PROJECT.md, ROADMAP.md, STATE.md from answers
7. Display ONE next action: `/openpaul:plan`

**Key behaviors:**
- Ask ONE question at a time
- Wait for response before next question
- Populate files from answers (user doesn't edit templates)
- End with exactly ONE next action
- Build momentum into planning phase
</process>

<success_criteria>
- [ ] .openpaul/ directory created
- [ ] PROJECT.md populated with core value and description from conversation
- [ ] STATE.md initialized with correct loop position
- [ ] ROADMAP.md initialized (phases TBD until planning)
- [ ] User presented with ONE clear next action
</success_criteria>
