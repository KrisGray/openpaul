# Phase 15: CLI Foundation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

CLI entry point that allows users to invoke and control the OpenPAUL installer via command line. Includes argument parsing, help/version display, path/name options, and colored output. Actual scaffolding and templates are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Output Style
- Incremental verbosity: silent by default, `-v` for more detail, `-vv` for everything
- Auto-detect terminal color support: use colors when supported, fall back to plain text
- One-line success message (e.g., "OpenPAUL initialized in ./my-project")
- Step messages for progress (e.g., "Creating .openpaul/..." then "Done")

### Flag Design
- Both short and long flags (e.g., `-h`/`--help`, `-n`/`--name`)
- Target directory via `--path` flag only (no positional argument)
- Standard naming: `--name`, `--path`, `--preset`, `--verbose`
- Default to current directory `.` when `--path` not specified
- Project name defaults to current directory name if `--name` not provided

### Execution Behavior
- Bare `npx openpaul` starts interactive mode
- Providing flags (`--name`, `--path`, `--preset`) skips prompts for those values
- `--interactive` flag explicitly enables interactive prompts
- No confirmation step before scaffolding
- Error and exit if `.openpaul/` directory already exists (no overwrite/merge)

### Error Handling
- Binary exit codes: 0 for success, 1 for any error
- Clean error messages only: red "Error:" prefix + message, no stack traces
- Unified error format: all errors use same format regardless of type
- Errors to stderr, success/progress to stdout

### OpenCode's Discretion
- Exact wording of success/error messages
- Specific color palette for output
- Interactive prompt wording and flow
- Help text formatting and examples

</decisions>

<specifics>
## Specific Ideas

- Use `commander` for argument parsing (already in roadmap notes)
- Use `picocolors` for colored output (already in roadmap notes)
- TypeScript shebang preserved during compilation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 15-cli-foundation*
*Context gathered: 2026-03-20*
