# Technology Stack

**Analysis Date:** 2026-03-03

## Languages

**Primary:**
- JavaScript (ES6+) - Installer script in `bin/install.js`
- Markdown - All framework content (commands, workflows, templates, references, rules)

**Secondary:**
- JSON - `package.json` configuration

## Runtime

**Environment:**
- Node.js >=16.7.0 (specified in engines)
- Current environment: v22.14.0

**Package Manager:**
- npm 10.9.2
- Lockfile: Not present (no runtime dependencies)

## Frameworks

**Core:**
- None - This is a pure markdown-based framework distribution package

**Build/Dev:**
- npx - Package execution via `npx paul-framework`

## Key Dependencies

**Production Dependencies:**
- None - Zero runtime dependencies

**Built-in Node.js Modules Used:**
- `fs` - File system operations for installation
- `path` - Path manipulation
- `os` - Home directory resolution
- `readline` - Interactive CLI prompts

## Configuration

**Package Configuration:**
- `package.json` - Package metadata, bin entry point, files whitelist
- No build configuration required

**Target Configuration:**
- Installs to `~/.claude/` (global) or `./.claude/` (local)
- Creates `commands/paul/` directory for slash commands
- Creates `paul-framework/` directory for workflows/templates/references/rules

**Environment Variables:**
- `CLAUDE_CONFIG_DIR` - Optional custom Claude config directory path

## Platform Requirements

**Development:**
- Node.js >=16.7.0
- npm or npx for running installer

**Production:**
- Claude Code (Anthropic's AI coding assistant)
- Git (for commit workflow integration)
- Optional: CARL (Context Augmentation & Reinforcement Layer) for dynamic rule loading

## Distribution

**npm Package:**
- Name: `paul-framework`
- Version: 1.0.3
- Registry: npmjs.com
- Entry point: `bin/install.js`

**Published Files:**
```
bin/              # Installer script
src/commands/     # Slash command definitions
src/templates/    # Document templates
src/workflows/    # Phase execution workflows
src/references/   # Reference documentation
src/rules/        # Style and convention rules
```

**Installation Modes:**
- `--global` / `-g` - Install to `~/.claude/`
- `--local` / `-l` - Install to `./.claude/`
- `--config-dir <path>` / `-c <path>` - Custom Claude config directory

---

*Stack analysis: 2026-03-03*
