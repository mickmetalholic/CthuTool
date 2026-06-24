## 1. Settings Navigation Structure

- [x] 1.1 Update the desktop renderer Settings view model and submenu items to represent the target sections: Service Connection, Local Runtime or Status, Diagnostics, Logs, and Appearance readiness.
- [x] 1.2 Preserve bottom-left Settings entry behavior and existing status-bar deep links into the appropriate Settings sections.

## 2. Settings Page Content

- [x] 2.1 Keep environment, backend URL, display name, and local agent enabled editing inside the Service Connection section.
- [x] 2.2 Reorganize read-only local app, agent, browser runtime, platform, version, packaged state, and local path information into the Local Runtime or Status section.
- [x] 2.3 Add or refine a Diagnostics section for troubleshooting detail such as active environment, backend URL, connection state, registration timing, last error, and browser runtime diagnostic message.
- [x] 2.4 Keep Logs as an explicit not-connected placeholder without adding log retrieval, log streaming, persistence, IPC, or backend API behavior.
- [x] 2.5 Represent Appearance as a fixed current theme/token-system state or omit executable controls that imply unsupported theme switching.

## 3. Tests and Validation

- [x] 3.1 Update renderer tests for Settings navigation labels, section headings, service save behavior, status-bar deep links, diagnostics content, logs placeholder, and appearance readiness.
- [x] 3.2 Confirm Home remains a readiness summary and does not gain editable backend configuration controls.
- [x] 3.3 Run `openspec validate apps-desktop-settings-information-architecture --strict`.
- [x] 3.4 Run `pnpm --filter @cthutool/desktop test`.
- [x] 3.5 Run `pnpm --filter @cthutool/desktop typecheck`.
- [x] 3.6 Run `pnpm --filter @cthutool/desktop build`.
