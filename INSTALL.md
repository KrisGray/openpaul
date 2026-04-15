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

Running `npx openpaul` scaffolds:

.openpaul/
└── state.json           # Project registry (name, version, timestamps)

opencode.json            # OpenCode config (includes "plugin": ["openpaul"])
.opencode/               # OpenCode folders (commands, rules, skills, etc.)

---

## Plugin Installation

`npx openpaul` automatically adds `"plugin": ["openpaul"]` to `opencode.json`. Just restart OpenCode after scaffolding to load the plugin. `/openpaul:*` commands will appear in the TUI command list.

---

## Verify Installation

- CLI: Run npx openpaul --version
- Plugin: Run /openpaul:help inside OpenCode (it should autocomplete)

## Local development (from source)

If you are working on OpenPAUL locally, add a local plugin file under `.opencode/plugins/`:

```
.opencode/plugins/openpaul.ts
```

```ts
import plugin from "/absolute/path/to/openpaul/dist/index.js"
export default plugin
```

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
