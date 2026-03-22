# Data Model: 提交说明与校验（002-commit-convention-workflow）

**Date**: 2025-03-22  
**Spec**: [spec.md](./spec.md)

本特性无持久化业务数据库；以下为 **提交说明** 的逻辑模型与 **校验规则** 所依赖的字段，供 commitlint/cz-git 配置与合同文档对齐。

## Entity: CommitMessage（提交说明）

| 字段 | 含义 | 约束（摘要） |
|------|------|----------------|
| `header` / 首行 | 主题行 | 符合 `type(scope): subject`；`type` ∈ 允许枚举；`scope` 可选、与团队命名一致；`subject` 为 **英文祈使句**、首字母小写（conventional 默认）、末尾无句号 |
| `body` | 正文 | 与 `header` 之间空一行；若存在则 **英文**；可为空 |
| `footer` | 脚注 | `BREAKING CHANGE:`、`Refs:` 等；若存在则 **英文**；可为空 |
| `raw` | 完整原始文本 | 用于 **全文英文** 规则（CJK 检测）与调试 |

## Entity: CommitType（提交类型）

| 值 | 语义（示例） |
|----|----------------|
| feat | 新功能 |
| fix | 缺陷修复 |
| docs | 文档 |
| style | 不影响语义的格式 |
| refactor | 重构 |
| perf | 性能 |
| test | 测试 |
| build | 构建或依赖 |
| ci | CI 配置 |
| chore | 其他不修改 src/test 的杂项 |

*与 `@commitlint/config-conventional` 默认集合对齐；若裁剪须在 `commitlint.config.cjs` 与 `.cursor/rules/*.mdc` 同步。*

## Entity: RuleDocument（团队规则文档）

| 字段 | 含义 |
|------|------|
| `commitlintConfigPath` | 机器可读规则源：`commitlint.config.cjs` |
| `humanReadableMirror` | `quickstart.md` + `.cursor/rules/*.mdc` + 本目录 `contracts/` |
| `versioning` | 变更时同时改配置与镜像文档（FR-006） |

## 校验状态机（概念）

```text
[编辑消息] → commit-msg hook → commitlint 解析
                ↓ 失败                    ↓ 成功
           拒绝提交 + 错误码          允许继续 git commit
```

## 与 spec FR 映射

| FR | 模型落点 |
|----|-----------|
| FR-001 | `header`/`body`/`footer` 结构与 conventional 规则 |
| FR-002 | `CommitType` 枚举 + 文档镜像 |
| FR-008 | `raw` 上 CJK 禁止 + 各段英文约束 |
