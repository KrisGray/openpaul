# Troubleshooting

Common issues and solutions for OpenPAUL.

## Commands not found after install?

- Restart OpenCode to reload plugins
- Verify openpaul is listed in the `plugin` array in `.opencode/opencode.json`

## Commands not working as expected?

- Run /openpaul:help to verify installation
- Check the plugin is installed in ~/.cache/opencode/node_modules/openpaul/

## Loop position seems wrong?

- Check .openpaul/STATE.md for current state
- Run /openpaul:progress for guided next action

## Resuming after a break?

- Run /openpaul:resume - it reads state and handoffs automatically

## CLI not scaffolding files?

- Ensure you have write permissions in the target directory
- Try with --force to overwrite existing files
- Check for .openpaul/ directory conflicts

## Plugin loading issues?

1. Verify opencode.json syntax is valid JSON
2. Check npm package installed correctly
3. Restart OpenCode completely

## State file corrupted?

1. Backup .openpaul/STATE.md
2. Review for missing required fields
3. Run npx openpaul --force to reinitialize (destructive)

## Plan execution failed?

1. Check .openpaul/phases/{phase}/{plan}-PLAN.md for details
2. Review task verification steps
3. Run /openpaul:apply with specific plan path

## Need more help?

- GitHub Issues: https://github.com/KrisGray/openpaul/issues
- Documentation: https://krisgray.github.io/openpaul/
