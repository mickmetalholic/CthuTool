# OpenSpec Capability Map

This map is a non-normative guide to the first-level capability specs under `openspec/specs/`. Requirement behavior lives in each capability's `spec.md`; this file is only for navigation and ownership context.

OpenSpec currently treats each `openspec/specs/<capability>/spec.md` directory as a first-class capability. Area prefixes keep ownership visible without adding nested spec directories.

## Backend

### Agent Transport

- [apps-backend-agent-registry](apps-backend-agent-registry/spec.md): connected desktop agent registration, heartbeat, status, command delegation boundaries, and generic agent-state exclusion.
- [apps-backend-agent-command-gateway](apps-backend-agent-command-gateway/spec.md): typed command dispatch and response correlation over agent transport.

### Browser Workflows

- [apps-backend-browser-service](apps-backend-browser-service/spec.md): aggregate backend entry point for business-facing browser workflows.
- [apps-backend-browser-content](apps-backend-browser-content/spec.md): controlled page content, diagnostics, detection, and content workflow behavior exposed through `BrowserService`.
- [apps-backend-browser-auth](apps-backend-browser-auth/spec.md): browser profile status, login, verification, and interaction challenge behavior exposed through `BrowserService`.
- [apps-backend-browser-public-api](apps-backend-browser-public-api/spec.md): trusted third-party browser session and action API surface.
- [apps-backend-desktop-browser-runtime](apps-backend-desktop-browser-runtime/spec.md): lower-level backend client for typed desktop browser runtime operations.
- [apps-backend-sites-config](apps-backend-sites-config/spec.md): backend effective site configuration loading, lookup, and browser consumer compatibility.

### Backend Domains And Delivery

- [apps-backend-douban-movie-info](apps-backend-douban-movie-info/spec.md): Douban movie information retrieval and parsing through controlled browser content.
- [apps-backend-image-ci](apps-backend-image-ci/spec.md): backend image CI build, verification, publishing, and deployment image behavior.
- [apps-backend-observability](apps-backend-observability/spec.md): backend request context, events, readiness, metrics, and trace semantics.

## CLI

- [apps-cli-agent-contract](apps-cli-agent-contract/spec.md): shared CLI runtime contract, interactivity, JSON output, quiet mode, and stable command errors.
- [apps-cli-bundled-script-execution](apps-cli-bundled-script-execution/spec.md): bundled script discovery, invocation, interactive selection, and JSON-safe execution.
- [apps-cli-codex-config](apps-cli-codex-config/spec.md): reproducible Codex configuration maintenance and repository-managed Codex state.
- [apps-cli-codex-plugin-management](apps-cli-codex-plugin-management/spec.md): repository-owned Codex plugin discovery, install, cache sync, and language-coach hook behavior.
- [apps-cli-opencode-shared-assets](apps-cli-opencode-shared-assets/spec.md): repository-owned plugin skill and MCP synchronization into OpenCode configuration.
- [apps-cli-distribution-ci](apps-cli-distribution-ci/spec.md): CLI distribution CI behavior.
- [apps-cli-observability](apps-cli-observability/spec.md): CLI command diagnostics, JSON-safe observability, stderr behavior, and redaction.
- [apps-cli-self-installation](apps-cli-self-installation/spec.md): GitHub-based personal installation, lifecycle status, and update behavior.
- [apps-cli-shell-completion](apps-cli-shell-completion/spec.md): PowerShell and zsh completion behavior for `chc`.

## Desktop

- [apps-desktop-agent-console](apps-desktop-agent-console/spec.md): desktop agent connection configuration, identity, and status presentation.
- [apps-desktop-browser-host](apps-desktop-browser-host/spec.md): desktop-owned browser runtime, profile, login, verification, and controlled command handling.
- [apps-desktop-douban-movie-info](apps-desktop-douban-movie-info/spec.md): desktop UI for Douban movie lookup by subject id or URL.
- [apps-desktop-observability](apps-desktop-observability/spec.md): desktop observability and safe diagnostic semantics.
- [apps-desktop-packaging-ci](apps-desktop-packaging-ci/spec.md): desktop icon assets, packaging configuration, and artifact workflow behavior.
- [apps-desktop-product-shell](apps-desktop-product-shell/spec.md): CthuDesktop product shell, navigation, visual system, window behavior, and settings surfaces.

## Web And Docs

- [apps-web-project-shell](apps-web-project-shell/spec.md): browser-hosted management console scaffold and workspace integration.
- [apps-web-observability](apps-web-observability/spec.md): web frontend observability, API correlation, console diagnostics, and UI error reporting.
- [apps-docs-site](apps-docs-site/spec.md): Astro Starlight documentation site, information architecture, content model, and OpenSpec capability discovery.
- [apps-root-engineering-config](apps-root-engineering-config/spec.md): root monorepo governance, package scripts, CI policy, and engineering configuration.
- [apps-runtime-structured-logs](apps-runtime-structured-logs/spec.md): shared runtime structured logging semantics across apps.

## Packages

- [packages-agent-protocol](packages-agent-protocol/spec.md): shared agent protocol envelopes, command messages, compatibility behavior, and protocol observability metadata.
- [packages-app-shell-runtime](packages-app-shell-runtime/spec.md): host-neutral app shell runtime contracts, shared page composition, and frontend observability semantics.
- [packages-browser-runtime-protocol](packages-browser-runtime-protocol/spec.md): typed browser runtime method names, payload schemas, JSON-RPC helpers, and operation challenges.
- [packages-browser-client-sdk](packages-browser-client-sdk/spec.md): TypeScript SDK for the backend public browser API.
- [packages-config-browser-sites](packages-config-browser-sites/spec.md): versioned browser sites JSON schema, loading, merge behavior, and sensitive-data exclusion.
- [packages-config-observability](packages-config-observability/spec.md): shared observability configuration schema, defaults, validation, environment naming, and redaction.
- [packages-ui-shared-components](packages-ui-shared-components/spec.md): shared React UI primitives, semantic tokens, and accessible interaction patterns.

## Codex Plugins

- [codex-plugins-cthu-codex-anki-mcp](codex-plugins-cthu-codex-anki-mcp/spec.md): CthuCodex Anki MCP server integration and note creation workflows.
- [codex-plugins-cthu-codex-english-expression-skill](codex-plugins-cthu-codex-english-expression-skill/spec.md): English expression Anki note skill.
- [codex-plugins-cthu-codex-japanese-sentence-skill](codex-plugins-cthu-codex-japanese-sentence-skill/spec.md): Japanese sentence Anki note skill.
- [codex-plugins-cthu-codex-japanese-vocabulary-skill](codex-plugins-cthu-codex-japanese-vocabulary-skill/spec.md): Japanese vocabulary Anki note skill.
- [codex-plugins-cthu-codex-language-coach](codex-plugins-cthu-codex-language-coach/spec.md): prompt-time English prose coaching hook behavior.
- [codex-plugins-cthu-codex-notion-album-skill](codex-plugins-cthu-codex-notion-album-skill/spec.md): guarded personal Notion Album matching, metadata completion, source reconciliation, and verified writes.

## GitOps

- [gitops-delivery](gitops-delivery/spec.md): GitOps bootstrap, namespace, and ArgoCD Application delivery resources for deployed apps.
- [gitops-observability-stack](gitops-observability-stack/spec.md): GitOps-managed Kubernetes observability stack and telemetry extension boundaries.
