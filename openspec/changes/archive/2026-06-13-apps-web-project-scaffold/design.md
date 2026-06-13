## Context

The repository already has `apps/backend`, `apps/cli`, and `apps/desktop` in a pnpm/turbo workspace. The desktop renderer currently owns the first management-console experience, while the active shared UI foundation work is expected to make pages reusable across desktop and a browser-hosted frontend.

This change establishes the browser-hosted frontend as `apps/web`. It should create the Next.js project host and update project references to the `apps/web` name, but it should not implement product pages or force the shared UI/runtime migration into this scaffold change.

## Goals / Non-Goals

**Goals:**

- Create a minimal `apps/web` workspace app for the future CthuTool web management console.
- Use Next.js, TypeScript, Tailwind CSS, and shadcn/ui-compatible conventions from the start.
- Keep web-host naming consistent as `apps/web` in relevant OpenSpec/project documentation.
- Leave enough structure for future shared pages to be consumed from shared UI/runtime packages.
- Add only the scripts and configuration needed to install, develop, typecheck, lint, and build the scaffold.

**Non-Goals:**

- Do not build real management-console pages, dashboards, settings, browser automation screens, or agent views.
- Do not extract desktop pages into shared packages.
- Do not create or modify `packages/ui`, shared runtime packages, backend APIs, CLI behavior, or desktop renderer behavior.
- Do not make the web app the source of truth for pages; future page reuse should come from shared packages.

## Decisions

### Use `apps/web` as the canonical web host name

The browser frontend will live at `apps/web`, not `apps/frontend`. This keeps the name short and symmetric with `apps/desktop`, and it leaves "frontend" available as a broader concept that can include desktop renderer and shared UI packages.

Alternative considered: `apps/frontend`. That name is descriptive, but it is less precise in this repo because the Electron renderer is also frontend code.

### Scaffold a host app, not product content

The first implementation will create a minimal app shell that proves the project compiles and renders a placeholder-safe entry point. It will not implement actual management pages. Product page work should wait for the shared UI/runtime boundary so the same pages can be consumed by desktop and web.

Alternative considered: scaffold and immediately build the management dashboard. That would make fast visual progress, but it risks creating a second copy of desktop pages before shared packages exist.

### Keep shared-page assumptions explicit but external

`apps/web` should be prepared to import future shared UI/runtime packages, but this change will not create or modify those packages. The web app should only own host-level concerns such as Next.js routing, global CSS entry, metadata, environment configuration, and app-local bootstrap.

Alternative considered: create `packages/ui` and a frontend runtime together with `apps/web`. That is architecturally clean, but it violates the requested scope of only creating the project now.

### Prefer framework-current setup with repo-local guardrails

The scaffold should use Next.js App Router and Tailwind/shadcn-compatible setup, while following repository conventions for pnpm workspace naming, TypeScript, lint scripts, and turbo tasks. Dependency versions should be resolved by the package manager during implementation rather than hard-coded in the spec text.

Alternative considered: use Vite for closer similarity to the desktop renderer. Next.js is the user's chosen stack for the web host and provides a stronger route/server boundary for a browser management console.

## Risks / Trade-offs

- The app may initially contain only placeholder content -> Keep that intentional and document that real pages arrive through later shared-page work.
- Next.js and Electron/Vite have different runtime assumptions -> Keep shared page code outside `apps/web` and avoid making Next-only APIs part of reusable page contracts.
- Tailwind/shadcn setup can diverge from future shared UI packages -> Keep the scaffold minimal and ready to consume shared CSS/components later.
- Existing active desktop/shared-ui changes mention `apps/frontend` -> Update documentation references that describe the future browser host to `apps/web` during implementation, without changing package code.
- Adding a new app changes lockfile/root metadata -> Limit package changes to `apps/web`, the workspace lockfile, and root/turbo metadata only when necessary.

## Migration Plan

1. Create `apps/web` with a minimal Next.js TypeScript scaffold.
2. Add Tailwind CSS and shadcn/ui-compatible baseline files without adding real product pages.
3. Add package scripts for `dev`, `build`, `typecheck`, and `lint`.
4. Update relevant documentation references from `apps/frontend` to `apps/web` where they refer to this future web management console.
5. Verify the scaffold with install-aware checks, typecheck, lint, and build.

Rollback is straightforward: remove `apps/web`, remove its lockfile entries, and revert documentation references added by this change.

## Open Questions

- Should the eventual route namespace start at `/` for the management console or reserve `/admin` for future multi-surface hosting?
- Should the web app eventually proxy through Next.js server routes or call `apps/backend` directly from shared client adapters?
- Should shadcn components be app-local until `packages/ui` exists, or should implementation wait for shared UI before adding any shadcn component files beyond baseline configuration?
