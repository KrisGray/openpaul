# Pitfalls Research

**Domain:** Session management for development workflow tools
**Researched:** 2026-03-05
**Confidence:** MEDIUM (web research + domain expertise, limited to session management patterns in dev tools)

## Critical Pitfalls

### Pitfall 1: Serialization Blind Spots

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

### Pitfall 2: Orphaned Session Files

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

### Pitfall 3: Incomplete Context Capture

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

### Pitfall 4: Handoff Document Drift

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

### Pitfall 5: Deprecation Without Migration Path

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

### Pitfall 6: State Version Mismatch

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

### Pitfall 7: Race Conditions in State Updates

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

## Integration Gotchas

Common mistakes when connecting session management to existing OpenPAUL state.

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| **Phase State** | Assume one active phase | Check all phase files, handle multiple active phases gracefully |
| **Plan References** | Store plan ID only | Store plan ID + status + timestamp for context |
| **File Manager** | Create parallel session storage | Extend FileManager with session methods, reuse patterns |
| **State Manager** | Bypass for session commands | Extend StateManager, maintain single source of truth |
| **Loop Phase** | Ignore current loop position | Include loop phase in session context, validate on resume |
| **Metadata Field** | Ignore existing metadata | Preserve and extend, don't replace |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **Large session files** | Slow pause/resume (>1s), memory issues | Store references, not full content; compress old sessions | >100KB session files |
| **No session indexing** | Resume has to scan all files to find current | Maintain session index file, update on pause | >10 paused sessions |
| **Full state serialization** | Pause takes >500ms | Incremental updates, diff-based serialization | State >1MB |
| **No lazy loading** | Resume loads entire history | Load recent first, lazy-load older context | >50 plans/phase |
| **Unbounded history** | `.paul/` grows without limit | Age-based cleanup, archive old sessions | >1GB total storage |

## Security Mistakes

Session management specific security issues.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Sessions in version control** | Expose project state, decisions, possibly secrets | Add `session-*.json` to `.gitignore` from day 1 |
| **No session ownership** | Anyone can resume/modify anyone's session | Include `created_by` field, validate on operations |
| **Session tampering** | Modified session files inject malicious context | Checksums or signatures on session files |
| **Sensitive data in sessions** | API keys, tokens captured in paused state | Sanitize before persist, never store secrets |
| **Session file permissions** | World-readable session files | Set restrictive permissions (0600) on creation |

## UX Pitfalls

Common user experience mistakes in session management.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **"Paused successfully" with no context** | User unsure what was captured, afraid to trust it | Show summary: "Captured: phase 2, task 3/7, 3 decisions, 2 blockers" |
| **Resume with no feedback** | User doesn't know if it worked, what changed | Show diff: "Restored from 2h ago: task 3→4, decision added, blocker resolved" |
| **Orphaned session files** | User confused which to resume | Always show session metadata when multiple exist |
| **Handoff with no preview** | User afraid to share incomplete/wrong info | Preview handoff, allow edits before finalizing |
| **Deprecation with no guidance** | User frustrated, doesn't know what to do | Show exact replacement command and why it's better |
| **Session with no timestamp** | User doesn't know how old context is | Always show age: "This session is 3 days old" |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Pause command:** Often missing validation that session is usable — verify round-trip test (pause → resume in test)
- [ ] **Resume command:** Often missing conflict detection (what if state changed since pause?) — verify state comparison
- [ ] **Handoff document:** Often missing verification against actual project state — verify handoff matches ROADMAP.md phase
- [ ] **Status deprecation:** Often missing migration guide — verify docs updated AND deprecation message helpful
- [ ] **Session storage:** Often missing cleanup strategy — verify old sessions handled correctly
- [ ] **Version compatibility:** Often missing version field — verify sessions have schema version

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

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Serialization Blind Spots | Pause command implementation | Test: pause with complex state, resume in fresh process, verify all data |
| Orphaned Session Files | Both pause AND resume | Test: pause 3 times, verify only 1 session file exists |
| Incomplete Context Capture | Pause command implementation | Test: pause mid-task, resume after 24h, verify immediate productivity |
| Handoff Document Drift | Handoff command implementation | Test: generate handoff, modify ROADMAP.md, regenerate, verify consistency |
| Deprecation Without Migration Path | Status deprecation | Test: run /paul:status, verify helpful message AND docs updated |
| State Version Mismatch | Both pause AND resume | Test: create v1 session file manually, resume with v2 code, verify migration |
| Race Conditions | State manager enhancement | Test: two concurrent pause operations, verify atomic handling |

## Sources

- **Session serialization issues:** Web search results on session state serialization problems (ASP.NET, JavaEE patterns) - MEDIUM confidence (general patterns, not dev-tool specific)
- **Workflow handoff mistakes:** Focus & Stack workflow management guide, NimbleWork task handoff article - MEDIUM confidence (project management focused, but patterns apply)
- **State migration:** PlanetScale backward-compatible database changes, Airbyte connector breaking changes docs - HIGH confidence (authoritative sources on state evolution)
- **Deprecation patterns:** React 19 migration guide, common upgrade mistake analysis - HIGH confidence (real-world deprecation experience)
- **Domain expertise:** Personal knowledge of session management in CLI tools, state serialization patterns, developer workflow tools - Used to synthesize and extend web findings

---

*Pitfalls research for: Session management in development workflow tools*
*Context: Adding pause, resume, handoff, status deprecation to OpenPAUL TypeScript plugin*
*Researched: 2026-03-05*
