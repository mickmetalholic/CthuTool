## MODIFIED Requirements

### Requirement: Styling Baseline
The `apps/web` app SHALL own its Tailwind CSS and shadcn/ui-compatible styling baseline independently of local Agent release content.

#### Scenario: Tailwind baseline exists
- **WHEN** the Web app configuration is inspected
- **THEN** Tailwind-compatible global styling is available to the Next.js app

#### Scenario: Web styling is independently owned
- **WHEN** the Web app imports and release inputs are inspected
- **THEN** its styles are owned by `apps/web` and are not loaded from a local Agent bundle or a retired local renderer package
