# Phase 2: Core Loop Commands - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement the essential PLAN → APPLY → UNIFY workflow commands (/paul:init, /paul:plan, /paul:apply, /paul:unify, /paul:progress, /paul:help). These commands drive the core workflow loop that users interact with to plan work, execute plans, and close loops. Session management, project planning, research, and advanced features are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Command Output Format

**Format style:**
- Rich text format with headers, emojis, bold/italic for structure
- Most flexible for varying content types, easy to scan, works well in chat interfaces

**Detail level:**
- Adaptive detail varies by command type:
  - `/paul:plan` shows full plan details
  - `/paul:progress` shows concise status
  - `/paul:apply` shows task-by-task progress
- Right information density for each workflow stage

**Multi-line content:**
- Smart formatting adapts to content:
  - Short content: Inline
  - Medium content: Line breaks with indentation
  - Long content: Collapsible or separate sections
  - Code: Code blocks with syntax highlighting
- Balances readability with information density

**Status and progress:**
- Minimal emojis for status indicators (✅ ⏳ ⏸️ ❌)
- Visual progress bars for counts: `[███░░░] 1/3 tasks`
- Quick visual scan + detailed status when needed

### Error Handling & Recovery

**Error presentation:**
- Guided errors include: error message + context + suggested fix + next steps
- Users understand the problem AND know exactly how to fix it
- Include relevant command suggestions and help references

**Retry behavior:**
- Smart retry depends on error type:
  - Transient errors (file locks, network): Auto-retry with backoff
  - Validation errors: Manual retry after fix
  - State errors: Manual retry with guidance
  - Fatal errors: No retry, clear explanation
- Handles different failure modes appropriately

**State recovery on failure:**
- Context-aware rollback preserves work:
  - Plan creation failure: Rollback (no partial plans)
  - Apply task failure: Save progress, pause at failure point
  - Unify failure: Keep state, allow manual fix
  - Init failure: Rollback partially created files
- Provides options: resume, skip task, or rollback

**Warnings vs errors:**
- Severity-based communication:
  - Info (suggestions): Subtle, after main output
  - Warnings (non-critical): Visible but not blocking
  - Errors (critical): Prominent, stop execution
- Users see what matters without noise

### Plan Structure & Display

**Plan organization:**
- Adaptive structure scales with complexity:
  - Simple plans (1-3 tasks): Minimal structure
  - Medium plans (4-10 tasks): Standard structure
  - Complex plans (10+ tasks): Detailed structure with all sections
- Right level of ceremony for plan complexity

**Task metadata visibility:**
- Configurable with flags:
  - Default view: Name + status + one-line description (scannable)
  - Verbose view (--verbose): All task metadata (files, verify, done)
  - Specific task (--task N): Full details for single task
- Default is scannable, verbose available when needed

**Dependencies and execution order:**
- Auto-detected from file changes (task B modifies file from task A = dependency)
- Visual execution graph shows parallel opportunities
- Format: [1, 3] → [2] (parallel when possible)
- Reduces manual work, shows actual dependencies

**Boundaries and criteria display:**
- Context-aware based on plan stage:
  - During planning (PLAN stage): Full sections visible for editing/review
  - During execution (APPLY stage): Condensed view with criteria for verification
  - After completion (UNIFY stage): Show criteria with pass/fail status
- Right information at each workflow stage

### Loop State Visualization

**Current position display:**
- Compact + contextual one-line summary: `📍 Loop: PLAN → APPLY (Task 2/5) → UNIFY`
- Shows position, active task name, and next action
- Quick visual scan + actionable context

**Context shown:**
- Smart context relevant to current stage:
  - Active task details (name, files, time in progress)
  - Visual progress bar
  - Quick action commands for immediate next steps
- Shows what's relevant for taking action NOW

**Stage transitions:**
- Guided transitions with milestone feel:
  - Clear separator/announcement
  - Summary of what's starting (plan name, task count, boundaries)
  - Immediate first action (start task 1)
- Stage changes feel like meaningful milestones

**Empty/inactive state:**
- Context-aware guidance based on project state:
  - Not initialized: "Run /paul:init to set up"
  - Initialized but no plans: "Ready to plan! Start with /paul:plan"
  - Just completed loop: Shows completion + suggests next
  - Paused mid-loop: Shows pause point + resume command
- Guides users based on their actual situation

</decisions>

<specifics>
## Specific Ideas

- Command output should feel modern and scannable (like good CLI tools)
- Progress bars provide quick visual feedback without clutter
- Auto-detected dependencies reduce manual overhead
- Context-aware display means users always see relevant info for their stage
- Guided errors and transitions make the workflow feel polished and supportive

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope (core workflow commands only)

</deferred>

---

*Phase: 02-core-loop-commands*
*Context gathered: 2026-03-04*
