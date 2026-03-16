# Phase 10: CI Workflow - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

GitHub Actions workflow that runs automated unit tests on every push/PR with concurrency control and coverage artifact generation. Coverage artifacts are uploaded for downstream codecov workflow to consume. E2E tests, codecov upload, and npm publishing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Trigger Configuration
- Push triggers on `main` and `develop` branches
- Skip CI for draft PRs (non-draft PRs only)
- No path filtering — run CI on all file changes including docs
- Trigger on version tags (v*) for release validation

### Artifact Handling
- Artifact name: `coverage-report` (static/predictable for downstream workflow)
- Retention: 7 days (codecov consumes quickly)
- Fail the workflow if coverage artifact generation fails
- Include `coverage/` directory only (lcov.info)

### Failure Notifications
- Use GitHub annotations from test output for PR visibility
- CI is a required status check for merging PRs
- Run all matrix jobs to completion (no fail-fast)
- No cancellation message when newer run takes priority

### OpenCode's Discretion
- Node.js version(s) for matrix strategy
- OS platform(s) to test on
- Exact concurrency group naming
- Cache configuration for npm dependencies
- Checkout depth/shallow clone settings
- Test runner timeout configuration

</decisions>

<specifics>
## Specific Ideas

- Standard GitHub Actions patterns — no exotic requirements
- Coverage artifacts must be predictable for downstream codecov workflow
- Required status check enables branch protection enforcement

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-ci-workflow*
*Context gathered: 2026-03-16*
