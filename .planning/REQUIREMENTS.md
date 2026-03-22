# Requirements: OpenPAUL

**Defined:** 2026-03-05
**Core Value:** Enforce the PLAN → APPLY → UNIFY loop with mandatory reconciliation, ensuring every plan closes properly with full traceability and context preservation.

## v1.4.0 Requirements

Requirements for CLI Installer milestone. Each maps to roadmap phases.

### CLI Core

- [x] **CLI-01**: User can run `npx openpaul` to execute the installer
- [x] **CLI-02**: User can run `npx openpaul --help` to see usage information
- [x] **CLI-03**: User can run `npx openpaul --version` to see package version
- [x] **CLI-04**: User receives clear colored error messages on failure
- [x] **CLI-05**: User receives success confirmation after scaffolding completes

### Scaffolding

- [x] **SCAF-01**: CLI creates `.openpaul/` directory in target project
- [x] **SCAF-02**: CLI creates initial `state.json` with project name and timestamps
- [x] **SCAF-03**: CLI supports template presets (minimal/full configurations)
- [ ] **SCAF-04**: User can specify preset via `--preset minimal` or `--preset full`

### Interactive

- [x] **INT-01**: CLI prompts for project name if not provided via argument
- [x] **INT-02**: CLI detects existing `.openpaul/` directory and warns user
- [x] **INT-03**: User can specify project path as positional argument (default: `.`)
- [x] **INT-04**: User can provide project name via `--name` flag to skip prompt

## v1.1 Requirements

Requirements for full command implementation. Each maps to roadmap phases.

### Session Management

- [x] **SESS-01**: User can create session handoff with `/openpaul:pause` that captures current state, what was done, what's in progress, what's next, and resume instructions
- [x] **SESS-02**: User can restore session with `/openpaul:resume` that reads HANDOFF.md, loads STATE.md, and restores context
- [x] **SESS-03**: User can view current position with `/openpaul:status` that displays PLAN/APPLY/UNIFY loop with markers, current phase, and plan status
- [x] **SESS-04**: User can create explicit handoff with `/openpaul:handoff` for team collaboration or context saves

### Roadmap Management

- [x] **ROAD-01**: User can add phase to roadmap with `/openpaul:add-phase` that adds phase to ROADMAP.md table, creates phase directory, updates STATE.md
- [x] **ROAD-02**: User can remove phase from roadmap with `/openpaul:remove-phase` that removes phase, renumbers subsequent phases, cleans up phase directory

### Milestone Management

- [x] **MILE-01**: User can create new milestone with `/openpaul:milestone` that defines milestone with scope, phases, theme, creates milestone section in ROADMAP.md
- [x] **MILE-02**: User can mark milestone complete with `/openpaul:complete-milestone` that archives milestone to MILESTONE-ARCHIVE.md, updates ROADMAP.md progress
- [x] **MILE-03**: User can plan upcoming milestone with `/openpaul:discuss-milestone` that creates MILESTONE-CONTEXT.md with features, scope, phase mapping, constraints

### Pre-Planning

- [x] **PLAN-01**: User can explore phase goals with `/openpaul:discuss` that creates CONTEXT.md with goals, approach, constraints, open questions
- [x] **PLAN-02**: User can capture and validate assumptions with `/openpaul:assumptions` that creates ASSUMPTIONS.md listing assumptions with validation status
- [x] **PLAN-03**: User can research technical options with `/openpaul:discover` that supports 3 depth levels: Quick (verbal, 2-5min), Standard (DISCOVERY.md, 15-30min), Deep (comprehensive, 1+hr)
- [x] **PLAN-04**: User can identify potential blockers with `/openpaul:consider-issues` that creates ISSUES.md with categorized risks and mitigation strategies

### Research

- [x] **RSCH-01**: User can research user-specified topics with `/openpaul:research` that executes research with proper verification and returns findings with confidence levels
- [x] **RSCH-02**: User can auto-detect and research phase unknowns with `/openpaul:research-phase` that analyzes phase description, identifies unknowns, spawns parallel research agents

### Quality

- [x] **QUAL-01**: User can perform manual acceptance testing with `/openpaul:verify` that generates test checklist from SUMMARY.md, guides through each test, captures results in phase UAT-ISSUES.md
- [x] **QUAL-02**: User can fix plans based on verification issues with `/openpaul:plan-fix` that reads UAT-ISSUES.md, identifies issues requiring plan updates, creates new or modifies existing plan

### Configuration

- [x] **CONF-01**: User can manage project configuration with `/openpaul:config` that manages integrations (SonarQube), project settings, preferences via YAML config in .openpaul/config.md
- [x] **CONF-02**: User can configure specialized flows with `/openpaul:flows` that enables/disables specialized workflows defined in SPECIAL-FLOWS.md
- [x] **CONF-03**: User can document codebase structure with `/openpaul:map-codebase` that creates CODEBASE.md with structure, stack, conventions, concerns, integrations, architecture

### Branding

- [x] **BRND-01**: All instances of "PAUL" replaced with "OpenPAUL" in documentation, command names, and user-facing text
- [x] **BRND-02**: All instances of "paul" replaced with "openpaul" in command names, file paths, and configuration

## v1.2 Requirements

Requirements for CI/CD pipeline milestone. Each maps to roadmap phases.

### CI Workflow

- [x] **CI-01**: GitHub Action runs tests on every push to main
- [x] **CI-02**: GitHub Action runs tests on every pull request (non-draft)
- [x] **CI-03**: Concurrency group cancels in-progress runs on same ref
- [x] **CI-04**: Coverage report generated via `npm run test:coverage`
- [x] **CI-05**: Coverage artifacts uploaded for downstream codecov workflow

### E2E Tests
- [x] **E2E-01**: E2E tests run in Docker container with OpenCode CLI
- [x] **E2E-02**: Docker image built with layer caching for faster subsequent runs
- [x] **E2E-03**: E2E tests retry once on failure
- [x] **E2E-04**: Failure artifacts uploaded (Docker logs, .openpaul state)
- [x] **E2E-05**: E2E tests run on schedule (daily at 2am UTC)
- [x] **E2E-06**: E2E tests run on push to main and PRs (non-draft)

### Codecov
- [x] **COV-01**: Codecov workflow runs AFTER both test.yml and e2e-tests.yml complete successfully
- [x] **COV-02**: Downloads coverage artifacts from test.yml
- [x] **COV-03**: Uploads coverage to Codecov with token
- [x] **COV-04**: PR coverage reports posted as comments
- [x] **COV-05**: codecov.yml config file with project thresholds

### Publish
- [x] **PUB-01**: npm publish triggered on GitHub release published
- [x] **PUB-02**: Publish requires: unit tests + E2E tests + codecov to pass
- [x] **PUB-03**: npm provenance enabled for supply chain security
- [x] **PUB-04**: Build runs before publish

## v1.x Requirements

Deferred to future release. Tracked but not in current roadmap.

### Non-Interactive Mode

- **NI-01**: User can run `npx openpaul --yes` to skip all prompts (CI-friendly)
- **NI-02**: Default configuration used when `--yes` flag provided

### Polish

- **POL-01**: User can run `npx openpaul --verbose` for detailed output
- **POL-02**: User can run `npx openpaul --dry-run` to preview without writing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Git initialization | OpenPAUL is for existing projects, not new scaffolds |
| Package manager selection | CLI doesn't install dependencies |
| GitHub template import | Adds network dependency, overkill for config files |
| Force overwrite | Destroys user state, data loss risk |
| `.paul/` fallback directory | Focus on `.openpaul/` only for clean migration |
| Automated testing in verify command | Verify is for manual user acceptance testing, not automated test suites |
| Real-time collaboration | OpenPAUL is designed for structured, async workflows, not real-time collaboration |
| Complex dependency graphs | Visual dependency management is complex and error-prone. Simple phase dependencies sufficient |
| Built-in time tracking | Time tracking is orthogonal to OpenPAUL's core value of structured workflow |
| Web-based project views | OpenPAUL is CLI-first for developer ergonomics. Web UI adds deployment complexity |
| Self-hosted runners | GitHub Actions provides free runners for open-source. No need for self-hosted infrastructure |
| Manual deployment process | Automated CI/CD pipeline eliminates need for manual npm publish steps |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

### v1.4.0 CLI Installer (Phases 15-17)

| Requirement | Phase | Description | Status |
|-------------|-------|-------------|--------|
| CLI-01 | Phase 15 | npx openpaul execution | Pending |
| CLI-02 | Phase 15 | --help flag | Pending |
| CLI-03 | Phase 15 | --version flag | Pending |
| CLI-04 | Phase 15 | Colored error messages | Pending |
| CLI-05 | Phase 15 | Success confirmation | Pending |
| INT-03 | Phase 15 | Project path argument | Pending |
| INT-04 | Phase 15 | --name flag | Pending |
| SCAF-01 | Phase 16 | Create .openpaul/ directory | Pending |
| SCAF-02 | Phase 16 | Create initial state.json | Pending |
| INT-01 | Phase 16 | Project name prompt | Pending |
| INT-02 | Phase 16 | Existing directory warning | Pending |
| SCAF-03 | Phase 17 | Template presets support | Pending |
| SCAF-04 | Phase 17 | --preset flag | Pending |

### v1.2 CI/CD Pipeline (Phases 10-14)

| Requirement | Phase | Status |
|-------------|-------|--------|
| CI-01 | Phase 10 | Complete |
| CI-02 | Phase 10 | Complete |
| CI-03 | Phase 10 | Complete |
| CI-04 | Phase 10 | Complete |
| CI-05 | Phase 10 | Complete |
| E2E-01 | Phase 11 | Complete |
| E2E-02 | Phase 11 | Complete |
| E2E-03 | Phase 11 | Complete |
| E2E-04 | Phase 11 | Complete |
| E2E-05 | Phase 11 | Complete |
| E2E-06 | Phase 11 | Complete |
| COV-01 | Phase 12, 14 | Complete |
| COV-02 | Phase 12 | Complete |
| COV-03 | Phase 12 | Complete |
| COV-04 | Phase 12 | Complete |
| COV-05 | Phase 12 | Complete |
| PUB-01 | Phase 13 | Complete |
| PUB-02 | Phase 13 | Complete |
| PUB-03 | Phase 13 | Complete |
| PUB-04 | Phase 13 | Complete |
| SESS-01 | Phase 3 | Complete |
| SESS-02 | Phase 3 | Complete |
| SESS-03 | Phase 3 | Complete |
| SESS-04 | Phase 3 | Complete |
| ROAD-01 | Phase 4 | Complete |
| ROAD-02 | Phase 4 | Complete |
| MILE-01 | Phase 5 | Complete |
| MILE-02 | Phase 5 | Complete |
| MILE-03 | Phase 5 | Complete |
| PLAN-01 | Phase 6 | Complete |
| PLAN-02 | Phase 6 | Complete |
| PLAN-03 | Phase 6 | Complete |
| PLAN-04 | Phase 6 | Complete |
| RSCH-01 | Phase 6 | Complete |
| RSCH-02 | Phase 6 | Complete |
| QUAL-01 | Phase 7 | Complete |
| QUAL-02 | Phase 7 | Complete |
| CONF-01 | Phase 8 | Complete |
| CONF-02 | Phase 8 | Complete |
| CONF-03 | Phase 8 | Complete |
| BRND-01 | Phase 9 | Complete |
| BRND-02 | Phase 6 | Complete |

**Coverage:**
- v1.4.0 requirements: 13 total (Pending)
- v1.1 requirements: 22 total (Complete)
- v1.2 requirements: 20 total (Complete)
- Mapped to phases: 55
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-20 after v1.4.0 CLI Installer milestone started*
