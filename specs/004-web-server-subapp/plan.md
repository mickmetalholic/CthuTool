# Implementation Plan: Web 服务端子应用初始化与健康检查

**Branch**: `004-web-server-subapp` | **Date**: 2026-03-31 | **Spec**: `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\specs\004-web-server-subapp\spec.md`
**Input**: Feature specification from `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\specs\004-web-server-subapp\spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

在 `apps/` 下使用 NestJS 官方 CLI 脚手架创建独立 web 服务端子应用，仅保留工具生成文件作为基线；移除脚手架默认 lint 体系并统一接入仓库根 `biome.jsonc`；新增健康检查接口用于可用性探测，并为后续任务提供可验证的启动、健康探测与错误响应基线。

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.9.x + Node.js >= 20  
**Primary Dependencies**: NestJS CLI (`@nestjs/schematics` 生成)、NestJS 核心运行时、`@biomejs/biome`（仓库已配置）  
**Storage**: N/A（本特性仅服务启动与健康探测）  
**Testing**: Jest（NestJS 单元与 e2e 基线）  
**Target Platform**: Node.js 服务进程（Windows/Linux/macOS 开发环境）  
**Project Type**: Turborepo monorepo 下的 web-service 子应用  
**Performance Goals**: 健康检查接口本地常规负载下 p95 < 1s（对齐 SC-005）  
**Constraints**: 必须通过 Nest CLI 生成应用与资源骨架；不得手动“补造”脚手架文件；移除 ESLint 并使用 Biome；保持 CI 门禁兼容（Biome/tsc/Knip/Commitlint/Tests）  
**Scale/Scope**: 单一子应用初始化（`apps/web`）+ 1 个健康检查接口 + 基础文档与契约

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Per `.specify/memory/constitution.md` (CthuTool):

- **FP & modularity:** Design MUST respect single-responsibility files/modules; effects explicit; no gratuitous
  mutation.
- **Errors:** Business logic MUST use `neverthrow` (`Result` / `ResultAsync`); no `try` / `catch` / `throw` in
  that layer.
- **Validation:** Boundaries MUST use `valibot` only (Zod forbidden).
- **TDD:** Red-Green-Refactor; Jest for Next.js/NestJS; `bun test` for Bun; unit tests for pure and core logic.
- **TSDoc:** Pure and core business functions MUST document `@param` / `@returns`.
- **Stack & repo:** Turborepo; `@cthutool/*` naming (scratches per constitution); REST + `fetch`; shared Tailwind
  + Ant Design UI patterns where UI applies.
- **CI:** Changes MUST remain compatible with Biome, `tsc --noEmit`, Knip, Commitlint, and all Jest/Bun tests.

门禁结论（Phase 0 前）：
- ✅ **FP & modularity**：控制器仅承载 HTTP 入口，健康状态组装放入服务函数；文件职责单一。
- ✅ **Errors / neverthrow**：若引入业务可失败逻辑，服务层使用 `Result`/`ResultAsync`；本次健康接口为无失败纯读取路径，避免异常控制流。
- ✅ **Validation / valibot**：本次接口无复杂输入；如后续新增 query/body，统一以 valibot 在边界层校验。
- ✅ **TDD**：先补充失败测试（健康接口与未定义路由），再实现通过。
- ✅ **TSDoc**：核心纯函数与服务函数补充 `@param`/`@returns`。
- ✅ **Stack/CI**：保持 NestJS + Biome + Jest + turbo 的仓库约束。

门禁复核（Phase 1 后）：
- ✅ `research.md` 已消除全部 NEEDS CLARIFICATION。
- ✅ `data-model.md`、`contracts/`、`quickstart.md` 与宪法及 FR-001~FR-008 对齐。
- ✅ 未出现需豁免的宪法违例，`Complexity Tracking` 保持空表。

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
apps/
└── web/
    ├── src/
    │   ├── app.controller.ts
    │   ├── app.module.ts
    │   ├── app.service.ts
    │   ├── health/
    │   │   ├── health.controller.ts
    │   │   ├── health.module.ts
    │   │   └── health.service.ts
    │   └── main.ts
    ├── test/
    │   ├── app.e2e-spec.ts
    │   └── jest-e2e.json
    ├── tsconfig.app.json
    └── tsconfig.spec.json

biome.jsonc
package.json
```

**Structure Decision**: 采用 monorepo 子应用结构，在 `apps/web` 内保持“控制器/服务”分层；以 Nest CLI 生成目录与资源骨架，避免手工脚手架偏差；lint/format 完全依赖仓库级 Biome 配置。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
