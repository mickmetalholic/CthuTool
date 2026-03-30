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
3. 若存在违规项，pre-commit 必须阻断并给出修复指令。
4. 修复后重新提交应通过。

## 5. CI 门禁验证

1. 推送包含违规样本的分支。
2. 确认 CI 中 Biome 任务失败。
3. 修复后再次 push，确认 Biome 任务通过。

## 6. 常见问题

- Q: 只改了文档为什么还会触发门禁？  
  A: 触发允许发生，但检查范围应限制在受管源码路径，需在配置中明确排除非源码文件。

- Q: 历史遗留太多导致无法推进怎么办？  
  A: 按“增量强制 + 基线分阶段收敛”执行，先保证新增改动合规，再分批清理历史问题。
