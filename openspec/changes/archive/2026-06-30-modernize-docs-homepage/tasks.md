## 1. Home Page Content

- [x] 1.1 Replace the plain docs home page overview with a structured landing-page experience.
- [x] 1.2 Add primary calls to action for Quick Start and runtime placement.
- [x] 1.3 Add a command preview aligned with documented homelab deployment and CLI verification commands.
- [x] 1.4 Add card entry points for deployment, client installation, modules, architecture, operations, and reference material.

## 2. Home Page Styling

- [x] 2.1 Add home-page-scoped CSS variables, hero styling, cards, buttons, and code preview styling.
- [x] 2.2 Preserve normal Starlight sidebar and table-of-contents behavior for non-home docs pages.
- [x] 2.3 Make the home page responsive on desktop and mobile without horizontal overflow.
- [x] 2.4 Ensure the first viewport leaves visible continuation into the next section on desktop and mobile viewports.

## 3. Verification

- [x] 3.1 Run `corepack pnpm --filter @cthutool/docs test`.
- [x] 3.2 Run `corepack pnpm --filter @cthutool/docs run check:openspec-index`.
- [x] 3.3 Run `corepack pnpm --filter @cthutool/docs run build`.
- [x] 3.4 Run `corepack pnpm --filter @cthutool/docs run typecheck`.
- [x] 3.5 Verify the home page visually in desktop and mobile browser viewports.
- [x] 3.6 Confirm generated agent adapter files remain unchanged.
