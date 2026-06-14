## Context

CthuDesktop is an Electron app that connects to the backend as a browser-capable agent. Browser commands are executed by `PlaywrightHost`, which uses Playwright's Chromium driver APIs to launch headed browser contexts from CthuDesktop's Electron app data profile directory.

The intended model is host Chrome only: CthuDesktop uses the user's installed Google Chrome executable while keeping profile data in CthuDesktop-owned `browser-profiles` directories, not the user's daily Chrome profile.

## Goals / Non-Goals

**Goals:**
- Use host Google Chrome for desktop browser automation.
- Keep persistent profile storage under CthuDesktop app data for required-auth sites.
- Allow an explicit Chrome executable path override for unusual installations.
- Make CLI diagnostics explain Playwright library availability and host Chrome launchability.
- Fail clearly when host Chrome is unavailable instead of silently using another browser.

**Non-Goals:**
- Do not attach to or reuse the user's normal Chrome profile.
- Do not connect to an already-running Chrome instance through CDP.
- Do not change backend browser command payloads or agent protocol schemas.
- Do not keep Playwright Chromium as a fallback runtime.
- Do not make `chc browser install` install or manage browsers.

## Decisions

### Runtime Model

Use a single desktop browser runtime config model:

```ts
type DesktopBrowserRuntime = {
  kind: 'host-chrome';
  executablePath?: string;
};
```

`host-chrome` is the normalized default. When no explicit path is configured, Playwright launches with `channel: 'chrome'`. When a path is configured, Playwright launches with `executablePath`.

Existing config files without `browserRuntime`, or with a removed runtime kind such as `playwright-chromium`, normalize back to `host-chrome`.

### No Fallback Runtime

Desktop startup validates host Chrome once. If host Chrome cannot launch, the browser host remains unavailable, the desktop agent does not advertise the `browser` capability, and local diagnostics explain that Google Chrome is required.

This intentionally removes the Playwright Chromium fallback. The product behavior is easier to explain: users install Chrome once, and CthuDesktop owns the automation profile.

### Profile Ownership

The runtime binary and the profile directory remain separate. CthuDesktop passes its own per-site profile directory to `launchPersistentContext` for required-auth flows. Anonymous captures continue to use temporary contexts and do not create persistent profiles.

Reusing the user's existing Chrome user data directory remains rejected because it can conflict with a running Chrome process, leaks personal browsing state into automation, and weakens the existing local profile boundary.

### CLI Diagnostics

`chc browser doctor` reports:
- whether Playwright can be loaded,
- whether host Chrome can be launched,
- which runtime desktop uses.

`chc browser install` is removed. Browser setup guidance should tell users to install Google Chrome or configure an executable path.

## Risks / Trade-offs

- Host Chrome version drift can change browser behavior over time -> keep focused runtime tests and clear diagnostics.
- Playwright `channel: 'chrome'` support depends on the host OS installation -> support explicit executable path override.
- Clean machines without Chrome no longer have an automatic fallback -> CLI and desktop diagnostics must explain the required Chrome install.

## Migration Plan

Existing desktop config files normalize to `host-chrome` when no browser runtime is present. Removed `playwright-chromium` config values also normalize to `host-chrome`. Existing CthuDesktop profile directories remain unchanged and continue to be used as persistent profile roots.

Rollback would require reintroducing the removed managed Chromium runtime branch; profile data remains compatible because the profile directory ownership does not change.
