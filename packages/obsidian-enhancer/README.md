# @cthutool/obsidian-enhancer

`@cthutool/obsidian-enhancer` is an Obsidian desktop plugin package migrated from `.references/obsidian-enhancer` and refactored for this monorepo.
This README is the package-local development reference. For module-level docs,
see `apps/docs/src/content/docs/modules/obsidian-enhancer.md`.

## Features

- Open current vocabulary note in Eudic via deep link.
- Auto move current note based on frontmatter tag hierarchy.
- Mark current note as reviewed (`last review` date).
- Move note status forward (`Again -> Hard -> Good -> Easy -> Complete`).
- Plugin settings for vocabulary tag and excluded root folders.

## Build

From repository root:

```bash
pnpm --filter @cthutool/obsidian-enhancer build
```

By default, build output goes to:

- `packages/obsidian-enhancer/dist/main.js`
- `packages/obsidian-enhancer/dist/manifest.json`
- `packages/obsidian-enhancer/dist/styles.css`
- `packages/obsidian-enhancer/dist/versions.json`

## Build Directly To Obsidian Plugin Directory

Set `OBSIDIAN_PLUGIN_DIR` to your target plugin folder:

PowerShell:

```powershell
$env:OBSIDIAN_PLUGIN_DIR = "D:\Vault\.obsidian\plugins\obsidian-enhancer"
pnpm --filter @cthutool/obsidian-enhancer build
```

Bash:

```bash
OBSIDIAN_PLUGIN_DIR="/path/to/Vault/.obsidian/plugins/obsidian-enhancer" \
pnpm --filter @cthutool/obsidian-enhancer build
```

This makes build artifacts available to Obsidian without manual copy.
