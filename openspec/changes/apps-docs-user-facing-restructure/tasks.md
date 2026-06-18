## 1. Navigation and Structure

- [ ] 1.1 Update the Starlight sidebar to use Start, Homelab Deployment, Client Installation, Modules, Operations, Architecture, and Reference sections.
- [ ] 1.2 Add landing pages for each new primary section with current-state scope and links to child pages.
- [ ] 1.3 Update the docs home page to present user-facing entry points instead of repository-first routing.
- [ ] 1.4 Preserve repository map and source boundary guidance under an appropriate architecture or reference location.

## 2. User and Operator Documentation

- [ ] 2.1 Add homelab deployment overview covering what runs on the homelab machine versus client computers.
- [ ] 2.2 Add homelab setup documentation covering prerequisites, installation, configuration, startup, health checks, upgrade, and troubleshooting entry points.
- [ ] 2.3 Add client installation documentation with separate desktop and CLI install/update/uninstall paths.
- [ ] 2.4 Add operations documentation for logs, config files, health checks, backups, restore, and security boundaries where current behavior is known.

## 3. Module Documentation

- [ ] 3.1 Convert the existing Applications overview into a module-oriented usage index.
- [ ] 3.2 Add or update module pages for CLI, Desktop, Web Console, Browser Auth, Browser Automation, Codex Plugin, Douban Movie Info, Collection Hub, and Obsidian Enhancer where source material exists.
- [ ] 3.3 Ensure each module page identifies runtime location, user purpose, setup or usage entry points, and authoritative source paths.
- [ ] 3.4 Split or summarize `docs/browser-auth.md` and `docs/desktop-agent-console.md` into the new user, operations, module, or architecture pages.

## 4. Architecture and Spec References

- [ ] 4.1 Add an architecture overview page with the homelab, backend, web, desktop, CLI, browser runtime, and shared package topology.
- [ ] 4.2 Add focused architecture pages or sections for backend/web services, desktop runtime, CLI responsibilities, browser auth/profile model, and agent protocol boundaries.
- [ ] 4.3 Link architecture and module pages to relevant `openspec/specs/<capability>/spec.md` sources for normative requirements.
- [ ] 4.4 Keep architecture summaries high-level and avoid duplicating full OpenSpec requirement text.

## 5. OpenSpec Index Synchronization

- [ ] 5.1 Implement a deterministic OpenSpec capability index generation or drift-check command that reads current `openspec/specs/*/spec.md` entries.
- [ ] 5.2 Integrate the generation or drift check into focused docs validation.
- [ ] 5.3 Update the capability specs page so it reflects all current specs or clearly indicates it is generated.

## 6. Source Boundary Cleanup and Validation

- [ ] 6.1 Update the root README to route users to the docs site for deployment, installation, module usage, and architecture docs.
- [ ] 6.2 Update `docs/README.md` and affected package README files to clarify that package READMEs are development references.
- [ ] 6.3 Run `pnpm --filter @cthutool/docs build`.
- [ ] 6.4 Run `pnpm --filter @cthutool/docs typecheck`.
- [ ] 6.5 Run OpenSpec validation for the new change.
