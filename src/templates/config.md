---
project:
  name: example-project
  description: OpenPAUL-managed project
integrations:
  sonarqube:
    enabled: false
    url: https://sonarqube.example.com
    projectKey: example-project
    branch: main
preferences:
  autoAdvance: false
  parallelization: false
  verbose: false
---
# OpenPAUL Configuration

This file stores configuration in YAML frontmatter. Notes below are preserved
when OpenPAUL updates the config values.

## Project

Use this section to identify the project in OpenPAUL output.

- `project.name` is required
- `project.description` is optional

## Integrations

Enable optional integrations used by configuration-aware commands.

### SonarQube

Fields for SonarQube integration:

- `enabled`: true when SonarQube is available
- `url`: server URL (cloud or local)
- `projectKey`: project identifier in SonarQube
- `branch`: default branch for scans

## Preferences

Toggle optional CLI behavior for OpenPAUL.

- `autoAdvance`: allow auto-approval of checkpoints
- `parallelization`: allow parallel agents when supported
- `verbose`: show detailed output

## Notes

Only the YAML frontmatter above is parsed as configuration. The markdown
body stays intact after edits and can be used for documentation, links,
or team-specific guidance.

## Guidelines

- Keep keys limited to: project, integrations, preferences
- Avoid secrets in this file; use environment variables instead
- Review changes with `/openpaul:config action=list`

## Example Updates

Typical edits are safe to make directly in the frontmatter:

- Update `project.name` when the repo name changes
- Set `sonarqube.enabled` to true after integration is ready
- Set `preferences.verbose` to true while troubleshooting

## Troubleshooting

If OpenPAUL reports an unknown key:

- Check for typos in frontmatter keys
- Verify indentation is two spaces
- Ensure only top-level keys are used

---

Managed by `/openpaul:config`
