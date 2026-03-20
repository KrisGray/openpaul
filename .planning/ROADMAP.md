# Roadmap: OpenPAUL

## Milestones

- ✅ **v1.0 MVP** - Phases 1-2 (shipped 2026-03-05)
- ✅ **v1.1 Full Command Implementation** - Phases 3-9 (94/94 plans shipped 2026-03-13)
- ✅ **v1.2 CI/CD Pipeline** - Phases 10-14 (shipped 2026-03-17)
- 🚧 **v1.4.0 CLI Installer** - Phases 15-17 (in progress)
- 📋 **v2.0** - Future enhancements (planned)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-2) - SHIPPED 2026-03-05</summary>

### Phase 1: Core Loop Infrastructure
**Goal**: Implement PAUL loop commands and storage infrastructure
**Plans**: 13 plans (13 complete)

Plans:
- [x] 01-01: Initialize project config (package.json, tsconfig)
- [x] 01-02: Define core loop/state/plan types
- [x] 01-03: Implement atomic writes and file manager
- [x] 01-04: Implement state manager for per-phase state
- [x] 01-05: Add loop enforcer test suite
- [x] 01-06: Implement model config system and sub-stage types
- [x] 01-07: Add atomic writes error handling tests
- [x] 01-08: Add state-manager edge case + sub-stage tests
- [x] 01-09: Add loop and loop-enforcer branch coverage tests
- [x] 01-10: Close remaining coverage gaps with defensive tests
- [x] 01-11: Define command types and exports
- [x] 01-12: Configure Jest and plugin entry point
- [x] 01-13: Implement loop enforcer logic

**Verified:** UAT complete (12/12 passed)

### Phase 2: Advanced Loop Features
**Goal**: Implement roadmapping and state visualization features
**Plans**: 10 plans (10 complete)

Plans:
- [x] 02-01: Create ROADMAP.md template and parsing logic
- [x] 02-02: Implement STATE.md template and management
- [x] 02-03: Build /openpaul:roadmap command for project roadmapping
- [x] 02-04: Build /openpaul:status command for state visualization
- [x] 02-05: Implement phase planning workflow
- [x] 02-06: Implement phase transition workflow
- [x] 02-07: Add validation for loop closure enforcement
- [x] 02-08: Create comprehensive test suite for loop features
- [x] 02-09: [reserved for future]
- [x] 02-10: Fix TypeScript compilation errors in apply/unify tests

**Verified:** UAT complete (6/6 passed)

</details>

<details>
<summary>✅ v1.1 Full Command Implementation (Phases 3-9) - SHIPPED 2026-03-13</summary>

### Phase 3: Session Management
**Goal**: Users can pause and resume development sessions with full context preservation
**Plans**: 14 plans (14 complete)

Plans:
- [x] 03-01: Implement SessionManager for session state tracking
- [x] 03-02: Build /openpaul:pause command
- [x] 03-03: Build /openpaul:resume command
- [x] 03-04: Build /openpaul:status command (enhanced version)
- [x] 03-05: Build /openpaul:handoff command
- [x] 03-06: Add tests for SessionManager
- [x] 03-07: Add tests for pause/resume commands
- [x] 03-08: Add tests for status/handoff commands
- [x] 03-09: [reserved]
- [x] 03-10: [reserved]
- [x] 03-11: [reserved]
- [x] 03-12: [reserved]
- [x] 03-13: [reserved]
- [x] 03-14: Add change detection to pause command

**Verified:** UAT complete (12/12 passed)

### Phase 4: Roadmap Management
**Goal**: Users can modify project roadmap by adding and removing phases
**Plans**: 5 plans (5 complete)

### Phase 5: Milestone Management
**Goal**: Users can define, track, and complete project milestones
**Plans**: 5 plans (5 complete)

### Phase 6: Pre-Planning + Research
**Goal**: Users can conduct phase planning and research to improve plan quality
**Plans**: 12 plans (12 complete)

### Phase 7: Quality
**Goal**: Users can verify plans and fix issues to close loops properly
**Plans**: 11 plans (11 complete)

### Phase 8: Configuration
**Goal**: Users can manage project configuration, specialized flows, and codebase documentation
**Plans**: 6 plans (6 complete)

### Phase 9: Documentation
**Goal**: All OpenPAUL documentation uses consistent "OpenPAUL" branding
**Plans**: 18 plans (18 complete)

</details>

<details>
<summary>✅ v1.2 CI/CD Pipeline (Phases 10-14) - SHIPPED 2026-03-17</summary>

### Phase 10: CI Workflow
**Goal**: Automated unit tests run on every push/PR with coverage artifacts
**Plans**: 1 plan (1 complete)

### Phase 11: E2E Tests
**Goal**: E2E tests run in Docker container with OpenCode CLI for realistic testing
**Plans**: 2 plans (2 complete)

### Phase 12: Codecov
**Goal**: Coverage reports uploaded to Codecov with PR comments for visibility
**Plans**: 1 plan (1 complete)

### Phase 13: Publish
**Goal**: npm package published automatically on GitHub release with quality gates
**Plans**: 1 plan (1 complete)

### Phase 14: Codecov Integration Fix
**Goal**: Fix race condition in codecov.yml dual-workflow verification
**Plans**: 1 plan (1 complete)

</details>

### 🚧 v1.4.0 CLI Installer (In Progress)

**Milestone Goal:** Add `npx openpaul` CLI installer for initializing OpenPAUL in existing projects

#### Phase 15: CLI Foundation
**Goal**: Users can invoke and control the OpenPAUL installer via command line
**Depends on**: Phase 14 (CI/CD complete)
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, INT-03, INT-04
**Success Criteria** (what must be TRUE):
  1. User can run `npx openpaul` and see the CLI execute
  2. User can run `npx openpaul --help` and see usage information
  3. User can run `npx openpaul --version` and see the package version
  4. User can run `npx openpaul --path ./my-project` to specify target directory
  5. User can run `npx openpaul --name my-project` to specify project name
**Plans**: 3 plans

Plans:
- [ ] 15-01: Add bin field and CLI entry point with commander
- [ ] 15-02: Implement help, version, path, and name flags
- [ ] 15-03: Add colored error and success output

#### Phase 16: Scaffold Core
**Goal**: Users can initialize OpenPAUL in their project with interactive prompts
**Depends on**: Phase 15
**Requirements**: SCAF-01, SCAF-02, INT-01, INT-02
**Success Criteria** (what must be TRUE):
  1. User sees `.openpaul/` directory created in their project
  2. User sees `state.json` file with project name and timestamps
  3. User is prompted for project name when not provided via --name
  4. User is warned when `.openpaul/` directory already exists
**Plans**: 2 plans

Plans:
- [ ] 16-01-PLAN.md — Create scaffolding module with state.json schema
- [ ] 16-02-PLAN.md — Integrate scaffolding into CLI with --force flag and prompts

#### Phase 17: Template Presets
**Goal**: Users can choose between minimal and full OpenPAUL configurations
**Depends on**: Phase 16
**Requirements**: SCAF-03, SCAF-04
**Success Criteria** (what must be TRUE):
  1. User can run `npx openpaul --preset minimal` for minimal configuration
  2. User can run `npx openpaul --preset full` for full configuration
  3. Default preset (minimal) is used when --preset not specified
**Plans**: 2 plans

Plans:
- [ ] 17-01: Define minimal and full preset templates
- [ ] 17-02: Implement --preset flag with template selection

### 📋 v2.0 (Planned)

**Milestone Goal:** Future enhancements based on user feedback

(No phases defined yet)

## Progress

**Execution Order:**
Phases execute in numeric order: 15 → 16 → 17

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Core Loop Infrastructure | v1.0 | 13/13 | Complete | 2026-03-04 |
| 2. Advanced Loop Features | v1.0 | 10/10 | Complete | 2026-03-05 |
| 3. Session Management | v1.1 | 14/14 | Complete | 2026-03-06 |
| 4. Roadmap Management | v1.1 | 5/5 | Complete | 2026-03-13 |
| 5. Milestone Management | v1.1 | 5/5 | Complete | 2026-03-13 |
| 6. Pre-Planning + Research | v1.1 | 12/12 | Complete | 2026-03-13 |
| 7. Quality | v1.1 | 11/11 | Complete | 2026-03-13 |
| 8. Configuration | v1.1 | 6/6 | Complete | 2026-03-13 |
| 9. Documentation | v1.1 | 18/18 | Complete | 2026-03-13 |
| 10. CI Workflow | v1.2 | 1/1 | Complete | 2026-03-16 |
| 11. E2E Tests | v1.2 | 2/2 | Complete | 2026-03-16 |
| 12. Codecov | v1.2 | 1/1 | Complete | 2026-03-16 |
| 13. Publish | v1.2 | 1/1 | Complete | 2026-03-16 |
| 14. Codecov Integration Fix | v1.2 | 1/1 | Complete | 2026-03-16 |
| 15. CLI Foundation | 4/4 | Complete    | 2026-03-20 | - |
| 16. Scaffold Core | v1.4.0 | 0/2 | Not started | - |
| 17. Template Presets | v1.4.0 | 0/2 | Not started | - |

## Dependencies

```
Phase 15 (CLI Foundation) - NOT STARTED
  └─> Phase 16 (Scaffold Core) - NOT STARTED
       └─> Phase 17 (Template Presets) - NOT STARTED
```

## Notes

- CLI installer uses `commander` for argument parsing
- TypeScript shebang preserved during compilation (no bundler needed)
- Dual entry points: plugin via `main`, CLI via `bin`
- Colored output via `picocolors` for minimal dependencies
- Interactive prompts optional, can use --name to skip

---
*Roadmap created: 2026-03-05*
*Last updated: 2026-03-20 for v1.4.0 CLI Installer milestone*
