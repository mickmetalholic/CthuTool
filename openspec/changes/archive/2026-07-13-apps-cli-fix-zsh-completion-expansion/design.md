## Context

The zsh adapter is embedded in TypeScript as a template literal. It previously used `String.raw` while also escaping zsh `${...}` expressions for JavaScript parsing. Because raw templates preserve escape characters, the generated script contained `\${...}` and zsh treated those expressions as literal text. Existing tests asserted only broad markers in the generated script, so they did not exercise shell expansion.

## Goals / Non-Goals

**Goals:**

- Emit valid zsh parameter expansion from `chc completion zsh`.
- Verify the generated adapter forwards line-oriented candidates to `compadd`.
- Keep the committed CLI bundle consistent with the TypeScript source.

**Non-Goals:**

- Redesign the internal `chc __complete` protocol.
- Change PowerShell completion behavior or persistent profile management.
- Add zsh as a required test-host dependency when it is unavailable.

## Decisions

1. Use a normal JavaScript template literal for the zsh adapter. The existing `\${...}` JavaScript escapes then produce unescaped `${...}` text at runtime. Keeping `String.raw` would require indirect interpolation or post-processing that obscures the intended shell script.
2. Retain a generated-text assertion that rejects literal `\${` output. This catches the exact escaping regression on every test host.
3. When zsh is installed, execute the generated script with stubbed `chc`, `compdef`, and `compadd` functions. This verifies candidate splitting and array expansion without depending on an interactive terminal; the behavior test is skipped on hosts without zsh.

## Risks / Trade-offs

- [Risk] Future edits can confuse JavaScript escaping with zsh escaping. → Mitigation: Keep both the exact output assertion and the shell-level behavior test.
- [Risk] Shell-level tests are platform-dependent. → Mitigation: Run the behavior test conditionally while retaining platform-independent generated-text coverage.

## Migration Plan

Rebuild and publish the committed CLI bundle. Existing users receive the corrected adapter after updating `chc` and reloading their zsh profile or restarting zsh. Rollback consists of reverting the source, test, and generated bundle changes together.

## Open Questions

None.
