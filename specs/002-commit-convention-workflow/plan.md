# Implementation Plan: Git 提交信息规范校验与辅助工作流

**Branch**: `002-commit-convention-workflow` | **Date**: 2025-03-22 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification + 用户指定技术栈（Husky、commitlint、Commitizen/cz-git、`.cursor/rules/*.mdc`）

## Summary

在 **Turborepo 根工作区**（pnpm）引入端到端约定式提交工作流：**Husky `commit-msg`** 调用 **commitlint**（`@commitlint/config-conventional` + 自定义 **英文全文** 规则 + **合并类 ignores**），**Commitizen + cz-git** 提供中文向导与 `pnpm run commit`，**`.cursor/rules/*.mdc`**（Cursor Project Rules）与配置同源描述格式以满足 AI 生成与 FR-005/FR-008。补齐 **CI commitlint**，与 `.specify/memory/constitution.md` 中「Commitlint」门禁一致。详细决策见 [research.md](./research.md)。

## Technical Context

**Language/Version**: Node.js ≥ 20（仓库 `engines`）  
**Primary Dependencies**: `husky`, `@commitlint/cli`, `@commitlint/config-conventional`, `commitizen`, `cz-git`（均为根目录 `devDependencies`）  
**Storage**: N/A（无应用数据持久化；配置为仓库内文件）  
**Testing**: 以 **契约样例 + 手工/脚本化** 调用 `commitlint` 验证通过/失败；不强制新增 Jest 套件（无业务 TS 模块）；若后续抽取纯函数再按宪章补单测  
**Target Platform**: 本地 Git（Windows/macOS/Linux）+ GitHub Actions `ubuntu-latest`  
**Project Type**: Monorepo **根级开发者体验（DX）工具链**  
**Performance Goals**: commitlint 单次校验亚秒级（默认规模）  
**Constraints**: 提交说明 **全文英文**（CJK 拦截）；与 pnpm/turbo 现有脚本共存；不引入 Zod；不将 valibot 用于 commitlint 管线（与宪章「应用边界 valibot」区分：本特性边界为 commitlint 插件规则）  
**Scale/Scope**: 全仓库单一 hook 与单一 `commitlint.config.cjs` 真相源

## Constitution Check

*GATE: Phase 0 前通过；Phase 1 设计后复验。*

| 原则 | 状态 | 说明 |
|------|------|------|
| FP & 模块化 | **Pass** | 配置按文件职责拆分：`commitlint.config.cjs`、`.husky/commit-msg`、`.cursor/rules/*.mdc`；避免在应用包内散落重复规则 |
| neverthrow / 业务错误 | **Pass** | 无应用层业务逻辑；hook 仅委托 CLI |
| valibot | **Pass** | 消息校验由 commitlint 承担；不引入 Zod |
| TDD / Jest | **N/A→Pass** | 无新增核心业务函数；以 commitlint 契约验收为主 |
| TSDoc | **N/A→Pass** | 无新增 TS 业务 API |
| Turborepo / `@cthutool/*` | **Pass** | 工具装根目录；不动包命名 |
| CI（含 Commitlint） | **需补强** | 当前 `ci.yml` 仅 `pnpm run check` / `test`；本计划 **增加 commitlint 步骤**（或根 `check` 聚合）以满足宪章 |

**Post-Phase-1 re-check**: 交付物包含 CI 中的 commitlint 与 [contracts/commit-message.contract.md](./contracts/commit-message.contract.md) 对齐；宪章无冲突。

## Project Structure

### Documentation (this feature)

```text
specs/002-commit-convention-workflow/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── commit-message.contract.md
└── tasks.md                    # /speckit.tasks（本命令不创建）
```

### Source Code（仓库根 — 本特性新增/修改）

```text
CthuTool/
├── package.json                 # devDeps、prepare、scripts.commit、config.commitizen
├── commitlint.config.cjs        # conventional + 英文规则 + ignores + cz-git prompt
├── .husky/
│   └── commit-msg               # pnpm exec commitlint --edit "$1"
├── .cursor/
│   └── rules/
│       └── *.mdc                # AI：Conventional Commits + 英文 + type 列表（Project Rules）
└── .github/workflows/ci.yml     # 增加 commitlint（PR 范围）
```

**Structure Decision**: **仅在 monorepo 根**落地 hook 与 commitlint；子包不重复安装 Husky，避免多份 hook。

## Phase 0: Outline & Research

- **Output**: [research.md](./research.md)（已完成）
- **NEEDS CLARIFICATION**: 无未决项；技术栈由用户指定并在 research 中记录取舍

## Phase 1: Design & Contracts

| 产出 | 路径 | 说明 |
|------|------|------|
| 逻辑模型 | [data-model.md](./data-model.md) | 实体与 FR 映射 |
| 接口合同 | [contracts/commit-message.contract.md](./contracts/commit-message.contract.md) | 语法、语言、豁免、变更流程 |
| 贡献者说明 | [quickstart.md](./quickstart.md) | `pnpm run commit`、排错、CI |
| Agent 上下文 | `.cursor/rules/*.mdc` | 约定式提交等规则以独立 `.mdc` 管理；`specify-rules.mdc` 等由 `update-agent-context.ps1` 合并本计划技术摘要 |

## Implementation Notes（供 `/speckit.tasks` 拆解）

1. **依赖与脚本**（根 `package.json`）  
   - `devDependencies`: `husky`, `@commitlint/cli`, `@commitlint/config-conventional`, `commitizen`, `cz-git`  
   - `"prepare": "husky"`（Husky 9 推荐）  
   - `"commit": "git-cz"` 或 `"czg"`（与 cz-git 文档一致即可）  
   - `config.commitizen.path`: `"cz-git"`

2. **Husky**  
   - `pnpm exec husky init`（若需）后添加/编辑 `.husky/commit-msg`：`pnpm exec commitlint --edit "$1"`  
   - 勿提交无效占位 hook；确保 LF 与可执行位在 Git 中正确（Windows 依赖 Git Bash 传参）

3. **commitlint.config.cjs**  
   - `extends: ['@commitlint/config-conventional']`  
   - 自定义 rule：检测 CJK（至少 `\u4e00-\u9fff`）于 subject/body/footer  
   - `ignores`: Merge branch / Merge pull request 等（与合同一致）  
   - `prompt`：cz-git 中文 messages + 与 `type-enum` 对齐的 types

4. **`.cursor/rules/*.mdc`**  
   - 在仓库内以 Project Rules（`.mdc`）维护：英文 imperative、类型列表、scope 约定、`BREAKING CHANGE`、**禁止中文写入提交文本**、与 commitlint 保持同步的维护说明；可与 `specify-rules.mdc` 等文件并存、分文件职责

5. **CI**  
   - PR：`pnpm exec commitlint --from ${{ github.event.pull_request.base.sha }} --to HEAD --verbose`（或等效）  
   - 注意 shallow clone：`actions/checkout` 需 `fetch-depth: 0` 若 base 不可见

6. **与宪章冲突排查**  
   - 不新增 Zod；不将 try/catch 业务层用于本特性

## Complexity Tracking

本计划 **无需** 登记宪章违规：commitlint/husky 为仓库基础设施，不适用应用层 neverthrow/valibot/TSDoc 要求。

---

**Generated artifacts**: `research.md`, `data-model.md`, `contracts/commit-message.contract.md`, `quickstart.md`, `plan.md`（本文件）  
**Next**: `/speckit.tasks` 生成 `tasks.md` 并实施
