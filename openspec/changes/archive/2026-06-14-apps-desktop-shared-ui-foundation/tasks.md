## 1. Desktop React Baseline

- [x] 1.1 Upgrade `apps/desktop` `react` and `react-dom` to the current React 19 stable line.
- [x] 1.2 Upgrade `apps/desktop` `@types/react` and `@types/react-dom` to React 19-compatible definitions.
- [x] 1.3 Refresh the lockfile and resolve any React 19 dependency or peer dependency conflicts.
- [x] 1.4 Run desktop renderer tests and typecheck to identify React 19 upgrade fallout before shared UI migration.
- [x] 1.5 Fix any React 19 TypeScript or runtime issues while preserving existing desktop behavior.

## 2. Shared UI Package

- [x] 2.1 Create `packages/ui` with package metadata, TypeScript config, build/typecheck scripts, and workspace exports.
- [x] 2.2 Add shared UI dependencies for shadcn-compatible primitives, Tailwind utilities, class merging, and selected accessible component primitives.
- [x] 2.3 Configure React and React DOM as broad peer dependencies compatible with React 18.3+ and React 19 consumers.
- [x] 2.4 Add shared `cn` utility, global stylesheet entrypoint, semantic CSS variables, and Dracula token mapping.
- [x] 2.5 Add the first shared primitives needed by desktop such as Button, Badge, Card, Tooltip, Table, Tabs, Separator, and ScrollArea.
- [x] 2.6 Add package-level tests or type assertions proving shared primitives can be imported without app-local paths.

## 3. Shared App Runtime

- [x] 3.1 Create the shared app-shell runtime package with package metadata, TypeScript config, build/typecheck scripts, and workspace exports.
- [x] 3.2 Configure React peer dependencies to match the shared UI package baseline.
- [x] 3.3 Define runtime kind, runtime capabilities, host action interfaces, and a provider/hook API for shared pages.
- [x] 3.4 Add shared navigation metadata for overview, browser profiles, agents, and settings sections.
- [x] 3.5 Add host-neutral shell/page building blocks that do not import Electron, preload modules, or desktop-only globals.
- [x] 3.6 Add runtime adapter tests for desktop-capable and web-safe capability sets.

## 4. Desktop Integration

- [x] 4.1 Wire Tailwind/shared global styles into the `apps/desktop` renderer build while preserving current renderer startup behavior.
- [x] 4.2 Add a desktop runtime adapter that bridges existing preload APIs into the shared runtime contract.
- [x] 4.3 Refactor desktop renderer API usage so shared page code receives host actions through the adapter instead of reading `window.cthutoolDesktop`.
- [x] 4.4 Replace common desktop controls and status surfaces with shared UI primitives where the shared package already provides them.
- [x] 4.5 Preserve custom desktop-only shell behavior for frameless titlebar drag regions and window controls.

## 5. Page Migration

- [x] 5.1 Move a narrow first slice of overview or status page composition into the shared app runtime package.
- [x] 5.2 Gate local path display behind desktop runtime capabilities and verify the same shared page can render without local path capabilities.
- [x] 5.3 Gate local browser login, verify, clear, and pending-auth actions behind desktop runtime capabilities.
- [x] 5.4 Keep host-only actions hidden, disabled, or replaced with non-executable states when rendered with a web-safe adapter.

## 6. Verification

- [x] 6.1 Update desktop renderer tests to use runtime adapter stubs and preserve existing shell, settings, agents, and browser-profile behavior.
- [x] 6.2 Run focused package checks for the new shared packages.
- [x] 6.3 Run `pnpm --filter @cthutool/desktop test`.
- [x] 6.4 Run `pnpm --filter @cthutool/desktop typecheck`.
- [x] 6.5 Run `openspec validate apps-desktop-shared-ui-foundation --strict`.
- [x] 6.6 Run `git diff --check`.
