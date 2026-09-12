## Context

See `proposal.md` for motivation. The current Skill, interaction templates, state templates, examples, Codex metadata, and existing specification all encode one confirmation per logical step. The shared Markdown instructions are used by both Codex and Hermes after their separate installations.

## Goals / Non-Goals

**Goals:** Use an approval boundary at each phase, preserve enough preflight and rollback detail for high-impact work, and make `继续` unambiguous after each checkpoint.

**Non-Goals:** Change how the Skill is invoked or installed, or edit generated OpenSpec agent adapters.

## Decisions

### A phase is the durable execution unit

`PLAN.md` keeps a compact phase list and one detailed `Current Phase`; `LOG.md` uses phase events. An approved phase may contain several related actions and internal checks. This directly reduces interruptions while retaining a reviewable scope. The alternative of keeping step events and merely grouping UI messages would leave the underlying state machine fragmented.

### One preview, one `继续`

The initial preview includes the plan and full first-phase details, so a single `继续` approves both. At every later successful phase boundary, the result summary appears first, followed by the next-phase summary. That exact preview is the only pending authorization. If it changes, the agent updates durable state and re-previews it. A bare `继续` cannot resolve an ambiguous choice.

### Decisions gate only exceptional mid-phase work

The agent continues ordinary included actions after verification. It pauses for a user decision, an unplanned higher-risk or broader action, or an unpreviewed external publication/message. A clear blocker answer may let it resume the still-approved phase. The alternative of pausing after every risk-bearing subtask would recreate the old interaction cost.

### Keep the workflow shared

Phase behavior lives in `SKILL.md` and shared references. Only Codex-specific invocation text stays in `agents/openai.yaml` and the adapter; Hermes maps its own invocation to the same state machine. This is an explicit change to the protected business plugin, while generated OpenSpec adapters remain untouched.

## Risks / Trade-offs

- [A phase preview becomes too broad] → Require exact target/exclusions, included actions, verification, and rollback; split high-impact work into bounded phases when those cannot be reviewed clearly.
- [Context loss during a phase leads to duplicate mutation] → Keep `in_progress` until reconciliation; inspect real state before resuming or retrying.
- [A vague continuation is mistaken for expanded approval] → Bind `继续` to one unchanged `Current Phase` preview and require a revised preview for material changes.

## Migration Plan

Update the shared Skill and templates together, validate the Skill and delta spec, then sync and archive this single change. Existing task plans are read as legacy state on resume; the agent reconciles them with reality and previews a bounded phase before further mutation, without blindly replaying an old step.
