# Phase 3: Session Management - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement session management commands: `/openpaul:pause`, `/openpaul:resume`, `/openpaul:status`, and `/openpaul:handoff`. Users can pause development sessions with context preservation, resume to exact PAUL loop position, view current status, and create handoffs for team collaboration.

</domain>

<decisions>
## Implementation Decisions

### Session state storage
- Store in `.openpaul/SESSIONS/` directory with dedicated session files
- Capture minimal data: current phase/plan position, work in progress, next steps
- Support single active session (current session only), pause replaces existing
- Identify current session via `.openpaul/CURRENT-SESSION` reference file

### Pause/resume behavior
- On pause: Prompt user if unsaved changes exist (save, discard, or abort)
- On resume: Show diff of changes since pause and prompt how to proceed
- Perform basic validation before resume: check session exists, files intact, state consistent
- Restore full working state: phase, plan, position markers to exact PAUL loop state

### Status output format
- Display essential info: current phase, active plan, PAUL loop position, progress %
- Visualize PAUL loop as diagram: `PLAN → APPLY → UNIFY` with current step highlighted
- Show plan progress with progress bar + count (e.g., "3/7 plans complete")
- Detect and warn about stale sessions: paused >24h or state changed since pause

### Handoff collaboration
- Include context + instructions: current state, work done, work in progress, next steps, resume instructions
- Format as standardized `HANDOFF.md` template with structured sections
- Save as shareable `.openpaul/HANDOFF.md` file for team collaboration
- Allow user to edit/refine HANDOFF.md before sharing

### OpenCode's Discretion
- Exact session file format (JSON structure)
- Progress bar visual design (ASCII art vs simple bar)
- Diff output format for resume conflicts
- Template content details for HANDOFF.md sections

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-session-management*
*Context gathered: 2026-03-06*