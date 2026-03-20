# Phase 17: Template Presets - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement template presets for the OpenPAUL installer so users can choose between minimal and full configurations via `--preset` (default to minimal when omitted). Presets define what gets installed into the OpenCode config locations. No new capabilities beyond preset selection and template contents.

</domain>

<decisions>
## Implementation Decisions

### Preset contents
- Minimal preset installs `.opencode/` directories plus a minimal `opencode.json` scaffold.
- Full preset includes everything in minimal, plus example `opencode.json` and `tui.json` configs.
- Sample content in full is minimal: include only 1 example command and 1 example rule.
- Never include API keys or user-specific settings (models, permissions, keybinds) in any preset.

### Selection rules
- Default preset is `minimal` when `--preset` is omitted.
- `--preset full` respects existing flags (`--name`, `--path`, `--force`) exactly like minimal.
- `--preset` requires interactive confirmation; no non-interactive usage.
- Unknown preset triggers an interactive prompt to choose from valid presets (no silent fallback).

### Output & messaging
- Always print the selected preset explicitly (e.g., "Preset: minimal").
- Include a 1–2 line description of what the preset includes.
- If `--preset` is omitted, print "Defaulting to minimal".
- Show preset messaging right before the confirmation prompt.

### Existing project behavior
- If `.opencode/` already exists, always show overwrite warning, even when `--preset` is used.
- Overwrite behavior: replace preset files; no merge or preservation.
- If user declines overwrite, exit with "Operation cancelled" and status 0.
- If `.opencode/` exists but is empty/partial, treat as overwrite.

### OpenCode's Discretion
- Exact wording of the 1–2 line preset description, as long as it matches contents.

</decisions>

<specifics>
## Specific Ideas

- Preset behavior should follow the PAUL installer pattern (banner + help + interactive prompts) but mapped to OpenCode locations: local `./.opencode/` and global `~/.config/opencode/`.
- Use OpenCode config conventions from opencode.ai docs (e.g., `.opencode/` subdirs, `opencode.json`, `tui.json`).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-template-presets*
*Context gathered: 2026-03-20*
