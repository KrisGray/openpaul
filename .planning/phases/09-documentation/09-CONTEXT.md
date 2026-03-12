# Phase 9: Documentation - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace all instances of "PAUL" with "OpenPAUL" and "paul" with "openpaul" in documentation, command names, functions, user-facing text, and directory structures. This includes renaming the project directory from `.paul/` to `.openpaul/` with migration support.

</domain>

<decisions>
## Implementation Decisions

### Renaming Scope

- **Function names:** Rename all `paulX` functions to `openpaulX` (e.g., `paulInit` → `openpaulInit`)
- **Project directory:** Rename from `.paul/` to `.openpaul/` with fallback migration support
- **Source file names:** Keep as-is (`init.ts`, `plan.ts`, etc.)
- **Test file names:** Keep as-is, matching source file names
- **Generated output:** Update all references from `/paul:` to `/openpaul:` in STATE.md, templates, and all generated files

### Backward Compatibility

- **Command names:** Clean break — only `/openpaul:` commands work (no `/paul:` aliases)
- **npm package:** No deprecation package — clean break
- **Migration approach:** Document manual steps in README (user renames `.paul/` to `.openpaul/` themselves)
- **Code fallback:** Support both `.openpaul/` (primary) and `.paul/` (fallback) for reading existing project state

### User Migration

- **Approach:** Documentation only — README includes manual migration instructions
- **No auto-migration script:** User explicitly chose documentation over automation

### Verification Approach

- **Automated tests:** Yes, create Jest tests in `src/tests/branding/`
- **CI check:** Yes, add CI step to catch "PAUL" vs "OpenPAUL" inconsistencies
- **Scope:** OpenCode decides exact scope of verification coverage

### OpenCode's Discretion

- Exact function renaming approach (incremental vs batch)
- Test file naming convention (branding.test.ts vs openpaul-branding.test.ts)
- Detailed verification scope for CI checks
- Order of file updates to minimize breaking changes during implementation

</decisions>

<specifics>
## Specific Ideas

- Commands should be `/openpaul:init`, `/openpaul:plan`, etc. — clean, consistent prefix
- Project directory `.openpaul/` matches npm package name `@krisgray/openpaul`
- Code should check `.openpaul/` first, fall back to `.paul/` for migration compatibility
- README.md is the primary documentation to update — currently uses "PAUL" throughout
- Remove all `paul:` command aliases from `src/index.ts` registrations

## Files Requiring Updates

### Command Files (32 files)
All files in `src/commands/` need:
- Function export renamed (`paulX` → `openpaulX`)
- Tool name updated (where using `paul:` prefix)
- User-facing strings updated (`/paul:` → `/openpaul:`, `.paul/` → `.openpaul/`)

### Index Files
- `src/index.ts` — Export names, plugin class name, command registrations
- `src/commands/index.ts` — Export statements

### Template Files
- All files in `src/templates/` that reference `.paul/` or `/paul:`

### Documentation
- `README.md` — Complete rewrite for OpenPAUL branding
- `package.json` — Description field

### Storage/Utility Files
- `src/storage/file-manager.ts` — Directory paths
- `src/storage/config-manager.ts` — Config path resolution
- `src/storage/flows-manager.ts` — Flows path resolution
- `src/state/state-manager.ts` — State path resolution
- Any other files referencing `.paul/` directory

</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-documentation*
*Context gathered: 2026-03-12*
