## Context

The desktop renderer currently exposes Settings through a bottom-left shell entry and a small settings subnav with `service`, `status`, and `logs`. Service Connection owns editable environment/backend fields, Connection Status owns a broad mix of agent, runtime, app, and local path metadata, and Logs is an explicit placeholder. After the Home readiness change, Settings should become the detailed configuration and diagnostics center while Home remains a summary surface.

The change is renderer-focused. Existing data already comes from desktop config, agent connection state, and desktop app info, so no backend, preload, or persisted config contract is needed.

## Goals / Non-Goals

**Goals:**

- Make Settings navigation labels and page titles reflect clear ownership: service configuration, local runtime/status detail, diagnostics, logs placeholder, and appearance readiness.
- Keep editable controls limited to configuration sections and keep diagnostic sections read-only.
- Preserve shell deep links from the status bar into the most relevant Settings section.
- Keep Logs visible but explicitly unconnected.
- Update renderer tests so the Settings information architecture is covered.

**Non-Goals:**

- Implement a logging system, log streaming, log retrieval, export, or filtering.
- Add backend endpoints, Electron IPC/preload methods, or config schema migrations.
- Build a full theme switcher or introduce new appearance persistence behavior.
- Move Settings into shared packages or redesign the whole desktop shell.

## Decisions

1. Keep Settings inside `apps-desktop-product-shell` instead of creating a new capability.
   - Rationale: Settings is part of the existing desktop shell contract and reuses current app/runtime data.
   - Alternative considered: create `apps-desktop-settings` as a new capability. That would make sense once Settings has independent contracts or cross-app reuse, but this change only refines the existing desktop shell behavior.

2. Use a small, explicit Settings subnav rather than nested settings groups.
   - Rationale: The desktop app currently has a compact shell with one subnav level. A shallow structure keeps implementation small and avoids creating empty pages.
   - Alternative considered: introduce grouped sidebar categories. That would add layout complexity before there is enough settings surface area.

3. Split information by editability and responsibility.
   - Service Connection remains the only place for environment/backend editing.
   - Local Runtime / Status owns read-only host and agent facts.
   - Diagnostics owns recent connection errors, timing, browser runtime diagnostic text, and local paths.
   - Logs remains a placeholder.
   - Appearance is shown only as a fixed-theme/token-system state if included.

4. Do not add new runtime data sources.
   - Rationale: The required information already exists in renderer state. Adding IPC or backend calls would expand scope into logging/runtime instrumentation work.
   - Alternative considered: introduce log/runtime APIs now. That is deferred to the planned standalone logging system.

## Risks / Trade-offs

- Settings may still feel sparse after splitting sections -> Use concise empty/read-only states and avoid adding filler controls.
- Existing tests may rely on old Settings titles or labels -> Update tests around user-visible section names and preserved save/status behavior.
- Appearance can look like an unfinished feature -> Present it as a fixed current visual system state or omit executable controls.
- Diagnostics can duplicate Home readiness details -> Keep Home summary-level and Settings detail-level, with no editable controls duplicated on Home.
