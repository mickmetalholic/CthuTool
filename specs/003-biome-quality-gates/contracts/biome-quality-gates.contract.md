# Contract: Biome Quality Gates

## 1. 目标

定义“编辑器、本地提交、CI”三层质量门禁在行为上的统一契约，确保 Biome 判定一致且可追溯。

## 2. 参与方

- Developer Workspace（Cursor / VS Code）
- Git Pre-commit Hook（Husky）
- CI Workflow（GitHub Actions）

## 3. 统一输入与范围契约

- 单一规则源：`biome.jsonc`
- 受管范围：`apps/**`、`packages/**`（可在实现中细化）
- 非受管样例：图片、构建产物、纯文档（按配置排除）

## 4. 命令契约

- 本地全量检查：`pnpm exec biome check .`
- 本地修复：`pnpm exec biome check --write .`
- 提交前增量检查：对 staged 文件执行等价检查命令
- CI 检查：运行与本地同版本、同规则的 `biome check`
- 根脚本入口（推荐）：`pnpm run lint` / `pnpm run lint:fix`
- staged-only 命令契约（示例实现）：
  - `git diff --cached --name-only --diff-filter=ACMR -- apps packages`
  - 当输出非空时执行 `pnpm exec biome check <staged-files>`

## 5. 行为契约

### 5.1 编辑器门禁

- MUST 在输入时实时反馈问题（onType）。
- MUST 在保存时执行格式化（onSave）。
- SHOULD 对可自动修复问题提供一键或命令修复路径。

### 5.2 提交门禁

- MUST 仅检查暂存区受管改动。
- MUST 在检查失败时阻止提交。
- MUST 输出明确修复指引（至少包含一个可执行命令）。

### 5.3 CI 门禁

- MUST 在所有分支 push 触发。
- MUST 在 Biome 检查失败时将任务标记失败。
- MUST 与本地规则源一致，不允许 CI 使用独立规则副本。

## 6. 一致性契约

- 同一违规样本在本地门禁和 CI 中 MUST 得到一致结论（同为失败或同为通过）。
- Commitlint 与 Biome 职责 MUST 分离：
  - Commitlint：提交信息格式
  - Biome：源码格式与 lint
- Commitlint 失败与 Biome 失败 MUST 分别输出可识别的错误来源，避免混淆修复路径。

## 7. 版本与变更契约

- 任意规则变更 MUST 通过 Pull Request 审核并更新文档。
- 规则变更 SHOULD 附带至少一个“失败样本 -> 修复 -> 通过”的验证记录。
