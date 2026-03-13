# Phase 7: Quality - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI commands for manual acceptance testing and plan fixing. `/openpaul:verify` generates a test checklist from SUMMARY.md, guides users through each test, and captures results. `/openpaul:plan-fix` reads UAT-ISSUES.md, identifies issues requiring plan updates, and creates new plans to address them. This phase closes the verification loop.

</domain>

<decisions>
## Implementation Decisions

### Verify Checklist Structure
- **Source:** Extract verification items from SUMMARY.md must_haves/truths/artifacts
- **Item detail:** Truth-based — each "truth" from must_haves becomes one checklist item with clear pass/fail criteria
- **Display:** Interactive numbered list — numbered items, user enters number to mark pass/fail, shows progress (X/Y passed)
- **Failed handling:** Prompt for issue description, severity, category. Save to UAT-ISSUES.md for later fixing.

### Test Execution Flow
- **Skipping:** Yes, users can skip items and come back later. Supports re-ordering.
- **Completion with failures:** No blocking — user can mark phase complete even with failures. Issues get tracked in UAT-ISSUES.md.
- **Missing SUMMARY.md:** Show clear error: "SUMMARY.md not found. Run /gsd-execute-phase first to generate it."
- **Output:** Create both UAT.md (pass/fail summary + timestamp) and UAT-ISSUES.md (failed item details).

### UAT-ISSUES.md Format
- **Structure:** Structured table + details sections. Table columns: ID, Item, Status, Severity, Category. Below: detailed description for each failed item.
- **Severity levels:** Critical / Major / Minor. Critical = blocking, Major = should fix, Minor = nice to have.
- **Categories:** Functional / Visual / Performance / Configuration. Covers main UAT areas.
- **Linking:** Auto-link issues to the plan that created the failing artifact/truth. Shows "Fix plan: 06-01".

### Plan-fix Behavior
- **Modification type:** Create new plans only. Never modify existing plans. Keeps history intact.
- **Plan numbering:** Alpha suffix — 06-01a, 06-01b, 06-01c. Clear sequence, easy to understand.
- **Wave assignment:** Inherit parent's wave. If parent was wave 2, new plan is wave 2. Clear dependency tracking.
- **Auto-execution:** Ask first — create the plan, then ask user: "Run /gsd-execute-phase now?" Gives user control.

### OpenCode's Discretion
- Exact wording of checklist item prompts
- Console styling and progress indicators
- Issue description template/prompt phrasing
- Wave calculation edge cases

</decisions>

<specifics>
## Specific Ideas

- UAT-ISSUES.md follows table + details pattern — similar to ISSUES.md from Phase 6
- Plan naming convention uses alpha suffix (a, b, c) matching project patterns
- Interactive flow similar to existing pause/resume confirmation patterns

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-quality*
*Context gathered: 2026-03-11*
