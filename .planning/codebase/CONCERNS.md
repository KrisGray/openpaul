# Codebase Concerns

**Analysis Date:** 2026-03-03

## Tech Debt

**Deprecated command still in distribution:**
- Issue: `/paul:status` is marked deprecated but still shipped with the package
- Files: `src/commands/status.md`
- Why: Backward compatibility during transition to `/paul:progress`
- Impact: Users may use outdated command, confusion about which to use
- Fix approach: Remove `status.md` from `src/commands/` in next major version, or add automatic redirect logic

**No test suite for installer:**
- Issue: `bin/install.js` is the only executable code but has no automated tests
- Files: `bin/install.js`
- Why: Project is primarily markdown-based, installer was considered simple enough to skip tests
- Impact: Changes to installer could break npm package without detection
- Fix approach: Add basic integration tests verifying: global install, local install, custom config-dir, path replacement works correctly

**Inconsistent file references across templates:**
- Issue: Some markdown files use `@.paul/` while others use full paths or relative paths
- Files: Various in `src/templates/`, `src/commands/`, `src/workflows/`
- Why: Templates written at different times, no strict linting for references
- Impact: Could lead to broken references when PAUL is installed to non-standard locations
- Fix approach: Standardize all internal references to use `@.paul/` pattern or validate during install

## Known Bugs

**Path replacement edge case with symbolic links:**
- Symptoms: Install to directory containing symlinks may resolve paths incorrectly
- Trigger: Installing with `--config-dir` pointing to symlinked directory
- Files: `bin/install.js` (lines 87-92, 124-128)
- Workaround: Use resolved physical path instead of symlink path
- Root cause: `expandTilde()` handles `~` but not symlink resolution
- Fix: Add `fs.realpathSync()` after path expansion

**Tilde expansion incomplete for relative paths:**
- Symptoms: Paths like `~/../other` not handled correctly
- Trigger: Using complex relative paths with tilde
- Files: `bin/install.js` (lines 87-92)
- Workaround: Avoid complex relative paths
- Root cause: Only handles `~/` prefix, not other tilde patterns
- Fix: Use proper path resolution library or expand function

## Security Considerations

**No file integrity verification:**
- Risk: Installed files could be modified between npm publish and install
- Files: `bin/install.js`
- Current mitigation: npm registry provides integrity checks at package level
- Recommendations: Consider adding checksums or using npm's built-in integrity verification

**No input validation for custom config paths:**
- Risk: Malicious or malformed `--config-dir` argument could cause unexpected behavior
- Files: `bin/install.js` (lines 36-51)
- Current mitigation: Basic check for missing argument
- Recommendations: Validate path doesn't escape expected boundaries, sanitize input

**Synchronous filesystem operations:**
- Risk: Large installations could block event loop, though unlikely given small package size
- Files: `bin/install.js` (fs.mkdirSync, fs.readdirSync, fs.readFileSync, fs.writeFileSync)
- Current mitigation: Package is small (~70 markdown files)
- Recommendations: Consider async variants for future-proofing

## Performance Bottlenecks

**Directory copy without filtering:**
- Problem: Copy operation reads all files before filtering by extension
- Files: `bin/install.js` (lines 97-117)
- Measurement: Trivial for current package size (~70 files)
- Cause: `copyWithPathReplacement` reads every file to check extension
- Improvement path: Pre-filter files before reading, though not impactful at current scale

## Fragile Areas

**Path replacement during copy:**
- Files: `bin/install.js` (lines 97-117)
- Why fragile: Simple string replacement (`~/.claude/` → pathPrefix) could match unintended strings
- Common failures: If markdown content legitimately contains `~/.claude/` in code examples, it gets replaced incorrectly
- Safe modification: Test with edge cases containing `~/.claude/` in various contexts
- Test coverage: None

**Install location detection:**
- Files: `bin/install.js` (lines 122-138)
- Why fragile: Multiple fallback paths for determining install location (explicit arg, env var, default)
- Common failures: `CLAUDE_CONFIG_DIR` env var behavior differs from `--config-dir` flag
- Safe modification: Add explicit tests for each configuration path
- Test coverage: None

## Scaling Limits

**Npm package size:**
- Current capacity: ~70 markdown files, 210 lines of JS
- Limit: No enforced limit, but large packages slow npm install
- Symptoms at limit: Slow installation, npm warnings
- Scaling path: Currently well within limits, monitor if adding more templates

**Markdown file parsing by Claude:**
- Current capacity: All templates fit in context window when needed
- Limit: ~500 markdown files could exceed efficient context loading
- Symptoms at limit: Commands may not load properly, context overflow
- Scaling path: Consider lazy loading or modular command packs

## Dependencies at Risk

**Node.js version requirement:**
- Risk: Minimum Node 16.7.0 excludes some older environments
- Files: `package.json` (engines field)
- Impact: Users on older Node versions cannot use PAUL
- Migration plan: Consider dropping minimum version if compatibility layer feasible

**No production dependencies:**
- Risk: All logic is custom JS without battle-tested libraries
- Files: `bin/install.js`
- Impact: Edge cases in file operations not handled by mature libraries
- Migration plan: Consider using `fs-extra` or similar for robust file operations

**CARL dependency for full functionality:**
- Risk: PAUL rules require CARL (separate tool) for enforcement
- Files: `src/carl/PAUL`, `src/carl/PAUL.manifest`
- Impact: Without CARL, PAUL rules are just documentation, not enforced
- Migration plan: Document CARL as optional but recommended; consider inline rule enforcement

## Missing Critical Features

**No uninstall command:**
- Problem: Users cannot cleanly remove PAUL from their system
- Current workaround: Manually delete `~/.claude/commands/paul/` and `~/.claude/paul-framework/`
- Blocks: Clean migration between versions, testing clean installs
- Implementation complexity: Low (add `--uninstall` flag to bin/install.js)

**No update/upgrade verification:**
- Problem: Running installer over existing install doesn't verify file integrity
- Current workaround: Delete old installation before reinstalling
- Blocks: Cannot confidently upgrade without manual cleanup
- Implementation complexity: Medium (add version check and file diff)

**No configuration validation:**
- Problem: Malformed `.paul/config.md` or `sonar-project.properties` fails silently or with cryptic errors
- Current workaround: Manual debugging
- Blocks: Troubleshooting SonarQube integration issues
- Implementation complexity: Medium (add schema validation for config files)

## Test Coverage Gaps

**Installer functionality:**
- What's not tested: All installer code paths (global, local, custom-dir, interactive, non-interactive)
- Files: `bin/install.js`
- Risk: npm package could ship with broken installer
- Priority: High
- Difficulty to test: Medium (requires filesystem mocking or temp directories)

**Markdown file references:**
- What's not tested: Cross-file `@` references in templates and workflows resolve correctly
- Files: All markdown in `src/`
- Risk: Broken references cause commands to fail at runtime
- Priority: Medium
- Difficulty to test: Medium (requires parsing markdown and checking file existence)

**Command execution paths:**
- What's not tested: Each `/paul:*` command loads and executes correctly
- Files: All files in `src/commands/`
- Risk: Commands may reference missing workflows or templates
- Priority: Medium
- Difficulty to test: High (requires Claude Code environment simulation)

---

*Concerns audit: 2026-03-03*
*Update as issues are fixed or new ones discovered*
