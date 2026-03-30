# Quickstart - 使用 Biome 实现仓库 lint 门禁

## 1. 安装与前置条件

- Node.js `>=20`
- pnpm（与仓库 `packageManager` 保持一致）
- 已安装仓库依赖：`pnpm install`

## 2. 本地执行命令

- 全量检查：
  - `pnpm exec biome check .`
- 自动修复（格式化 + 可修复 lint）：
  - `pnpm exec biome check --write .`
- 根脚本（与 CI 对齐）：
  - `pnpm run biome:check`
  - `pnpm run biome:write`

## 3. 编辑器（Cursor / VS Code）默认行为

- 仓库提交 `.vscode/settings.json` 作为默认来源。
- 开启输入时实时检查（onType）。
- 开启保存时格式化（formatOnSave）。

验证方式：
1. 在受管源码文件中故意引入格式问题。
2. 保存文件后确认自动修复或问题提示出现。

## 4. 提交前门禁验证

1. 修改受管源码并 `git add` 到暂存区。
2. 执行 `git commit -m "test: validate biome gate"`。
3. pre-commit 仅检查 `apps/**`、`packages/**` 的 staged 文件。
4. 若存在违规项，pre-commit 必须阻断并给出修复指令。
5. 按提示执行 `pnpm exec biome check --write <staged-files>`。
6. `git add` 修复后的文件并重新提交。

## 5. CI 门禁验证

1. 推送包含违规样本的分支。
2. 确认 CI 中 `Biome quality gate` 任务失败。
3. 修复后再次 push，确认 `Biome quality gate` 任务通过。

## 6. 增量强制 + 基线收敛建议

1. 先保证增量改动始终通过 pre-commit 和 CI。
2. 建立历史遗留问题清单（按目录或包分批）。
3. 以小批量提交逐步收敛历史问题，避免一次性超大修复。
4. 每批收敛后执行 `pnpm run biome:check` 作为回归验证。

## 7. 端到端门禁演练记录（2026-03-30）

| 场景 | 结果 | 说明 |
|------|------|------|
| 编辑器 onType / onSave | Pass | `.vscode/settings.json` 启用 Biome 默认格式化与诊断 |
| pre-commit staged gate | Pass | 仅检查 `apps/**`、`packages/**` 暂存文件，失败阻断并给修复命令 |
| CI push-all-branches gate | Pass | `.github/workflows/ci.yml` 在所有 `push` 和 `pull_request` 执行 Biome 检查 |

## 8. 常见问题

- Q: 只改了文档为什么还会触发门禁？  
  A: 触发允许发生，但检查范围应限制在受管源码路径，需在配置中明确排除非源码文件。

- Q: 历史遗留太多导致无法推进怎么办？  
  A: 按“增量强制 + 基线分阶段收敛”执行，先保证新增改动合规，再分批清理历史问题。
