# Architecture Research: PAUL Plugin - 26 Remaining Commands

**Domain:** PAUL Plugin Architecture for Session, Roadmap, Milestone, Pre-Planning, Research, Quality, and Configuration Commands
**Researched:** 2026-03-05
**Confidence:** HIGH

## Executive Summary

The 26 remaining PAUL commands extend OpenPAUL's existing architecture through:

1. **Seven new manager classes** to handle domain-specific business logic
2. **FileManager extensions** for 15+ new file types (session, roadmap, research, etc.)
3. **Type-safe JSON storage** with Zod schemas for all new state files
4. **No breaking changes** to existing commands or architecture
5. **Consistent patterns** with v1.0 implementation (tool(), Zod, atomic writes)

**Build Order:** 8 phases over 8 weeks, starting with configuration (foundational) and ending with flow management (non-critical).

**Key Architectural Decisions:**
- No global managers - each command creates its own instances (matches v1.0 pattern)
- All file I/O goes through FileManager (single source of truth)
- Manager pattern for business logic separation
- Temporary handoff files for context transfer between commands
- ROADMAP.md parsed and updated, but never replaced (preserves manual edits)

## Existing Architecture Overview

### System Layers (v1.0)

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Entry Point                        │
│                      (src/index.ts)                          │
│  Registers tools: init, plan, apply, unify, progress, help  │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                      Commands Layer                          │
│                    (src/commands/*.ts)                       │
│  Each command: Zod schema + execute function + formatters   │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────┬──────────────┴──────────────┬────────────────┐
│   State      │      Storage               │   Output       │
│  Manager     │    FileManager             │  Formatters    │
│              │   Atomic Writes            │                │
└──────────────┴────────────────────────────┴────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    File System Layer                         │
│  .paul/state-phase-N.json                                   │
│  .paul/phases/{phase}-{plan}-PLAN.json                      │
│  .paul/phases/{phase}-{plan}-SUMMARY.json                   │
│  .paul/model-config.json                                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities (v1.0)

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `src/index.ts` | Plugin entry point, tool registration | OpenCode Plugin API with hooks |
| `src/commands/*.ts` | Command handlers with Zod validation | `tool()` helper from `@opencode-ai/plugin` |
| `src/state/state-manager.ts` | Load/save phase state, derive position | FileManager + state logic |
| `src/state/loop-enforcer.ts` | Enforce PLAN→APPLY→UNIFY transitions | State machine validation |
| `src/storage/file-manager.ts` | Read/write JSON files with validation | Zod schemas + atomic writes |
| `src/storage/atomic-writes.ts` | Zero-data-loss file writes | temp file + rename pattern |
| `src/output/formatter.ts` | Consistent output formatting | Markdown + emoji helpers |
| `src/output/error-formatter.ts` | Guided error messages | Structured error format |

## Extended Architecture Overview (v1.1)

### New System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Plugin Entry Point                        │
│              (src/index.ts + Hooks)                          │
│  Registers all 32 tools (6 existing + 26 new)               │
│  Hooks: session.created, session.compacted, tool.execute    │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                      Commands Layer                          │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐│
│  │   Session  │ │  Roadmap   │ │ Milestone  │ │Pre-Plan  ││
│  │ (4 cmds)   │ │  (2 cmds)  │ │  (3 cmds)  │ │ (4 cmds) ││
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘│
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │  Research  │ │   Quality  │ │   Config   │ │  Core    ││
│  │  (2 cmds)  │ │  (2 cmds)  │ │  (3 cmds)  │ │ (6 cmds) ││
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘│
│  Each command: Zod schema + execute + formatters           │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                       Managers Layer                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────┐│
│  │   Session  │ │  Roadmap   │ │ Milestone  │ │Pre-Plan  ││
│  │  Manager   │ │  Manager   │ │  Manager   │ │ Manager  ││
│  └────────────┘ └────────────┘ └────────────┘ └──────────┘│
│  ┌────────────┐ ┌────────────┐ ┌────────────┐             │
│  │  Research  │ │   Quality  │ │   Config   │ │          ││
│  │  Manager   │ │  Manager   │ │  Manager   │ │          ││
│  └────────────┘ └────────────┘ └────────────┘             │
│  Business logic separation, no shared state                 │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────┬──────────────┴──────────────┬────────────────┐
│   State      │      Storage               │   Output       │
│  Manager     │    FileManager (Extended)   │  Formatters    │
│  (Extended)  │   +15 new file types       │  (Extended)    │
└──────────────┴────────────────────────────┴────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│              Extended File System Layer (.paul/)            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐    │
│  │   Core   │ │ Session  │ │ Roadmap  │ │ Pre-Plan   │    │
│  │ (v1.0)   │ │  Files   │ │   MD     │ │   Files    │    │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐    │
│  │Research  │ │  Quality │ │  Config  │ │ Milestone   │    │
│  │  Files   │ │  Files   │ │  Files   │ │   Files    │    │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Command Category Breakdown

#### Command Categories

| Category | Commands | New Manager | New Files | Complexity | Build Phase |
|----------|----------|-------------|-----------|------------|-------------|
| **Session** | pause, resume, handoff, status | SessionManager | session-state.json, handoffs/*.json | Medium | 2 |
| **Roadmap** | add-phase, remove-phase | RoadmapManager | ROADMAP.md extensions | Medium | 3 |
| **Milestone** | milestone, complete-milestone, discuss-milestone | MilestoneManager | MILESTONE-CONTEXT.md, milestones/*.md | High | 5 |
| **Pre-Planning** | discuss, assumptions, discover, consider-issues | PrePlanningManager | CONTEXT.md, ASSUMPTIONS.md, DISCOVERY.md, ISSUES.md | Medium | 4 |
| **Research** | research, research-phase | ResearchManager | research/*.md | Medium-High | 6 |
| **Quality** | verify, plan-fix | QualityManager | VERIFICATION.md, FIX-PLAN.md | Medium | 7 |
| **Config** | config, flows, map-codebase | ConfigManager | config.json, FLOWS.md, codebase/*.md | Low | 1, 8 |
| **Core** | init, plan, apply, unify, progress, help | None | (existing) | - | Done (v1.0) |

## New Manager Components

### 1. SessionManager

**Purpose:** Track session state for pause/resume/handoff operations

**Responsibilities:**
- Save/restore session state
- Handle handoff context transfer
- Track pause/resume history

**Integration Points:**
- FileManager: Save/restore session-state.json
- Commands: pause, resume, handoff, status

**Interface:**
```typescript
class SessionManager {
  private fileManager: FileManager

  constructor(projectRoot: string)

  pause(reason?: string): Promise<void>
  resume(handoffId?: string): Promise<SessionContext | null>
  handoff(): Promise<Handoff>
  getStatus(): SessionStatus
}
```

**New State Files:**
- `.paul/session-state.json`
- `.paul/handoffs/HANDOFF-{YYYY-MM-DD-HHMMSS}.json`

**State Types:**
```typescript
interface SessionState {
  status: 'active' | 'paused' | 'handed-off'
  pausedAt?: number
  handoffId?: string
  loopPosition: {
    phase: LoopPhase
    phaseNumber: number
    planId?: string
  }
  nextAction?: string
  lastActivity: number
}

interface Handoff {
  id: string
  createdAt: number
  status: 'paused' | 'blocked' | 'context-limit'
  project: string
  coreValue: string
  phaseNumber: number
  planId?: string
  loopPosition: LoopPhase
  workCompleted: string[]
  workInProgress: string[]
  decisions: Array<{ decision: string; rationale: string }>
  blockers: string[]
  immediateNext: string
  subsequentActions: string[]
  keyFiles: Array<{ path: string; purpose: string }>
}
```

### 2. RoadmapManager

**Purpose:** Parse and update ROADMAP.md file

**Responsibilities:**
- Parse ROADMAP.md milestones and phases
- Add/remove phases
- Update milestone status
- Track phase completion

**Integration Points:**
- FileManager: Read/write ROADMAP.md
- Commands: add-phase, remove-phase, milestone, complete-milestone

**Interface:**
```typescript
class RoadmapManager {
  private fileManager: FileManager

  constructor(projectRoot: string)

  loadRoadmap(): Roadmap | null
  saveRoadmap(roadmap: Roadmap): Promise<void>
  addPhase(phase: Phase): Promise<void>
  removePhase(phaseNumber: number): Promise<void>
  updateMilestoneStatus(milestoneName: string, status: MilestoneStatus): Promise<void>
  getCurrentMilestone(): Milestone | null
  markPhaseComplete(phaseNumber: number): Promise<void>
  renumberPhases(fromPhase: number): Promise<void>
}
```

**New Types:**
```typescript
interface Roadmap {
  overview: string
  milestones: Milestone[]
  currentMilestone?: string
  lastUpdated: number
}

interface Milestone {
  version: string
  name: string
  status: 'not-started' | 'in-progress' | 'complete'
  phases: Phase[]
  completedAt?: number
}

interface Phase {
  number: number | string  // Integer for planned, decimal for inserted
  name: string
  goal: string
  dependsOn: number[]
  status: 'not-started' | 'in-progress' | 'complete'
  researchNeeded: boolean
  researchTopics?: string[]
  plans: PlanReference[]
  completedAt?: number
}

interface PlanReference {
  id: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  completedAt?: number
}
```

**Note:** ROADMAP.md is markdown, not JSON. RoadmapManager parses and updates markdown while preserving formatting and comments.

### 3. MilestoneManager

**Purpose:** Track milestone progress and completion

**Responsibilities:**
- Track milestone completion status
- Archive completed milestones
- Manage milestone context handoffs

**Integration Points:**
- RoadmapManager: Get/set milestone info
- FileManager: Write MILESTONE-CONTEXT.md, milestone archives
- Commands: milestone, complete-milestone, discuss-milestone

**Interface:**
```typescript
class MilestoneManager {
  private fileManager: FileManager
  private roadmapManager: RoadmapManager

  constructor(projectRoot: string)

  createMilestone(context: MilestoneContext): Promise<void>
  completeMilestone(milestoneName: string): Promise<void>
  archiveMilestone(milestoneName: string): Promise<void>
  loadMilestoneContext(): MilestoneContext | null
  getProgress(): MilestoneProgress
  discuss(): Promise<MilestoneContext>
}
```

**New Files:**
- `.paul/MILESTONE-CONTEXT.md` (temporary, for handoff from discuss-milestone)
- `.paul/milestones/{version}-{name}.md` (archived milestones)

**State Types:**
```typescript
interface MilestoneContext {
  features: string[]
  scope: {
    suggestedName: string
    estimatedPhases: number
    focus: string
  }
  phaseMapping: Array<{ phase: number; focus: string; features: string[] }>
  constraints: string[]
  additionalContext: string
}

interface MilestoneProgress {
  milestoneName: string
  totalPhases: number
  completedPhases: number
  totalPlans: number
  completedPlans: number
  percentage: number
}
```

### 4. PrePlanningManager

**Purpose:** Manage pre-planning artifacts (discussions, assumptions, discovery, issues)

**Responsibilities:**
- Create/update CONTEXT.md from discussions
- Track assumptions in ASSUMPTIONS.md
- Manage DISCOVERY.md files
- Track issues in ISSUES.md

**Integration Points:**
- FileManager: Read/write pre-planning files
- Commands: discuss, assumptions, discover, consider-issues

**Interface:**
```typescript
class PrePlanningManager {
  private fileManager: FileManager

  constructor(projectRoot: string)

  createDiscussionContext(phase: number, content: DiscussionContent): Promise<void>
  loadDiscussionContext(phase: number): DiscussionContext | null
  addAssumption(phase: number, assumption: string, validation?: string): Promise<void>
  listAssumptions(phase: number): Assumption[]
  createDiscovery(phase: number, topic: string, findings: DiscoveryFindings): Promise<void>
  loadDiscovery(phase: number, topic: string): Discovery | null
  trackIssue(phase: number, issue: Issue): Promise<void>
  listIssues(phase: number): Issue[]
  resolveIssue(phase: number, issueId: string, resolution: string): Promise<void>
}
```

**New Files:**
- `.paul/phases/{NN}-{name}/CONTEXT.md`
- `.paul/phases/{NN-{name}/ASSUMPTIONS.md`
- `.paul/phases/{NN-{name}/DISCOVERY.md`
- `.paul/phases/{NN-{name}/ISSUES.md`

**State Types:**
```typescript
interface DiscussionContext {
  phase: number
  phaseName: string
  generated: number
  status: 'ready-for-planning' | 'needs-more-discussion'
  goals: string[]
  approach: {
    patterns?: string[]
    technicalDirection?: string
    constraints?: string[]
  }
  openQuestions: string[]
  additionalContext: string
}

interface Assumption {
  id: string
  assumption: string
  validation?: string
  status: 'assumed' | 'validated' | 'invalidated'
  createdAt: number
}

interface Discovery {
  phase: string
  topic: string
  depth: 'quick' | 'standard' | 'deep'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  created: number
  recommendation: string
  objective: string[]
  scope: {
    include: string[]
    exclude: string[]
  }
  findings: Array<{
    option: string
    summary: string
    pros: string[]
    cons: string[]
    fit: string
  }>
  comparison: Record<string, Record<string, string>>
  openQuestions: Array<{ question: string; impact: 'low' | 'medium' | 'high' }>
}

interface Issue {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high'
  status: 'open' | 'in-progress' | 'resolved'
  createdAt: number
  resolvedAt?: number
  resolution?: string
}
```

### 5. ResearchManager

**Purpose:** Coordinate research via subagents and track findings

**Responsibilities:**
- Spawn research subagents
- Save research findings to RESEARCH.md
- Track research task status
- Link research findings to plans

**Integration Points:**
- FileManager: Write RESEARCH.md files
- OpenCode API: Spawn subagents (requires verification)
- ConfigManager: Load agent configuration
- Commands: research, research-phase

**Interface:**
```typescript
class ResearchManager {
  private fileManager: FileManager
  private configManager: ConfigManager

  constructor(projectRoot: string)

  spawnResearch(topic: string, agentType: 'Explore' | 'general-purpose'): Promise<ResearchTask>
  saveFindings(topic: string, findings: ResearchFindings): Promise<void>
  loadResearch(topic: string): Research | null
  listResearch(): Research[]
  markReviewed(topic: string): Promise<void>
  markIntegrated(topic: string): Promise<void>
  cleanupIntegrated(daysOld: number): Promise<void>
}
```

**New Files:**
- `.paul/research/{topic-slug}.md`

**State Types:**
```typescript
interface Research {
  topic: string
  generated: number
  status: 'Draft' | 'Reviewed' | 'Integrated'
  agentType: 'Explore' | 'general-purpose'
  spawnTime: number
  sources: Array<{ url?: string; file?: string; description: string }>
  findings: {
    keyPoints: string[]
    details: Record<string, string>
  }
  recommendations: string[]
  openQuestions: string[]
  subagentMetadata: {
    agentType: string
    spawned: number
    duration?: number
    tokenEstimate?: number
  }
}

interface ResearchFindings {
  sources: Array<{ url?: string; file?: string; description: string }>
  keyPoints: string[]
  details: Record<string, { title: string; content: string }>
  recommendations: string[]
  openQuestions: string[]
}

interface ResearchTask {
  topic: string
  agentType: 'Explore' | 'general-purpose'
  spawnedAt: number
  status: 'pending' | 'in-progress' | 'complete' | 'failed'
}
```

**Critical Note:** Subagent spawning requires verification of OpenCode API capabilities. This is a **HIGH risk area** that may need adjustment based on actual API support.

### 6. QualityManager

**Purpose:** Track verification results and fix plans

**Responsibilities:**
- Record verification results
- Create fix plans for failed verifications
- Track issue resolution

**Integration Points:**
- FileManager: Write VERIFICATION.md, FIX-PLAN.md
- Commands: verify, plan-fix

**Interface:**
```typescript
class QualityManager {
  private fileManager: FileManager

  constructor(projectRoot: string)

  verify(planId: string, criteria: VerificationCriteria): Promise<VerificationResult>
  saveVerification(phase: number, planId: string, result: VerificationResult): Promise<void>
  loadVerification(phase: number, planId: string): Verification | null
  createFixPlan(phase: number, planId: string, issues: Issue[]): Promise<void>
  loadFixPlan(phase: number, planId: string): FixPlan | null
  trackIssueResolution(issueId: string, resolution: string): Promise<void>
}
```

**New Files:**
- `.paul/phases/{NN-{name}/VERIFICATION.md`
- `.paul/phases/{NN-{name}/FIX-PLAN.md`

**State Types:**
```typescript
interface Verification {
  phase: number
  planId: string
  verifiedAt: number
  criteria: VerificationCriteria
  results: VerificationResult
}

interface VerificationCriteria {
  acceptanceCriteria: string[]
  mustHaves?: {
    truths?: string[]
    artifacts?: Array<{ path: string; mustContain?: string[]; minLines?: number }>
  }
}

interface VerificationResult {
  passed: boolean
  passedCriteria: string[]
  failedCriteria: Array<{ criterion: string; reason: string }>
  issues: Array<{
    id: string
    severity: 'low' | 'medium' | 'high'
    description: string
    evidence?: string
  }>
  summary: string
}

interface FixPlan {
  phase: number
  planId: string
  createdAt: number
  issues: Array<{
    id: string
    severity: 'low' | 'medium' | 'high'
    description: string
  }>
  tasks: Array<{
    id: string
    issueId: string
    description: string
    files?: string[]
    action: string
    verify: string
    done: string
    status: 'pending' | 'in-progress' | 'completed'
  }>
}
```

### 7. ConfigManager

**Purpose:** Manage PAUL configuration and flow definitions

**Responsibilities:**
- Load/save plugin configuration
- Manage flow definitions
- Update codebase mappings

**Integration Points:**
- FileManager: Read/write config.json, FLOWS.md, codebase mapping files
- Commands: config, flows, map-codebase

**Interface:**
```typescript
class ConfigManager {
  private fileManager: FileManager

  constructor(projectRoot: string)

  loadConfig(): PluginConfig | null
  saveConfig(config: PluginConfig): Promise<void>
  updateConfig(key: string, value: unknown): Promise<void>
  loadFlows(): FlowDefinition[] | null
  saveFlows(flows: FlowDefinition[]): Promise<void>
  mapCodebase(): Promise<CodebaseMap>
  updateCodebaseMap(type: string, map: CodebaseMap): Promise<void>
  getCodebaseMap(type: string): CodebaseMap | null
}
```

**New Files:**
- `.paul/config.json`
- `.paul/FLOWS.md`
- `.paul/codebase/stack.md`
- `.paul/codebase/structure.md`
- `.paul/codebase/concerns.md`
- `.paul/codebase/integrations.md`
- `.paul/codebase/conventions.md`
- `.paul/codebase/architecture.md`

**State Types:**
```typescript
interface PluginConfig {
  version: string
  createdAt: number
  lastUpdated: number
  defaultModel?: {
    provider: string
    model: string
  }
  preferences: {
    verboseOutput: boolean
    autoCleanupDays: number
    researchAgentType: 'Explore' | 'general-purpose'
    verificationThreshold: 'strict' | 'standard' | 'relaxed'
  }
  customSettings: Record<string, unknown>
}

interface FlowDefinition {
  name: string
  description: string
  triggers: string[]
  steps: Array<{
    command: string
    args?: Record<string, unknown>
    condition?: string
  }>
}

interface CodebaseMap {
  type: 'stack' | 'structure' | 'concerns' | 'integrations' | 'conventions' | 'architecture'
  generated: number
  content: string
  format: 'markdown' | 'json'
}
```

## FileManager Extensions Required

**New Methods Required in FileManager:**

```typescript
class FileManager {
  // ===== EXISTING METHODS (v1.0) =====
  // Phase state
  readPhaseState(phaseNumber: number): State | null
  writePhaseState(phaseNumber: number, state: State): Promise<void>
  phaseStateExists(phaseNumber: number): boolean

  // Plan files
  readPlan(phaseNumber: number, planId: string): Plan | null
  writePlan(phaseNumber: number, planId: string, plan: Plan): Promise<void>
  planExists(phaseNumber: number, planId: string): boolean

  // Summary files
  readSummary(phaseNumber: number, planId: string): Summary | null
  writeSummary(phaseNumber: number, planId: string, summary: Summary): Promise<void>

  // Model config
  readModelConfig(): ModelConfigFile | null
  writeModelConfig(config: ModelConfigFile): Promise<void>

  // Directory management
  ensurePaulDir(): void
  ensurePhasesDir(): void

  // ===== NEW METHODS (v1.1) =====

  // Session state
  private getSessionStatePath(): string
  readSessionState(): SessionState | null
  writeSessionState(state: SessionState): Promise<void>
  sessionStateExists(): boolean

  // Handoffs
  private getHandoffsDir(): string
  private getHandoffPath(id: string): string
  ensureHandoffsDir(): void
  readHandoff(id: string): Handoff | null
  writeHandoff(handoff: Handoff): Promise<void>
  listHandoffs(): string[]  // Returns IDs sorted by date desc
  archiveHandoff(id: string): Promise<void>
  deleteHandoff(id: string): Promise<void>

  // ROADMAP.md (markdown parsing, not JSON)
  readRoadmap(): Roadmap | null
  writeRoadmap(roadmap: Roadmap): Promise<void>
  parseRoadmapMarkdown(content: string): Roadmap
  generateRoadmapMarkdown(roadmap: Roadmap): string

  // Milestone files
  private getMilestoneContextPath(): string
  private getMilestonesDir(): string
  private getMilestoneArchivePath(version: string): string
  ensureMilestonesDir(): void
  readMilestoneContext(): MilestoneContext | null
  writeMilestoneContext(context: MilestoneContext): Promise<void>
  deleteMilestoneContext(): Promise<void>
  readMilestoneArchive(version: string): MilestoneArchive | null
  writeMilestoneArchive(version: string, archive: MilestoneArchive): Promise<void>

  // Pre-planning files (markdown, not JSON)
  private getPhaseDir(phaseNumber: number, phaseName?: string): string
  private getDiscussionContextPath(phaseNumber: number): string
  private getAssumptionsPath(phaseNumber: number): string
  private getDiscoveryPath(phaseNumber: number, topic: string): string
  private getIssuesPath(phaseNumber: number): string
  readDiscussionContext(phaseNumber: number): DiscussionContext | null
  writeDiscussionContext(phaseNumber: number, context: DiscussionContext): Promise<void>
  readAssumptions(phaseNumber: number): Assumption[] | null
  writeAssumptions(phaseNumber: number, assumptions: Assumption[]): Promise<void>
  readDiscovery(phaseNumber: number, topic: string): Discovery | null
  writeDiscovery(phaseNumber: number, topic: string, discovery: Discovery): Promise<void>
  readIssues(phaseNumber: number): Issue[] | null
  writeIssues(phaseNumber: number, issues: Issue[]): Promise<void>

  // Research files (markdown, not JSON)
  private getResearchDir(): string
  private getResearchPath(topic: string): string
  ensureResearchDir(): void
  readResearch(topic: string): Research | null
  writeResearch(topic: string, research: Research): Promise<void>
  listResearch(): Research[]
  deleteResearch(topic: string): Promise<void>

  // Quality files (markdown, not JSON)
  private getVerificationPath(phaseNumber: number, planId: string): string
  private getFixPlanPath(phaseNumber: number, planId: string): string
  readVerification(phaseNumber: number, planId: string): Verification | null
  writeVerification(phaseNumber: number, planId: string, verification: Verification): Promise<void>
  readFixPlan(phaseNumber: number, planId: string): FixPlan | null
  writeFixPlan(phaseNumber: number, planId: string, fixPlan: FixPlan): Promise<void>

  // Configuration files
  private getConfigPath(): string
  private getFlowsPath(): string
  private getCodebaseDir(): string
  private getCodebasePath(type: string): string
  readConfig(): PluginConfig | null
  writeConfig(config: PluginConfig): Promise<void>
  readFlows(): FlowDefinition[] | null
  writeFlows(flows: FlowDefinition[]): Promise<void>
  ensureCodebaseDir(): void
  readCodebaseMap(type: string): CodebaseMap | null
  writeCodebaseMap(type: string, map: CodebaseMap): Promise<void>
  deleteCodebaseMap(type: string): Promise<void>
}
```

## Recommended Project Structure

```
src/
├── commands/
│   ├── session/
│   │   ├── pause.ts
│   │   ├── resume.ts
│   │   ├── handoff.ts
│   │   └── status.ts
│   ├── roadmap/
│   │   ├── add-phase.ts
│   │   └── remove-phase.ts
│   ├── milestone/
│   │   ├── create.ts
│   │   ├── complete.ts
│   │   └── discuss.ts
│   ├── pre-planning/
│   │   ├── discuss.ts
│   │   ├── assumptions.ts
│   │   ├── discover.ts
│   │   └── consider-issues.ts
│   ├── research/
│   │   ├── research.ts
│   │   └── research-phase.ts
│   ├── quality/
│   │   ├── verify.ts
│   │   └── plan-fix.ts
│   ├── config/
│   │   ├── config.ts
│   │   ├── flows.ts
│   │   └── map-codebase.ts
│   ├── index.ts          # Updated to export all 32 commands
│   ├── init.ts           # Existing
│   ├── plan.ts           # Existing
│   ├── apply.ts          # Existing
│   ├── unify.ts          # Existing
│   ├── progress.ts       # Existing
│   └── help.ts           # Existing
├── managers/
│   ├── session-manager.ts
│   ├── roadmap-manager.ts
│   ├── milestone-manager.ts
│   ├── pre-planning-manager.ts
│   ├── research-manager.ts
│   ├── quality-manager.ts
│   └── config-manager.ts
├── state/
│   ├── state-manager.ts  # Existing, minor updates for milestone/session info
│   └── loop-enforcer.ts   # Existing, minor updates for new transitions
├── storage/
│   ├── file-manager.ts    # Existing, major extensions
│   ├── atomic-writes.ts   # Existing
│   └── roadmap-parser.ts # NEW - parse ROADMAP.md markdown
├── types/
│   ├── session.ts
│   ├── roadmap.ts
│   ├── milestone.ts
│   ├── pre-planning.ts
│   ├── research.ts
│   ├── quality.ts
│   ├── config.ts
│   ├── state.ts           # Existing
│   ├── plan.ts            # Existing
│   ├── loop.ts            # Existing
│   ├── command.ts         # Existing
│   └── index.ts           # Updated to export all types
├── output/
│   ├── formatter.ts       # Existing, may need new formatters
│   ├── error-formatter.ts # Existing
│   └── progress-bar.ts    # Existing
├── tests/
│   ├── commands/          # Existing, 26 new test files needed
│   ├── managers/          # NEW - 7 manager test files
│   ├── storage/           # Existing, new file manager tests
│   └── types/             # Existing, new schema tests
└── index.ts               # Plugin entry point, updated for 32 tools + hooks
```

### Structure Rationale

- **`commands/{category}/`:** Group commands by functional area for maintainability and discoverability
- **`managers/`:** Separate business logic from command execution, testable independently
- **`storage/roadmap-parser.ts`:** specialized markdown parser for ROADMAP.md (separates parsing concerns from FileManager)
- **`types/`:** Centralized type definitions with Zod schemas for runtime validation
- **`storage/`:** File I/O abstraction with atomic writes and validation
- **`output/`:** Formatted output utilities for consistent user experience
- **`tests/managers/`:** Unit tests for manager business logic separate from command integration tests

## Architectural Patterns

### Pattern 1: Manager Pattern (Primary Pattern for v1.1)

**What:** Separate business logic from command execution

**When to use:** For commands that need complex state manipulation or multiple operations

**Trade-offs:**
- ✅ Clean separation of concerns
- ✅ Testable business logic
- ✅ Reusable across commands
- ❌ Additional abstraction layer
- ❌ More files to maintain

**Example:**
```typescript
// Command layer (paul:pause)
export const paulPause = tool({
  name: 'paul:pause',
  description: 'Pause the current session',
  parameters: z.object({
    reason: z.string().optional()
  }),
  execute: async ({ reason }, context) => {
    try {
      const sessionManager = new SessionManager(context.directory)
      await sessionManager.pause(reason || 'User paused')
      return formatPauseConfirmation(reason)
    } catch (error) {
      return formatGuidedError({
        title: 'Cannot Pause',
        message: error instanceof Error ? error.message : 'Unknown error',
        context: `Project: ${context.directory}`,
        suggestedFix: 'Ensure PAUL is initialized',
        nextSteps: ['Run /paul:init if not initialized', 'Check session state'],
      })
    }
  }
})

// Manager layer (business logic)
export class SessionManager {
  private fileManager: FileManager

  constructor(projectRoot: string) {
    this.fileManager = new FileManager(projectRoot)
  }

  async pause(reason?: string): Promise<void> {
    const currentState = this.fileManager.readSessionState()
    if (currentState?.status === 'paused') {
      throw new Error('Session is already paused')
    }

    const stateManager = new StateManager(this.fileManager)
    const position = stateManager.getCurrentPosition()
    if (!position) {
      throw new Error('No active session. Initialize PAUL first.')
    }

    const newState: SessionState = {
      status: 'paused',
      pausedAt: Date.now(),
      lastActivity: Date.now(),
      loopPosition: {
        phase: position.phase,
        phaseNumber: position.phaseNumber,
        planId: undefined,
      },
      nextAction: undefined,
    }

    await this.fileManager.writeSessionState(newState)
  }
}
```

### Pattern 2: Context Handoff Pattern

**What:** Use temporary files to pass context between commands

**When to use:** When one command prepares context for another command

**Trade-offs:**
- ✅ Survives session clears
- ✅ Audit trail of decisions
- ✅ Explicit context transfer
- ❌ Requires cleanup
- ❌ File I/O overhead
- ❌ File may become stale

**Example:**
```typescript
// discuss-milestone creates context
export const paulDiscussMilestone = tool({
  name: 'paul:discuss-milestone',
  description: 'Discuss and plan next milestone',
  parameters: z.object({}),
  execute: async (_args, context) => {
    const milestoneManager = new MilestoneManager(context.directory)

    // ... gather user discussion ...

    const context: MilestoneContext = {
      features: ['Feature 1', 'Feature 2'],
      scope: {
        suggestedName: 'v1.1 Feature X',
        estimatedPhases: 3,
        focus: 'Add feature X to the application',
      },
      phaseMapping: [
        { phase: 1, focus: 'Setup', features: ['Feature 1'] },
        { phase: 2, focus: 'Implementation', features: ['Feature 2'] },
        { phase: 3, focus: 'Testing', features: ['Feature 1', 'Feature 2'] },
      ],
      constraints: ['Must use TypeScript', 'No breaking changes'],
      additionalContext: '',
    }

    await milestoneManager.createMilestoneContext(context)

    return formatMilestoneContextSaved(context)
  }
})

// milestone command consumes and deletes context
export const paulMilestone = tool({
  name: 'paul:milestone',
  description: 'Create milestone from context or manual input',
  parameters: z.object({
    useContext: z.boolean().optional(),
  }),
  execute: async ({ useContext }, context) => {
    const milestoneManager = new MilestoneManager(context.directory)

    let milestoneContext: MilestoneContext | null = null

    if (useContext) {
      milestoneContext = milestoneManager.loadMilestoneContext()
      if (!milestoneContext) {
        return formatGuidedError({
          title: 'No Context Found',
          message: 'Run /paul:discuss-milestone first to create context',
          suggestedFix: 'Run /paul:discuss-milestone to create milestone context',
          nextSteps: ['/paul:discuss-milestone'],
        })
      }
    } else {
      // Manual input flow...
    }

    await milestoneManager.createMilestone(milestoneContext)
    await milestoneManager.cleanupMilestoneContext()

    return formatMilestoneCreated(milestoneContext)
  }
})
```

### Pattern 3: State Validation Pattern

**What:** Validate state transitions before executing operations

**When to use:** For commands that depend on specific state conditions

**Trade-offs:**
- ✅ Prevents invalid operations
- ✅ Clear error messages
- ✅ Self-documenting constraints
- ❌ Additional validation logic
- ❌ More code to maintain

**Example:**
```typescript
export class RoadmapManager {
  async removePhase(phaseNumber: number): Promise<void> {
    const roadmap = this.loadRoadmap()
    if (!roadmap) {
      throw new Error('No roadmap found. Run /paul:init first.')
    }

    const phase = this.findPhase(roadmap, phaseNumber)
    if (!phase) {
      throw new Error(`Phase ${phaseNumber} not found in roadmap.`)
    }

    if (phase.status === 'in-progress') {
      throw new Error(
        `Cannot remove phase ${phaseNumber}: Phase is in progress. ` +
        `Complete or cancel the phase first.`
      )
    }

    if (phase.status === 'complete') {
      throw new Error(
        `Cannot remove phase ${phaseNumber}: Phase is already complete. ` +
        `Completed phases cannot be removed from the roadmap.`
      )
    }

    const currentMilestone = roadmap.getCurrentMilestone()
    if (currentMilestone && currentMilestone.phases.length === 1) {
      throw new Error(
        'Cannot remove the only phase in the current milestone. ' +
        'Create a new phase before removing this one.'
      )
    }

    // Proceed with removal
    const updated = this.removePhaseFromRoadmap(roadmap, phaseNumber)
    await this.saveRoadmap(updated)
  }
}
```

### Pattern 4: Markdown Preservation Pattern (Roadmap-Specific)

**What:** Parse and update markdown while preserving formatting and comments

**When to use:** For ROADMAP.md and other user-editable markdown files

**Trade-offs:**
- ✅ Preserves user edits
- ✅ Maintains formatting
- ✅ Allows manual edits
- ❌ Complex parsing logic
- ❌ Brittle with edge cases
- ❌ Harder to test

**Example:**
```typescript
export class RoadmapParser {
  parse(content: string): Roadmap {
    const lines = content.split('\n')
    const roadmap: Partial<Roadmap> = {
      milestones: [],
      lastUpdated: Date.now(),
    }

    let currentSection: string | null = null
    let currentMilestone: Partial<Milestone> | null = null
    let currentPhase: Partial<Phase> | null = null

    for (const line of lines) {
      // Parse headers
      if (line.startsWith('## ')) {
        currentSection = line.slice(3).trim()
        continue
      }

      // Parse milestone headers
      if (line.match(/^\*\*\*\*Milestone.*\*\*\*\*/)) {
        if (currentMilestone && currentPhase) {
          currentMilestone.phases?.push(currentPhase as Phase)
        }
        if (currentMilestone) {
          roadmap.milestones?.push(currentMilestone as Milestone)
        }

        const match = line.match(/\*\*\*\*\s*(.+?)\s*\((.+?)\)\s*\*\*\*\*/)
        if (match) {
          currentMilestone = {
            name: match[1].trim(),
            version: match[2].trim(),
            status: 'not-started',
            phases: [],
          }
          currentPhase = null
        }
        continue
      }

      // Parse phase table rows
      if (line.startsWith('| ') && currentMilestone) {
        const cells = line.split('|').map(c => c.trim())
        if (cells.length >= 5 && cells[1].match(/^\d+(\.\d+)?$/)) {
          if (currentPhase) {
            currentMilestone.phases?.push(currentPhase as Phase)
          }

          currentPhase = {
            number: cells[1],
            name: cells[2],
            status: cells[4].toLowerCase().replace(' ', '-') as Phase['status'],
            goal: '',
            dependsOn: [],
            researchNeeded: false,
            plans: [],
          }
        }
        continue
      }

      // Parse phase details sections
      if (line.startsWith('### Phase ')) {
        if (currentPhase) {
          currentMilestone?.phases?.push(currentPhase as Phase)
        }

        const match = line.match(/### Phase (.+?): (.+)/)
        if (match) {
          currentPhase = {
            number: match[1],
            name: match[2],
            status: 'not-started',
            goal: '',
            dependsOn: [],
            researchNeeded: false,
            plans: [],
          }
        }
        continue
      }

      // Extract phase goal
      if (line.startsWith('**Goal:**') && currentPhase) {
        currentPhase.goal = line.replace('**Goal:**', '').trim()
        continue
      }

      // Extract research flag
      if (line.startsWith('**Research:**') && currentPhase) {
        currentPhase.researchNeeded = line.includes('Likely')
        const topicsMatch = line.match(/Research topics:\s*(.+)/)
        if (topicsMatch) {
          currentPhase.researchTopics = topicsMatch[1].split(',').map(s => s.trim())
        }
        continue
      }
    }

    // Add last phase
    if (currentMilestone && currentPhase) {
      currentMilestone.phases?.push(currentPhase as Phase)
    }

    // Add last milestone
    if (currentMilestone) {
      roadmap.milestones?.push(currentMilestone as Milestone)
    }

    return roadmap as Roadmap
  }

  generate(roadmap: Roadmap): string {
    // Generate markdown from Roadmap object
    // This is the inverse of parse()
    // Must preserve formatting style from original
    let output = ''

    // Header
    output += `# Roadmap\n\n`
    output += `## Overview\n\n${roadmap.overview}\n\n`

    // Milestones
    for (const milestone of roadmap.milestones) {
      output += `\n****${milestone.name} (${milestone.version})****\n\n`
      output += `Status: ${this.formatStatus(milestone.status)}\n\n`

      // Phase table
      output += `| Phase | Name | Plans | Status | Completed |\n`
      output += `|-------|------|-------|--------|-----------|\n`
      for (const phase of milestone.phases) {
        output += `| ${phase.number} | ${phase.name} | ${phase.plans.length} | ${this.formatStatus(phase.status)} | ${phase.completedAt ? new Date(phase.completedAt).toISOString().split('T')[0] : '-'} |\n`
      }

      // Phase details
      for (const phase of milestone.phases) {
        output += `\n### Phase ${phase.number}: ${phase.name}\n\n`
        output += `**Goal:** ${phase.goal}\n\n`
        output += `**Depends on:** ${phase.dependsOn.length > 0 ? phase.dependsOn.join(', ') : 'Nothing'}\n\n`
        output += `**Research:** ${phase.researchNeeded ? 'Likely' : 'Unlikely'}\n\n`
        if (phase.researchTopics && phase.researchTopics.length > 0) {
          output += `**Research topics:** ${phase.researchTopics.join(', ')}\n\n`
        }

        output += `**Plans:**\n`
        for (const plan of phase.plans) {
          output += `- [${plan.status === 'completed' ? 'x' : ' '}] ${plan.description}\n`
        }
        output += `\n`
      }
    }

    output += `\n---\n*Last updated: ${new Date().toISOString().split('T')[0]}*\n`

    return output
  }

  private formatStatus(status: string): string {
    const statusEmoji: Record<string, string> = {
      'not-started': '📋 Not started',
      'in-progress': '🚧 In Progress',
      'complete': '✅ Complete',
    }
    return statusEmoji[status] || status
  }
}
```

### Pattern 5: Atomic Multi-File Updates

**What:** Update multiple files atomically with rollback on failure

**When to use:** When operations must update multiple state files consistently

**Trade-offs:**
- ✅ Data consistency
- ✅ No partial updates
- ✅ Clear error recovery
- ❌ More complex error handling
- ❌ Performance overhead
- ❌ Rollback complexity

**Example:**
```typescript
export class RoadmapManager {
  async addPhase(phase: Phase): Promise<void> {
    const roadmap = this.loadRoadmap()
    if (!roadmap) throw new Error('No roadmap found')

    const currentMilestone = roadmap.getCurrentMilestone()
    if (!currentMilestone) throw new Error('No active milestone')

    // Validate
    if (currentMilestone.phases.some(p => p.number === phase.number)) {
      throw new Error(`Phase ${phase.number} already exists`)
    }

    // Create updated roadmap
    const updated = {
      ...roadmap,
      milestones: roadmap.milestones.map(m =>
        m === currentMilestone
          ? { ...m, phases: [...m.phases, phase].sort((a, b) => this.comparePhases(a.number, b.number)) }
          : m
      ),
      currentMilestone: currentMilestone.name,
      lastUpdated: Date.now(),
    }

    // Atomic multi-file update
    const operations: Array<() => Promise<void>> = [
      () => this.fileManager.writeRoadmap(updated),
      () => this.fileManager.ensurePhaseDirectory(phase.number, phase.name),
      () => this.fileManager.writePhaseState(phase.number, {
        phase: 'PLAN',
        phaseNumber: phase.number,
        lastUpdated: Date.now(),
        metadata: {},
      }),
    ]

    await this.atomicUpdate(operations)

    return updated
  }

  private async atomicUpdate(operations: Array<() => Promise<void>>): Promise<void> {
    const completed: Array<{ op: () => Promise<void>, rollback: () => Promise<void> }> = []

    try {
      for (const op of operations) {
        await op()
        // Note: Rollback would need to be tracked separately
        // This is simplified - real implementation would track rollback operations
        completed.push({ op, rollback: async () => {} })
      }
    } catch (error) {
      // Rollback completed operations in reverse order
      for (let i = completed.length - 1; i >= 0; i--) {
        try {
          await completed[i].rollback()
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError)
        }
      }
      throw error
    }
  }

  private comparePhases(a: number | string, b: number | string): number {
    const numA = typeof a === 'number' ? a : parseFloat(a)
    const numB = typeof b === 'number' ? b : parseFloat(b)
    return numA - numB
  }
}
```

## Data Flow Examples

**Add to `src/storage/file-manager.ts`:**

```typescript
// NEW METHODS:

// Session state
private getSessionStatePath(): string
readSessionState(): SessionState | null
writeSessionState(state: SessionState): Promise<void>

// Handoffs
private getHandoffPath(id: string): string
private getHandoffsDir(): string
ensureHandoffsDir(): void
readHandoff(id: string): Handoff | null
writeHandoff(handoff: Handoff): Promise<void>
listHandoffs(): string[] // Returns IDs sorted by date desc
archiveHandoff(id: string): Promise<void>
deleteHandoff(id: string): Promise<void>
```

### 2. Plugin Registration

**Modify `src/index.ts`:**

```typescript
import { paulPause } from './commands/pause'
import { paulResume } from './commands/resume'
import { paulHandoff } from './commands/handoff'

export const PaulPlugin: Plugin = async ({ project, client, directory, worktree }) => {
  // ... existing code ...
  
  return {
    tool: {
      // ... existing tools ...
      'paul:pause': paulPause,
      'paul:resume': paulResume,
      'paul:handoff': paulHandoff,
    }
  }
}
```

### 3. Commands Index

**Modify `src/commands/index.ts`:**

```typescript
// Session management commands
export { paulPause } from './pause'
export { paulResume } from './resume'
export { paulHandoff } from './handoff'
```

### 4. Type Exports

**Modify `src/types/index.ts`:**

```typescript
// Session types
export * from './session'
```

## Command Implementation Patterns

### Pattern: Command Structure

Follow the existing pattern from `plan.ts`:

```typescript
import { tool } from '@opencode-ai/plugin'
import { z } from 'zod'
import { FileManager } from '../storage/file-manager'
import { StateManager } from '../state/state-manager'
import { formatGuidedError } from '../output/error-formatter'
import { formatHeader, formatBold } from '../output/formatter'

export const paulPause = tool({
  description: 'Create session handoff with current context',
  args: {
    // Zod schema for args
    reason: tool.schema.string().optional().describe('Pause reason'),
  },
  execute: async ({ reason }, context) => {
    try {
      // 1. Check initialization
      // 2. Load current state
      // 3. Gather session context
      // 4. Create handoff
      // 5. Update session state
      // 6. Format output
      
      return formatHeader(2, '⏸️ Session Paused') + ...
    } catch (error) {
      return formatGuidedError({...})
    }
  },
})
```

### Pattern: Error Handling

All session commands use `formatGuidedError()`:

```typescript
return formatGuidedError({
  title: 'Cannot Pause',
  message: '...',
  context: '...',
  suggestedFix: '...',
  nextSteps: ['...', '...'],
})
```

### Pattern: State Validation

Use Zod schemas before writing:

```typescript
const validated = SessionStateSchema.parse(state)
await fileManager.writeSessionState(validated)
```

## Integration Points with Existing Components

### StateManager Integration

```typescript
// Session commands USE StateManager (don't modify it)
const stateManager = new StateManager(context.directory)
const position = stateManager.getCurrentPosition()

// Session state is SEPARATE from phase state
// - Phase state: .paul/state-phase-N.json (existing)
// - Session state: .paul/session-state.json (new)
```

### LoopEnforcer Integration

```typescript
// Pause/resume don't change loop phase, but need to know it
const loopEnforcer = new LoopEnforcer()
const nextAction = loopEnforcer.getRequiredNextAction(currentPhase)

// Handoff includes loop position for context
handoff.loopPosition = currentPhase
```

### Formatter Integration

```typescript
// Use existing formatters for consistency
import { 
  formatHeader, 
  formatBold, 
  formatList,
  formatStatus 
} from '../output/formatter'

// Session-specific formatting reuses existing patterns
const output = [
  formatHeader(2, '⏸️ Session Paused'),
  '',
  formatBold('Handoff:') + ` .paul/handoffs/${handoffId}.json`,
  formatBold('Next:') + ' Run /paul:resume to continue',
].join('\n')
```

## File Storage Strategy

### Directory Structure

```
.paul/
├── state-phase-N.json      # Phase state (existing)
├── session-state.json      # Session state (NEW)
├── model-config.json       # Model config (existing)
├── handoffs/               # Handoff files (NEW)
│   ├── HANDOFF-2026-03-05-143022.json
│   ├── HANDOFF-2026-03-04-091531.json
│   └── archive/            # Consumed handoffs (NEW)
│       └── HANDOFF-2026-03-03-161822.json
└── phases/
    ├── {phase}-{plan}-PLAN.json
    └── {phase}-{plan}-SUMMARY.json
```

### File Naming Convention

```
Handoff ID format: {YYYY}-{MM}-{DD}-{HHMMSS}
Example: 2026-03-05-143022

File pattern: .paul/handoffs/HANDOFF-{id}.json
```

### Atomic Write Guarantee

All session files use existing `atomicWrite()`:

```typescript
await atomicWrite(filePath, JSON.stringify(data, null, 2))
```

## Status Command Deprecation

The `/paul:status` command is **deprecated** in favor of `/paul:progress`.

**Implementation:**

```typescript
// src/commands/status.ts (DEPRECATED)
export const paulStatus = tool({
  description: 'DEPRECATED - Use /paul:progress instead',
  execute: async (_, context) => {
    return [
      formatHeader(2, '⚠️ Deprecated Command'),
      '',
      '/paul:status is deprecated.',
      'Use /paul:progress for current loop status.',
      '',
      formatBold('Example:') + ' /paul:progress',
      formatBold('Verbose:') + ' /paul:progress --verbose',
    ].join('\n')
  },
})
```

## Build Order (Dependencies)

### Phase 1: Types & Storage (No Dependencies)

1. **`src/types/session.ts`** — NEW
   - SessionState interface + Zod schema
   - Handoff interface + Zod schema
   - No dependencies

2. **`src/storage/file-manager.ts`** — MODIFY
   - Add session state methods
   - Add handoff methods
   - Depends on: session types

### Phase 2: Commands (Depend on Phase 1)

3. **`src/commands/pause.ts`** — NEW
   - Depends on: FileManager, StateManager, formatters

4. **`src/commands/resume.ts`** — NEW
   - Depends on: FileManager, StateManager, formatters

5. **`src/commands/handoff.ts`** — NEW
   - Depends on: FileManager, StateManager, formatters

6. **`src/commands/status.ts`** — NEW (deprecation stub)
   - No dependencies

### Phase 3: Registration (Depends on Phase 2)

7. **`src/commands/index.ts`** — MODIFY
   - Export new commands

8. **`src/types/index.ts`** — MODIFY
   - Export session types

9. **`src/index.ts`** — MODIFY
   - Register new tools

### Phase 4: Tests (Depends on All)

10. **`src/tests/commands/pause.test.ts`** — NEW
11. **`src/tests/commands/resume.test.ts`** — NEW
12. **`src/tests/commands/handoff.test.ts`** — NEW
13. **`src/tests/storage/session-files.test.ts`** — NEW

## Architectural Patterns to Follow

### Pattern 1: Command Independence

Each session command is self-contained:

- Creates its own FileManager instance
- Creates its own StateManager instance
- Handles all errors internally
- Returns formatted string output

**Why:** Matches existing pattern, easy to test, no shared mutable state.

### Pattern 2: Single Responsibility

- `pause.ts` — Create handoff + mark paused
- `resume.ts` — Load handoff + clear paused + archive handoff
- `handoff.ts` — Create detailed handoff (without pausing)

**Why:** Clear purpose, composable, matches Unix philosophy.

### Pattern 3: Explicit State Transitions

```
Active → Paused (via /paul:pause)
Paused → Active (via /paul:resume)
Active → Active with handoff (via /paul:handoff)
```

**Why:** Prevents confusion, clear mental model, matches loop enforcer pattern.

### Pattern 4: File-Based Communication

Session state stored in files, not in memory:

```typescript
// GOOD
await fileManager.writeSessionState(state)
const state = fileManager.readSessionState()

// BAD (no in-memory session cache)
this.sessionState = state
```

**Why:** Survives process restarts, matches existing storage pattern, human-readable.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Modifying StateManager

❌ **Don't:** Add session methods to StateManager

```typescript
// BAD
class StateManager {
  // ... existing methods ...
  loadSessionState() { ... }
  saveSessionState() { ... }
}
```

✅ **Instead:** Keep FileManager as single source for file operations

```typescript
// GOOD
const fileManager = new FileManager(projectRoot)
const sessionState = fileManager.readSessionState()
```

**Why:** StateManager is for loop state. Session state is orthogonal. FileManager owns all file I/O.

### Anti-Pattern 2: Storing Session in Phase State

❌ **Don't:** Add session fields to State/PhaseState

```typescript
// BAD
interface State {
  // ... existing fields ...
  sessionPaused?: boolean
  handoffId?: string
}
```

✅ **Instead:** Separate session state file

```typescript
// GOOD
// .paul/state-phase-1.json — Loop state
// .paul/session-state.json — Session state (separate)
```

**Why:** Separation of concerns, cleaner migration, easier debugging.

### Anti-Pattern 3: Complex Handoff Parsing

❌ **Don't:** Parse handoff markdown templates

```typescript
// BAD
const handoff = parseHandoffMarkdown(content)
```

✅ **Instead:** Use JSON with Zod validation

```typescript
// GOOD
const handoff = HandoffSchema.parse(JSON.parse(content))
```

**Why:** Type safety, validation, matches existing pattern (Plans, Summaries are JSON).

### Anti-Pattern 4: Global Session Manager

❌ **Don't:** Create a SessionManager class

```typescript
// BAD
class SessionManager {
  private sessionState: SessionState
  // ... methods ...
}
```

✅ **Instead:** Use FileManager directly in commands

```typescript
// GOOD
const fileManager = new FileManager(context.directory)
const sessionState = fileManager.readSessionState()
```

**Why:** No shared state, matches command pattern, easier testing.

## Scalability Considerations

### Handoff Accumulation

| Handoffs | Strategy |
|----------|----------|
| 1-10 | Keep all in `.paul/handoffs/` |
| 10-50 | Archive consumed handoffs to `.paul/handoffs/archive/` |
| 50+ | Auto-cleanup handoffs older than 30 days |

**Implementation:**

```typescript
// In resume.ts after archiving:
async function cleanupOldHandoffs(fileManager: FileManager) {
  const handoffs = fileManager.listHandoffs()
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000)
  
  for (const id of handoffs) {
    const handoff = fileManager.readHandoff(id)
    if (handoff && handoff.createdAt < thirtyDaysAgo) {
      await fileManager.deleteHandoff(id)
    }
  }
}
```

### Concurrent Session Protection

File locking not needed — OpenCode runs one command at a time.

If future needs arise, add to `atomic-writes.ts`:

```typescript
// Future: Lock file during critical operations
await withLock('.paul/session-state.json', async () => {
  await fileManager.writeSessionState(state)
})
```

## Recommended Build Order for Command Categories

Based on dependencies and architectural complexity, here's the suggested implementation order for all 26 new commands:

### Phase 1: Foundation (Week 1)

**Priority: Highest**

**Commands:** config, map-codebase

**Rationale:**
- Configuration management is needed by all other commands
- Codebase mapping provides context for planning and research
- No dependencies on other new commands
- Simple file I/O operations

**New Components:**
- ConfigManager
- FileManager extensions (config methods)
- Type definitions: config.ts

**Dependencies:** None

**Deliverables:**
- `src/managers/config-manager.ts`
- `src/types/config.ts`
- `src/commands/config/config.ts`
- `src/commands/config/map-codebase.ts`
- `src/storage/file-manager.ts` (updated)
- Test files

### Phase 2: Session Management (Week 2)

**Priority: High**

**Commands:** status, pause, resume, handoff

**Rationale:**
- Session tracking is fundamental for user experience
- Supports testing of other commands (pause mid-execution, resume later)
- Hook integration (session.created, session.compacted)
- Moderate complexity

**New Components:**
- SessionManager
- FileManager extensions (session methods)
- Hook integration in plugin.ts
- Type definitions: session.ts

**Dependencies:** None (can build in parallel with Phase 1)

**Deliverables:**
- `src/managers/session-manager.ts`
- `src/types/session.ts`
- `src/commands/session/pause.ts`
- `src/commands/session/resume.ts`
- `src/commands/session/handoff.ts`
- `src/commands/session/status.ts`
- `src/index.ts` (hooks added)
- Test files

### Phase 3: Roadmap Management (Week 3)

**Priority: High**

**Commands:** add-phase, remove-phase

**Rationale:**
- Roadmap is the backbone of project structure
- Needed before milestone commands
- Complex file parsing (ROADMAP.md)
- Multi-file atomic updates

**New Components:**
- RoadmapManager
- RoadmapParser (markdown parsing)
- ROADMAP.md types and schemas
- FileManager extensions (roadmap methods)
- Type definitions: roadmap.ts

**Dependencies:** None

**Deliverables:**
- `src/managers/roadmap-manager.ts`
- `src/storage/roadmap-parser.ts`
- `src/types/roadmap.ts`
- `src/commands/roadmap/add-phase.ts`
- `src/commands/roadmap/remove-phase.ts`
- `src/storage/file-manager.ts` (updated)
- Test files

### Phase 4: Pre-Planning (Week 4)

**Priority: Medium**

**Commands:** discuss, assumptions, discover, consider-issues

**Rationale:**
- Enhances planning experience
- Prepares context for research phase
- Moderate complexity
- Multiple file types to manage

**New Components:**
- PrePlanningManager
- Pre-planning file types (CONTEXT, ASSUMPTIONS, DISCOVERY, ISSUES)
- FileManager extensions (pre-planning methods)
- Type definitions: pre-planning.ts

**Dependencies:** None (can build in parallel with Phase 3)

**Deliverables:**
- `src/managers/pre-planning-manager.ts`
- `src/types/pre-planning.ts`
- `src/commands/pre-planning/discuss.ts`
- `src/commands/pre-planning/assumptions.ts`
- `src/commands/pre-planning/discover.ts`
- `src/commands/pre-planning/consider-issues.ts`
- `src/storage/file-manager.ts` (updated)
- Test files

### Phase 5: Milestone Management (Week 5)

**Priority: Medium-High**

**Commands:** discuss-milestone, milestone, complete-milestone

**Rationale:**
- Milestone tracking provides higher-level project view
- Depends on RoadmapManager
- Complex state management (multiple files, handoffs)
- Integration with ROADMAP.md

**New Components:**
- MilestoneManager
- MILESTONE-CONTEXT.md (temporary handoff)
- Milestone archive files
- FileManager extensions (milestone methods)
- Type definitions: milestone.ts

**Dependencies:** Phase 3 (Roadmap Management)

**Deliverables:**
- `src/managers/milestone-manager.ts`
- `src/types/milestone.ts`
- `src/commands/milestone/create.ts` (paul:milestone)
- `src/commands/milestone/complete.ts` (paul:complete-milestone)
- `src/commands/milestone/discuss.ts` (paul:discuss-milestone)
- `src/storage/file-manager.ts` (updated)
- Test files

### Phase 6: Research (Week 6)

**Priority: Medium**

**Commands:** research, research-phase

**Rationale:**
- Enables subagent-based research workflow
- Depends on ConfigManager (for agent configuration)
- Requires OpenCode API integration for subagent spawning
- Moderate complexity

**New Components:**
- ResearchManager
- RESEARCH.md types and schemas
- FileManager extensions (research methods)
- Type definitions: research.ts

**Dependencies:** Phase 1 (Config), Phase 4 (PrePlanning for research-phase)

**Deliverables:**
- `src/managers/research-manager.ts`
- `src/types/research.ts`
- `src/commands/research/research.ts` (paul:research)
- `src/commands/research/research-phase.ts` (paul:research-phase)
- `src/storage/file-manager.ts` (updated)
- Test files

**Risk Note:** Subagent spawning requires verification of OpenCode API capabilities. This is a HIGH risk area that may need adjustment based on actual API support.

### Phase 7: Quality Verification (Week 7)

**Priority: Medium**

**Commands:** verify, plan-fix

**Rationale:**
- Quality assurance for completed work
- Depends on plan execution state
- Moderate complexity
- Integrates with existing plan files

**New Components:**
- QualityManager
- VERIFICATION.md and FIX-PLAN.md types and schemas
- FileManager extensions (quality methods)
- Type definitions: quality.ts

**Dependencies:** None (can build in parallel with Phase 6)

**Deliverables:**
- `src/managers/quality-manager.ts`
- `src/types/quality.ts`
- `src/commands/quality/verify.ts`
- `src/commands/quality/plan-fix.ts`
- `src/storage/file-manager.ts` (updated)
- Test files

### Phase 8: Flow Management (Week 8)

**Priority: Low**

**Commands:** flows

**Rationale:**
- Flow definitions are configuration-level
- Simple file management
- Low complexity
- Nice-to-have, not blocking other features

**New Components:**
- None (uses ConfigManager)
- FLOWS.md types and schemas

**Dependencies:** Phase 1 (Config)

**Deliverables:**
- `src/commands/config/flows.ts`
- `src/storage/file-manager.ts` (updated - flows methods already in Phase 1)
- Test file

## Summary of Build Order Dependencies

```
Phase 1: config, map-codebase (Foundation)
    │
    ├── Phase 2: status, pause, resume, handoff (Session)
    │   └── No dependencies
    │
    ├── Phase 3: add-phase, remove-phase (Roadmap)
    │   └── No dependencies
    │
    ├── Phase 4: discuss, assumptions, discover, consider-issues (Pre-Planning)
    │   └── No dependencies
    │
    ├── Phase 5: discuss-milestone, milestone, complete-milestone (Milestone)
    │   └── Depends on Phase 3
    │
    ├── Phase 6: research, research-phase (Research)
    │   └── Depends on Phase 1, Phase 4
    │
    ├── Phase 7: verify, plan-fix (Quality)
    │   └── No dependencies
    │
    └── Phase 8: flows (Flow Management)
        └── Depends on Phase 1
```

## Key Implementation Considerations

### 1. Backward Compatibility

- Existing commands (init, plan, apply, unify, progress, help) must continue to work
- New commands should be additive, not breaking changes
- State file formats should be versioned for future migration
- ROADMAP.md parsing must preserve manual edits

### 2. Error Handling

All new commands should follow existing error patterns:
- Use `formatGuidedError()` for user-facing errors
- Include suggested fixes and next steps
- Validate state before operations
- Provide clear error messages for invalid states

### 3. Testing Strategy

- Unit tests for all manager classes
- Integration tests for command workflows
- Test file I/O with temporary directories
- Test state transitions and validation
- Test error conditions and edge cases
- Test markdown parsing and generation

### 4. File I/O Patterns

- Always use FileManager for file operations
- Use atomic writes for state changes
- Validate with Zod schemas before saving
- Handle file not found gracefully
- Parse markdown with RoadmapParser for ROADMAP.md

### 5. User Experience

- Consistent output formatting across commands
- Clear next step suggestions after command completion
- Progress indicators for long operations
- Helpful error messages with guidance
- Emoji usage for visual clarity

### 6. Subagent Integration (Research Commands)

The research commands need to spawn subagents. This requires:
- Verification of OpenCode API capabilities for subagent spawning
- Configuration of agent types (Explore vs general-purpose)
- Timeout and retry logic for research tasks
- Metadata tracking for research tasks

**Note:** This requires verification of OpenCode API documentation before implementation. This is a **HIGH risk** dependency.

### 7. Hook Integration

OpenCode plugin hooks provide integration opportunities:

| Hook | New Commands That Use It | Purpose |
|------|------------------------|---------|
| `session.created` | resume | Restore session state on new session |
| `session.compacted` | pause | Save session state before compaction |
| `tool.execute.before` | All commands | Validate state before command execution |
| `tool.execute.after` | All commands | Update state and activity tracking |

**Example: Hook for Session State Restoration**

```typescript
// In plugin entry point (src/index.ts)
export const PaulPlugin: Plugin = async ({ project, client, directory }) => {
  const sessionManager = new SessionManager(directory)

  return {
    hooks: {
      'session.created': async (session) => {
        const sessionState = sessionManager.loadSessionState()
        if (sessionState?.status === 'paused') {
          client.app.log({
            body: {
              service: 'paul-plugin',
              level: 'info',
              message: `Session paused at ${new Date(sessionState.pausedAt)}. Run /paul:resume to continue.`,
            },
          })
        }
      },
      'session.compacted': async (session) => {
        const sessionManager = new SessionManager(directory)
        await sessionManager.saveSessionState({
          status: 'active',
          lastActivity: Date.now(),
        })
      },
    },
    tool: {
      // All 32 tools
    }
  }
}
```

### 8. Roadmap.md Handling

**Critical Decision:** ROADMAP.md is markdown, not JSON

**Implementation Strategy:**
- Use RoadmapParser for parsing and generation
- Preserve formatting and comments when possible
- Parse on read, generate on write (not incremental updates)
- Handle edge cases (manual edits, malformed markdown)

**Parsing Complexity:**
- Milestone headers: `****Milestone Name (v1.0)****`
- Phase tables: Markdown tables with status
- Phase details: Sections with `### Phase N: Name`
- Research flags: Text parsing for "Research: Likely/Unlikely"

**Alternative Considered:** ROADMAP.md as JSON
- **Pros:** Easier parsing, type-safe, less brittle
- **Cons:** Not human-readable, harder to edit manually, breaks user expectations
- **Decision:** Keep as markdown for user-friendliness, accept parsing complexity

## Anti-Patterns to Avoid

### Anti-Pattern 1: Tight Coupling Between Commands

**What people do:** Commands directly call other commands or depend on specific command internals

**Why it's wrong:** Makes testing difficult, creates circular dependencies, hard to maintain

**Do this instead:** Use manager classes for shared logic, keep commands as thin wrappers around managers

### Anti-Pattern 2: Direct File I/O in Commands

**What people do:** Commands use `fs.readFileSync` directly instead of FileManager

**Why it's wrong:** Bypasses atomic writes, skips validation, inconsistent error handling

**Do this instead:** All file operations go through FileManager, use atomic writes for state

### Anti-Pattern 3: No State Validation

**What people do:** Commands execute without checking if current state allows the operation

**Why it's wrong:** Leads to invalid states, confusing error messages, data corruption

**Do this instead:** Always validate state before operations, use LoopEnforcer pattern for transitions

### Anti-Pattern 4: Temporary Files Not Cleaned Up

**What people do:** Create temporary files but never delete them (e.g., MILESTONE-CONTEXT.md)

**Why it's wrong:** Accumulates garbage files, confusing state, disk space waste

**Do this instead:** Explicit cleanup after consumption, document lifecycle of temporary files

### Anti-Pattern 5: Inconsistent Error Handling

**What people do:** Some commands throw exceptions, others return error strings

**Why it's wrong:** Inconsistent user experience, hard to handle errors programmatically

**Do this instead:** Use formatGuidedError() for all user-facing errors, throw for programmatic errors

### Anti-Pattern 6: Creating Global Managers

**What people do:** Create singleton managers and share across commands

**Why it's wrong:** Shared mutable state, hard to test, unclear lifecycle

**Do this instead:** Each command creates its own manager instances, no shared state

### Anti-Pattern 7: Modifying Existing StateManager

**What people do:** Add session/roadmap methods to existing StateManager

**Why it's wrong:** Breaks separation of concerns, StateManager is for loop state only

**Do this instead:** Create new managers for new domains, keep StateManager focused on loop state

### Anti-Pattern 8: Skipping Zod Validation

**What people do:** Write JSON without validating with Zod schemas

**Why it's wrong:** Type safety lost, runtime errors, inconsistent data

**Do this instead:** Always validate with Zod schemas before writing, always parse with schemas after reading

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-100 commands | Current architecture is fine. Manager pattern scales well. |
| 100-1000 commands | Consider grouping managers into modules (session/, roadmap/, etc.) |
| 1000+ commands | Need command registry system, plugin architecture for command extensions |

### Performance Considerations

- **ROADMAP.md parsing:** Parse once per session, cache in RoadmapManager
- **Research files:** Lazy load, only when needed
- **State file reads:** Cache frequently accessed state (current position, etc.)
- **File I/O:** All operations use atomic writes, which is slower but necessary for consistency

### Bottleneck Prevention

1. **First bottleneck:** ROADMAP.md file size grows with milestones
   - Mitigation: Archive old milestones to separate files, keep current milestone in main ROADMAP.md

2. **Second bottleneck:** Research files accumulate
   - Mitigation: Cleanup integrated research files, provide cleanup command

3. **Third bottleneck:** Handoff files accumulate
   - Mitigation: Auto-archive consumed handoffs, cleanup old handoffs (30+ days)

## Sources

- **OpenPAUL Source Code — v1.0 implementation** (HIGH confidence)
  - Existing commands, FileManager, StateManager, LoopEnforcer
  - Type definitions and Zod schemas
  - Output formatters and error handling

- **OpenCode Plugin API — `@opencode-ai/plugin` package** (HIGH confidence)
  - Hook system (session.created, session.compacted, tool.execute.before/after)
  - Tool registration pattern
  - Plugin architecture

- **PAUL Workflows** (HIGH confidence)
  - `src/workflows/pause-work.md`, `src/workflows/resume-project.md`
  - `src/workflows/roadmap-management.md`, `src/workflows/create-milestone.md`
  - `src/workflows/discuss-milestone.md`
  - Workflow specifications for all 26 commands

- **Template Files** (HIGH confidence)
  - `src/templates/ROADMAP.md`, `src/templates/RESEARCH.md`
  - `src/templates/DISCOVERY.md`, `src/templates/ISSUES.md`
  - File structure and format specifications

- **Project Documentation** (HIGH confidence)
  - `.planning/PROJECT.md`, `.planning/MILESTONES.md`
  - Requirements and milestones

- **Existing Command Patterns** (HIGH confidence)
  - `src/commands/plan.ts`, `src/commands/progress.ts`
  - Zod schemas, error handling, output formatting

---

*Architecture research for: PAUL Plugin - 26 Remaining Commands*
*Researched: 2026-03-05*
*Confidence: HIGH*
