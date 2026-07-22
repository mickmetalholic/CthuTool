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
| `@cthutool/obsidian-enhancer` | 81.91 | 73.13 | 94.44 | 81.91 | 75 | 65 | 85 | 75 |
| `@cthutool/browser-client` | 74.49 | 67.39 | 88.09 | 74.49 | 70 | 65 | 85 | 70 |

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
- `@cthutool/docs`
- `@cthutool/web`

`@cthutool/cli` intentionally remains on Bun coverage. The recorded raw
`pnpm --filter @cthutool/cli test:cov` baseline is 69.17 functions and 75.55
lines. Bun's text reporter currently provides reliable function and line
percentages for this package, while the root threshold-gated packages use
Vitest coverage configuration with statements, branches, functions, and lines.
CLI coverage artifacts are filtered after Bun writes `coverage/lcov.info` so
the published LCOV artifact only includes package-owned `src/**` files. Bundled
scripts under `src/scripts/**` count as package-owned CLI coverage; test setup
files, external plugin scripts, and temporary `cthutool-script-*` execution
paths are excluded from the artifact. The CLI is not threshold-gated yet because
Bun does not provide the same package-local threshold configuration surface used
by the Vitest packages, and the next useful improvements are broader behavioral
tests around command entrypoints, completion candidates, update flows, and
bundled script execution.

`@cthutool/browser-client` is threshold-gated after adding browser API client
request and response handling tests for session creation, action execution,
session closing, validation failures, and HTTP error mapping. Its thresholds
start below the recorded package baseline so the new SDK keeps package-local
coverage visibility without requiring unrelated test expansion in the initial
browser API change.

`@cthutool/web` remains visibility-only after expanding utility, metadata, root
layout, and page shell tests. The recorded `pnpm --filter @cthutool/web
test:cov` baseline is 82.64 statements, 80.50 branches, 77.77 functions, and
82.64 lines. It is not threshold-gated yet because the current web application
surface still has a very small source baseline and includes backend-health
rendering behavior that should mature before a stable percentage gate is useful.

`@cthutool/docs` remains visibility-only after expanding content metadata,
route, internal link, generated-output exclusion, and Starlight content config
tests. The recorded `pnpm --filter @cthutool/docs test:cov` baseline is 100
statements and 100 lines, with no branch or function denominator in the current
source coverage. It is not threshold-gated yet because the package is primarily
content validation and has too little source surface for a stable percentage
gate.

## Graduation Criteria

A visibility-only package can become threshold-gated when all of the following
are true:

- The package produces stable package-local coverage artifacts.
- The package has meaningful behavioral tests beyond shallow smoke coverage.
- A current baseline is recorded from the package `test:cov` command.
- The proposed thresholds are conservative relative to that baseline.
- Root engineering contract tests or policy data are updated to include the
  package in the threshold-gated set.
