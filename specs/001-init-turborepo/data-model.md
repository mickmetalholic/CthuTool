# Data Model: 001-init-turborepo

本特性无业务领域持久化实体；以下为 **配置与仓库结构** 概念模型，对应 [spec.md](./spec.md) 中的 Key Entities。

## 1. 工作区根（Workspace Root）

| 字段 / 方面 | 说明 |
|-------------|------|
| 物理位置 | Git 仓库根目录 |
| 声明文件 | `package.json`（根脚本、`packageManager` 字段建议与 pnpm 一致）、`pnpm-workspace.yaml`、`turbo.json` |
| 文档 | 根 `README.md` 与/或 `specs/001-init-turborepo/quickstart.md` |
| 约束 | 脚手架在空临时目录生成后再合并入根；不得删除 `.specify/`；合并策略见 [research.md](./research.md) |

## 2. 工作区成员（Workspace Member）

| 字段 / 方面 | 说明 |
|-------------|------|
| 身份 | `package.json` 中 `name`（须符合 `@cthutool/*`，占位包见 research） |
| 位置 | `apps/<pkg>` 或 `packages/<pkg>` |
| 纳入方式 | 被 `pnpm-workspace.yaml` 中 `packages` glob 匹配 |
| 生命周期 | 增删成员 = 增删目录 + 更新 workspace 声明 + 更新 `turbo.json` 任务依赖（若有） |

## 3. 任务图（Task Graph）

| 字段 / 方面 | 说明 |
|-------------|------|
| 定义位置 | 根目录 `turbo.json`（`tasks` / `pipeline` 以生成版本为准） |
| 任务名 | 与根 `package.json` `scripts` 对齐（如 `build`、`lint`、`check`） |
| 依赖 | 跨包 `dependsOn: ["^build"]` 等按模板与后续约定调整 |
| 可观测性 | 失败时须能根据 turbo 输出识别失败包（满足规格 SC-003） |

## 4. 校验规则（配置层）

- **Workspace 完整性**: 每个 `pnpm-workspace.yaml` 声明的路径若存在，则必须含有效 `package.json`。
- **无悬空引用**: 根脚本与 `turbo.json` 不得引用已删除的示例包路径。
- **命名**: 正式包 `name` 字段 MUST 匹配 `@cthutool/*`（占位包同一规则）。

## 5. 状态转换

不适用运行时状态机；仅 **仓库结构变更**：「模板生成 → 合并 → 删除示例 → （可选）添加占位包 → 修正声明」为线性迁移步骤。
