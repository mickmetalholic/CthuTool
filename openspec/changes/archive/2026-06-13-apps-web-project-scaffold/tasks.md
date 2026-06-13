## 1. Web App Scaffold

- [x] 1.1 Create `apps/web` with a private CthuTool-scoped package name and Next.js TypeScript App Router structure.
- [x] 1.2 Add minimal Next.js entry files required for the app to build, using placeholder-safe scaffold content only.
- [x] 1.3 Add app-local configuration files needed by Next.js and TypeScript without importing desktop renderer internals.
- [x] 1.4 Add `dev`, `build`, `typecheck`, and `lint` scripts to `apps/web/package.json`.

## 2. Styling Baseline

- [x] 2.1 Add Tailwind CSS baseline files for `apps/web`.
- [x] 2.2 Add shadcn/ui-compatible utility setup such as `components.json` and a local `cn` helper if required by the scaffold.
- [x] 2.3 Keep all initial styling app-local or framework baseline only; do not create or modify `packages/ui`.

## 3. Workspace Integration

- [x] 3.1 Install or update dependencies through pnpm so `apps/web` is represented in the lockfile.
- [x] 3.2 Ensure the existing pnpm workspace and turbo task configuration can discover `apps/web` without package-specific changes elsewhere.
- [x] 3.3 Avoid changes to `apps/desktop`, `apps/backend`, `apps/cli`, and `packages/*` source code.

## 4. Documentation Naming

- [x] 4.1 Search relevant OpenSpec and project documentation for future web host references that say `apps/frontend`.
- [x] 4.2 Update those future web host references to `apps/web` when they refer to the CthuTool browser management console.
- [x] 4.3 Leave unrelated frontend wording alone when it describes generic frontend concepts rather than the app path.

## 5. Verification

- [x] 5.1 Run `pnpm --filter @cthutool/web typecheck`.
- [x] 5.2 Run `pnpm --filter @cthutool/web lint`.
- [x] 5.3 Run `pnpm --filter @cthutool/web build`.
- [x] 5.4 Run `openspec validate apps-web-project-scaffold --strict`.
- [x] 5.5 Run `git diff --check` to catch whitespace issues in generated scaffold and docs.
