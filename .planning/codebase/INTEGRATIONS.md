# External Integrations

**Analysis Date:** 2026-03-03

## Primary Integration Target

**Claude Code (Anthropic):**
- Purpose: AI-assisted development environment where PAUL commands execute
- Integration: Slash commands in `~/.claude/commands/paul/`
- Activation: Commands invoked via `/paul:{command}` syntax
- Files: `src/commands/*.md` define 26 slash commands

## APIs & External Services

**Optional - SonarQube:**
- Purpose: Code quality scanning and static analysis
- SDK/Client: MCP (Model Context Protocol) server
- Configuration: `.paul/config.md` with `sonarqube.enabled: true`
- Auth: Via SonarQube MCP server configuration
- Reference: `src/references/sonarqube-integration.md`

**SonarQube MCP Tools Used:**
- `mcp__sonarqube__sonar_create_project` - Project setup
- `mcp__sonarqube__sonar_scan` - Run analysis
- `mcp__sonarqube__sonar_get_metrics` - Fetch quality metrics
- `mcp__sonarqube__sonar_get_issues` - Fetch code issues

## Data Storage

**Databases:**
- None - Framework is stateless

**File Storage:**
- Local filesystem only
- Project state stored in `.paul/` directory within target projects
- Structure:
  ```
  .paul/
  ├── PROJECT.md      # Project context
  ├── ROADMAP.md      # Phase breakdown
  ├── STATE.md        # Loop position
  ├── config.md       # Integration settings
  ├── SPECIAL-FLOWS.md # Skill requirements
  └── phases/         # Plan and summary files
  ```

**Caching:**
- None - All state persisted to markdown files

## Authentication & Identity

**Auth Provider:**
- None - Framework has no authentication requirements
- SonarQube integration uses MCP server authentication (user-configured)

## Monitoring & Observability

**Error Tracking:**
- None built-in

**Logs:**
- Console output during installation
- APPLY-LOG entries in STATE.md during plan execution

## CI/CD & Deployment

**Hosting:**
- npm registry (npmjs.com) for package distribution
- GitHub repository for source control

**CI Pipeline:**
- Not detected in codebase

**Deployment:**
- `npm publish` for releasing new versions
- Users update via `npx paul-framework@latest`

## Environment Configuration

**Required env vars:**
- None for core framework

**Optional env vars:**
- `CLAUDE_CONFIG_DIR` - Override default Claude config location

**Secrets location:**
- Not applicable - No secrets in framework
- SonarQube tokens configured in MCP server settings (outside PAUL)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Companion Integration

**CARL (Context Augmentation & Reinforcement Layer):**
- Purpose: Dynamic rule injection system
- Integration: PAUL domain file at `src/carl/PAUL`
- Manifest: `src/carl/PAUL.manifest`
- Behavior: Rules load when working in `.paul/` directories
- Rules enforced:
  - Loop integrity (PLAN → APPLY → UNIFY)
  - Boundary protection
  - State consistency checks
  - Verification requirements
  - Skill blocking before APPLY

**CARL Domain Configuration:**
```
PAUL_STATE=active
PAUL_ALWAYS_ON=false
```

**CARL Recall Keywords:**
```
paul, plan phase, apply phase, unify phase, PLAN.md, STATE.md,
development workflow, vibe coding, ai development, planning
framework, .paul/
```

## Git Integration

**Purpose:** Version control workflow integration

**Commit Strategy:**
- Per-task commits during APPLY phase
- Metadata commits after UNIFY
- Format: `{type}({phase}-{plan}): {description}`

**Commit Types:**
- `feat` - New features
- `fix` - Bug fixes
- `test` - Test-only changes
- `refactor` - Code cleanup
- `docs` - Documentation
- `chore` - Dependencies/config
- `wip` - Work in progress (handoffs)

**Reference:** `src/references/git-strategy.md`

## Specialized Skill Integration

**SPECIAL-FLOWS.md:**
- Purpose: Declare project-specific skill requirements
- Location: `.paul/SPECIAL-FLOWS.md` (user-created)
- Enforced at: APPLY phase (blocks if required skills not loaded)
- Verified at: UNIFY phase (gap analysis)

**Example Skills:**
- `/frontend-design` - UI component generation
- `/revops-expert` - Persuasion copy writing
- Custom user-defined skills

**Reference:** `src/references/specialized-workflow-integration.md`

---

*Integration audit: 2026-03-03*
