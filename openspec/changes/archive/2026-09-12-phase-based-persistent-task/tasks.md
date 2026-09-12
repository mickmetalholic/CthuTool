## 1. Shared workflow

- [x] 1.1 Rewrite `SKILL.md` for phase approval, autonomous in-phase work, blocker handling, continuation, and final verification; verify it contains no step-level approval rule.
- [x] 1.2 Update PLAN, LOG, interaction templates, README, and Codex metadata for the phase state machine; verify the fields, events, and example prompts agree.
- [x] 1.3 Revise manual scenarios to cover multi-action phases, blocker decisions, context recovery, and result-before-next-plan ordering; verify all examples use the new approval rule.

## 2. Validation

- [x] 2.1 Validate the Skill and strict OpenSpec delta, review the scoped diff, and verify generated `.agents/skills` and `.zcode/skills` files remain unchanged.
- [x] 2.2 Sync only this change's delta to the main capability spec, archive this change, and verify the archived tasks and main spec match the implemented phase behavior.
