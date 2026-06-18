---
title: Desktop App
description: Install and run CthuDesktop on a client computer.
---

CthuDesktop is the client-side app for local browser execution and user-visible login state.

## Development Run

From a repository checkout:

```bash
pnpm install
pnpm --filter @cthutool/desktop dev
```

Start the backend separately:

```bash
pnpm --filter @cthutool/backend dev
```

The desktop app defaults to `http://localhost:3000`. Change the Backend URL in Settings when connecting to a homelab backend such as `http://homelab.local:3000`.

## Packaging

Current local packaging commands:

```bash
pnpm --filter @cthutool/desktop package:win
pnpm --filter @cthutool/desktop package:mac
```

GitHub Actions runs `.github/workflows/desktop-artifacts.yml` on relevant desktop changes and uploads unsigned macOS and Windows artifacts. The workflow does not notarize, sign, or publish installers yet.

On local Windows machines, `package:win` may require Developer Mode or an administrator terminal because electron-builder extracts `winCodeSign` files that include symlinks before it edits executable resources. A directory package smoke test can be run without executable resource editing:

```powershell
pnpm --filter @cthutool/desktop exec electron-builder --dir --config.win.signAndEditExecutable=false
```

## Runtime Notes

CthuDesktop uses the host Google Chrome binary for local browser automation while keeping CthuDesktop-owned profile directories under app data. It does not reuse the user's everyday Chrome profile.

Source reference: `docs/desktop-agent-console.md`.
