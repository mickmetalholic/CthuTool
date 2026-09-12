## Context

The install command's default path resolver falls back to the current directory when no CthuTool workspace is found. Empty discovery is indistinguishable from a valid repository with no enabled plugins.

## Decisions

- Store a versioned `{version:1, repoRoot}` file at `$HOME/.cthutool/codex/plugin-source.json`, outside the replaceable plugin cache. Write atomically after a successful installation.
- Resolve sources in this order: explicit `--repo-root` for this run; remembered path; detected CthuTool working-tree root. On the first interactive run, prompt even when a working-tree root is detected and prefill that root. `--change-source` prompts with the saved/detected path as default, or uses the supplied `--repo-root` to update the remembered path.
- Validate the chosen source before mutation. A source must be a directory containing a plugin directory or plugin manifest. The detected cwd must additionally be a CthuTool workspace root. When the remembered path is stale, prompt to replace it interactively and fail with a repair instruction otherwise.
- `--json` and `--no-interactive` never prompt. If no source is available, fail and instruct the caller to use `--change-source --repo-root <path>`.
- Do not infer the source from installed plugin cache because installed state may be stale and is not authoritative for repository discovery.

## Risks

- A valid source may contain zero enabled plugins. Report that explicitly with the selected source, rather than claiming an installed plugin.
- A one-run worktree override must not overwrite the remembered default.
