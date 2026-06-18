## Context

CthuDesktop currently has top-level Home, Tasks, Browser Profiles, Agents, and Settings surfaces. Home shows generic metrics plus a Douban Movie lookup tool. Tasks only aggregates browser-auth work, while Browser Profiles also displays the same browser login/profile domain. Logs is available from Settings but only has a local placeholder and no service-backed log API.

The product direction for this change is A first, B later:

- A: CthuDesktop is a local capability console for backend connection, local agent readiness, and host browser capability management.
- B: Future business tools can live under a separate Tools workspace, but they should not occupy Home.

## Goals / Non-Goals

**Goals:**

- Make Home answer "is this host ready?" instead of acting as a miscellaneous dashboard.
- Remove the premature top-level Tasks workspace from primary navigation.
- Preserve browser-auth visibility by surfacing attention in Home and full details/actions in Browser Host.
- Reframe Browser Profiles as a host browser capability management page.
- Keep Settings Logs honest as a placeholder until a real logging capability exists.
- Remove Douban Movie lookup from Home without adding a replacement Tools workspace in this change.

**Non-Goals:**

- Do not implement a new generic task system.
- Do not add server log retrieval or local log streaming.
- Do not add a Tools workspace or re-home Douban lookup yet.
- Do not change backend browser APIs, agent protocol messages, or desktop preload IPC contracts.
- Do not change local browser profile storage, verification logic, or Playwright execution behavior.

## Decisions

### Home owns readiness, Settings owns detailed diagnostics

Home should combine compact summaries for backend connection, local agent state, browser capability readiness, online agents, and browser-auth attention. Detailed backend URL editing, agent id, local paths, app info, and runtime diagnostics remain in Settings status/service pages.

Alternative considered: keep connection and agent status only in Settings. That keeps Home cleaner but makes the default desktop screen less useful because the user must leave Home to know whether the desktop is ready.

### Remove top-level Tasks until there is a broader task model

The current Tasks page is only browser-auth work under a generic name. Removing it avoids teaching users a generic task center that does not yet exist. Browser-auth attention should be shown where it belongs: Home for notification and Browser Host for resolution.

Alternative considered: keep Tasks but rename it Auth Tasks. That would reduce ambiguity but still preserves a narrow top-level workspace for one browser-specific concern.

### Browser Profiles becomes Browser Host

The browser page should be named around host capability rather than storage implementation. It should show runtime readiness, managed profiles, site auth state, and login/verify/clear actions. "Profiles" remains a subsection, not the whole page.

Alternative considered: keep Browser Profiles. That is accurate for one part of the page but undersells runtime capability, host Chrome readiness, and auth attention.

### Douban lookup leaves Home for now

The Douban lookup panel is a business tool that calls backend APIs. It should not be part of the default local readiness dashboard. A later Tools workspace can reintroduce it if desktop is intended to host business utilities.

Alternative considered: keep Douban lookup below Home readiness. That still mixes readiness and business work in the first screen and conflicts with the A-first direction.

### Logs remains a placeholder

There is no desktop preload or backend API currently wired for logs. The Logs settings section should remain accessible but must clearly present itself as an explicit placeholder rather than implying live logs are connected.

Alternative considered: remove Logs until real logging exists. Existing product-shell requirements already call for a logs view or explicit placeholder, so keeping a placeholder is less disruptive.

## Risks / Trade-offs

- Existing task-center spec expectations will conflict with this change -> Mitigate by explicitly removing/deprecating the first-class task center requirements in the change spec.
- Users may lose a single list of browser-auth work -> Mitigate by preserving auth attention counts/status in Home and full auth rows/actions in Browser Host.
- Removing Douban lookup may feel like a feature regression -> Mitigate by documenting it as deferred to a future Tools workspace rather than deleted from backend capability.
- Tests may be tightly coupled to navigation labels -> Mitigate by updating renderer tests around user-visible intent: Home readiness, no Tasks nav, Browser Host auth actions, Logs placeholder.
