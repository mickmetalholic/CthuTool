## 1. Package Setup

- [x] 1.1 Create `packages/browser-client` with package metadata, TypeScript config, source entrypoint, and test config matching monorepo package conventions.
- [x] 1.2 Add package exports for JavaScript output and TypeScript declaration files.
- [x] 1.3 Ensure the package has no Playwright, desktop agent, or backend application dependency.

## 2. Public Types And Transport

- [x] 2.1 Define public SDK types for client options, session options, browser actions, action results, screenshots, and structured errors.
- [x] 2.2 Implement a backend-bound HTTP transport that uses configured `baseUrl`, optional default headers, and optional injected `fetch`.
- [x] 2.3 Implement structured response parsing and `BrowserClientError` mapping for backend errors and transport failures.
- [x] 2.4 Add unit tests for URL construction, injected fetch usage, headers, response parsing, and error mapping.

## 3. Client And Page API

- [x] 3.1 Implement `CthuBrowserClient.newPage()` by calling the backend create-session endpoint and returning a page wrapper with the session ID.
- [x] 3.2 Implement low-level session/action methods for callers that want direct access to the backend action contract.
- [x] 3.3 Implement Playwright-like page methods for `goto`, `waitForSelector`, `click`, `fill`, `textContent`, `content`, `title`, `screenshot`, and `close`.
- [x] 3.4 Add a `withPage()` helper or equivalent documented pattern that closes sessions with `try/finally`.
- [x] 3.5 Add unit tests for method-to-action mapping, ordered result handling, close behavior, and closed-page local rejection.

## 4. Documentation

- [x] 4.1 Add a package README with install/build notes, basic usage, session lifecycle, supported methods, and limitations.
- [x] 4.2 Document that the SDK talks only to the CthuTool backend public browser API and does not expose raw Playwright, desktop agent, cookies, localStorage, storage-state, or profile paths.
- [x] 4.3 Include an example that creates a client, opens a page, navigates, extracts text or HTML, and closes the page.

## 5. Verification

- [x] 5.1 Run package build, typecheck, lint, and unit tests for `@cthutool/browser-client`.
- [x] 5.2 Run `openspec validate packages-browser-client-sdk --strict`.
- [x] 5.3 Confirm generated `.claude/`, `.codex/`, and `.cursor/` adapter files remain unchanged unless explicitly regenerated.
