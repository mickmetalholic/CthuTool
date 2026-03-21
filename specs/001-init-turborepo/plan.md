# Implementation Plan: 空仓库 Turborepo 初始化

**Branch**: `001-init-turborepo` | **Date**: 2025-03-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-init-turborepo/spec.md`；实现策略补充：`pnpm` + 于**空临时目录**执行 `pnpm dlx create-turbo@latest .`，再将生成物合并入仓库根（不在根目录直接跑脚手架）；清理官方示例应用，保留空 `apps/` / `packages/` 骨架。临时目录内若因**网络问题**导致依赖安装失败：跳过在临时目录完成安装，先将脚手架**已生成的模板文件**合并入仓库根，再在**仓库根**对 `pnpm install` 做**多次有限重试**。**禁止**在未使用官方脚手架的情况下从零手写根级 monorepo 文件树以代替生成物；允许的唯一「手写」范围限于本计划已述的**冲突合并**、删除示例、`.gitkeep`、占位包登记等裁剪，而非替代 `create-turbo` 产出。

**Note**: 本文件由 `/speckit.plan` 生成；流程见 `.specify/templates/plan-template.md`。

## Summary

在已有 `.specify` 等文件的仓库中，用 **Turborepo 官方脚手架**（`create-turbo`）在 **空临时目录** 生成 **pnpm + Turborepo** 基线，再 **合并到仓库根**（避免在根目录执行脚手架、避免覆盖 `.specify`、既有 `README` 等）。随后 **删除** 模板自带的示例应用（如 `apps/docs`、`apps/web` 等，以生成结果为准），使 **`apps/` 与 `packages/` 仅保留可扩展的空骨架**；为保证 `pnpm install` / `turbo` 可运行，在 `research.md` 中约定 **最小编排占位包**（若零包会导致工作区或管道无效）。根 `README` / `quickstart.md` 与 `turbo.json`、`pnpm-workspace.yaml` 对齐，满足规格中的根级任务入口与成员声明（FR-001–FR-006）。

## Technical Context

**Language/Version**: TypeScript（随 create-turbo 默认，具体主版本以生成物为准）；Node.js LTS（贡献者文档注明）。  
**Primary Dependencies**: pnpm（工作区与锁文件）；`turbo`（Turborepo CLI）；create-turbo 生成的 `eslint` / `typescript` 等以模板为准，清理示例后按 constitution 逐步收敛到 Biome 等为后续任务。  
**Storage**: N/A（无持久化业务数据；仅仓库内配置文件与源码树）。  
**Testing**: 初始化阶段以「`pnpm install` + 根级 `turbo`/`pnpm` 脚本成功」为验收；首包落地后遵循 constitution（Jest / `bun test`）。  
**Target Platform**: 开发者本地（Windows / macOS / Linux）与 CI（后续任务接入）。  
**Project Type**: Turborepo monorepo（多包工作区，当前无业务应用代码）。  
**Performance Goals**: 满足规格 SC-002：二次根级任务相对首次显著缩短（依赖 Turborepo 缓存；占位阶段可在 quickstart 中说明）。  
**Constraints**: 不静默覆盖 `.specify` 与既有根文件；包管理器固定 **pnpm**；工作区包名后续统一 `@cthutool/*`（占位包命名在 research 中决策）；**脚手架来源**须为官方 `create-turbo` 的一次运行产出，不得以「对照文档手搓」方式复制根级布局。  
**Scale/Scope**: 单仓库根初始化 + 移除示例 + 空目录骨架 + 最小编排成员；不含 Next/Nest 业务实现。

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Per `.specify/memory/constitution.md` (CthuTool):

- **FP & modularity:** 初始化无业务逻辑代码路径；后续新增包须单职责、显式副作用。
- **Errors:** 业务层 `neverthrow` 在首包实现时生效；脚手架与脚本层可使用进程退出码，不视为业务逻辑层。
- **Validation:** 运行时代码边界须 `valibot`；本阶段无运行时包则 N/A。
- **TDD:** 占位包若仅 `exit 0` 可无测试；首个含逻辑的包起必须 TDD。
- **TSDoc:** 同上，首个业务函数起必填。
- **Stack & repo:** Turborepo + `@cthutool/*` 命名；本计划采用 pnpm 工作区与官方生成物对齐后裁剪。
- **CI:** 完整 Biome/Knip 等门禁可在后续 `tasks` 中接入；本特性交付至少保证文档化根命令与本地可复现安装。

**Post–Phase 1 re-check:** 契约与 quickstart 已与 pnpm/turbo 根脚本一致；占位包命名预留 `@cthutool/*`，与 constitution 一致。

## Phase 0 — 执行顺序（实现时）

1. **前置**：已安装 Node LTS 与 pnpm（版本范围写入 `quickstart.md`）。
2. **脚手架（仅临时目录）**：在仓库外或系统临时区新建**空**目录（例如 `cthutool-turbo-staging`），`cd` 至该目录后执行  
   `pnpm dlx create-turbo@latest .`  
   选项中选择 **pnpm**（若 CLI 交互要求）。**不要**在已有 `.specify` 等的仓库根执行此命令。  
   - **网络与依赖安装**：若该步骤中**依赖安装**因网络超时、中断或 registry 不可达而失败，**不要**在临时目录无限重试以致阻塞后续合并；应**结束临时目录内的安装尝试**（若官方 CLI 提供「跳过安装 / 仅生成文件」类非交互标志，优先使用），并仅以脚手架**已写入磁盘**的模板文件（通常不依赖完整 `node_modules`）作为合并来源。  
   - **来源约束**：根级 `package.json`、`pnpm-workspace.yaml`、`turbo.json` 及目录布局必须来自上述脚手架生成物；**禁止**在未运行 `create-turbo` 的前提下自行创建等价文件树冒充初始化结果。
3. **合并到仓库根**：将临时目录中的生成物 **复制或移动** 至仓库根，与既有文件 **合并**：**不要**删除或覆盖 `.specify/`；对根目录已存在文件采用「仅补充缺失 / 人工 diff 合并」策略（`package.json`、`turbo.json`、`pnpm-workspace.yaml` 等优先手工合并）。完成后删除空临时目录（若仍保留）。  
   - **在仓库根安装依赖**：合并完成后，在**仓库根**执行 `pnpm install`，并对该命令实施**多次有限重试**（例如固定次数 + 间隔退避）；若仍失败，在文档中明确提示检查网络或 registry 镜像，而非回到临时目录继续安装。
4. **清理示例应用**：删除模板中的应用包目录（常见为 `apps/docs`、`apps/web` 等，以实际生成为准），移除 `pnpm-workspace.yaml` / 根 `package.json` `workspaces` 中对它们的引用。
5. **空骨架**：保证存在 `apps/` 与 `packages/` 目录结构；示例子包目录删除后按需保留 `.gitkeep`；按 `research.md` 决定是否添加 **单一占位 workspace 包** 以满足 `pnpm -r` / `turbo` 管道。
6. **根脚本与管道**：更新根 `package.json` scripts 与 `turbo.json` 的 `pipeline`/`tasks`，使 `pnpm run check`（或等价名）能编排当前全部成员且无悬空引用。
7. **文档**：更新根 `README` 或引用 `specs/001-init-turborepo/quickstart.md` 中的前置条件与命令。

## Project Structure

### Documentation (this feature)

```text
specs/001-init-turborepo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md              # Phase 2（/speckit.tasks），非本命令产出
```

### Source Code (repository root)

```text
（目标交付树 — 示例应用已删，目录为空骨架 + 可选占位包）
./
├── .specify/                    # 既有，保留
├── apps/                        # 空骨架（.gitkeep）或后续应用
├── packages/                    # 空骨架或 @cthutool/* 占位包（见 research）
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── pnpm-lock.yaml
├── tsconfig.json                # 若模板生成根 tsconfig
├── README.md
└── …                            # create-turbo 其余根级配置（eslint 等），后续可再收敛
```

**Structure Decision**: 采用 **Turborepo 官方默认 monorepo 布局**（`apps/*`、`packages/*`），经 **删除示例应用** 后保留 **空目录基础**；工作区成员通过 `pnpm-workspace.yaml` 声明，任务图通过 `turbo.json` 声明，符合规格「工作区根 / 成员 / 任务图」实体。

## Complexity Tracking

> 本特性无 constitution 违规须豁免项；占位包若仅用于编排连通性，不增加长期架构复杂度。

（无表格。）
