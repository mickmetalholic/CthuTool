## Context

The latest source state includes:

- backend public browser API endpoints under `POST /api/browser/sessions`, `POST /api/browser/sessions/{sessionId}/actions`, and `DELETE /api/browser/sessions/{sessionId}`
- a `packages/browser-client` package exporting `CthuBrowserClient`
- OpenSpec requirements for `apps-backend-browser-public-api` and `packages-browser-client-sdk`

The current docs mention browser automation and auth but do not explain this public integration layer.

## Decisions

### Add browser client SDK documentation

Add a docs page for the SDK, preferably under Modules so users can discover it alongside browser automation. The page should include a small example, supported page methods, session lifecycle, and limitations.

### Update backend API reference

The reference API page should list public browser session endpoints separately from browser status endpoints. It should state that these endpoints are for trusted deployments first and currently do not add API key authentication.

### Keep safety boundaries prominent

Docs should repeat that responses do not expose cookies, localStorage, Playwright storage-state contents, desktop profile paths, or raw Playwright handles. Navigation is constrained by configured site `allowedOrigins`.

## Risks / Trade-offs

- This API is powerful because it drives browser work through desktop agents. The docs must frame it as trusted-network usage until an explicit auth layer exists.
- The SDK has a Playwright-like shape but is not Playwright; docs should avoid implying full Playwright compatibility.

## Open Questions

- Should future docs provide examples for authentication headers once backend API authentication is added?
