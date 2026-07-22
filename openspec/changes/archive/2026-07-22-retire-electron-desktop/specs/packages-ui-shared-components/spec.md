## REMOVED Requirements

### Requirement: Shared UI package
**Reason**: Repository reachability checks found no consumer after the Electron renderer and app-shell package were removed.
**Migration**: Own interface primitives in the independently deployed Web application when they are needed.

### Requirement: shadcn-compatible component ownership
**Reason**: The retired package no longer owns copied component primitives.
**Migration**: Keep any future shadcn-compatible components under the Web application's ownership.

### Requirement: Tailwind theme foundation
**Reason**: The theme foundation was only consumed by the retired local renderer.
**Migration**: The deployed Web application owns its global styles and semantic tokens.

### Requirement: Framework-neutral React compatibility
**Reason**: There is no longer a shared Electron/Web React component package.
**Migration**: Let `apps/web` define its supported React and framework baseline.

### Requirement: Accessible interaction primitives
**Reason**: The shared UI package is removed, not the accessibility requirement for live interfaces.
**Migration**: Verify keyboard, focus, disabled, and screen-reader behavior in Web-owned components.

### Requirement: Replaceable neon design tokens
**Reason**: The retired Electron visual direction is not a local Agent requirement.
**Migration**: The deployed Web application owns visual direction and replaceable design tokens.

### Requirement: Shared control primitives for desktop shell
**Reason**: The desktop shell and its control primitives are removed.
**Migration**: Use native tray menu items and Web-owned controls rather than recreating shell chrome.

### Requirement: Shared layout primitives for scan-friendly pages
**Reason**: The removed shared package has no remaining page consumer.
**Migration**: Implement responsive, scan-friendly layouts in the Web application.

### Requirement: Token coverage for shell and page states
**Reason**: Electron shell tokens no longer belong to the local component.
**Migration**: Keep focus, disabled, status, and surface tokens with the deployed Web UI.
