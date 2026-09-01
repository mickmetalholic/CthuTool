## Why

CthuTool currently has multiple manually copied and divergent agent skill trees, an outdated OpenSpec installation, and a legacy Reasonix configuration that does not match the installed Reasonix version. This makes Codex, Cursor, OpenCode, and Reasonix observe different capabilities and makes it unclear whether a skill belongs to OpenSpec, the third-party `npx skills` ecosystem, or the repository's business plugin system.

The repository needs one explicit ownership and generation model before adding more skills: OpenSpec should generate its workflow adapters, `npx skills` should manage third-party skills, and Reasonix should consume the shared skills format without introducing another copy of every skill.

## What Changes

- **BREAKING** Upgrade the repository's OpenSpec setup to the current CLI generation model and core workflow set: `explore`, `propose`, `apply`, `update`, `sync`, and `archive`.
- **BREAKING** Configure OpenSpec for Codex, Cursor, OpenCode, and the vendor-neutral `agents` target; migrate or remove obsolete OpenSpec-generated files under legacy agent directories.
- Define `.agents/skills` as the shared OpenSpec skill surface consumed by Codex and Reasonix, while retaining native generated surfaces for Cursor and OpenCode.
- Establish the ownership boundary between OpenSpec-generated workflows, third-party skills installed with `npx skills`, and repository-owned business plugins.
- Remove the repository-local `ui-ux-pro-max` copies instead of treating them as a repository-managed skill. Do not change `codex/plugins/cthu-codex`.
- Replace the stale Reasonix project configuration with the configuration and skill-discovery model supported by the installed Reasonix release; remove machine-specific paths from project configuration.
- Update repository policy and developer documentation to describe the actual directory layout, installation commands, generated-file policy, and four-tool invocation model.

## Capabilities

### New Capabilities

- `apps-cli-ai-tooling-standardization`: Defines the repository-owned AI tooling topology, OpenSpec adapter generation, third-party skill ownership, and Reasonix compatibility.

### Modified Capabilities

- None. Existing Codex skill-management and OpenCode plugin specifications remain focused on their current CLI/plugin contracts; this change documents and standardizes the surrounding project-level tooling without changing the `cthu-codex` business plugin.

## Impact

- Project configuration and generated adapter locations under `.agents/`, `.codex/`, `.cursor/`, `.opencode/`, `.claude/`, and `.reasonix/`.
- `openspec/config.yaml`, repository agent policy, AI-tooling documentation, and Reasonix configuration.
- Removal of the tracked `ui-ux-pro-max` skill copies.
- Removal of the generic project baseline skill sources and their setup wiring.
- OpenSpec CLI version and generated workflow files; no product APIs or runtime business behavior.
- Developer onboarding and local verification commands for Codex, Cursor, OpenCode, and Reasonix.
