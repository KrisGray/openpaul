# Phase 7: Quality - Research

**Researched:** 2026-03-11
**Domain:** CLI commands for manual acceptance testing and plan fixing
**Confidence:** HIGH

## Summary

Phase 7 implements two commands that close the verification loop: `/openpaul:verify` for manual acceptance testing and `/openpaul:plan-fix` for creating fix plans from verification issues. The implementation follows existing command patterns (pause, resume, complete-milestone) with confirmation flows, uses PrePlanningManager patterns for file generation, and leverages existing plan structure with must_haves verification.

**Primary recommendation:** Follow existing command patterns from complete-milestone.ts (confirmation flow), pause.ts (state management), and consider-issues.ts (ISSUES.md format). Use alpha-suffix plan naming (06-01a, 06-01b) matching existing split plan patterns.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Verify Checklist Structure
- **Source:** Extract verification items from SUMMARY.md must_haves/truths/artifacts
- **Item detail:** Truth-based — each "truth" from must_haves becomes one checklist item with clear pass/fail criteria
- **Display:** Interactive numbered list — numbered items, user enters number to mark pass/fail, shows progress (X/Y passed)
- **Failed handling:** Prompt for issue description, severity, category. Save to UAT-ISSUES.md for later fixing.

#### Test Execution Flow
- **Skipping:** Yes, users can skip items and come back later. Supports re-ordering.
- **Completion with failures:** No blocking — user can mark phase complete even with failures. Issues get tracked in UAT-ISSUES.md.
- **Missing SUMMARY.md:** Show clear error: "SUMMARY.md not found. Run /gsd-execute-phase first to generate it."
- **Output:** Create both UAT.md (pass/fail summary + timestamp) and UAT-ISSUES.md (failed item details).

#### UAT-ISSUES.md Format
- **Structure:** Structured table + details sections. Table columns: ID, Item, Status, Severity, Category. Below: detailed description for each failed item.
- **Severity levels:** Critical / Major / Minor. Critical = blocking, Major = should fix, Minor = nice to have.
- **Categories:** Functional / Visual / Performance / Configuration. Covers main UAT areas.
- **Linking:** Auto-link issues to the plan that created the failing artifact/truth. Shows "Fix plan: 06-01".

#### Plan-fix Behavior
- **Modification type:** Create new plans only. Never modify existing plans. Keeps history intact.
- **Plan numbering:** Alpha suffix — 06-01a, 06-01b, 06-01c. Clear sequence, easy to understand.
- **Wave assignment:** Inherit parent's wave. If parent was wave 2, new plan is wave 2. Clear dependency tracking.
- **Auto-execution:** Ask first — create the plan, then ask user: "Run /gsd-execute-phase now?" Gives user control.

### OpenCode's Discretion
- Exact wording of checklist item prompts
- Console styling and progress indicators
- Issue description template/prompt phrasing
- Wave calculation edge cases

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| QUAL-01 | User can perform manual acceptance testing with `/openpaul:verify` that generates test checklist from SUMMARY.md, guides through each test, captures results in phase UAT-ISSUES.md | SUMMARY.md parsing (must_haves/truths), ISSUES.md format from consider-issues.ts, confirmation flow patterns from complete-milestone.ts |
| QUAL-02 | User can fix plans based on verification issues with `/openpaul:plan-fix` that reads UAT-ISSUES.md, identifies issues requiring plan updates, creates new or modifies existing plan | Plan naming (alpha suffix: 06-01a), wave inheritance, plan file structure from PlanSchema, FileManager for plan I/O |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @opencode-ai/plugin | ^0.1.0 | Tool registration | All commands use `tool()` factory |
| zod | ^3.22.0 | Schema validation | Command params, Plan validation |
| fs (Node) | built-in | File operations | existsSync, readFileSync, mkdirSync |
| path (Node) | built-in | Path handling | join, relative, sep |

### Supporting (existing codebase utilities)
| Utility | Location | Purpose | When to Use |
|---------|----------|---------|-------------|
| formatHeader, formatBold, formatList | src/output/formatter.ts | Consistent CLI output | All user-facing output |
| atomicWrite | src/storage/atomic-writes.ts | Safe file writes | UAT.md, UAT-ISSUES.md, new PLAN.md |
| FileManager | src/storage/file-manager.ts | Plan/Summary I/O | readPlan, readSummary, writePlan |
| PrePlanningManager | src/storage/pre-planning-manager.ts | Phase directory resolution | resolvePhaseDir, writeIssues pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom UAT format | Reuse ISSUES.md format | ISSUES.md uses severity/grouping; UAT needs pass/fail + plan linkage — use ISSUES.md as base, extend for UAT |

**Installation:**
No new dependencies required. All utilities exist in codebase.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── commands/
│   ├── verify.ts          # /openpaul:verify command
│   ├── plan-fix.ts        # /openpaul:plan-fix command
│   └── index.ts           # Export new commands
├── storage/
│   └── quality-manager.ts # UAT file management (optional, can inline)
├── types/
│   └── quality.ts         # UAT types (if needed)
└── tests/
    └── commands/
        ├── verify.test.ts
        └── plan-fix.test.ts
```

### Pattern 1: Command Factory with Zod Validation
**What:** All commands use `tool()` factory with Zod schemas for parameter validation.
**When to use:** All new commands.
**Example:**
```typescript
// Source: src/commands/complete-milestone.ts
const toolFactory = tool as unknown as (input: any) => any

export const paulVerify = toolFactory({
  name: 'openpaul:verify',
  description: 'Perform manual acceptance testing',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number'),
    plan: z.string().optional().describe('Plan ID (defaults to current)'),
    item: z.number().optional().describe('Item number to test'),
    result: z.enum(['pass', 'fail', 'skip']).optional(),
  }),
  execute: async (args, context) => {
    // Implementation
  },
})
```

### Pattern 2: Confirmation Flow
**What:** Commands show context first, require `--confirm` flag to proceed.
**When to use:** Destructive or significant operations.
**Example:**
```typescript
// Source: src/commands/resume.ts:59-61
if (!confirm) {
  return formatResumeConfirmation(session, context.directory)
}
// Proceed with operation...

// Source: src/commands/complete-milestone.ts:142-152
if (!args.confirm) {
  return summaryDisplay + '\n\n' +
    formatBold('This will:') + '\n' +
    formatList([
      'Archive milestone to .planning/MILESTONE-ARCHIVE.md',
      'Collapse phases to <details> section in ROADMAP.md',
    ]) + '\n\n' +
    formatBold('Confirm?') + ' Re-run with --confirm to proceed:\n' +
    `/openpaul:complete-milestone --confirm`
}
```

### Pattern 3: File Manager for Plans/Summaries
**What:** Use FileManager for reading plans and summaries.
**When to use:** Any plan or summary file access.
**Example:**
```typescript
// Source: src/storage/file-manager.ts:178-181
readPlan(phaseNumber: number, planId: string): Plan | null {
  const filePath = this.getPlanPath(phaseNumber, planId)
  return this.readJSON(filePath, PlanSchema)
}

// Source: src/storage/file-manager.ts:220-223
readSummary(phaseNumber: number, planId: string): Summary | null {
  const filePath = this.getSummaryPath(phaseNumber, planId)
  return this.readJSON(filePath, SummarySchema)
}
```

### Pattern 4: ISSUES.md Format
**What:** Structured markdown with severity grouping and summary table.
**When to use:** UAT-ISSUES.md follows this pattern.
**Example:**
```typescript
// Source: src/storage/pre-planning-manager.ts:230-278
private generateIssuesContent(artifact: IssuesArtifact): string {
  const lines: string[] = [
    `# Phase ${artifact.phase}: Issues and Risks`,
    '',
    `**Created:** ${artifact.createdAt}`,
    '**Status:** Open',
    '',
  ]

  // Group by severity
  const groupedIssues = this.groupIssuesBySeverity(artifact.issues)

  for (const severity of ['critical', 'high', 'medium', 'low']) {
    // Add issues for each severity
  }

  // Summary table
  lines.push('## Summary')
  lines.push('| Severity | Count |')
  lines.push('|----------|-------|')
  // ...
}
```

### Pattern 5: Alpha-Suffix Plan Naming
**What:** Split/fix plans use alpha suffixes: `06-01a`, `06-01b`, `06-01c`.
**When to use:** Creating fix plans from verification issues.
**Example:**
```
// Existing patterns in .planning/phases/03-session-management/:
// - 03-06a-PLAN.md
// - 03-06b-PLAN.md
// - 03-06c-PLAN.md

// Algorithm for next alpha suffix:
function getNextPlanId(phaseNumber: number, basePlanId: string): string {
  // List existing plans matching pattern "{phase}-{base}[a-z]*"
  // Find highest suffix (a, b, c, ...)
  // Return next in sequence (if 'c' exists, return 'd')
}
```

### Anti-Patterns to Avoid
- **Don't modify existing plans:** Create new plans only. Preserves history and traceability.
- **Don't use synchronous prompts:** OpenCode CLI doesn't support interactive readline. Use `--item` and `--result` flags instead.
- **Don't hardcode phase directories:** Use PrePlanningManager.resolvePhaseDir() for location resolution.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plan file I/O | Custom JSON read/write | FileManager.readPlan/writePlan | Atomic writes, schema validation |
| Phase directory lookup | Manual path construction | PrePlanningManager.resolvePhaseDir | Handles .paul vs .openpaul |
| Output formatting | Console.log templates | formatHeader, formatBold, formatList | Consistent styling |
| File writes | fs.writeFileSync | atomicWrite | Zero data loss on crash |
| Plan validation | Manual type checks | PlanSchema.parse | Zod validation, detailed errors |

**Key insight:** All infrastructure exists. Focus on command logic, not file handling.

## Common Pitfalls

### Pitfall 1: Missing SUMMARY.md
**What goes wrong:** User runs `/openpaul:verify` before plan execution.
**Why it happens:** SUMMARY.md is generated by /gsd-execute-phase, not /openpaul:plan.
**How to avoid:** Check SUMMARY.md exists early, show actionable error.
**Warning signs:** Plan exists but no SUMMARY.md in phase directory.

```typescript
// Pattern from CONTEXT.md:
if (!summaryPath) {
  return formatHeader(2, 'Cannot Verify') + '\n\n' +
    'SUMMARY.md not found. Run /gsd-execute-phase first to generate it.\n\n' +
    formatBold('What to do:') + '\n' +
    formatList([
      'Run `/gsd-execute-phase` to execute the plan',
      'Then re-run `/openpaul:verify`',
    ])
}
```

### Pitfall 2: Alpha Suffix Collision
**What goes wrong:** Creating `06-01a` when it already exists.
**Why it happens:** Not checking existing plans before generating ID.
**How to avoid:** Scan phase directory for existing `{phase}-{base}[a-z]*` patterns.
**Warning signs:** writePlan returns "file exists" error.

```typescript
// Safe alpha suffix generation:
function generateNextPlanId(phaseDir: string, basePlanId: string): string {
  const files = readdirSync(phaseDir)
  const pattern = new RegExp(`^\\d{2}-${basePlanId}[a-z]?-PLAN\\.md$`)
  const matches = files.filter(f => pattern.test(f))
  
  if (matches.length === 0) return `${basePlanId}a`
  
  const suffixes = matches
    .map(f => f.match(/[a-z](?=-PLAN)/)?.[0])
    .filter(Boolean)
    .sort()
  
  const lastSuffix = suffixes[suffixes.length - 1] || ''
  const nextSuffix = String.fromCharCode(lastSuffix.charCodeAt(0) + 1)
  return `${basePlanId}${nextSuffix}`
}
```

### Pitfall 3: Wave Mismatch
**What goes wrong:** Fix plan has wrong wave number, breaks dependency tracking.
**Why it happens:** Not reading parent plan's wave field.
**How to avoid:** Always inherit wave from parent plan.
**Warning signs:** Plan executes out of order.

```typescript
// Source: PlanSchema src/types/plan.ts:124-143
// Inherit wave from parent:
const parentPlan = fileManager.readPlan(phaseNumber, parentPlanId)
const newPlan: Plan = {
  // ...
  wave: parentPlan.wave,  // Inherit parent's wave
  depends_on: [parentPlanId],  // Depend on parent
  // ...
}
```

### Pitfall 4: UAT State Loss
**What goes wrong:** User progress lost when re-running verify.
**Why it happens:** Not persisting intermediate state.
**How to avoid:** Write UAT.md after each item, support resume.
**Warning signs:** User has to restart verification from beginning.

## Code Examples

### Parsing SUMMARY.md must_haves
```typescript
// SUMMARY.md has must_haves in YAML frontmatter
// Source: .planning/phases/03-session-management/03-06a-PLAN.md:22-45

interface ParsedSummary {
  mustHaves: {
    truths: string[]
    artifacts: Array<{ path: string; provides: string; min_lines?: number }>
    keyLinks: Array<{ from: string; to: string; via: string; pattern: string }>
  }
}

function parseSummaryFrontmatter(content: string): ParsedSummary | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
  if (!frontmatterMatch) return null
  
  // Parse YAML (can use gray-matter or simple regex for this format)
  const yaml = frontmatterMatch[1]
  const truthsMatch = yaml.match(/truths:\s*\n((?:\s+- .+\n?)+)/)
  const artifactsMatch = yaml.match(/artifacts:\s*\n((?:\s+- .+\n?)+)/)
  
  return {
    mustHaves: {
      truths: truthsMatch 
        ? truthsMatch[1].split('\n').filter(l => l.trim()).map(l => l.replace(/^\s+- /, ''))
        : [],
      // ... parse artifacts similarly
    }
  }
}
```

### UAT.md Format
```markdown
# Phase 6: User Acceptance Testing

**Plan:** 06-01
**Tested:** 2026-03-11T15:30:00Z
**Status:** Partial (2/3 passed)

## Results

| # | Item | Result | Notes |
|---|------|--------|-------|
| 1 | SessionState has comprehensive test coverage | ✅ PASS | 25 tests |
| 2 | SessionManager tests cover save, load, delete | ✅ PASS | 18 tests |
| 3 | All tests pass with Jest | ❌ FAIL | See UAT-ISSUES.md |

## Summary

- **Passed:** 2
- **Failed:** 1
- **Skipped:** 0
- **Total:** 3

---
*Generated by /openpaul:verify*
```

### UAT-ISSUES.md Format
```markdown
# Phase 6: UAT Issues

**Created:** 2026-03-11T15:30:00Z
**Source Plan:** 06-01

## Issues

| ID | Item | Status | Severity | Category | Fix Plan |
|----|------|--------|----------|----------|----------|
| 1 | Jest tests failing | Open | Critical | Functional | 06-01a |

## Details

### Issue 1: Jest tests failing
- **Severity:** Critical
- **Category:** Functional
- **Source Item:** All tests pass with Jest
- **Description:** 3 tests in session-manager.test.ts are failing due to async timing issues
- **Suggested Fix:** Add proper async/await handling in test setup
- **Created:** 2026-03-11T15:30:00Z

---
*Generated by /openpaul:verify*
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Interactive readline prompts | Flag-based item/result selection | Phase 3+ | CLI-friendly, no stdin issues |
| Single ISSUES.md | UAT.md + UAT-ISSUES.md split | This phase | Separate pass/fail from issues |

**Deprecated/outdated:**
- Interactive prompts: OpenCode CLI doesn't support stdin readline. Use `--item N --result pass|fail|skip` instead.

## Open Questions

1. **How to handle multiple SUMMARY.md files in a phase?**
   - What we know: Plans can have multiple SUMMARY.md files (one per plan)
   - What's unclear: Should verify check all summaries or just the latest?
   - Recommendation: Start with `--plan` flag to specify which plan to verify, default to current plan from phase state

2. **Should plan-fix support batch fixing multiple issues?**
   - What we know: UAT-ISSUES.md may have multiple issues
   - What's unclear: One fix plan per issue, or batch related issues into one plan?
   - Recommendation: Start with one issue = one fix plan. Can add batch support in future.

## Sources

### Primary (HIGH confidence)
- src/commands/complete-milestone.ts - Confirmation flow pattern
- src/commands/pause.ts - State management pattern
- src/commands/resume.ts - Confirmation + context display pattern
- src/commands/consider-issues.ts - ISSUES.md format
- src/storage/file-manager.ts - Plan/Summary I/O
- src/storage/pre-planning-manager.ts - Phase directory resolution, issue generation
- src/types/plan.ts - Plan schema with must_haves structure
- .planning/phases/03-session-management/03-06a-PLAN.md - Example plan with must_haves
- .planning/phases/03-session-management/03-08-SUMMARY.md - Example summary structure

### Secondary (MEDIUM confidence)
- Existing alpha-suffix plan files (03-06a, 03-06b, 03-06c) - Naming pattern

### Tertiary (LOW confidence)
- None - all patterns verified in codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All utilities exist in codebase, no new dependencies
- Architecture: HIGH - Command patterns well-established across 20+ existing commands
- Pitfalls: HIGH - Based on observed patterns and CONTEXT.md decisions

**Research date:** 2026-03-11
**Valid until:** 30 days (stable codebase patterns)
