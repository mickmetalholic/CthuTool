---
description: "Task list for Git 提交信息规范校验与辅助工作流 (002-commit-convention-workflow)"
---

# Tasks: Git 提交信息规范校验与辅助工作流

**Input**: Design documents from `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\specs\002-commit-convention-workflow\`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/commit-message.contract.md](./contracts/commit-message.contract.md), [quickstart.md](./quickstart.md)

**Tests**: 按 [plan.md](./plan.md)，本特性 **不新增 Jest**；以 [contracts/commit-message.contract.md](./contracts/commit-message.contract.md) §5 与 `pnpm exec commitlint` 手工或临时文件验收（非单元测试套件）。

**Organization**: 按用户故事（P1→P3）分阶段；每条任务含明确文件路径。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可与同阶段其他 [P] 任务并行（不同文件、无未完成前置依赖）
- **[Story]**: 对应 [spec.md](./spec.md) 用户故事（US1、US2、US3）
- 描述中须含具体路径

## Path Conventions

- **Monorepo 根**：`package.json`、`commitlint.config.cjs`、`.husky/`、`.github/workflows/ci.yml`、`.cursor/rules/*.mdc`
- 与 [plan.md](./plan.md) 一致；子包不重复安装 Husky

---

## Phase 1: Setup（共享基础设施）

**Purpose**：安装依赖与 npm 脚本，使本地可运行 Husky / commitlint / Commitizen。

- [x] T001 Add devDependencies `husky`, `@commitlint/cli`, `@commitlint/config-conventional`, `commitizen`, `cz-git` to `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\package.json`
- [x] T002 Add root `package.json` fields: `"prepare": "husky"`, commit script（`git-cz` 或 `czg`，与 cz-git 文档一致）, `config.commitizen.path` 指向 `cz-git`

---

## Phase 2: Foundational（阻塞性前置）

**Purpose**：单一规则真相源与 hook；**未完成前不得开始用户故事验收**。

**⚠️ CRITICAL**：US1/US2/US3 均依赖 commitlint 配置与 `commit-msg` hook。

- [x] T003 [P] Create `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\commitlint.config.cjs` with `extends: ['@commitlint/config-conventional']`, custom CJK（如 `\u4e00-\u9fff`）全文规则、与 `contracts/commit-message.contract.md` §4 一致的 `ignores`、与 `type-enum` 对齐的 cz-git `prompt`（中文 UI）
- [x] T004 Create `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\.husky\commit-msg` running `pnpm exec commitlint --edit "$1"`；确保 Husky 9 目录布局与换行/可执行位符合 [plan.md](./plan.md)（Windows 下 Git Bash 传参）

**Checkpoint**：`pnpm install` 后 hook 存在；`pnpm exec commitlint --help` 可用。

---

## Phase 3: User Story 1 — 不合规提交无法入库（Priority: P1）🎯 MVP

**Goal**：满足 FR-001 / FR-008：非法首行、含 CJK 的说明被 commitlint 拒绝；合规英文说明通过。

**Independent Test**：用故意违规的说明调用 commitlint 或 `git commit`，应失败并可读错误；改为合规消息后通过。

### Verification（契约验收，非 Jest）

- [x] T005 [US1] Run `pnpm exec commitlint --edit <file>` against temporary message files covering `contracts/commit-message.contract.md` §5: compliant sample exit 0; CJK in subject/body/footer non-zero with language-related message; merge exempt patterns exit 0

**Checkpoint**：User Story 1 可独立于 US2/US3 Demonstrate。

---

## Phase 4: User Story 2 — 交互式引导撰写合规说明（Priority: P2）

**Goal**：满足 FR-003 / FR-004：`pnpm run commit`（cz-git）方向键选 type、中文提示，产出英文消息且过 commitlint。

**Independent Test**：不依赖 hook 演示时，至少可通过向导生成一条合规消息并经 commitlint 校验通过。

- [x] T006 [US2] End-to-end: run `pnpm run commit` from repo root per `specs/002-commit-convention-workflow/quickstart.md` and confirm generated message passes `pnpm exec commitlint --edit` on the produced commit message file
- [x] T007 [US2] Update `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\specs\002-commit-convention-workflow\quickstart.md` if actual script name or cz-git invocation differs from documented commands

**Checkpoint**：US1 仍有效；US2 可独立演示向导流程。

---

## Phase 5: User Story 3 — AI 辅助默认产出可过检的说明（Priority: P3）

**Goal**：满足 FR-005 / FR-006：Cursor Project Rules 与 commitlint / 合同对齐，AI 按规则生成的典型说明可过检。

**Independent Test**：按 `.mdc` 与合同生成若干条说明，`commitlint` 应判合规（可与 T005 样例复用思路）。

- [x] T008 [P] [US3] Create `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\.cursor\rules\git-commit-convention.mdc` with Conventional Commits summary: English imperative, allowed types matching `commitlint.config.cjs`, scope notes, `BREAKING CHANGE`, **no CJK in commit text**, and FR-006 note to sync with `commitlint.config.cjs` / contract / quickstart on change

**Checkpoint**：US3 可独立对照 AI 规则与 commitlint。

---

## Phase 6: Polish & cross-cutting

**Purpose**：CI 兜底、FR-007 边角、文档与规则同源、快速开始自测。

- [x] T009 Extend `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\.github\workflows\ci.yml`: on `pull_request`, set `actions/checkout` `fetch-depth: 0` as needed; add step `pnpm exec commitlint --from ${{ github.event.pull_request.base.sha }} --to HEAD --verbose`（或与根 `pnpm run check` 聚合，与 [plan.md](./plan.md) 一致）
- [x] T010 [P] If default `git revert` messages fail commitlint, add `ignores` or header handling in `commitlint.config.cjs` and sync `specs/002-commit-convention-workflow/contracts/commit-message.contract.md` §4 per research R7
- [x] T011 [P] FR-006 pass: reconcile `commitlint.config.cjs`, `specs/002-commit-convention-workflow/contracts/commit-message.contract.md`, `specs/002-commit-convention-workflow/quickstart.md`, `.cursor/rules/git-commit-convention.mdc` for types, language, exemptions
- [x] T012 Execute manual validation from `specs/002-commit-convention-workflow/quickstart.md`（install、`pnpm run commit`、本地 `commitlint --edit`、CI 预期）
- [x] T013 [P] Run `C:\Users\yuans\Documents\GitHub\mickmetalholic\CthuTool\.specify\scripts\powershell\update-agent-context.ps1` if repo workflow requires refreshing `.cursor/rules/specify-rules.mdc` with implementation summary per [plan.md](./plan.md) Phase 1 table

---

## Dependencies & execution order

### Phase dependencies

- **Phase 1**：无前置；最先完成。
- **Phase 2**：依赖 Phase 1（依赖与 `prepare` 已写入）；**阻塞所有用户故事阶段**。
- **Phase 3–5**：各依赖 Phase 2；三者可按 P1→P2→P3 串行，或在 Phase 2 完成后由不同成员并行（需注意共享文件冲突）。**推荐顺序**：US1 → US2 → US3。
- **Phase 6**：依赖 commitlint 与 hook 已落地；**T009 建议在有可运行的 `commitlint.config.cjs` 后执行**。

### User story dependencies

- **US1**：仅依赖 Phase 2；与其它故事无硬依赖。
- **US2**：依赖 Phase 2；逻辑上叠加在 US1 的 hook 行为之上，但向导产出可用 `commitlint --edit` 独立验证。
- **US3**：依赖 Phase 2 中规则稳定；与 US1/US2 无代码层依赖，但应晚于或与 US2 同步以避免文档漂移。

### Parallel opportunities

- **Phase 2**：T003 与 T004 可在 T001、T002 完成后 **并行**（不同文件）。
- **Phase 5**：T008 单独，可与 Phase 6 中 T010、T011、T013 等 **[P]** 在人员充足时并行（注意勿同时改同一配置的多处镜像）。
- **Phase 6**：T010、T011、T013 可并行；T009 建议单独合并前先验证表达式与 `checkout` depth。

---

## Parallel example: Phase 2

```text
开发者 A: T003 commitlint.config.cjs（规则 + prompt + ignores）
开发者 B: T004 .husky/commit-msg（pnpm exec commitlint --edit "$1"）
```

前提：T001、T002 已完成且 `pnpm install` 执行过。

---

## Parallel example: User Story 1验收

```text
# T005：多个临时消息文件可并行试跑（同一 CLI、不同输入文件）
pnpm exec commitlint --edit tmp/valid.txt
pnpm exec commitlint --edit tmp/cjk-subject.txt
pnpm exec commitlint --edit tmp/merge-exempt.txt
```

---

## Implementation strategy

### MVP first（仅 User Story 1）

1. 完成 Phase 1、Phase 2  
2. 完成 Phase 3（T005）  
3. **停止并验收**：违规必拦、合规必过、合并豁免符合合同  

### Incremental delivery

1. Setup + Foundational → hook + commitlint 可用  
2. + US1 → 契约验收通过 → **MVP**  
3. + US2 → 向导 + quickstart 一致  
4. + US3 → `.mdc` 与工具链对齐  
5. + Polish → CI 与 FR-007 / FR-006 收口  

### Parallel team strategy

1. 全员完成 Phase 1–2  
2. Phase 2 后：成员 A 专注 US1 验收与 CI（T005、T009）；成员 B 专注 US2（T006–T007）；成员 C 专注 US3（T008）与文档交叉检查（T011）  

---

## Notes

- 所有任务须保留 **checkbox + Task ID +（若适用）[P] / [USn] + 文件路径** 格式，便于 `/speckit.implement` 逐条勾选。  
- 不引入 Zod；commitlint 边界不使用 valibot（见 [plan.md](./plan.md)）。  
- 变更 `contracts/commit-message.contract.md` 任一条时，按合同 §6 同步 `commitlint.config.cjs`、相关 `.mdc`、`quickstart.md`。  

---

**Generated by**: `/speckit.tasks` · **Feature dir**: `specs/002-commit-convention-workflow`
