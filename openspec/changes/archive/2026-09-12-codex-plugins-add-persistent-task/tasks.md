## 1. Review plugin Skill source

- [x] 1.1 Review the nine selected `persistent-task` source files for portable task behavior and verify all referenced files exist.
- [x] 1.2 Verify Codex metadata disables implicit invocation, both agent adapters are present, and the Skill validator passes.

## 2. Validate and publish the scoped change

- [x] 2.1 Validate the OpenSpec change strictly and verify no generated agent adapter files changed.
- [x] 2.2 Review the selected source and change-artifact path allowlist and verify `git diff --check` before archiving this change and publishing its PR.
