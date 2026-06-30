## MODIFIED Requirements

### Requirement: User-facing documentation journeys
The docs site SHALL organize its primary documentation around user and operator journeys before repository implementation structure.

#### Scenario: Reader starts from the docs home page
- **WHEN** a reader opens the docs site home page
- **THEN** the page presents a modern, responsive entry experience with a first-viewport hero, primary calls to action, and links for homelab deployment, client installation, module usage, operations, architecture, and reference material
- **AND** the first viewport includes a preview of the shortest documented deployment or CLI verification path
- **AND** the page provides visible continuation into the next documentation section on desktop and mobile viewports

#### Scenario: Reader uses the sidebar navigation
- **WHEN** a reader inspects the primary docs navigation outside the home page landing experience
- **THEN** the navigation includes sections for Start, Homelab Deployment, Client Installation, Modules, Operations, Architecture, and Reference
