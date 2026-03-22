# Research: Git 提交规范工作流（002-commit-convention-workflow）

**Date**: 2025-03-22  
**Spec**: [spec.md](./spec.md)

## R1 — 拦截层：Husky + `commit-msg`

| Item | Detail |
|------|--------|
| **Decision** | 使用 **Husky 9.x** 在仓库根目录注册 `.husky/commit-msg`，调用 `pnpm exec commitlint --edit "$1"`（POSIX）/ 在 Windows 下由 Git for Windows 传入路径参数。 |
| **Rationale** | 与 pnpm monorepo 一致；`commit-msg` 在消息写入对象前触发，满足 FR-001/FR-008 的强制拦截；Husky 为社区默认方案，维护活跃。 |
| **Alternatives considered** | **纯文档约定**（无强制，不满足 spec）；**lefthook**（可行，但用户已指定 husky）；**仅 CI 校验**（本地可绕过，不满足 P1）。 |

## R2 — 校验层：commitlint + conventional

| Item | Detail |
|------|--------|
| **Decision** | `@commitlint/cli` + `@commitlint/config-conventional`；根目录 `commitlint.config.cjs` 单文件承载规则、**英文全文**自定义规则、**合并/部分自动化提交** 的 `ignores`、以及与 cz-git 共享的 `prompt`（若 cz-git 从同文件读取）。 |
| **Rationale** | 与宪章「Commitlint — Conventional Commits」一致；规则集与 spec 中类型列表（feat/fix/docs 等）对齐；单文件便于 FR-006「文档与工具一致」。 |
| **Alternatives considered** | **完全手写 rules**（成本高）；**semantic-release 内置**（偏重发布，不替代本地 hook）。 |

## R3 — 全文英文（FR-008）

| Item | Detail |
|------|--------|
| **Decision** | 在 `commitlint.config.cjs` 内以 **commitlint 插件对象**注册自定义 rule（例如 `english-only`）：对 `parsed.subject`、`parsed.body`、`parsed.footer`（或 `parsed.raw`）检测 **CJK 统一表意文字**（如 `\u4e00-\u9fff`）；命中则 error。合并类消息走 `ignores`，不进入该规则。 |
| **Rationale** | 不引入 Zod/valibot 于消息边界（commitlint 自有校验管线）；实现成本低且可测；满足「指明与语言要求相关」的错误信息。 |
| **Alternatives considered** | **仅依赖贡献者自觉**（不满足 FR-008）；**ASCII-only**（过严，易误伤合法标点/Unicode 英文名；可迭代收紧）。 |

## R4 — 交互层：Commitizen + cz-git + `pnpm run commit`

| Item | Detail |
|------|--------|
| **Decision** | `devDependencies`: `commitizen`, `cz-git`；`package.json` 配置 `config.commitizen.path` 指向 `cz-git`；脚本 **`"commit": "git-cz"`** 或 **`czg`**（以实现时 cz-git 推荐方式为准，二者择一并写入 quickstart）。中文 **prompt** 由 cz-git 的 `prompt` 配置提供；**产出消息仍为英文**（提示文案可中文）。 |
| **Rationale** | 满足 FR-003/FR-004；类型列表与 commitlint `type-enum` 同源配置，避免双处漂移。 |
| **Alternatives considered** | **@commitlint/prompt-cli**（轻量但 UX 与「中文向导」需求不如 cz-git 成熟）；**手写 inquirer 脚本**（维护成本高）。 |

## R5 — AI 规则层：`.cursor/rules/*.mdc`

| Item | Detail |
|------|--------|
| **Decision** | 在 **`.cursor/rules/`** 下以 **Cursor Project Rules（`.mdc`）** 维护提交规范：可与 `specify-rules.mdc` 等并存、分文件职责；内容与 `commitlint.config.cjs` 一致：**英文 imperative subject**、允许 type 列表、scope 约定、`BREAKING CHANGE` 脚注格式、禁止中文写入提交说明。 |
| **Rationale** | 满足 FR-005/FR-008 与 spec P3；与 Cursor 推荐的 Project Rules 路径一致，便于与 Spec Kit 产物分文件管理。 |
| **Alternatives considered** | **根目录 `.cursorrules`**（单文件、与 `.cursor/rules/*.mdc` 并存时易重复；本特性以 Project Rules 为交付物）。 |

## R6 — CI 与宪章对齐

| Item | Detail |
|------|--------|
| **Decision** | 当前 `.github/workflows/ci.yml` 未显式运行 commitlint。实现时在 **PR** 上增加一步（或纳入 `pnpm run check`）：对 PR 范围内提交运行 `commitlint --from <base> --to HEAD`；**push** 至 main 可对单次提交校验。与宪章「Commitlint」门禁对齐。 |
| **Rationale** | 本地 hook 可被 `--no-verify` 跳过，CI 提供团队兜底。 |
| **Alternatives considered** | **仅本地 husky**（与宪章/SC 抽样审计意图不完全一致）。 |

## R7 — 特殊提交（FR-007）

| Item | Detail |
|------|--------|
| **Decision** | `ignores` 默认包含常见 **Merge branch** / **Merge pull request** 消息模式；**Revert** 若工具生成非 conventional 格式，一并加入 `ignores` 或单独 `headerPattern`（以实现时样本为准并在 `contracts/` 中写明）。 |
| **Rationale** | 减少误拦；与 spec 边界案例一致。 |
| **Alternatives considered** | **不忽略任何合并**（易阻塞日常 merge）。 |
