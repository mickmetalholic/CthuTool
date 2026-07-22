## REMOVED Requirements

### Requirement: Desktop Douban movie lookup panel
**Reason**: The desktop-only business panel is intentionally not part of the minimal tray/Agent product.
**Migration**: Use the corresponding web workflow when available; otherwise document this as an intentionally retired surface.

### Requirement: Desktop movie result display
**Reason**: The Electron result view is removed with the desktop business workspace.
**Migration**: Display movie lookup results in a Web-owned business experience rather than an Agent-served page.

### Requirement: Desktop lookup states
**Reason**: Loading, failure, and challenge presentation for this desktop-only panel no longer has an Electron renderer.
**Migration**: A web replacement MUST own its own equivalent states before claiming feature parity; the tray does not implement them.
