## 1. CLI Surface Removal

- [x] 1.1 Add or update CLI tests so the root command no longer exposes `browser`.
- [x] 1.2 Remove `browser` from CLI root command registration.
- [x] 1.3 Delete the browser command implementation and its unit tests.
- [x] 1.4 Delete the old CLI browser-auth helper implementation and its unit tests.
- [x] 1.5 Generalize incomplete top-level command help handling beyond `codex`.

## 2. Documentation and Specs

- [x] 2.1 Update browser-auth documentation to point regular users to CthuDesktop and developers to backend APIs for troubleshooting.
- [x] 2.2 Remove the current `apps-cli-browser-runtime` main spec capability after recording the removal delta.
- [x] 2.3 Validate the OpenSpec change strictly.

## 3. Verification

- [x] 3.1 Run focused CLI tests.
- [x] 3.2 Run CLI typecheck.
- [x] 3.3 Search for stale CLI browser command references.
