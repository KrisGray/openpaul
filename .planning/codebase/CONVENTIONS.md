# Coding Conventions

**Analysis Date:** 2026-03-03

## Project Overview

PAUL (Plan-Apply-Unify Loop) is a structured AI-assisted development framework. It consists of:
- **CLI tooling** (`.opencode/get-shit-done/bin/`) — Node.js/CommonJS utilities
- **Framework content** (`src/`) — Markdown-based commands, workflows, templates, and references

## Naming Patterns

**Files:**
- JavaScript files: `kebab-case.cjs` (e.g., `gsd-tools.cjs`, `phase.cjs`)
- Markdown files: `UPPERCASE.md` (e.g., `PLAN.md`, `STATE.md`) or `kebab-case.md` for workflows
- Phase directories: `NN-kebab-name` (e.g., `01-foundation`, `02-api-layer`)
- Plan files: `NN-PP-PLAN.md` (e.g., `01-02-PLAN.md` for Phase 1, Plan 2)
- Summary files: `NN-PP-SUMMARY.md` matching their plan

**Functions:**
- Command handlers: `cmd<Action><Target>` (e.g., `cmdPhaseAdd`, `cmdStateUpdate`)
- Internal helpers: `camelCase` (e.g., `normalizePhaseName`, `extractFrontmatter`)
- Export pattern: Named exports via `module.exports`

**Variables:**
- Constants: `CAPS_UNDERSCORES` (e.g., `MODEL_PROFILES`)
- Local variables: `camelCase`
- Function parameters: `camelCase`

**Markdown/XML Tags:**
- Semantic tags: `<objective>`, `<context>`, `<tasks>`, `<boundaries>`, `<verification>`
- Step names in XML: `snake_case` (e.g., `name="validate_preconditions"`)

## Code Style

**Formatting:**
- No explicit formatter detected (no `.prettierrc`, `.eslintrc`, or `biome.json`)
- 2-space indentation observed in codebase
- Single quotes for strings in JavaScript

**JavaScript Conventions:**
```javascript
// Module imports at top
const fs = require('fs');
const path = require('path');
const { helper } = require('./lib/core.cjs');

// Function documentation with JSDoc-style blocks
/**
 * Brief description of function purpose
 * @param {string} cwd - Working directory
 * @param {object} options - Configuration options
 */
function cmdPhaseAdd(cwd, description, raw) {
  // Implementation
}

// Export at end
module.exports = {
  cmdPhaseAdd,
  cmdPhaseRemove,
};
```

**Section comments:**
```javascript
// ─── Section Name ──────────────────────────────────────────────
```

## Import Organization

**Order:**
1. Node.js built-ins (`fs`, `path`, `child_process`, `os`)
2. Local library modules (`./lib/core.cjs`)
3. Constants and configuration

**Pattern:**
```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { safeReadFile, loadConfig, output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
```

## Error Handling

**Exit pattern:**
```javascript
function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}
```

**Usage:**
```javascript
if (!phase) {
  error('phase identifier required');
}
```

**Try-catch for file operations:**
```javascript
try {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Process content
} catch {
  // Return null or default value
  return null;
}
```

**Output with error field:**
```javascript
const result = { found: false, error: 'File not found' };
output(result, raw);
```

## Logging

**Console output:**
- Use `process.stdout.write()` for structured JSON output
- Use `process.stderr.write()` for errors
- ANSI colors for terminal output: `'\x1b[36m'` (cyan), `'\x1b[32m'` (green), `'\x1b[33m'` (yellow)

**Pattern:**
```javascript
const cyan = '\x1b[36m';
const reset = '\x1b[0m';
console.log(`${cyan}Message${reset}`);
```

## Comments

**When to Comment:**
- Module header explaining purpose
- Function documentation for exported commands
- Complex logic explanations
- Section dividers for code organization

**JSDoc pattern:**
```javascript
/**
 * GSD Tools — CLI utility for GSD workflow operations
 *
 * Replaces repetitive inline bash patterns across ~50 GSD files.
 */
```

## Function Design

**Size:** Functions typically 10-50 lines; larger functions split into helpers

**Parameters:** 
- `cwd` (current working directory) as first parameter for most commands
- `raw` flag for raw output mode (string instead of JSON)
- Options objects for complex configurations

**Return Values:**
- Commands call `output(result, raw, rawValue)` instead of returning
- Internal functions return values directly
- Error cases call `error()` which exits the process

**Command handler pattern:**
```javascript
function cmdPhaseAdd(cwd, description, raw) {
  // 1. Validate inputs
  if (!description) {
    error('description required');
  }

  // 2. Perform operation
  const result = performOperation();

  // 3. Output result
  output(result, raw, result.slug);
}
```

## Module Design

**Exports:** Named exports via object literal

```javascript
module.exports = {
  cmdPhaseAdd,
  cmdPhaseRemove,
  cmdFindPhase,
};
```

**No barrel files:** Each module is imported directly

## Output Format

**JSON output:**
```javascript
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    // Handle large payloads by writing to temp file
    if (json.length > 50000) {
      const tmpPath = path.join(require('os').tmpdir(), `gsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}
```

## Markdown Conventions

**Document structure:**
- YAML frontmatter with metadata
- XML semantic tags for structure
- `@path` references for file includes

**Frontmatter format:**
```yaml
---
name: paul:command-name
description: Brief description
argument-hint: "[optional-args]"
allowed-tools: [Read, Write, Glob]
---
```

**XML semantic tags:**
```xml
<objective>
  ## Goal
  Description here
</objective>

<process>
  <step name="validate_preconditions" priority="first">
    1. Check conditions
    2. Proceed or warn
  </step>
</process>
```

## Temporal Language Rules

**Per `src/rules/style.md`:**

- Never use: "We changed X to Y", "Previously", "No longer", "Instead of"
- Always: Describe current state only
- Exception: SUMMARY.md deviations section, git commits

## Acceptance Criteria Format

**BDD Given/When/Then:**
```gherkin
Given [precondition / initial state]
When [action / trigger]
Then [expected outcome]
```

## Commit Format

```
{type}({phase}-{plan}): {description}
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`

---

*Convention analysis: 2026-03-03*
