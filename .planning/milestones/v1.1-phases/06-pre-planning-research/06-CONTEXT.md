# Phase 6: Pre-Planning + Research - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI commands that help users explore, research, and prepare for phase implementation. Six commands generate artifacts (CONTEXT.md, ASSUMPTIONS.md, DISCOVERY.md, ISSUES.md, RESEARCH.md) plus two manager classes (PrePlanningManager, ResearchManager). The phase enables structured research before implementation begins.

</domain>

<decisions>
## Implementation Decisions

### Command Output Format
- **Default output:** Summary to console with brief preview + artifact file created (e.g., "Created DISCOVERY.md" with key findings preview)
- **--json flag:** Yes, for scripting and CI use. JSON goes to stdout, human messages to stderr.
- **-v/--verbose flag:** Yes, shows more progress details, intermediate steps, debug info for transparency
- **Error handling:** Clear human-readable error message with hint to fix + non-zero exit code. Works in both interactive and scripted contexts.

### Artifact Structure
- **CONTEXT.md:** Enforce standard template (domain, decisions, specifics, deferred sections). Ensures downstream agents (researcher, planner) can reliably parse structure.
- **ASSUMPTIONS.md:** Structured list format with: statement, validation_status (unvalidated/validated/invalidated), confidence (high/medium/low), impact (what happens if wrong). Machine-parseable.
- **DISCOVERY.md:** Standard research template sections: Summary, Findings, Options Considered, Recommendation, References. Follows existing research documentation patterns.
- **ISSUES.md:** Categorized by severity (Critical/High/Medium/Low). Each issue has: description, affected areas, suggested mitigation. Prioritizes action.

### Research Depth Modes
- **Depth selection:** User-specified via flags: `--quick`, `--standard` (default), `--deep`. Explicit user control, predictable behavior.
- **Quick mode:** Verbal response only — outputs findings to console, no file created. Fast, informal, 2-5 minutes. For rapid exploration.
- **Standard mode:** Creates DISCOVERY.md with 2-3 top options, key tradeoffs, focused scope. 15-30 minutes.
- **Deep mode:** Creates DISCOVERY.md with 5+ options, edge cases, security/compatibility concerns, detailed examples. Shows time estimate (e.g., "30-60 minutes") and requires user confirmation before starting. 1+ hour.

### Parallel Research Coordination
- **Progress display:** Agent status dashboard showing each agent's topic, status (spawning/running/complete), and summary when done. Full visibility during long operations.
- **Result aggregation:** Single synthesized RESEARCH.md file with findings organized by theme. Coherent narrative, not fragmented individual files.
- **Agent failure handling:** Continue with partial results. Failed agent noted in report with error, successful agents contribute to final output. Don't fail entire operation.
- **Max parallel agents:** 4 agents maximum. Balances coverage (typical research dimensions: stack, features, architecture, pitfalls) with resource usage.

### OpenCode's Discretion
- Exact wording/formatting of console summaries
- Error message phrasing and hint details
- Dashboard layout for parallel agent status
- Theme organization within synthesized RESEARCH.md

</decisions>

<specifics>
## Specific Ideas

- Output format follows standard CLI conventions (git, gh, aws, kubectl patterns)
- Research modes prioritize user agency — explicit flags, confirmation for long operations
- Partial results are valuable — one agent failure shouldn't block everything

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 06-pre-planning-research*
*Context gathered: 2026-03-11*
