# Phase 17: Template Presets - Research

**Researched:** 2026-03-22
**Domain:** CLI template presets with OpenCode configuration scaffolding
**Confidence:** HIGH

## Summary

Phase 17 adds template preset support to the OpenPAUL CLI installer, allowing users to choose between `minimal` and `full` configurations for OpenCode setup. The presets write to `.opencode/` directories following OpenCode conventions. This phase extends the existing CLI infrastructure from Phase 16 (commander, @inquirer/prompts, picocolors) with a `--preset` flag and preset-specific template generation.

**Primary recommendation:** Extend `src/cli.ts` with `--preset` flag, create `src/cli/presets.ts` module for preset definitions and generation, and store preset templates as TypeScript objects in `src/cli/templates/`.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Preset contents:**
- Minimal preset installs `.opencode/` directories plus a minimal `opencode.json` scaffold.
- Full preset includes everything in minimal, plus example `opencode.json` and `tui.json` configs.
- Sample content in full is minimal: include only 1 example command and 1 example rule.
- Never include API keys or user-specific settings (models, permissions, keybinds) in any preset.

**Selection rules:**
- Default preset is `minimal` when `--preset` is omitted.
- `--preset full` respects existing flags (`--name`, `--path`, `--force`) exactly like minimal.
- `--preset` requires interactive confirmation; no non-interactive usage.
- Unknown preset triggers an interactive prompt to choose from valid presets (no silent fallback).

**Output & messaging:**
- Always print the selected preset explicitly (e.g., "Preset: minimal").
- Include a 1–2 line description of what the preset includes.
- If `--preset` is omitted, print "Defaulting to minimal".
- Show preset messaging right before the confirmation prompt.

**Existing project behavior:**
- If `.opencode/` already exists, always show overwrite warning, even when `--preset` is used.
- Overwrite behavior: replace preset files; no merge or preservation.
- If user declines overwrite, exit with "Operation cancelled" and status 0.
- If `.opencode/` exists but is empty/partial, treat as overwrite.

### OpenCode's Discretion

- Exact wording of the 1–2 line preset description, as long as it matches contents.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCAF-03 | CLI supports template presets (minimal/full configurations) | OpenCode config conventions from opencode.ai/docs/config; preset module pattern |
| SCAF-04 | User can specify preset via `--preset minimal` or `--preset full` | Commander `.option()` pattern; @inquirer/prompts `select()` for unknown preset fallback |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| commander | ^14.0.3 | CLI argument parsing | Already in use; add `--preset` option |
| @inquirer/prompts | ^8.3.2 | Interactive prompts | Already installed; use `select()` for unknown preset prompt |
| picocolors | ^1.1.1 | Colored output | Already in use via `src/cli/output.ts` |
| zod | ^3.22.0 | Schema validation | Optional for preset validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs (Node.js) | built-in | Directory/file operations | Creating .opencode/ structure |
| path (Node.js) | built-in | Path manipulation | Joining paths for template files |

### Already Installed (Phase 15-16)
All dependencies already installed - no new installs required.

**Installation:** None required — all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure

Extend existing CLI structure:
```
src/
├── cli.ts                    # CLI entry point (extend with --preset flag)
├── cli/
│   ├── output.ts             # Output helpers (existing)
│   ├── errors.ts             # Error handling (existing)
│   ├── scaffold.ts           # Scaffolding logic (existing)
│   ├── presets.ts            # NEW: Preset definitions and selection
│   └── templates/            # NEW: Template content as TS objects
│       ├── minimal.ts        # Minimal preset templates
│       └── full.ts           # Full preset templates
└── types/
    └── state-file.ts         # Existing state.json schema
```

### Pattern 1: Preset Type Definition

**What:** Define preset structure with type safety
**When to use:** Preset module and templates

```typescript
// Source: Project pattern from Phase 16
export type PresetName = 'minimal' | 'full'

export interface Preset {
  name: PresetName
  description: string
  files: PresetFile[]
}

export interface PresetFile {
  path: string
  content: string
}
```

### Pattern 2: Commander Option for Preset

**What:** Add --preset flag to commander
**When to use:** CLI entry point

```typescript
// Source: commander docs + existing Phase 16 pattern
program
  .option('-p, --path <path>', 'target directory', '.')
  .option('-n, --name <name>', 'project name')
  .option('--preset <preset>', 'template preset (minimal|full)', 'minimal')
  .option('-f, --force', 'skip prompts and overwrite existing files')
```

### Pattern 3: Unknown Preset Interactive Prompt

**What:** Prompt user to select valid preset when unknown value provided
**When to use:** When `--preset` value is not 'minimal' or 'full'

```typescript
// Source: @inquirer/prompts docs
import { select } from '@inquirer/prompts'

const preset = await select({
  message: 'Select a preset:',
  choices: [
    { name: 'minimal - Essential OpenCode configuration', value: 'minimal' },
    { name: 'full - Complete configuration with examples', value: 'full' }
  ],
  default: 'minimal'
})
```

### Pattern 4: Template File Generation

**What:** Generate preset files from TypeScript template objects
**When to use:** Preset generation after confirmation

```typescript
// Source: Pattern from Phase 16 scaffold.ts
import { mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

function generatePresetFiles(targetPath: string, preset: Preset): void {
  const opencodeDir = join(targetPath, '.opencode')
  mkdirSync(opencodeDir, { recursive: true })
  
  for (const file of preset.files) {
    const filePath = join(opencodeDir, file.path)
    const dir = dirname(filePath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(filePath, file.content)
  }
}
```

### Anti-Patterns to Avoid

- **Don't store presets as JSON files:** Use TypeScript modules for type safety and IDE support
- **Don't include user-specific settings:** Never API keys, model preferences, permissions in templates
- **Don't merge with existing configs:** Overwrite behavior per CONTEXT.md
- **Don't silently fallback on unknown preset:** Must prompt user per CONTEXT.md

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Interactive selection | Custom prompt logic | @inquirer/prompts select() | Already installed, handles edge cases |
| Preset validation | Manual if/else | TypeScript union type | Compile-time safety |
| File generation | Complex template engine | Simple TS objects + fs | No template engine needed for static content |

**Key insight:** Presets are static configurations. TypeScript objects with type safety are simpler than template engines.

## Common Pitfalls

### Pitfall 1: Forgetting Minimal Default Message

**What goes wrong:** When `--preset` omitted, no "Defaulting to minimal" message shown
**Why it happens:** Easy to assume default behavior is implicit
**How to avoid:** Always print preset message, even for default
**Warning signs:** User doesn't know which preset was applied

### Pitfall 2: Confusing .openpaul vs .opencode

**What goes wrong:** Writing to `.openpaul/` instead of `.opencode/`
**Why it happens:** OpenPAUL project uses `.openpaul/` for its own state
**How to avoid:** Presets write to `.opencode/` (OpenCode config), OpenPAUL state stays in `.openpaul/`
**Warning signs:** OpenCode doesn't recognize the generated config

### Pitfall 3: Overwriting Without Warning

**What goes wrong:** Existing `.opencode/` directory overwritten without confirmation
**Why it happens:** Forgot to check for existing directory
**How to avoid:** Reuse existing overwrite check pattern from Phase 16
**Warning signs:** User's custom OpenCode config destroyed

### Pitfall 4: Including Sensitive Data in Templates

**What goes wrong:** Example config includes placeholder API keys or real model names
**Why it happens:** Copy-paste from working config
**How to avoid:** Audit template content; no keys, no user-specific settings
**Warning signs:** Templates contain `"model": "anthropic/..."` or API key fields

## Code Examples

### Minimal Preset Template

```typescript
// src/cli/templates/minimal.ts
import type { Preset } from '../presets'

export const minimalPreset: Preset = {
  name: 'minimal',
  description: 'Essential OpenCode configuration with empty directory structure',
  files: [
    {
      path: 'opencode.json',
      content: JSON.stringify({
        "$schema": "https://opencode.ai/config.json"
      }, null, 2)
    },
    {
      path: 'agents/.gitkeep',
      content: ''
    },
    {
      path: 'commands/.gitkeep',
      content: ''
    },
    {
      path: 'rules/.gitkeep',
      content: ''
    }
  ]
}
```

### Full Preset Template

```typescript
// src/cli/templates/full.ts
import type { Preset } from '../presets'

export const fullPreset: Preset = {
  name: 'full',
  description: 'Complete OpenCode configuration with example command and rule',
  files: [
    {
      path: 'opencode.json',
      content: JSON.stringify({
        "$schema": "https://opencode.ai/config.json"
      }, null, 2)
    },
    {
      path: 'tui.json',
      content: JSON.stringify({
        "$schema": "https://opencode.ai/tui.json"
      }, null, 2)
    },
    {
      path: 'commands/example.md',
      content: `---
description: Example custom command
agent: build
---
This is an example command. Customize it for your project needs.
`
    },
    {
      path: 'rules/example.md',
      content: `# Example Rule

This is an example rule file. Add your project-specific guidelines here.
`
    },
    {
      path: 'agents/.gitkeep',
      content: ''
    }
  ]
}
```

### Preset Selection Logic

```typescript
// src/cli/presets.ts
import { select } from '@inquirer/prompts'
import { notice, info } from './output.js'
import { minimalPreset } from './templates/minimal.js'
import { fullPreset } from './templates/full.js'

export const PRESETS = {
  minimal: minimalPreset,
  full: fullPreset
} as const

export type PresetName = keyof typeof PRESETS
export type Preset = typeof minimalPreset

export function isValidPreset(value: string): value is PresetName {
  return value in PRESETS
}

export async function resolvePreset(presetArg: string | undefined): Promise<Preset> {
  // Default to minimal when --preset not specified
  if (presetArg === undefined) {
    notice('Defaulting to minimal')
    return PRESETS.minimal
  }
  
  // Valid preset specified
  if (isValidPreset(presetArg)) {
    const preset = PRESETS[presetArg]
    info(`Preset: ${preset.name}`)
    info(preset.description)
    return preset
  }
  
  // Unknown preset - prompt for selection
  notice(`Unknown preset "${presetArg}"`)
  const selected = await select({
    message: 'Select a preset:',
    choices: [
      { name: `minimal - ${PRESETS.minimal.description}`, value: 'minimal' },
      { name: `full - ${PRESETS.full.description}`, value: 'full' }
    ],
    default: 'minimal'
  })
  
  return PRESETS[selected]
}
```

### CLI Integration

```typescript
// Extension to src/cli.ts action handler
import { resolvePreset, type Preset } from './cli/presets.js'
import { generatePresetFiles } from './cli/scaffold.js'

// In action handler, after getting project name:
const preset = await resolvePreset(options.preset)

// In confirmation message, include preset info:
const confirmed = await confirm({
  message: `Create OpenPAUL in '${targetPath}' with project name '${projectName}' (preset: ${preset.name})?`,
  default: true
})

// After state.json generation:
generatePresetFiles(targetPath, preset)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JSON template files | TypeScript template objects | Phase 17 | Type safety, IDE support |
| Hardcoded preset list | Dynamic preset registry | Phase 17 | Extensible for future presets |

**Deprecated/outdated:**
- Template engines (Handlebars, EJS): Overkill for static configuration files

## Open Questions

1. **Should presets include skills/ directory?**
   - What we know: OpenCode supports `.opencode/skills/` directory
   - What's unclear: CONTEXT.md doesn't mention skills in preset contents
   - Recommendation: Include empty `skills/.gitkeep` for consistency with agents/commands/rules

2. **Should full preset include agents/.gitkeep?**
   - What we know: Full preset includes example command and rule
   - What's unclear: Whether to include empty agents directory
   - Recommendation: Yes, include `agents/.gitkeep` for completeness

## Sources

### Primary (HIGH confidence)
- OpenCode config docs: https://opencode.ai/docs/config/ - Configuration locations, schema, merge behavior
- OpenCode commands docs: https://opencode.ai/docs/commands/ - Command file format, frontmatter
- OpenCode agents docs: https://opencode.ai/docs/agents/ - Agent file format, frontmatter
- Phase 16 RESEARCH.md - Existing CLI patterns, scaffold module
- Phase 16 scaffold.ts - Existing scaffolding implementation

### Secondary (MEDIUM confidence)
- Existing .opencode/ directory in this project - Real-world example of OpenCode config structure
- @inquirer/prompts docs - select() prompt usage

### Tertiary (LOW confidence)
- None required — all patterns verified from official docs and existing code

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use from Phase 15-16
- Architecture: HIGH - OpenCode config conventions well-documented, existing scaffold pattern to extend
- Pitfalls: HIGH - Based on CONTEXT.md constraints and common CLI patterns

**Research date:** 2026-03-22
**Valid until:** 30 days - stable libraries, OpenCode config format stable
