# Phase 16: Scaffold Core - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can initialize OpenPAUL in their project with interactive prompts. Creates `.openpaul/` directory with `state.json` containing project metadata. Prompts for project name when not provided via `--name`. Warns when `.openpaul/` already exists. Model configuration and preset templates are handled by Phase 17.

</domain>

<decisions>
## Implementation Decisions

### Interactive Prompts

- Prompt for project name **only when `--name` flag not provided**
- Show directory name as default — user can press Enter to accept
- Basic validation: reject empty strings and problematic characters (`/`, `\`, `:`)
- Show confirmation prompt before proceeding: "Create OpenPAUL in './app' with project name 'my-project'?" (y/n)

### Directory Structure

- Create `.openpaul/` directory
- Create `state.json` with project metadata
- **Do NOT create `model-config.json`** — deferred to Phase 17 presets
- Keep minimal footprint for Phase 16; Phase 17 adds preset variations

### Existing Directory Handling

- When `.openpaul/` exists, show minimal warning: "`.openpaul/` already exists. Overwrite? (y/n)"
- If user declines: exit cleanly with code 0 (user cancelled, not an error)
- Add `--force` / `-f` flag to skip prompt and overwrite for CI/CD scenarios

### State.json Format

- Include schema `version` field (e.g., `"1.0"`) for future migrations
- Include `cliVersion` field tracking which CLI version created the file
- Include `name`, `createdAt`, `updatedAt` fields
- **Do NOT include `path`** — implicit from file location

### OpenCode's Discretion

- Exact wording of prompts and messages
- Error message styling
- How to derive default project name from directory (basename vs package.json fallback)

</decisions>

<specifics>
## Specific Ideas

- Confirmation UX mirrors `create-next-app` — show what will be created, ask before proceeding
- `--force` flag pattern matches common CLI conventions (npm, git)
- state.json schema should be extensible for future fields without breaking changes

</specifics>

<deferred>
## Deferred Ideas

- `model-config.json` creation — Phase 17 Template Presets
- `--preset minimal` / `--preset full` options — Phase 17
- Additional template files (README, config stubs) — Phase 17

</deferred>

---

*Phase: 16-scaffold-core*
*Context gathered: 2026-03-20*
