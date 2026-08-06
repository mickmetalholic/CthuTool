## MODIFIED Requirements

### Requirement: Homelab deployment documentation
The docs site SHALL document CthuOps-managed Backend deployment and the fixed
private-network access boundary for CthuTool server-side services on a homelab
machine.

#### Scenario: Reader deploys homelab services
- **WHEN** a reader follows the homelab deployment documentation
- **THEN** the documentation identifies CthuOps as the owner of Kubernetes,
  Argo CD, image digest promotion, service, ingress, TLS, and rollout state

#### Scenario: Reader configures Backend access
- **WHEN** a reader reviews Backend deployment configuration
- **THEN** the documentation states that no operator access mode, trusted proxy
  IP, gateway identity header, private-development flag, or Agent Secret is
  configured in CthuTool
- **AND** it identifies `CTHUTOOL_ENVIRONMENT_ID` as environment-routing
  metadata rather than a credential

#### Scenario: Reader reviews external access
- **WHEN** a reader needs to access the Web or Backend from outside the
  homelab
- **THEN** the documentation requires Cloudflare Access/Tunnel to protect the
  external Web and Backend HTTP routes
- **AND** it states that the Agent `/ws/agents` path remains private-network
  only and must be reachable privately from Agent hosts
- **AND** it warns that a direct public Backend port or unprotected ingress
  bypass is unsupported

#### Scenario: Reader reviews retained runtime diagnostics
- **WHEN** a reader follows deployment or operations documentation
- **THEN** the documentation identifies retained health, metrics, and
  structured stdout/stderr diagnostics without requiring removed authentication
  configuration
