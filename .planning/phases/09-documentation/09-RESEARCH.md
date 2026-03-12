# Phase 9: Documentation - Research

**Researched:** 2026-03-12
**Domain:** Branding/Code Rename - Replace PAUL with OpenPAUL branding
**Confidence:** HIGH

## Summary

This phase rebrands the project from "PAUL" to "OpenPAUL" across all code, documentation, and user-facing strings. The scope includes function renames (`paulX` → `openpaulX`), command prefix changes (`paul:` → `openpaul:`), directory path updates (`.paul/` → `.openpaul/`), and documentation updates.

**Primary recommendation:** Rename all `paulX` functions to `openpaulX`, remove `paul:` command aliases (clean break), update all path references to `.openpaul/` with fallback support for legacy `.paul/` directories.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Function names:** Rename all `paulX` functions to `openpaulX` (e.g., `paulInit` → `openpaulInit`)
- **Project directory:** Rename from `.paul/` to `.openpaul/` with fallback migration support
- **Source file names:** Keep as-is (`init.ts`, `plan.ts`, etc.)
- **Test file names:** Keep as-is, matching source file names
- **Generated output:** Update all references from `/paul:` to `/openpaul:` in STATE.md, templates, and all generated files
- **Command names:** Clean break — only `/openpaul:` commands work (no `/paul:` aliases)
- **npm package:** No deprecation package — clean break
- **Migration approach:** Document manual steps in README (user renames `.paul/` to `.openpaul/` themselves)
- **Code fallback:** Support both `.openpaul/` (primary) and `.paul/` (fallback) for reading existing project state
- **User Migration:** Documentation only — README includes manual migration instructions; no auto-migration script
- **Automated tests:** Yes, create Jest tests in `src/tests/branding/`
- **CI check:** Yes, add CI step to catch "PAUL" vs "OpenPAUL" inconsistencies

### OpenCode's Discretion

- Exact function renaming approach (incremental vs batch)
- Test file naming convention (branding.test.ts vs openpaul-branding.test.ts)
- Detailed verification scope for CI checks
- Order of file updates to minimize breaking changes during implementation

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BRND-01 | All instances of "PAUL" replaced with "OpenPAUL" in documentation, command names, and user-facing text | Function renames, command prefix removal, path updates, README rewrite |
| BRND-02 | All instances of "paul" replaced with "openpaul" in command names, file paths, and configuration | Function renames (`paulX` → `openpaulX`), path resolution updates, index exports |

</phase_requirements>

## Standard Stack

### Core

This phase is a rename/branding effort, not a library integration. The "stack" is the existing codebase:

| Component | Purpose | Why Standard |
|-----------|---------|--------------|
| Jest 29 | Test framework | Already configured, all existing tests use Jest |
| TypeScript 5 | Language | Existing codebase is TypeScript |
| Zod 3.22 | Validation | Existing validation pattern |

### Renaming Patterns

| Type | Old Pattern | New Pattern | Example |
|------|-------------|-------------|---------|
| Function export | `paulX` | `openpaulX` | `paulInit` → `openpaulInit` |
| Command registration | `paul:x` | `openpaul:x` | `paul:plan` → `openpaul:plan` |
| Directory path | `.paul/` | `.openpaul/` | `.paul/STATE.md` → `.openpaul/STATE.md` |
| Plugin name | `PaulPlugin` | `OpenPaulPlugin` | Class/function names |
| Service name | `paul-plugin` | `openpaul-plugin` | Log messages |

## Architecture Patterns

### Files Requiring Updates

```
src/
├── commands/
│   ├── index.ts              # Export statements (paulX → openpaulX)
│   ├── init.ts               # paulInit → openpaulInit, user strings
│   ├── plan.ts               # paulPlan → openpaulPlan, user strings
│   ├── apply.ts              # paulApply → openpaulApply, user strings
│   ├── unify.ts              # paulUnify → openpaulUnify, user strings
│   ├── progress.ts           # paulProgress → openpaulProgress
│   ├── status.ts             # paulStatus → openpaulStatus
│   ├── help.ts               # paulHelp → openpaulHelp
│   ├── pause.ts              # paulPause → openpaulPause
│   ├── resume.ts             # paulResume → openpaulResume
│   ├── handoff.ts            # paulHandoff → openpaulHandoff
│   ├── add-phase.ts          # paulAddPhase → openpaulAddPhase
│   ├── remove-phase.ts       # paulRemovePhase → openpaulRemovePhase
│   ├── milestone.ts          # paulMilestone → openpaulMilestone
│   ├── complete-milestone.ts # paulCompleteMilestone → openpaulCompleteMilestone
│   ├── discuss-milestone.ts  # paulDiscussMilestone → openpaulDiscussMilestone
│   ├── discuss.ts            # paulDiscuss → openpaulDiscuss
│   ├── assumptions.ts        # paulAssumptions → openpaulAssumptions
│   ├── discover.ts           # paulDiscover → openpaulDiscover
│   ├── consider-issues.ts    # paulConsiderIssues → openpaulConsiderIssues
│   ├── research.ts           # paulResearch → openpaulResearch
│   ├── research-phase.ts     # paulResearchPhase → openpaulResearchPhase
│   ├── verify.ts             # paulVerify → openpaulVerify
│   ├── plan-fix.ts           # paulPlanFix → openpaulPlanFix
│   ├── config.ts             # paulConfig → openpaulConfig
│   ├── flows.ts              # paulFlows → openpaulFlows
│   └── map-codebase.ts       # paulMapCodebase → openpaulMapCodebase
├── index.ts                  # PaulPlugin → OpenPaulPlugin, imports, command registrations
├── storage/
│   ├── file-manager.ts       # paulDir → openPaulDir, .paul/ → .openpaul/
│   ├── config-manager.ts     # Path resolution
│   ├── flows-manager.ts      # Path resolution
│   ├── milestone-manager.ts  # Path resolution with fallback
│   ├── pre-planning-manager.ts # Path resolution
│   ├── quality-manager.ts    # Path resolution
│   ├── research-manager.ts   # Path resolution
│   └── session-manager.ts    # Path resolution
└── templates/               # All .paul/ references → .openpaul/
```

### Pattern 1: Function Renaming

**What:** Rename exported function from `paulX` to `openpaulX`
**When to use:** All command files in `src/commands/`
**Example:**
```typescript
// Before
export const paulInit: ToolDefinition = tool({ ... })

// After
export const openpaulInit: ToolDefinition = tool({ ... })
```

### Pattern 2: Dual Path Resolution with Fallback

**What:** Support both `.openpaul/` (primary) and `.paul/` (fallback) for migration compatibility
**When to use:** All path resolution in storage managers
**Example:**
```typescript
// Pattern already exists in roadmap/roadmap-manager.ts
private resolveRoadmapPath(): string | null {
  // Check .openpaul/ first (primary)
  const openPaulPath = join(this.projectRoot, '.openpaul', 'ROADMAP.md')
  if (existsSync(openPaulPath)) return openPaulPath
  
  // Fall back to .paul/ (legacy)
  const paulPath = join(this.projectRoot, '.paul', 'ROADMAP.md')
  if (existsSync(paulPath)) return paulPath
  
  return null
}
```

### Pattern 3: Clean Break Command Registration

**What:** Remove all `paul:` command aliases, keep only `openpaul:` registrations
**When to use:** `src/index.ts` tool registrations
**Example:**
```typescript
// Before (dual registration)
'paul:init': paulInit,
'openpaul:init': paulInit,

// After (single registration)
'openpaul:init': openpaulInit,
```

### Anti-Patterns to Avoid

- **Partial renames:** Don't rename some functions but not others — consistency is critical
- **Mixed prefixes:** Don't keep `paul:` aliases alongside `openpaul:` — clean break per user decision
- **Breaking fallback:** Don't remove `.paul/` fallback until users migrate — support both during transition

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path resolution | Custom path logic | Existing `resolve*Path()` pattern in managers | Consistent fallback behavior |
| Test infrastructure | New test utilities | Jest + existing patterns in `src/tests/` | 80%+ coverage already exists |

**Key insight:** This phase is about systematic find-and-replace, not new architecture. Use existing patterns consistently.

## Common Pitfalls

### Pitfall 1: Incomplete Function Renames

**What goes wrong:** Some `paulX` functions missed during rename
**Why it happens:** IDE find-replace doesn't catch all variants, manual review incomplete
**How to avoid:** Use grep to find ALL `paul[A-Z]` patterns, verify each file
**Warning signs:** TypeScript errors about missing exports after rename

### Pitfall 2: Missed User-Facing Strings

**What goes wrong:** `/paul:` or `.paul/` references remain in error messages, templates
**Why it happens:** Strings in error messages, templates, generated output are easy to miss
**How to avoid:** Grep for all string literals containing "paul" (case-insensitive)
**Warning signs:** Users see old branding in error messages or generated files

### Pitfall 3: Breaking Existing Projects

**What goes wrong:** Projects with `.paul/` directories stop working after update
**Why it happens:** Code only checks `.openpaul/` without fallback
**How to avoid:** Implement dual-path resolution in ALL storage managers
**Warning signs:** FileNotFoundError for `.openpaul/STATE.md` on existing projects

### Pitfall 4: Dist Directory Out of Sync

**What goes wrong:** TypeScript compiles but dist/ still has old names
**Why it happens:** dist/ not rebuilt after source changes
**How to avoid:** Run `npm run build` after all changes, verify dist/ output
**Warning signs:** Tests pass but runtime uses old function names

## Code Examples

### Function Rename Pattern

```typescript
// src/commands/init.ts
// Source: Existing codebase pattern

// Before
export const paulInit: ToolDefinition = tool({
  name: 'paul:init',
  // ...
})

// After
export const openpaulInit: ToolDefinition = tool({
  name: 'openpaul:init',
  // ...
})
```

### Path Resolution with Fallback

```typescript
// src/storage/file-manager.ts
// Source: Existing pattern from roadmap-manager.ts

export class FileManager {
  private openPaulDir: string
  private paulDir: string  // Keep for fallback
  
  constructor(projectRoot: string) {
    this.openPaulDir = join(projectRoot, '.openpaul')
    this.paulDir = join(projectRoot, '.paul')  // Legacy fallback
  }
  
  private resolvePath(filename: string): string {
    // Check .openpaul/ first (primary)
    const openPaulPath = join(this.openPaulDir, filename)
    if (existsSync(openPaulPath)) return openPaulPath
    
    // Fall back to .paul/ (legacy)
    return join(this.paulDir, filename)
  }
}
```

### Command Registration Cleanup

```typescript
// src/index.ts
// Source: Existing index.ts structure

export const OpenPaulPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  await client.app.log({
    body: {
      service: 'openpaul-plugin',
      level: 'info',
      message: 'OpenPAUL plugin initialized',
      // ...
    },
  })
  
  return {
    tool: {
      // Clean break - only openpaul: commands
      'openpaul:init': openpaulInit,
      'openpaul:plan': openpaulPlan,
      // ... (all commands with openpaul: prefix only)
    }
  }
}
```

## Scope Inventory

### Files Requiring Function Renames (32 command files)

| File | Function to Rename |
|------|---------------------|
| init.ts | `paulInit` → `openpaulInit` |
| plan.ts | `paulPlan` → `openpaulPlan` |
| apply.ts | `paulApply` → `openpaulApply` |
| unify.ts | `paulUnify` → `openpaulUnify` |
| progress.ts | `paulProgress` → `openpaulProgress` |
| status.ts | `paulStatus` → `openpaulStatus` |
| help.ts | `paulHelp` → `openpaulHelp` |
| pause.ts | `paulPause` → `openpaulPause` |
| resume.ts | `paulResume` → `openpaulResume` |
| handoff.ts | `paulHandoff` → `openpaulHandoff` |
| add-phase.ts | `paulAddPhase` → `openpaulAddPhase` |
| remove-phase.ts | `paulRemovePhase` → `openpaulRemovePhase` |
| milestone.ts | `paulMilestone` → `openpaulMilestone` |
| complete-milestone.ts | `paulCompleteMilestone` → `openpaulCompleteMilestone` |
| discuss-milestone.ts | `paulDiscussMilestone` → `openpaulDiscussMilestone` |
| discuss.ts | `paulDiscuss` → `openpaulDiscuss` |
| assumptions.ts | `paulAssumptions` → `openpaulAssumptions` |
| discover.ts | `paulDiscover` → `openpaulDiscover` |
| consider-issues.ts | `paulConsiderIssues` → `openpaulConsiderIssues` |
| research.ts | `paulResearch` → `openpaulResearch` |
| research-phase.ts | `paulResearchPhase` → `openpaulResearchPhase` |
| verify.ts | `paulVerify` → `openpaulVerify` |
| plan-fix.ts | `paulPlanFix` → `openpaulPlanFix` |
| config.ts | `paulConfig` → `openpaulConfig` |
| flows.ts | `paulFlows` → `openpaulFlows` |
| map-codebase.ts | `paulMapCodebase` → `openpaulMapCodebase` |
| index.ts (commands) | Update all exports |

### Files Requiring Path Updates

| File | Changes |
|------|---------|
| src/index.ts | `PaulPlugin` → `OpenPaulPlugin`, service name, imports |
| src/storage/file-manager.ts | `paulDir` → `openPaulDir`, add fallback |
| src/storage/config-manager.ts | Path resolution with fallback |
| src/storage/flows-manager.ts | Path resolution with fallback |
| src/storage/milestone-manager.ts | Already has fallback, verify consistency |
| src/storage/pre-planning-manager.ts | Path resolution with fallback |
| src/storage/quality-manager.ts | Path resolution with fallback |
| src/storage/research-manager.ts | Path resolution with fallback |
| src/storage/session-manager.ts | Path resolution with fallback |

### Documentation Files

| File | Changes |
|------|---------|
| README.md | Complete rewrite: PAUL → OpenPAUL, /paul: → /openpaul:, .paul/ → .openpaul/ |
| package.json | Description field update |

### Template Files

All files in `src/templates/` may contain `.paul/` or `/paul:` references that need updating.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `.paul/` path | Dual `.openpaul/` + `.paul/` fallback | Phase 6 | Migration compatibility |
| Dual command prefixes | Clean break to `openpaul:` only | This phase | Simplified branding |

**Deprecated/outdated:**
- `paul:` command prefix: Remove all aliases per user decision for clean break

## Open Questions

1. **CI Configuration**
   - What we know: Jest is configured, no GitHub Actions workflows found
   - What's unclear: How CI check for branding consistency should be implemented
   - Recommendation: Add a simple script that greps for "PAUL" (not in OpenPAUL) and "paul" (not in openpaul) patterns in src/, or add as a pre-commit hook

2. **Test File Location**
   - What we know: Tests exist in `src/commands/__tests__/` and `src/tests/`
   - What's unclear: Whether `src/tests/branding/` or `src/commands/__tests__/branding.test.ts`
   - Recommendation: Create in `src/tests/branding/` for new test category, matching existing pattern

## Sources

### Primary (HIGH confidence)
- Existing codebase structure analysis
- CONTEXT.md user decisions

### Secondary (MEDIUM confidence)
- grep search results for `paulX`, `.paul/`, `paul:` patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing codebase, no external libraries needed
- Architecture: HIGH - Clear patterns from existing code
- Pitfalls: HIGH - Common rename issues well-documented

**Research date:** 2026-03-12
**Valid until:** N/A - This is a rename phase, research is stable
