# Repository Codex Config

This directory is the repository source for low-risk, reproducible Codex configuration.

Managed entries:

- `prompts/`
- `rules/`
- `skills.manifest.json`
- `plugins.manifest.json`
- `README.md`

Do not commit Codex runtime state here. Keep these local to `C:\Users\yuans\.codex` or other personal backup tooling:

- `auth.json`
- `cap_sid`
- `*.sqlite`, `*.sqlite-shm`, `*.sqlite-wal`
- `cache/`
- `plugins/cache/`
- `logs/` or `log/`
- `tmp/` or `.tmp/`
- `sessions/`
- `archived_sessions/`
- `memories/`
- `config.toml`

Use the CLI guardrail before committing Codex config changes:

```bash
chc codex doctor
```
