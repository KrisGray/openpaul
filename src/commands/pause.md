---
name: paul:pause
description: Create handoff file and prepare for session break
argument-hint: [reason]
allowed-tools: [Read, Write, Bash]
---

<objective>
Create a HANDOFF.md file capturing current context and update STATE.md for session continuity.

**When to use:** Before ending a session, switching context, or when context limit is approaching.
</objective>

<execution_context>
</execution_context>

<context>
@.paul/STATE.md
@.paul/PROJECT.md
@src/templates/HANDOFF.md
</context>

<process>

<step name="gather_state">
Read current state:
1. `.paul/STATE.md` - Current position, loop state
2. `.paul/PROJECT.md` - Project name, core value
3. Current PLAN.md if exists - What's being worked on
4. `.paul/ROADMAP.md` - Phase context
</step>

<step name="summarize_session">
Build session summary:
1. **What was done** - List accomplishments from this session
2. **What's in progress** - Partially complete work
3. **What's next** - Clear next action
4. **Key decisions** - Any significant choices made
</step>

<step name="create_handoff">
Create HANDOFF.md from template:

```bash
# Generate filename with timestamp
TIMESTAMP=$(date +%Y-%m-%d)
HANDOFF_FILE=".paul/HANDOFF-${TIMESTAMP}.md"
```

Fill template variables:
- `{{timestamp}}` - Current date/time
- `{{session_id}}` - Optional identifier
- `{{status}}` - Session ending status
- Loop markers from STATE.md
- Accomplished/in-progress from session summary
</step>

<step name="update_state">
Update `.paul/STATE.md` Session Continuity section:

```markdown
## Session Continuity

Last session: [timestamp]
Stopped at: [what was happening]
Next action: [clear directive]
Resume file: .paul/HANDOFF-[date].md
Resume context:
- [bullet 1]
- [bullet 2]
- [bullet 3]
```
</step>

<step name="confirm_handoff">
Display confirmation:

```
════════════════════════════════════════
PAUL SESSION PAUSED
════════════════════════════════════════

Handoff created: .paul/HANDOFF-[date].md

Current State:
  Phase: [N] of [M]
  Plan: [status]
  Loop: [position]

To resume later:
  /paul:resume

Or share handoff file with another session.
════════════════════════════════════════
```
</step>

</process>

<success_criteria>
- [ ] HANDOFF.md created with complete context
- [ ] STATE.md updated with session continuity
- [ ] Next action is clear and actionable
- [ ] Resume instructions provided
</success_criteria>

---

## GSD Parity Documentation

### Source Reference
- **GSD File:** N/A - PAUL Innovation

### PAUL Innovation
This command is a **PAUL-native feature**. GSD does not have explicit session handoff:
- GSD relies on STATE.md alone for continuity
- PAUL creates explicit handoff files for zero-context sessions
- Designed for context window limits and multi-session work

### Design Philosophy
- **Explicit over implicit:** Don't assume next session has context
- **Self-contained:** Handoff file is complete entry point
- **Loop-aware:** Preserves PLAN/APPLY/UNIFY position
