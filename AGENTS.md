<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read:
- `specs/009-obsidian-enhancer/plan.md`
<!-- SPECKIT END -->

## Agent Adapter Policy

- Treat `.specify/` and `specs/` as the versioned Speckit source of truth.
- Keep intentionally shared `.claude/`, `.codex/`, and `.cursor/` instructions when they are project-specific and portable.
- Do not commit generated Speckit command/skill adapters under agent-specific folders; regenerate those per tool or platform instead.

## Collection Hub

- For work under `scratches/collection-hub`, read `scratches/collection-hub/AGENTS.md`.
