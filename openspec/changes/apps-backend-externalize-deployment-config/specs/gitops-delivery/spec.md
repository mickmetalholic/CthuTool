## REMOVED Requirements

### Requirement: Bootstrap directory scaffold exists
**Reason**: CthuTool no longer owns Argo CD bootstrap or cluster desired state.
**Migration**: Use the bootstrap and root Application in the separate CthuOps repository.

### Requirement: ArgoCD Application CR per deployed app
**Reason**: Argo CD Application definitions are now maintained by CthuOps, not by CthuTool.
**Migration**: Update CthuOps Applications for the workloads it owns. Preserve or separately migrate unrelated entries such as PixelPlayground before deleting the old CthuTool GitOps tree.

### Requirement: Namespace for each deployed application
**Reason**: Namespace resources are cluster desired state and are outside the CthuTool source repository boundary.
**Migration**: Manage CthuTool and other homelab namespaces from CthuOps or their owning operations repository.

### Requirement: CthuTool backend deployment tracks the main image tag
**Reason**: CthuTool no longer deploys the mutable `:main` tag or owns Backend rollout behavior.
**Migration**: CthuOps pins a verified GHCR digest and promotes it through its own Git/Kustomize/Argo CD workflow.
