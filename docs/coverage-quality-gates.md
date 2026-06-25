# Coverage Quality Gates

Root-managed runtime packages produce package-local coverage artifacts. Coverage
percentage gates are intentionally package-aware: mature suites can block large
regressions while smaller or smoke-test-focused suites remain visible without
premature percentage failures.

## Threshold-Gated Packages

Initial thresholds are conservative and lower than the recorded baseline from
the current package `test:cov` commands.

| Package | Baseline statements | Baseline branches | Baseline functions | Baseline lines | Gate statements | Gate branches | Gate functions | Gate lines |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `@cthutool/backend` | 83.38 | 79.79 | 85.89 | 83.38 | 75 | 70 | 80 | 75 |
| `@cthutool/config` | 81.88 | 69.90 | 100.00 | 81.88 | 75 | 60 | 90 | 75 |
| `@cthutool/agent-protocol` | 94.35 | 97.43 | 90.47 | 94.35 | 90 | 90 | 85 | 90 |

Thresholds are configured in each package's Vitest coverage configuration, not
in hidden CI shell logic. The root coverage command fails when a threshold-gated
package fails its package-local coverage gate.

Codecov project and patch statuses are visibility signals for pull request
review. They remain informational so global diff coverage does not override the
package-aware gates above.

## Visibility-Only Packages

These packages still produce and publish coverage artifacts, but their coverage
percentages are not threshold-gated yet:

- `@cthutool/cli`
- `@cthutool/desktop`
- `@cthutool/docs`
- `@cthutool/web`
- `@cthutool/app-shell`
- `@cthutool/obsidian-enhancer`
- `@cthutool/ui`

`@cthutool/cli` intentionally remains on Bun coverage. It is not threshold-gated
in this change because Bun coverage output differs from the Vitest package
coverage configuration used by the initial gated packages.

`@cthutool/desktop` remains visibility-only after expanding desktop runtime and
renderer workflow tests. The recorded `pnpm --filter @cthutool/desktop
test:cov` baseline is 80.97 statements, 80.57 branches, 84.10 functions, and
80.97 lines. It is not threshold-gated yet because Electron entrypoints and
preload bootstrap files still require more appropriate integration coverage
before a package-wide percentage gate would be a stable signal.

## Graduation Criteria

A visibility-only package can become threshold-gated when all of the following
are true:

- The package produces stable package-local coverage artifacts.
- The package has meaningful behavioral tests beyond shallow smoke coverage.
- A current baseline is recorded from the package `test:cov` command.
- The proposed thresholds are conservative relative to that baseline.
- Root engineering contract tests or policy data are updated to include the
  package in the threshold-gated set.
