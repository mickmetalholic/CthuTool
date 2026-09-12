## Why

Fresh checkouts depend on `pnpm setup:ai-tooling` or a checkout hook to generate OpenSpec skills, so agents can start without the workflows the repository expects. The setup path also duplicates OpenSpec's own regeneration command and obscures which skill files belong in version control.

## What Changes

- Commit the OpenSpec core workflow skills (`explore`, `propose`, `apply`, `update`, `sync`, and `archive`) as a reviewed snapshot for Codex, Cursor, OpenCode, Pi, and ZCode.
- Share `.agents/skills/openspec-*` across Codex, Cursor, OpenCode, and Pi; keep ZCode's native `.zcode/skills/openspec-*` output.
- **BREAKING**: Remove `pnpm setup:ai-tooling`, `pnpm check:ai-tooling`, and the checkout-hook bootstrap. Regenerate the tracked snapshot directly with the OpenSpec CLI when upgrading it or changing workflows.
- Update repository guidance, verification, and contract tests for the committed-skill lifecycle while leaving authored Cursor skills and the `cthu-codex` business plugin outside regeneration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-ai-tooling-standardization`: Require committed OpenSpec skills for the five project agents and document direct CLI regeneration and read-only verification.
- `apps-root-engineering-config`: Define the checked-in OpenSpec output paths in root project guidance.

## Impact

The tracked `.agents/skills` and `.zcode/skills` trees, root scripts and Git hooks, OpenSpec configuration, AI tooling documentation, and related contract tests change. Unrelated OpenSpec specs and changes remain separate. The protected `codex/plugins/cthu-codex` plugin is unaffected.
