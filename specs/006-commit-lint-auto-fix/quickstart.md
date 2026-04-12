# Quickstart：验证「lint-staged + Biome 写入」提交门禁

前置：已 `pnpm install`（会执行 `husky` `prepare`），且未使用 `--no-verify`（除非刻意跳过钩子）。

## 1. 仅自动修复类问题（User Story 1）

1. 在 `apps/` 或 `packages/` 下故意制造**仅**违反可自动修复规则的内容（例如多余空格、格式化不一致）。
2. `git add` 相关文件。
3. `git commit -m "chore(test): trigger lint-staged biome write"`（消息需符合 commitlint）。
4. **期望**：提交成功；`git show` 中可见 Biome 格式化/修复与原始意图在同一提交中。

## 2. 无法自动修复的问题（User Story 2）

1. 引入一条 Biome **error** 且无法被 `--write` 安全消除的问题（按项目规则选择场景）。
2. `git add` 并尝试提交。
3. **期望**：提交失败；终端可见 Biome 诊断；修复后重新暂存并可成功提交。

## 3. 消息不合法（User Story 3）

1. 保持暂存文件通过 Biome。
2. `git commit -m "bad message"`（故意违反 Conventional Commits / 合同）。
3. **期望**：在 **commit-msg** 阶段被 commitlint 拒绝；按规则修正消息后再次提交应可通过。

## 4. 回归：与 CI 一致

1. 本地通过上述提交后，推送分支。
2. **期望**：CI 中 **Lint**（`pnpm run lint`）与 **Commitlint** 仍通过。

## 提示

- 若同一文件存在 **partial staging**，格式化可能影响整文件；见 `research.md` 说明。
- 跳过钩子仅用于紧急情况：`git commit --no-verify`（不推荐纳入常规流程）。
