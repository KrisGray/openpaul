# Testing Patterns

**Analysis Date:** 2026-03-03

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`)
- Native assertion library (`node:assert`)

**No external test configuration files detected.**

**Run Commands:**
```bash
node .opencode/get-shit-done/bin/gsd-tools.test.cjs   # Run all tests
```

## Test File Organization

**Location:**
- Co-located with source: `gsd-tools.test.cjs` alongside `gsd-tools.cjs`
- Path: `.opencode/get-shit-done/bin/gsd-tools.test.cjs`

**Naming:**
- Pattern: `{source}.test.cjs` (e.g., `gsd-tools.test.cjs`)

**Structure:**
```
.opencode/get-shit-done/bin/
├── gsd-tools.cjs           # Source file
├── gsd-tools.test.cjs      # Test file
└── lib/
    ├── core.cjs
    ├── phase.cjs
    └── ...                 # Library modules
```

## Test Structure

**Suite Organization:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('command name', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('specific behavior description', () => {
    // Test implementation
  });
});
```

**Patterns:**
- `describe()` blocks group related tests by command/feature
- `beforeEach()` creates isolated test fixtures
- `afterEach()` cleans up temporary directories
- Test names describe expected behavior

## Mocking

**Framework:** No mocking framework; uses real file system with temp directories

**Patterns:**
```javascript
// Create temp directory structure
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

// Write test fixtures
fs.writeFileSync(
  path.join(tmpDir, '.planning', 'ROADMAP.md'),
  `# Roadmap
### Phase 1: Foundation
**Goal:** Setup
`
);

// Execute command under test
const result = runGsdTools('roadmap get-phase 1', tmpDir);
```

**What to Mock:**
- File system: Use temp directories, not mocks
- Git operations: Tested via real `execSync`
- External APIs: Not currently mocked (tests focus on internal logic)

**What NOT to Mock:**
- File system operations (use temp directories)
- Internal module functions (test through public interface)

## Fixtures and Factories

**Test Data:**
```javascript
// Inline fixture creation
const summaryContent = `---
phase: "01"
name: "Foundation Setup"
dependency-graph:
  provides:
    - "Database schema"
    - "Auth system"
  affects:
    - "API layer"
tech-stack:
  added:
    - "prisma"
    - "jose"
patterns-established:
  - "Repository pattern"
key-decisions:
  - "Use Prisma over Drizzle"
---

# Summary content here
`;

fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), summaryContent);
```

**Location:**
- Inline within test files (no separate fixture directory)

**Helper functions:**
```javascript
// Run CLI command
function runGsdTools(args, cwd = process.cwd()) {
  try {
    const result = execSync(`node "${TOOLS_PATH}" ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString().trim() || '',
      error: err.stderr?.toString().trim() || err.message,
    };
  }
}
```

## Coverage

**Requirements:** None enforced

**Coverage tooling:** Not configured

**Note:** Tests are comprehensive (2346 lines) but coverage metrics are not collected.

## Test Types

**Unit Tests:**
- Individual command functions tested in isolation
- Each command variation has dedicated tests
- Focus on input/output behavior

**Integration Tests:**
- Commands tested against real file system
- Multi-step workflows tested end-to-end
- Git operations verified

**E2E Tests:**
- Not used (CLI is the interface)

## Common Patterns

**Command execution testing:**
```javascript
test('command returns expected output', () => {
  const result = runGsdTools('command arg', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  const output = JSON.parse(result.output);
  assert.strictEqual(output.field, 'expected value');
});
```

**Error case testing:**
```javascript
test('missing argument returns error', () => {
  const result = runGsdTools('command', tmpDir);
  assert.ok(!result.success, 'should fail');
  assert.ok(result.error.includes('required'), 'error mentions required');
});
```

**File system state verification:**
```javascript
test('file is created correctly', () => {
  runGsdTools('scaffold context --phase 3', tmpDir);

  assert.ok(
    fs.existsSync(path.join(tmpDir, '.planning', 'phases', '03-api', '03-CONTEXT.md')),
    'file should exist'
  );

  const content = fs.readFileSync(path.join(tmpDir, '.planning', 'phases', '03-api', '03-CONTEXT.md'), 'utf-8');
  assert.ok(content.includes('Phase 3'), 'should reference phase number');
});
```

**Edge case testing:**
```javascript
test('handles decimal phase numbers', () => {
  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'ROADMAP.md'),
    `# Roadmap
### Phase 2.1: Hotfix
**Goal:** Emergency fix
`
  );

  const result = runGsdTools('roadmap get-phase 2.1', tmpDir);
  assert.ok(result.success);

  const output = JSON.parse(result.output);
  assert.strictEqual(output.found, true, 'decimal phase should be found');
});
```

**Empty/missing state testing:**
```javascript
test('empty phases directory returns valid schema', () => {
  const result = runGsdTools('history-digest', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  const digest = JSON.parse(result.output);
  assert.deepStrictEqual(digest.phases, {}, 'phases should be empty object');
});
```

**Malformed input handling:**
```javascript
test('malformed SUMMARY.md skipped gracefully', () => {
  // Create valid summary
  fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), `---\nphase: "01"\n---\n`);

  // Create malformed summary (no frontmatter)
  fs.writeFileSync(path.join(phaseDir, '01-02-SUMMARY.md'), `# Just a heading\nNo frontmatter\n`);

  const result = runGsdTools('history-digest', tmpDir);
  assert.ok(result.success, `Command should succeed despite malformed files`);
});
```

## Test Organization by Feature

**Command groupings:**
- `describe('history-digest command', ...)`
- `describe('phases list command', ...)`
- `describe('roadmap get-phase command', ...)`
- `describe('phase next-decimal command', ...)`
- `describe('phase-plan-index command', ...)`
- `describe('state-snapshot command', ...)`
- `describe('summary-extract command', ...)`
- `describe('init commands with --include flag', ...)`
- `describe('roadmap analyze command', ...)`
- `describe('phase add command', ...)`
- `describe('phase insert command', ...)`
- `describe('phase remove command', ...)`
- `describe('phase complete command', ...)`
- `describe('milestone complete command', ...)`
- `describe('validate consistency command', ...)`
- `describe('progress command', ...)`
- `describe('todo complete command', ...)`
- `describe('scaffold command', ...)`

## Test Quality Guidelines

**Observed best practices:**
1. Each test focuses on a single behavior
2. Tests are independent (temp directories per test)
3. Assertions are specific (not just "exists" but exact values)
4. Error messages help debugging
5. Edge cases (empty, malformed, decimals) are covered

**Anti-patterns avoided:**
- No shared mutable state between tests
- No reliance on test execution order
- No external dependencies (APIs, network)

---

*Testing analysis: 2026-03-03*
