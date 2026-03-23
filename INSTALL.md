# Installation Guide

Get OpenPAUL running in your project.

## Quick Start

```bash
npx openpaul
```

This scaffolds the .openpaul/ directory with everything you need.

---

## CLI Options

- -n, --name <name> - Project name (defaults to directory name)
- -p, --path <path> - Target directory (default: current)
- --preset <preset> - Template preset: minimal or full
- -f, --force - Skip prompts and overwrite existing files
- -i, --interactive - Force interactive mode
- -v, --verbose - Enable verbose output

---

## Examples

```bash
npx openpaul                           # Interactive mode
npx openpaul --name my-project         # Skip name prompt
npx openpaul --path ./app              # Target directory
npx openpaul -n my-project -p ./app    # Combined options
npx openpaul --preset minimal          # Minimal template
npx openpaul --preset full             # Full template
```

---

## What Gets Created

.openpaul/
├── PROJECT.md           # Project context and requirements
├── ROADMAP.md           # Phase breakdown and milestones
├── STATE.md             # Loop position and session state
└── phases/              # Phase directories (created as needed)

---

## Install as OpenCode Plugin

To use OpenPAUL commands inside OpenCode (like /openpaul:plan):

1. Open or create ~/.config/opencode/opencode.json:

```json
{
  "plugins": {
    "npm": [
      "openpaul"
    ]
  }
}
```

2. Restart OpenCode to load the plugin.

---

## Verify Installation

- CLI: Run npx openpaul --version
- Plugin: Run /openpaul:help inside OpenCode

---

## With OpenCARL (Recommended)

For the best experience, use OpenPAUL with OpenCARL:

```bash
# Initialize OpenPAUL
npx openpaul

# Initialize OpenCARL
npx opencarl --local   # Current project only
npx opencarl --global  # All projects
```

OpenCARL auto-loads OpenPAUL rules when it detects .openpaul/ directory.
