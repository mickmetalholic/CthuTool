# Feature Specification: Commit-time lint gate with auto-fix

**Feature Branch**: `006-commit-lint-auto-fix`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "增强 git commit 时的 lint 门禁；在提交时自动修复 lint 问题并一并提交"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One-shot commit with auto-fixed style (Priority: P1)

A contributor stages code changes and runs a commit. Minor issues that the project’s style and lint rules allow to correct automatically are fixed during the commit process, those fixes are included in the same commit, and the commit completes without requiring a separate “fix formatting then commit again” round trip.

**Why this priority**: This is the core outcome: less friction and fewer interrupted workflows for routine, machine-fixable problems.

**Independent Test**: Can be validated by staging changes that violate only auto-fixable rules, running a commit, and confirming one successful commit contains both the original intent and the corrections.

**Acceptance Scenarios**:

1. **Given** staged changes that violate only rules the project allows to auto-correct, **When** the contributor completes a commit, **Then** the corrections are applied, included in that commit, and the commit succeeds.
2. **Given** the same situation, **When** the commit finishes, **Then** the contributor can see which files or areas were changed by the automatic step (for example via command output or review of the resulting commit).

---

### User Story 2 - Blocked commit with clear next steps (Priority: P2)

A contributor attempts a commit, but some problems cannot be fixed automatically (or are excluded from auto-fix by policy). The commit does not go through, and the contributor understands what still fails and what to do manually.

**Why this priority**: Auto-fix must not hide serious issues; failing fast with clarity preserves trust in the gate.

**Independent Test**: Staged changes that trigger non-auto-fixable violations still fail the commit, with messages that distinguish “must fix manually” from “was fixed automatically.”

**Acceptance Scenarios**:

1. **Given** staged changes with at least one issue that cannot be auto-fixed under project rules, **When** the contributor attempts a commit, **Then** the commit is rejected and the output points to the remaining problems.
2. **Given** a rejected commit, **When** the contributor fixes only the remaining issues and commits again, **Then** the commit can succeed without unexpected extra steps beyond those fixes.

---

### User Story 3 - Commit message rules remain enforced (Priority: P3)

Project rules for commit messages (for example conventional commit format and language policy) continue to apply. A bad message does not slip through just because code style was auto-fixed.

**Why this priority**: Strengthening the code gate must not weaken message discipline, which affects history and automation.

**Independent Test**: Attempt a commit with valid staged code but an invalid commit message; the commit fails for message reasons, independent of auto-fix behavior.

**Acceptance Scenarios**:

1. **Given** acceptable staged code, **When** the contributor uses a commit message that violates project commit-message rules, **Then** the commit is blocked until the message is corrected.
2. **Given** code issues are auto-fixed and included in the commit, **When** the message is valid, **Then** both code corrections and the message are part of the same successful commit.

---

### Edge Cases

- **Nothing left to fix**: If there are no auto-fixable issues, the commit flow behaves like a normal lint check without redundant noise.
- **Auto-fix touches files the user did not stage**: By default, automatic corrections apply only to paths that are part of the current commit attempt (for example staged files). If the project later allows fixing unstaged neighbors, the contributor MUST be clearly notified before those files are included in the commit.
- **Partial success**: Some violations fixed automatically, others not—the commit MUST still fail until all remaining issues are resolved.
- **No automatic fix possible**: Binary or generated-only conflicts, or tool failures—the commit MUST fail with a clear error rather than silently skipping checks.
- **Amend and partial commits**: Same rules apply whenever the project’s “commit gate” runs for a code commit (including amend), unless explicitly out of scope for this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Whenever a contributor attempts to create a code commit that is subject to the project’s local commit checks, the system MUST run the project’s configured lint and style checks with automatic correction enabled for rules that support it.
- **FR-002**: Any file content corrected by that automatic step MUST be included in the same commit as the contributor’s changes (same commit operation), not left as unstaged edits or a follow-up commit by default.
- **FR-003**: If any check still fails after automatic correction (including issues that cannot be auto-fixed), the commit MUST NOT complete until those issues are resolved.
- **FR-004**: Commit message validation MUST run as part of the same commit workflow and MUST reject commits whose messages violate project rules, independent of code auto-fix.
- **FR-005**: The contributor MUST receive enough feedback to know (a) that automatic corrections were applied and to which parts of the change, and (b) what remains wrong if the commit is blocked.
- **FR-006**: The behavior MUST be consistent for all team members using the repository’s standard developer setup (no “works only on one machine” path for the gate).

### Assumptions

- The repository already defines which lint and style rules apply and which violations are safe to auto-fix; this feature wires those rules into the commit path with auto-fix and “include in same commit” behavior.
- Contributors use the supported Git client flows that trigger the same hooks or equivalent entry points the project documents.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a defined pilot period, at least **90%** of commits that would previously have failed only on machine-fixable style or lint issues complete successfully on the **first** commit attempt after auto-fix (measured by sampling or recorded dry runs, with a clear definition of “only machine-fixable”).
- **SC-002**: **100%** of commits with invalid commit messages are still rejected (no increase in invalid messages on the default branch compared to pre-change baseline over the same measurement window).
- **SC-003**: In user feedback (short survey or retrospective), a majority of contributors report **less** manual formatting or trivial fix-up work compared to before the change.
- **SC-004**: When a commit is blocked, contributors can identify whether the problem requires manual code change versus a message change in **under one minute** in usability tests (e.g., task-based review with a small set of scenarios).

## Constitution alignment *(implementation)*

Implementation MUST stay aligned with `.specify/memory/constitution.md`: monorepo quality gates, existing formatting and lint tooling policy, and CI parity so local commit behavior does not contradict continuous integration. User-facing requirements above remain technology-agnostic; concrete tool names and hook wiring belong in the plan and tasks, not in stakeholder-facing success criteria.
