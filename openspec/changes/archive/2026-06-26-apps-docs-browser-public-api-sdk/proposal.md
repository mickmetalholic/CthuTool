## Why

The backend now exposes a trusted public browser session API, and the repository includes `@cthutool/browser-client` as a typed SDK. Current user docs still describe only internal browser auth/status APIs, so third-party integration users cannot discover the supported API or safety boundary.

## What Changes

- Document the public browser session lifecycle and supported action model.
- Document the `@cthutool/browser-client` SDK usage, limitations, and trusted deployment assumptions.
- Update browser automation/auth module pages and backend API reference to include session endpoints.
- Keep sensitive state ownership clear: CthuDesktop owns Playwright runtime state and browser storage; backend stores only routing metadata.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-docs-site`: Document public browser API and browser client SDK usage paths.

## Impact

- Affects user/reference docs under `apps/docs/src/content/docs/`.
- May add a new module or reference page for the browser client SDK.
- No backend or SDK runtime behavior changes are expected.
