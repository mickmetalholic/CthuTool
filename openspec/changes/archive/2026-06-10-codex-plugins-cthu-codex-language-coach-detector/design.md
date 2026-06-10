## Context

CthuCodex currently bundles a `UserPromptSubmit` language-coach hook at `codex/plugins/cthu-codex/scripts/language-coach.mjs`. The hook reads the prompt payload, decides whether the latest user input is English-dominant, and injects a fixed coaching instruction through `hookSpecificOutput.additionalContext`.

The current detector is intentionally lightweight, but it evaluates the raw prompt directly. That makes it vulnerable to common Codex prompt shapes: fenced code, inline code, command lines, identifier-only snippets, logs, and long pasted context followed by a short user-authored question. Better Phrase solves the same class of problem with deterministic local filtering before injecting model instructions; the CthuCodex hook should adopt the pattern while preserving the current repo-managed plugin boundary.

## Goals / Non-Goals

**Goals:**

- Keep the language-coach feature as a hook, because local language/prose routing is deterministic and cheap.
- Improve trigger precision before any model context is injected.
- Preserve the existing hook output contract using `hookSpecificOutput.additionalContext`.
- Cover detector behavior with integration tests that exercise both positive and negative routing cases.
- Keep implementation dependency-free and compatible with the plugin's Node script runtime.

**Non-Goals:**

- Do not add Better Phrase as a dependency or copy its installer/settings patch workflow.
- Do not add default Chinese-to-English translation.
- Do not turn language coaching into a skill or manual command.
- Do not change Anki MCP tools, Japanese sentence skill work, or `chc codex install` behavior.
- Do not introduce telemetry, network calls, or persistent learning history.

## Decisions

### Decision: Keep a single Node hook script

Implement the detector inside `language-coach.mjs` or small local helpers in the same script rather than adding Python or an external package.

Rationale: CthuCodex already ships this hook as a Node script, the repo test harness invokes it directly with Bun/Node, and a stdlib-only implementation is enough for the required routing. This keeps install/cache behavior unchanged and avoids mixed runtime friction on Windows.

Alternative considered: port Better Phrase's Python detector directly. This would provide a ready model but would add a second runtime to a plugin that otherwise launches Node scripts.

### Decision: Split routing into cleanup, intent extraction, and prose detection

Use three conceptual steps:

- `cleanPrompt`: remove fenced code blocks, inline code spans, and command lines that begin with `/` or `!`.
- `extractUserIntent`: if a long body is followed by a much shorter trailing segment, evaluate only the trailing segment.
- `isEnglishProsePrompt`: require enough English word signal and reject code-like token lists before deciding to inject coaching.

Rationale: Separating the steps makes each failure mode testable. It also keeps future policy changes local to routing rather than the injected coaching prompt.

Alternative considered: tune the existing English/CJK ratio only. That would not solve code fences, pasted bodies, or identifier-only snippets.

### Decision: Preserve English-only coaching scope

Chinese-dominant input remains silent even if it contains occasional English terms such as `hook`, `Codex`, or a file path. English-dominant mixed prose continues to trigger coaching.

Rationale: The current plugin is a low-noise English prose coach. Adding default translation would expand product behavior and make Chinese workflow messages noisier.

Alternative considered: adopt Better Phrase's Chinese translation mode. This can be revisited later as a separately proposed feature with an explicit user setting.

### Decision: Treat tests as the behavior contract

Extend `apps/cli/tests/integration/language-coach-hook.test.ts` with detector fixtures for inert and active inputs. The test suite should assert whether the hook emits `{}` or `hookSpecificOutput.additionalContext`, not the exact model-written English correction.

Rationale: The hook only injects instructions. The model's eventual prose feedback is outside this repository's deterministic test boundary.

Alternative considered: snapshot the full additionalContext. That would make prompt wording changes brittle without improving detector confidence.

## Risks / Trade-offs

- False negatives for terse but valid English prompts -> Mitigation: keep the minimum-word threshold low enough for common requests and cover imperative prompts such as "write two files please".
- False positives for technical identifiers -> Mitigation: reject all-code-like token lists, but allow mixed prose plus identifiers.
- Tail-only heuristic ignores meaningful earlier context -> Mitigation: only activate it when the trailing segment is short and the rest is substantially longer.
- Regex cleanup misses unusual Markdown/code shapes -> Mitigation: keep cleanup conservative and add regression tests as cases appear.
- Existing main spec mentions language-coach behavior under plugin management -> Mitigation: introduce a dedicated language-coach capability and avoid changing install semantics in this change.
