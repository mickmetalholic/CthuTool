# Codex Plugins

Personal Codex plugins maintained as workspace packages.

## Layout

- `plugins/english-coach`: English coaching hook for Codex prompts.
- `.agents/plugins/marketplace.json`: Local marketplace manifest for this project.

Future plugins should live under `plugins/<plugin-name>` with their own `.codex-plugin/plugin.json`.

## Validate

```powershell
pnpm validate:english-coach
```

## Install

Run the CLI installer to see plugin status and choose which plugins to install into your personal Codex marketplace:

```powershell
pnpm install:plugins
```

Non-interactive examples:

```powershell
chc codex plugins --plugin english-coach
chc codex plugins --all
```

## Refresh Codex Cache

When plugin hook files change, refresh the local Codex runtime cache:

```powershell
chc codex plugins --plugin english-coach --sync-cache
```

When changing plugin behavior and you want Codex to see a new plugin version, bump the patch version and refresh the cache in one command:

```powershell
chc codex plugins --plugin english-coach --bump-patch
```

Package shortcuts:

```powershell
pnpm refresh:english-coach
pnpm upgrade:english-coach
```
