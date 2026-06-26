## Context

The docs site already has architecture pages, but they were written before:

- GitOps observability stack and backend metrics/traces
- public browser session API
- `@cthutool/browser-client`
- CLI installer local/remote mode refinements

The feature-specific changes will update task-oriented pages first. This change keeps architecture docs coherent after those updates.

## Decisions

### Use one topology story

`architecture/topology.md` and `what-runs-where.md` should describe:

- user/client computers running CthuDesktop and `chc`
- third-party apps using `@cthutool/browser-client`
- backend APIs in Kubernetes
- CthuDesktop owning browser runtime state
- observability stack consuming metrics, logs, and traces
- GitHub Actions/GHCR/ArgoCD image rollout

### Keep architecture high-level

Architecture pages should link to module/reference pages for commands and API details. They should not duplicate full endpoint schemas or SDK README content.

## Risks / Trade-offs

- Architecture docs can become a dumping ground. Keep them flow-oriented and link to focused pages.
- If this runs before feature-specific docs, links may be missing. Implement after the other docs updates.
