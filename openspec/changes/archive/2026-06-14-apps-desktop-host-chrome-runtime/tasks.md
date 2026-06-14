## 1. Desktop Runtime Model

- [x] 1.1 Add a normalized desktop browser runtime config type with `host-chrome` as the only supported runtime.
- [x] 1.2 Persist and normalize optional host Chrome executable path overrides in desktop config without breaking existing config files.
- [x] 1.3 Add focused config tests for default migration, removed Chromium runtime migration, and explicit host Chrome path normalization.

## 2. Desktop Browser Host

- [x] 2.1 Extend `PlaywrightHost` runtime launch options to support host Chrome through Playwright `channel: 'chrome'` and explicit `executablePath`.
- [x] 2.2 Add startup/runtime resolution that validates host Chrome and fails clearly when it is unavailable.
- [x] 2.3 Ensure required-auth `launchPersistentContext` always uses CthuDesktop-owned profile directories regardless of selected browser executable.
- [x] 2.4 Prevent `browser` capability advertisement when host Chrome cannot launch, and surface a local diagnostic.
- [x] 2.5 Add focused PlaywrightHost tests for host Chrome launch options, explicit executable path, and host Chrome unavailable failure.

## 3. CLI Browser Runtime Commands

- [x] 3.1 Update `chc browser doctor` to report Playwright load status, host Chrome availability, and preferred runtime.
- [x] 3.2 Remove `chc browser install` from the browser runtime command surface.
- [x] 3.3 Preserve `chc browser status` as backend-state-only and avoid requiring local Chrome discovery for status.
- [x] 3.4 Add CLI unit tests for host Chrome ready/unavailable diagnostics and status separation.

## 4. Desktop UI and Documentation

- [x] 4.1 Decide whether first-pass runtime selection is config-file-only or exposed in desktop Settings; implement the chosen surface consistently.
- [x] 4.2 Update desktop/browser docs to explain host Chrome runtime and the isolated CthuDesktop profile boundary.
- [x] 4.3 Update any setup text that currently implies `chc browser install` is available or mandatory for desktop browser automation.

## 5. Validation

- [x] 5.1 Run `openspec validate apps-desktop-host-chrome-runtime --type change --strict`.
- [x] 5.2 Run focused desktop tests for config and PlaywrightHost behavior.
- [x] 5.3 Run focused CLI browser command tests.
- [x] 5.4 Run desktop and CLI typechecks.
- [x] 5.5 Run `git diff --check`.
