## Agent Adapter Policy

- Keep intentionally shared `.claude/`, `.codex/`, and `.cursor/` instructions when they are project-specific and portable.
- Do not commit generated command/skill adapters under agent-specific folders; regenerate those per tool or platform instead.

## OpenSpec Naming

- Name `openspec/specs/<capability>` directories with a monorepo area prefix so ownership is visible from the directory name.
- Use prefixes such as `apps-cli-*`, `packages-<package>-*`, or `scratches-collection-hub-*` instead of generic names when creating or syncing main specs.
- Keep existing clear area prefixes, such as `collection-hub-*`, unless a broader rename is explicitly requested.

## Collection Hub

- For work under `scratches/collection-hub`, read `scratches/collection-hub/AGENTS.md`.
