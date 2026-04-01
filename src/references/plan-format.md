<plan_format>

## Purpose

Plans are created via `/openpaul:plan` and stored as JSON at `.openpaul/phases/{N}-{planId}-PLAN.json`.

**Core principle:** A plan is executable when every task has a precise `action` instruction, a measurable `verify` step, and a clear `done` criterion. If you can't specify all three, the task is too vague.

## Command

```
/openpaul:plan
```

OpenPAUL runs a TDD wizard to collect:
- Phase number and plan ID
- Acceptance criteria
- Boundaries (what NOT to change)
- 1–5 tasks in TDD order (failing test -> implementation -> edge/coverage)

## Plan JSON Structure

```json
{
  "phase": "1",
  "plan": "01",
  "type": "execute",
  "wave": 1,
  "autonomous": true,
  "criteria": ["AC-1: login returns 200 with JWT cookie"],
  "boundaries": ["DO NOT change database/migrations/*"],
  "files_modified": ["src/api/auth/login.ts"],
  "tasks": [
    {
      "type": "auto",
      "name": "Create login endpoint",
      "files": ["src/api/auth/login.ts"],
      "action": "POST endpoint accepting {email,password}...",
      "verify": "curl -X POST /auth/login returns 200",
      "done": "AC-1 satisfied"
    }
  ]
}
```

## Task Anatomy

Every task has four required fields:

### files
**What it is:** Exact file paths created or modified.

```json
// GOOD
"files": ["src/app/api/auth/login/route.ts", "prisma/schema.prisma"]

// BAD
"files": ["the auth files", "relevant components"]
```

### action
**What it is:** Specific implementation instructions, including what to avoid and WHY.

```json
// GOOD
"action": "Create POST endpoint accepting {email, password}. Query User by email, compare password with bcrypt. On match, create JWT with jose library (15-min expiry). Return 200. On mismatch, return 401. Avoid: jsonwebtoken (CommonJS issues with Edge runtime)"

// BAD
"action": "Add authentication"
```

### verify
**What it is:** How to prove the task is complete.

```json
// GOOD
"verify": "curl -X POST localhost:3000/api/auth/login returns 200 with Set-Cookie header"

// BAD
"verify": "It works"
```

### done
**What it is:** Acceptance criteria — links to AC-N for traceability.

```json
// GOOD
"done": "AC-1 satisfied: Valid credentials return 200 + JWT cookie"

// BAD
"done": "Authentication is complete"
```

**If you can't specify files + action + verify + done, the task is too vague.**

## Acceptance Criteria Format

Provide criteria via the wizard. Use Given/When/Then (BDD) format:

```gherkin
Given [precondition / initial state]
When [action / trigger]
Then [expected outcome]
```

**Guidelines:**
- Each criterion should be independently testable
- Include error states and edge cases
- Avoid implementation details (describe behavior, not code)
- Link tasks to criteria via `"done": "AC-N satisfied"`

## Boundaries

Provide boundaries via the wizard. Prevents scope creep:

## Specificity Levels

### Too Vague
```json
{
  "name": "Add authentication",
  "files": [],
  "action": "Implement auth",
  "verify": "???",
  "done": "Users can authenticate"
}
```
Claude: "How? What type? What library? Where?"

### Just Right
```json
{
  "name": "Create login endpoint with JWT",
  "files": ["src/app/api/auth/login/route.ts"],
  "action": "POST endpoint accepting {email, password}. Query User by email, compare password with bcrypt. On match, create JWT with jose (15-min expiry). Return 200. On mismatch, return 401.",
  "verify": "curl -X POST returns 200 with Set-Cookie header",
  "done": "AC-1 satisfied: Valid credentials → 200 + cookie"
}
```
Claude can implement immediately.

### Too Detailed
Writing the actual code in the plan. Trust Claude to implement from clear instructions.

## Sizing Guidance

**Good plan size:** 2–3 tasks, single concern. Maximum 5 tasks per plan.

**When to split into multiple plans:**
- Different subsystems (auth vs API vs UI)
- More than 3 tasks
- TDD candidates (separate red/green/refactor plans)

**Prefer vertical slices:**
```
PREFER: Plan 01 = User (model + API + UI)
        Plan 02 = Product (model + API + UI)

AVOID:  Plan 01 = All models
        Plan 02 = All APIs
```

## Anti-Patterns

**Vague actions:**
- "Set up the infrastructure"
- "Handle edge cases"
- "Make it production-ready"

**Unverifiable completion:**
- "It works correctly"
- "User experience is good"
- "Code is clean"

**Missing context:**
- "Use the standard approach"
- "Follow best practices"
- "Like the other endpoints"

</plan_format>
