# Phase 6: Pre-Planning + Research - Research

**Researched:** 2026-03-11
**Domain:** CLI command implementation, artifact generation, parallel agent coordination
**Confidence:** HIGH

## Summary

Phase 6 implements 6 CLI commands for pre-planning and research activities, plus 2 manager classes (PrePlanningManager, ResearchManager). The phase builds on established patterns from Phase 3-5: tool-based command registration, Zod schema validation, atomic file writes, and manager-based storage patterns. Key complexity lies in research depth modes (--quick/--standard/--deep) and parallel agent coordination with status dashboards.

**Primary recommendation:** Follow existing command patterns (discuss-milestone.ts, milestone.ts) with manager classes mirroring MilestoneManager structure. Use template generators for artifact files, implement depth mode as conditional logic within discover command, and use existing formatter utilities for status dashboards.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Command Output Format:**
- Default output: Summary to console with brief preview + artifact file created
- --json flag: Yes, for scripting and CI use. JSON goes to stdout, human messages to stderr
- -v/--verbose flag: Yes, shows more progress details, intermediate steps, debug info
- Error handling: Clear human-readable error message with hint to fix + non-zero exit code

**Artifact Structure:**
- CONTEXT.md: Enforce standard template (domain, decisions, specifics, deferred sections)
- ASSUMPTIONS.md: Structured list with: statement, validation_status, confidence, impact
- DISCOVERY.md: Standard research template sections: Summary, Findings, Options Considered, Recommendation, References
- ISSUES.md: Categorized by severity (Critical/High/Medium/Low) with description, affected areas, suggested mitigation

**Research Depth Modes:**
- --quick: Verbal response only, no file created, 2-5 minutes
- --standard (default): Creates DISCOVERY.md with 2-3 top options, key tradeoffs, 15-30 minutes
- --deep: Creates DISCOVERY.md with 5+ options, edge cases, security concerns, requires confirmation, 1+ hour

**Parallel Research Coordination:**
- Progress display: Agent status dashboard showing each agent's topic, status, summary
- Result aggregation: Single synthesized RESEARCH.md organized by theme
- Agent failure handling: Continue with partial results, failed agent noted in report
- Max parallel agents: 4 agents maximum

### OpenCode's Discretion
- Exact wording/formatting of console summaries
- Error message phrasing and hint details
- Dashboard layout for parallel agent status
- Theme organization within synthesized RESEARCH.md

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | `/openpaul:discuss` creates CONTEXT.md with goals, approach, constraints, open questions | Template generator pattern from `generateMilestoneContext()`, formatter utilities |
| PLAN-02 | `/openpaul:assumptions` creates ASSUMPTIONS.md with validation status | Zod schema for structured list, atomicWrite for persistence |
| PLAN-03 | `/openpaul:discover` supports 3 depth levels (Quick/Standard/Deep) | Conditional logic based on depth flag, confirmation prompt for deep |
| PLAN-04 | `/openpaul:consider-issues` creates ISSUES.md with categorized risks | Severity enum, structured issue template |
| RSCH-01 | `/openpaul:research` executes research with verification and confidence levels | ResearchManager pattern, confidence enum (HIGH/MEDIUM/LOW) |
| RSCH-02 | `/openpaul:research-phase` auto-detects unknowns, spawns parallel agents | Phase analysis, Task tool for spawning, result aggregation |
| BRND-02 | Commands use "openpaul" prefix in command names and file paths | Follow existing dual-registration pattern in index.ts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | ^5.0.0 | Type safety, interfaces | Established in Phase 1 |
| Zod | ^3.22.0 | Schema validation | Used in all commands for input validation |
| @opencode-ai/plugin | ^1.2.0 | Tool registration | Required for command registration |
| Jest | ^29.0.0 | Testing | Established test framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs (Node) | built-in | File operations | All artifact generation |
| path (Node) | built-in | Path resolution | Cross-platform file paths |

### Internal Utilities (Reuse)
| Module | Purpose | Location |
|--------|---------|----------|
| atomicWrite | Safe file writes | `src/storage/atomic-writes.ts` |
| formatHeader, formatBold, formatList | Output formatting | `src/output/formatter.ts` |
| formatGuidedError | Error formatting | `src/output/error-formatter.ts` |

**Installation:** No new dependencies required.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── commands/
│   ├── discuss.ts           # /openpaul:discuss command
│   ├── assumptions.ts       # /openpaul:assumptions command
│   ├── discover.ts          # /openpaul:discover command
│   ├── consider-issues.ts   # /openpaul:consider-issues command
│   ├── research.ts          # /openpaul:research command
│   └── research-phase.ts    # /openpaul:research-phase command
├── storage/
│   ├── pre-planning-manager.ts  # Artifact generation/persistence
│   └── research-manager.ts      # Research coordination
├── types/
│   ├── pre-planning.ts      # Types for pre-planning artifacts
│   └── research.ts          # Types for research results
└── tests/
    ├── commands/
    │   ├── discuss.test.ts
    │   ├── assumptions.test.ts
    │   ├── discover.test.ts
    │   ├── consider-issues.test.ts
    │   ├── research.test.ts
    │   └── research-phase.test.ts
    └── storage/
        ├── pre-planning-manager.test.ts
        └── research-manager.test.ts
```

### Pattern 1: Tool Command Structure
**What:** Standard command pattern using `@opencode-ai/plugin` tool wrapper
**When to use:** All 6 commands follow this pattern
**Example:**
```typescript
// Source: src/commands/discuss-milestone.ts (existing pattern)
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'

const toolFactory = tool as unknown as (input: any) => any

export const paulDiscuss = toolFactory({
  name: 'openpaul:discuss',
  description: 'Explore phase goals and capture planning context',
  parameters: z.object({
    phase: z.number().int().positive().describe('Phase number'),
    topic: z.string().optional().describe('Discussion topic'),
    // ... other params
  }),
  execute: async (args, context) => {
    // Implementation
  },
})
```

### Pattern 2: Manager Class Structure
**What:** Manager classes handle storage and business logic, commands delegate to managers
**When to use:** PrePlanningManager and ResearchManager
**Example:**
```typescript
// Source: src/storage/milestone-manager.ts (existing pattern)
export class PrePlanningManager {
  private projectRoot: string

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot
  }

  resolveContextPath(phaseNumber: number): string | null {
    // Check .paul/ and .openpaul/ locations
  }

  createContext(phaseNumber: number, params: ContextParams): Context {
    // Validate, generate content, write atomically
  }

  getContext(phaseNumber: number): Context | null {
    // Parse existing artifact
  }
}
```

### Pattern 3: Template Generator Functions
**What:** Pure functions that generate markdown content from structured data
**When to use:** All artifact file generation
**Example:**
```typescript
// Source: src/commands/discuss-milestone.ts (existing pattern)
function generateContextContent(params: {
  phase: number
  domain: string
  decisions: Decision[]
  specifics: string[]
  deferred: string[]
  timestamp: string
}): string {
  const lines = [
    '# Phase ' + params.phase + ': Context',
    '',
    '**Gathered:** ' + params.timestamp,
    '**Status:** Ready for planning',
    '',
    '<domain>',
    '## Phase Boundary',
    '',
    params.domain,
    '',
    '</domain>',
    // ... more sections
  ]
  return lines.join('\n')
}
```

### Pattern 4: Depth Mode Conditional Logic
**What:** Switch/conditional based on depth flag determines output behavior
**When to use:** /openpaul:discover command
**Example:**
```typescript
// Conceptual pattern for depth modes
async function executeDiscover(args: DiscoverArgs, context: ToolContext) {
  if (args.depth === 'quick') {
    // Verbal response only, no file creation
    return formatQuickResponse(findings)
  }
  
  if (args.depth === 'deep') {
    // Show time estimate, require confirmation
    const estimate = '30-60 minutes'
    if (!args.confirm) {
      return formatConfirmationPrompt(estimate)
    }
  }
  
  // Standard or Deep: create DISCOVERY.md
  const content = generateDiscoveryContent(findings, args.depth)
  await atomicWrite(discoveryPath, content)
  return formatSuccessOutput(discoveryPath, findings)
}
```

### Anti-Patterns to Avoid
- **Don't create separate command files for each depth mode:** Depth is a flag, not a separate command
- **Don't use synchronous fs operations:** Always use atomicWrite for file persistence
- **Don't duplicate path resolution logic:** Use resolveXxxPath methods in managers
- **Don't skip Zod validation:** All command inputs must be validated with Zod schemas

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File persistence | Custom write logic | `atomicWrite` from atomic-writes.ts | Handles atomic operations, prevents corruption |
| Output formatting | Manual markdown | `formatHeader`, `formatBold`, `formatList` | Consistent styling, reuse existing patterns |
| Error messages | Ad-hoc error strings | `formatGuidedError` | Structured errors with hints and next steps |
| Path resolution | Hardcoded paths | Manager `resolve*Path()` methods | Handles .paul/ vs .openpaul/ fallback |
| Zod schema building | Manual type definitions | `z.object()`, `z.enum()` | Type safety with runtime validation |

**Key insight:** This project has established patterns for all common operations. Every new command should mirror existing command implementations and delegate storage to manager classes.

## Common Pitfalls

### Pitfall 1: Forgetting Dual Path Resolution
**What goes wrong:** Code assumes only `.paul/` or `.openpaul/` exists
**Why it happens:** Project supports both legacy `.paul/` and new `.openpaul/` directories
**How to avoid:** Always use manager methods that check both locations (pattern: `resolve*Path()`)
**Warning signs:** Tests pass but production fails, or vice versa

### Pitfall 2: Missing Depth Mode Edge Cases
**What goes wrong:** Deep mode doesn't confirm, quick mode creates files
**Why it happens:** Conditional logic for depth modes is easy to get wrong
**How to avoid:** Write explicit tests for each depth mode before implementation
**Warning signs:** Discover command always behaves the same regardless of --quick/--deep flags

### Pitfall 3: Parallel Agent Result Fragmentation
**What goes wrong:** research-phase returns multiple files instead of synthesized RESEARCH.md
**Why it happens:** Easier to save individual results than aggregate
**How to avoid:** Design result aggregation into ResearchManager from start
**Warning signs:** Multiple DISCOVERY-*.md files in phase directory

### Pitfall 4: Inconsistent Error Format
**What goes wrong:** Some commands use formatGuidedError, others return plain strings
**Why it happens:** Error handling added later without consistency
**How to avoid:** All errors must use formatGuidedError with title, message, suggestedFix, nextSteps
**Warning signs:** Error messages look different across commands

## Code Examples

### Context.md Generator
```typescript
// Pattern from discuss-milestone.ts
function generateContextContent(params: {
  phase: number
  domain: string
  decisions: Decision[]
  specifics: string[]
  deferred: string[]
  timestamp: string
}): string {
  const lines = [
    '# Phase ' + params.phase + ': Context',
    '',
    '**Gathered:** ' + params.timestamp,
    '**Status:** Ready for planning',
    '',
    '<domain>',
    '## Phase Boundary',
    params.domain,
    '</domain>',
    '',
    '<decisions>',
    '## Implementation Decisions',
    '',
    ...params.decisions.map(d => '- **' + d.title + ':** ' + d.description),
    '</decisions>',
    '',
    '<specifics>',
    '## Specific Ideas',
    '',
    ...params.specifics.map(s => '- ' + s),
    '</specifics>',
    '',
    '<deferred>',
    '## Deferred Ideas',
    '',
    params.deferred.length > 0 
      ? params.deferred.map(d => '- ' + d).join('\n')
      : 'None — discussion stayed within phase scope.',
    '</deferred>',
    '',
    '---',
    '',
    '*Phase: ' + params.phase.toString().padStart(2, '0') + '*',
    '*Context gathered: ' + params.timestamp + '*',
    ''
  ]
  return lines.join('\n')
}
```

### Assumptions.md Schema
```typescript
// Zod schema for structured assumptions
const AssumptionSchema = z.object({
  statement: z.string().min(1),
  validation_status: z.enum(['unvalidated', 'validated', 'invalidated']),
  confidence: z.enum(['high', 'medium', 'low']),
  impact: z.string().min(1),
})

const AssumptionsFileSchema = z.object({
  phase: z.number().int().positive(),
  assumptions: z.array(AssumptionSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

type Assumption = z.infer<typeof AssumptionSchema>
type AssumptionsFile = z.infer<typeof AssumptionsFileSchema>
```

### Status Dashboard for Parallel Agents
```typescript
// Conceptual pattern for agent status display
function formatAgentDashboard(agents: AgentStatus[]): string {
  const statusEmoji = {
    'spawning': '🔄',
    'running': '⏳', 
    'complete': '✅',
    'failed': '❌',
  }
  
  let output = formatHeader(2, 'Research Progress') + '\n\n'
  
  for (const agent of agents) {
    const emoji = statusEmoji[agent.status]
    output += `${emoji} **${agent.topic}** — ${agent.status}\n`
    if (agent.summary) {
      output += `   ${agent.summary}\n`
    }
  }
  
  const completed = agents.filter(a => a.status === 'complete').length
  output += `\n**Progress:** ${completed}/${agents.length} agents complete\n`
  
  return output
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single command output format | Depth-mode conditional output | Phase 6 | User controls verbosity/time investment |
| Single agent research | Parallel agent spawning | Phase 6 | Faster comprehensive research |
| Ad-hoc artifact formats | Enforced templates with sections | Phase 6 | Consistent machine-parseable output |

**Deprecated/outdated:**
- Plain text error messages: Use formatGuidedError with structured sections

## Open Questions

1. **How does OpenCode Task tool spawn parallel agents?**
   - What we know: ROADMAP.md mentions "parallel subagent spawning via OpenCode Task tool"
   - What's unclear: Exact API for spawning, status tracking, and result collection
   - Recommendation: Research OpenCode plugin Task API during implementation, may need Context7 lookup

2. **What triggers research-phase auto-detection of unknowns?**
   - What we know: Command "analyzes phase description, identifies unknowns"
   - What's unclear: Detection algorithm, what constitutes an "unknown"
   - Recommendation: Start with simple heuristics (TBD in phase requirements, technical terms without definitions)

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns (discuss-milestone.ts, milestone-manager.ts, formatter.ts)
- REQUIREMENTS.md for phase requirements mapping
- CONTEXT.md for locked decisions

### Secondary (MEDIUM confidence)
- ROADMAP.md for phase structure and success criteria
- Existing test patterns (milestone.test.ts, discuss-milestone.test.ts)

### Tertiary (LOW confidence)
- OpenCode Task tool API (needs verification during implementation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Established patterns from Phases 1-5
- Architecture: HIGH - Clear command and manager patterns exist
- Pitfalls: HIGH - Based on analysis of existing codebase and CONTEXT.md constraints

**Research date:** 2026-03-11
**Valid until:** 30 days (stable patterns)
