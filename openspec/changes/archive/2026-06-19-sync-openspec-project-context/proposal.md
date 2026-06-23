## Why

OpenSpec artifact generation currently depends on `AGENTS.md` for project-specific
rules such as capability naming, change scope, and generated adapter handling.
Putting those constraints in OpenSpec's own configuration makes future proposals,
specs, designs, and tasks more consistent across agents.

## What Changes

- Add repository-specific OpenSpec context to `openspec/config.yaml`.
- Add artifact rules that remind proposal/spec/task generation to keep monorepo
  area prefixes and one-change scope.
- Keep generated agent adapter skills as generated outputs rather than hand-edited
  project policy files.
- Do not change the active OpenSpec workflow schema.

## Capabilities

### New Capabilities

### Modified Capabilities
- `apps-root-engineering-config`: Add requirements for representing
  repository-level OpenSpec guidance in project configuration so artifact
  creation follows the same project policies as agent instructions.

## Impact

- Affects `openspec/config.yaml`.
- Does not affect runtime code, package APIs, or existing main specs.
- Improves future OpenSpec artifact quality by making project policy available
  through OpenSpec instructions.
