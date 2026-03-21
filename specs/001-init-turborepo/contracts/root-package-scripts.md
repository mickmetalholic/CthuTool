# Contract: Root `package.json` scripts & Turbo tasks

**Version**: 1.0.0（随实现可 PATCH 修订）  
**Consumers**: 本地贡献者、后续 CI 工作流

## 必须存在的根脚本（MUST）

交付完成后，仓库根 `package.json` 的 `scripts` **MUST** 至少包含：

| Script | 语义 | 实现约束 |
|--------|------|----------|
| `build` | 编排全工作区构建 | MUST 委托 `turbo run build`（或等价，使子包 `build` 被调用） |
| `check` | 全工作区静态校验/测试入口（可与模板中 `lint` 合并或并存） | MUST 可被 CI 与文档同时引用；具体子任务名在实现后与 `turbo.json` 一致 |

若 create-turbo 默认使用 `lint` 而非 `check`，实现 **MUST** 在 `README` / quickstart 中说明别名关系，或增加 `check` 作为统一入口。

## Turbo 任务名（SHOULD）

根 `turbo.json` 中 **SHOULD** 为工作区成员注册以下任务名之一组（与官方模板对齐后裁剪）：

- `build`
- `lint` 或 `check`（最终对外以 `check` 为优先）

## 退出约定

- 成功：进程退出码 `0`。
- 失败：非零退出码；输出 **SHOULD** 包含失败包名或 turbo 任务名，以满足规格可定位性（SC-003）。

## 与 pnpm 的关系

根脚本 **MUST** 在已执行 `pnpm install` 的前提下可从仓库根直接运行，**MUST NOT** 要求全局安装 `turbo`（优先 `pnpm exec turbo` 或 devDependency）。
