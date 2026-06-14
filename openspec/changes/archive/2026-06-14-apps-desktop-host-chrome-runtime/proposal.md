## Why

CthuDesktop should use the user's installed Google Chrome binary for local browser automation instead of managing a separate Chromium browser download. This keeps setup simple on machines that already have Chrome while preserving the important boundary that CthuDesktop owns its own isolated browser profiles.

## What Changes

- Add a host Chrome browser runtime model for CthuDesktop.
- Keep all required-auth site profiles under CthuDesktop's existing `browser-profiles` directory.
- Allow an explicit host Chrome executable path override for machines where Playwright channel discovery is insufficient.
- Update `chc browser doctor` so users can check Playwright library availability and host Chrome launchability.
- Remove `chc browser install` and any Playwright Chromium fallback runtime behavior from the browser automation surface.
- Update desktop/browser auth documentation to describe the host Chrome default and isolated profile boundary.
- No breaking changes to backend browser command payloads, browser profile status APIs, or agent protocol messages.

## Capabilities

### New Capabilities
- `apps-cli-browser-runtime`: CLI browser runtime diagnostics for host Chrome.

### Modified Capabilities
- `apps-desktop-browser-host`: CthuDesktop browser host runtime changes from Playwright Chromium to host Google Chrome with isolated CthuDesktop profiles.

## Impact

- Affected code: `apps/desktop/src/main/playwright-host.ts`, `apps/desktop/src/main/config.ts`, `apps/desktop/src/main/index.ts`, desktop preload/renderer diagnostic surfaces, and focused desktop tests.
- Affected CLI code: `apps/cli/src/command/browser.command.ts` and browser command tests.
- Affected docs: `docs/browser-auth.md` and `docs/desktop-agent-console.md`.
- Dependencies: no new external service dependency; continues to use Playwright as the automation library.
- Systems: CthuDesktop local browser automation, local desktop config, CLI runtime diagnostics, and browser setup documentation.
