## Why

The generated zsh completion adapter preserves escape characters around zsh array expressions, so pressing Tab can insert the literal text `${candidates[@]}` instead of a CLI candidate. The adapter must emit executable zsh parameter expansion so interactive completion works as documented.

## What Changes

- Render the zsh completion adapter without literal backslashes before its parameter expansions.
- Add integration coverage that executes the generated adapter in zsh and observes the candidates passed to `compadd`.
- Regenerate the committed CLI distribution bundle.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apps-cli-shell-completion`: Require the generated zsh adapter to expand and forward completion candidates rather than insert shell array syntax literally.

## Impact

- Affects zsh completion rendering in `apps/cli/src/command/completion.command.ts`.
- Adds zsh adapter integration coverage in `apps/cli/tests/integration/completion-command.test.ts`.
- Updates the committed Node CLI bundle in `apps/cli/dist/index.js`.
- Does not change the `chc __complete` protocol or command-line API.
