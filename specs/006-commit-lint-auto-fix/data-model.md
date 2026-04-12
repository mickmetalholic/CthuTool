# 数据模型：提交时 Lint 门禁（概念层）

本特性无数据库；以下为 **Git 工作流与门禁** 的概念实体，用于对齐 spec 与实现。

## 实体

### 1. 暂存变更集（Staged Change Set）

| 字段 | 说明 |
|------|------|
| 路径集合 | 当前 `git index` 中已暂存文件路径（pre-commit 可见） |
| 作用域 | 实现上过滤为 `apps/**`、`packages/**` 下且受 Biome 处理的文件（与 `biome.jsonc` 一致） |

### 2. 自动修复结果（Auto-fix Outcome）

| 字段 | 说明 |
|------|------|
| 已修改文件 | Biome `--write` 产生变更的文件 |
| 回写暂存 | 由 lint-staged 将上述文件的更新再次加入暂存区 |
| 诊断 | 仍存在的 error 级问题（若有）→ 命令非零退出，提交中止 |

### 3. 提交消息（Commit Message）

| 字段 | 说明 |
|------|------|
| 原始文本 | 用户在 `git commit` / `git-cz` 中输入的消息 |
| 校验结果 | `commitlint` 根据 `commitlint.config.cjs` 与合同规则解析 |

## 关系

- **暂存变更集** —触发→ **lint-staged** —调度→ **Biome check --write** → 更新工作区与 **自动修复结果**。
- **提交消息** —在 commit-msg 阶段由 **Commitlint** 校验，与 pre-commit 成功顺序无关但同一提交需两次钩子均通过。

## 状态迁移（简化）

```text
[开始提交]
    → pre-commit：lint-staged → Biome（写入）
        → 仍有 error 诊断 → 失败（工作区可能已部分修改；用户修复后重新暂存）
        → 无 error → 继续
    → commit-msg：commitlint
        → 不合法 → 失败（代码可能已格式化；用户改消息后重试）
        → 合法 → [提交完成]
```

## 验证规则（映射 spec）

| Spec | 规则摘要 |
|------|-----------|
| FR-001 | pre-commit 必须运行带自动修复能力的 Biome 检查 |
| FR-002 | 自动修复必须包含在同一提交中（lint-staged 回写暂存） |
| FR-003 | 自动修复后仍有错误则提交失败 |
| FR-004 | commit-msg 阶段必须执行 Commitlint |
| FR-005 | 失败时输出须可区分「代码问题」与「消息问题」（分阶段钩子 + 工具 stderr） |
| FR-006 | 依赖 `prepare`/husky 与文档化标准流程 |
