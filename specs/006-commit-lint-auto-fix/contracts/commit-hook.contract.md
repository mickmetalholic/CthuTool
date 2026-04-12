# 契约：Git 提交钩子（006-commit-lint-auto-fix）

本文档约定仓库 **本地 Git 钩子** 行为，供实现与评审对照；与 `spec.md` 功能需求一致。

## 范围

- **包含**：`.husky/pre-commit`、`.husky/commit-msg`、根目录 `lint-staged` 配置、`package.json` 中相关脚本与依赖。
- **不包含**：CI Workflow 具体内容（见 `.github/workflows/ci.yml`），但本地行为不得与 CI 的 Commitlint/Biome 政策相矛盾。

## pre-commit

### 触发时机

每次 `git commit` 在写入提交对象之前执行（含 `--amend` 时由 Git 调用钩子的标准行为；以团队文档为准）。

### 必须行为

1. 调用 **`pnpm exec lint-staged`**（或仓库文档规定的等价命令，如 `npx lint-staged`）。
2. lint-staged 对**符合配置的暂存文件**执行 **`biome check --write`**（通过 `pnpm exec biome` 调用），**不得**默认添加 `--unsafe`。
3. 若 Biome 以非零状态退出，**整个提交必须中止**。
4. 对 Biome 修改过的文件，**必须**在同一提交准备过程中回到暂存区（由 lint-staged 完成）。

### 路径范围

- 至少覆盖 `apps/` 与 `packages/` 下由 Biome 管理的源文件；与 `biome.jsonc` 中 `files.includes` 不一致的配置视为缺陷。

### 可选行为

- 无匹配暂存文件时：静默成功或简短说明后退出 0（与 lint-staged 默认一致即可）。

## commit-msg

### 必须行为

1. 执行 **`pnpm exec commitlint --edit "$1"`**（保留现有行为）。
2. 消息不合法时 **非零退出**，提交失败。

### 与 pre-commit 的次序

- Git 保证 **pre-commit 先于 commit-msg**；不得将 Commitlint 移入 pre-commit 替代 commit-msg。

## CI 对齐（非钩子但为契约参考）

- **CI**：`pnpm run lint` 使用 **`biome check .`**（全仓库检查），**不带** `--write`。
- **本地**：pre-commit 使用 **写入式** 检查以降摩擦；合并前仍须通过 CI 全量检查。

## 版本与工具

- **Node**：遵守根目录 `package.json` 的 `engines`。
- **lint-staged**：版本锁定于 `pnpm-lock.yaml`；主版本升级时需重新验证钩子与 pnpm 工作区行为。
