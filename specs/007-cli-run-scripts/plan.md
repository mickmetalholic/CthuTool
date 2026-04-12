# Implementation Plan: CLI 脚本发现与执行

**Branch**: `007-cli-run-scripts` | **Date**: 2026-04-13 | **Spec**: `specs/007-cli-run-scripts/spec.md`  
**Input**: Feature specification from `specs/007-cli-run-scripts/spec.md`

## Summary

在 `apps/cli/src` 下新增 `scripts/` 目录：每个子文件夹为一个**脚本包**，包含机器可读的元数据 JSON 与入口 `index.ts`。用户既可用 `bun` 直接执行某个入口文件，也可通过 CLI 子命令列出并选择脚本，或通过参数/位置参数指定脚本标识后执行。实现上采用 **Citty** 扩展子命令、**valibot** 校验清单与元数据、**neverthrow** 表达发现/加载/执行中的失败，演示包至少包含一个 hello-world 级别输出，以满足 FR-001～FR-006。

## Technical Context

**Language/Version**: TypeScript 5.9.x（运行时 Bun）  
**Primary Dependencies**: Bun、citty、@clack/prompts（交互式多选）、valibot、neverthrow、picocolors（可选，用于一致的错误提示）  
**Storage**: N/A（脚本与元数据为仓库内文件；无应用级持久化）  
**Testing**: `bun test`（纯函数与发现/校验逻辑单元测试；必要时对 CLI 适配层做轻量集成测试）  
**Target Platform**: 交互式终端（Windows/macOS/Linux；列表选择在非 TTY 时需有明确降级策略，见 research）  
**Project Type**: Turborepo monorepo 下的 CLI 子应用（`apps/cli`）  
**Performance Goals**: 脚本数量在「少量内置脚本」规模下，发现与校验应在人类可感知瞬间完成（通常小于 500ms，不做硬性 SLA）  
**Constraints**: 元数据与入口路径约定在仓库内固定；业务层禁止 `try`/`catch`/`throw`；边界校验仅用 valibot；与 Biome/tsc/Knip/CI 保持兼容  
**Scale/Scope**: 初始 1 个演示脚本 + 可扩展多包；单包单入口文件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **FP 与模块化**：脚本发现、元数据解析、标识解析为纯函数或可组合的 `Result`/`ResultAsync`；文件读取与动态 import 放在适配层；通过。  
- **Errors（neverthrow）**：读目录、读 JSON、校验、解析路径、动态加载与执行编排均用 `Result`/`ResultAsync`；CLI 最外层可将失败映射为退出码与用户可读消息；通过。  
- **Validation（valibot）**：元数据与运行期边界统一 valibot；通过。  
- **TDD**：对清单构建、重复 id、非法包等先测后实现；通过。  
- **TSDoc**：核心业务与纯函数补齐 `@param` / `@returns`；通过。  
- **栈与仓库**：`@cthutool/cli`、Bun 脚本栈符合宪法；通过。  
- **CI**：不引入 Zod；保持现有质量门禁可运行；通过。

## Project Structure

### Documentation (this feature)

```text
specs/007-cli-run-scripts/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── script-package.contract.md
│   └── run-scripts-command.contract.md
└── tasks.md  # 由 /speckit.tasks 生成
```

### Source Code (repository root)

```text
apps/cli/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                         # 注册子命令（含 run-scripts）
│   ├── command/
│   │   ├── greet.command.ts            # 既有
│   │   └── run-scripts.command.ts      # 新增：参数解析 + 调用 flow
│   ├── scripts/                         # 新增：内置脚本包根目录
│   │   └── <script-id>/                 # 每包一目录，script-id 与元数据 id 一致
│   │       ├── script.json              # 元数据（文件名固定，见契约）
│   │       └── index.ts                 # 入口
│   ├── domain/                          # 新增或扩展
│   │   ├── script-manifest-schema.ts    # valibot schema
│   │   └── script-id.ts                 # 标识符规范化/冲突检测（纯函数）
│   ├── services/ 或 infra/             # 命名与现有 cli 一致即可
│   │   └── discover-scripts.ts          # 读目录、装载 manifest（ResultAsync）
│   └── flow/
│       └── run-bundled-script.ts        # 选择逻辑 + 动态 import + 调用入口
└── tests/
    ├── unit/
    └── integration/                     # 按需
```

**Structure Decision**：在 `apps/cli/src/scripts` 集中存放内置脚本包，与 CLI 源码同树便于打包与相对路径解析；命令与领域逻辑分层与 `005-cli-greeting-demo` 一致，满足 SRP 与可测性。

## Phase 0 Research Focus

- 元数据文件名与字段集合（稳定 id、展示名、描述）及与目录名的关系。  
- 非 TTY 下无参数调用时的行为（报错提示使用 `--name` / `SCRIPT` 或环境变量）。  
- 动态 `import()` 路径解析在 Bun 下与 `tsc` 类型检查的配合方式（`import.meta.url` 相对解析）。  
- Citty 子命令参数形态（位置参数 vs `--script`）与 help 文案一致性。

## Post-Design Constitution Check

- `data-model.md` 与 `contracts/` 将边界数据结构与命令接口固定，仍保持 valibot + neverthrow 分层。  
- 无新增违反宪法的栈或模式。  
- **结论**：通过，无需填写 Complexity Tracking。

## Complexity Tracking

无宪法违规项。

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| （无） | — | — |
