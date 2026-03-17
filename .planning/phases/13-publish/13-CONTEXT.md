# Phase 13: Publish - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

npm package publishing workflow triggered by GitHub releases. Quality gates ensure only verified code is published. Publishing mechanics, version handling, and registry configuration are in scope. Release note generation and post-publish marketing are separate concerns.

</domain>

<decisions>
## Implementation Decisions

### Quality Gates
- All quality gates must pass: unit tests + E2E tests + codecov upload
- Fail-fast strategy: stop immediately on first failure, don't wait for other checks
- Codecov is a hard gate (not just signal) — coverage must upload successfully
- No automatic retry on test failures — flakes should be fixed, not hidden

### Version Handling
- GitHub release tag is the source of truth for version (e.g., `v1.2.3`)
- Auto-sync package.json to match release tag before build
- Validate semver format — reject non-semver tags like `v1.2` or `1.2.3`
- Support pre-release tags (e.g., `v1.0.0-beta.1`) with appropriate npm dist-tag (`--tag beta` or `--tag next`)

### Failure Recovery
- No automatic retry on npm publish failure — manual re-run via GitHub Actions
- GitHub notifications only (no Slack/Discord webhook)
- No auto-rollback — npm deprecate/unpublish handled manually if needed
- Upload `dist/` directory as artifact on failure for debugging

### Registry Configuration
- npmjs.org public registry (not GitHub Packages)
- Scoped package: `@krisgray/openpaul`
- OIDC trusted publishing (no NPM_TOKEN secret needed)
- Enable npm provenance for supply chain security transparency

### OpenCode's Discretion
- Exact workflow file structure and job organization
- Provenance configuration syntax
- Artifact retention policy

</decisions>

<specifics>
## Specific Ideas

- Follow GitHub Actions best practices for npm publishing
- Provenance links published package to source commit for transparency
- Pre-release workflow should mirror stable release but with dist-tag

</specifics>

<deferred>
## Deferred Ideas

- Release notes auto-generation — future enhancement
- Post-publish notifications beyond GitHub — future enhancement
- Automated changelog updates — separate concern

</deferred>

---

*Phase: 13-publish*
*Context gathered: 2026-03-16*
