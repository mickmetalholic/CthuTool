# Contract: Root `package.json` scripts & Turbo tasks

**Version**: 1.0.0（随实现可 PATCH 修订）  
**Consumers**: 本地贡献者、后续 CI 工作流

## 必须存在的根脚本（MUST）

交付完成后，仓库根 `package.json` 的 `scripts` **MUST** 至少包含：

| Script | 语义 | 实现约束 |
|--------|------|----------|
| `build` | 编排全工作区构建 | MUST 委托 `turbo run build`（或等价，使子包 `build` 被调用） |
| `lint` | 根目录 Biome 静态校验（`biome check .`） | MUST 可被 CI 与文档同时引用；与 `lint:fix` 配对 |

若历史文档或模板仍使用 `check` / `biome:check` 指代同一入口，实现 **MUST** 在 `README` / quickstart 中说明与 `lint` 的对应关系。

## Turbo 任务名（SHOULD）

根 `turbo.json` 中 **SHOULD** 为工作区成员注册以下任务名之一组（与官方模板对齐后裁剪）：

- `build`
- `lint`（根脚本名；子包可选用与 `turbo.json` 对齐的任务名）

## 退出约定

- 成功：进程退出码 `0`。
- 失败：非零退出码；输出 **SHOULD** 包含失败包名或 turbo 任务名，以满足规格可定位性（SC-003）。

## 与 pnpm 的关系

根脚本 **MUST** 在已执行 `pnpm install` 的前提下可从仓库根直接运行，**MUST NOT** 要求全局安装 `turbo`（优先 `pnpm exec turbo` 或 devDependency）。
