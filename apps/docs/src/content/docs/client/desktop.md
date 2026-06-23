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

For local desktop development, either point the app at a homelab backend URL or start a development backend separately:

```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run start:dev
```

The local backend command is for development and debugging. The homelab backend deployment runs in Kubernetes and is reconciled by ArgoCD.

The desktop app defaults to `http://localhost:3000`. Change the Backend URL in Settings when connecting to a homelab backend exposed from the cluster, such as `http://homelab.local:3000`.

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
