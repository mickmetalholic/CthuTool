# Research: 001-init-turborepo

**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## 1. 官方脚手架与包管理器

**Decision**: 在 **空临时目录** 内执行 `pnpm dlx create-turbo@latest .` 生成项目，工作区包管理器选择 **pnpm**；生成后再合并入真实仓库根。

**Rationale**: 与 Turborepo 文档及团队选择一致；`pnpm-workspace.yaml` + 内容寻址安装适合 monorepo；临时空目录可避免 CLI 对非空根目录的限制或意外覆盖。

**Alternatives considered**: `npx create-turbo@latest`（npm/yarn 工作区）；本仓库明确排除。在仓库根直接执行 `create-turbo` — **拒绝**（本仓库约定一律临时目录生成）。

---

## 1b. 临时目录内安装失败（网络）时的降级

**Decision**: 若 `create-turbo` 在临时目录内触发依赖安装且因网络失败：**不再**以「在临时目录无限重试安装」为唯一路径；应**跳过在临时目录完成安装**，将脚手架**已生成的文件**合并入真实仓库根后，在**仓库根**执行 `pnpm install`，并对安装命令做**多次有限重试**（次数与间隔在实现脚本或维护者操作中约定，避免无限循环）。

**Rationale**: 不稳定网络下，合并后在本机/CI 统一使用已配置的 registry 与重试策略，往往比困在临时目录更易排障；交付物仍以官方生成物为源，不引入「手搓根布局」。

**Alternatives considered**: 网络失败时改用文档化手工 `package.json` + `pnpm-workspace.yaml` + `turbo.json` — **拒绝**（与「必须来自官方脚手架生成物」冲突）。

---

## 2. 合并入非空仓库根（存在 `.specify` 等）

**Decision**: **始终**采用「临时目录生成 → 合并到仓库根」；合并时 **绝不**用生成物覆盖 `.specify/`，对 `package.json` / `turbo.json` / `pnpm-workspace.yaml` 等与既有根文件冲突处 **手工合并**。

**Rationale**: 仓库已有 Spec Kit 与规格文档；空临时目录生成可稳定复现，合并策略保护既有资产。

**Alternatives considered**: 强制 `--force` 类标志（若存在）覆盖根目录 — **拒绝**，风险破坏既有 Spec Kit 文件。

---

## 3. 删除示例应用后的工作区有效性

**Decision**: 删除 `apps/docs`、`apps/web`（名称以生成结果为准）后：

- 保持 `apps/`、`packages/` 目录存在，必要时放置 `.gitkeep` 以便空目录进 Git。
- 若 `pnpm-workspace.yaml` 的 glob（如 `apps/*`）在 **零个包** 时导致 `pnpm install` 或 `turbo` 无任务/报错，则添加 **单一占位包**，例如 `packages/placeholder`（或 `packages/config`），`name` 为 `@cthutool/placeholder`，`private: true`，脚本提供无操作的 `check`（如 `node -e "process.exit(0)"`），并在 `turbo.json` 中注册对应 `tasks`。

**Rationale**: 规格要求「至少一个可编排成员或等价占位」与 FR-003 根级可执行校验；纯空 glob 在部分版本下体验差。

**Alternatives considered**: 保留一个精简示例 app — **拒绝**，与用户「只保留空骨架」冲突。

---

## 4. 与 constitution 的命名约定

**Decision**: 首个真实或占位 workspace 包使用 **`@cthutool/<name>`** 作用域；`scratches/` 规则暂不适用（无 scratches）。

**Rationale**: 与 `.specify/memory/constitution.md` 包命名一致。

**Alternatives considered**: 沿用模板 `@repo/*` — 须在合并后重命名并更新引用，增加出错面；优先直接使用 `@cthutool/*`。

---

## 5. CI 与质量门禁（本特性范围）

**Decision**: 本特性交付 **不强制** 一次接满 Biome/Knip/Jest 流水线；在 `quickstart.md` 中写明根级命令，并在 `plan.md` 中注明完整 CI 为后续任务。

**Rationale**: 规格 FR-006 为「若引入 CI」；空骨架阶段先保证本地与文档一致。

**Alternatives considered**: 初始化同时加齐 GitHub Actions — 可作为紧随其后的 PR，非本 plan 必达项。
