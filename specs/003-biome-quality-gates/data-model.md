# Data Model - Biome 质量门禁

本特性为工程配置型能力，不新增业务数据库实体。为保证需求可验证，定义以下“配置/流程实体”。

## Entity: QualityPolicy

- Purpose: 定义仓库唯一的格式化与 lint 规则来源。
- Fields:
  - `policyId` (string, required): 固定标识，建议 `root-biome-policy`。
  - `sourceFile` (string, required): 规则文件路径（`biome.jsonc`）。
  - `appliesTo` (string[], required): 受管路径范围（如 `apps/**`, `packages/**`）。
  - `excludes` (string[], optional): 明确排除范围（生成文件、构建产物等）。
  - `versioned` (boolean, required): 是否纳入版本控制，固定为 `true`。
- Validation Rules:
  - `sourceFile` 必须存在于仓库根并受版本控制。
  - `appliesTo` 至少包含一个源码目录。

## Entity: EditorGateConfig

- Purpose: 定义编辑器默认反馈行为。
- Fields:
  - `settingsFile` (string, required): `/.vscode/settings.json`。
  - `lintOnType` (boolean, required): 输入时检查，固定 `true`。
  - `formatOnSave` (boolean, required): 保存时格式化，固定 `true`。
  - `defaultFormatter` (string, required): Biome formatter 标识。
- Validation Rules:
  - `settingsFile` 必须存在且可被 Cursor/VS Code 识别。
  - `lintOnType` 与 `formatOnSave` 不能同时为 `false`。

## Entity: PreCommitGate

- Purpose: 定义本地提交前的增量门禁行为。
- Fields:
  - `hookFile` (string, required): `/.husky/pre-commit`。
  - `scope` (enum, required): `staged-only`。
  - `blockOnFailure` (boolean, required): 固定 `true`。
  - `fixHintCommand` (string, required): 失败时提示修复命令。
- Validation Rules:
  - `scope` 必须为 `staged-only`（与“增量强制”策略一致）。
  - `blockOnFailure` 必须为 `true`（满足 FR-003）。

## Entity: CIGateJob

- Purpose: 定义 CI 中的 Biome 门禁任务。
- Fields:
  - `workflowFile` (string, required): `.github/workflows/*.yml` 中对应任务。
  - `trigger` (enum, required): `push-all-branches`。
  - `checkCommand` (string, required): 与本地一致的 Biome 检查命令。
  - `failPipelineOnError` (boolean, required): 固定 `true`。
- Validation Rules:
  - `trigger` 必须覆盖所有分支 push。
  - `checkCommand` 与文档命令保持一致（FR-005）。

## State Transitions

### 1) 代码变更生命周期

`Edited` -> `LocallyChecked` -> `PreCommitPassed` -> `Pushed` -> `CIPassed`

- 若编辑器检查失败：停留在 `Edited`，开发者修复后重试。
- 若 pre-commit 失败：停留在 `LocallyChecked`，禁止进入 `Pushed`。
- 若 CI 失败：停留在 `Pushed`，不能作为合规基线继续流转。

### 2) 历史问题收敛生命周期

`BaselineIdentified` -> `IncrementProtected` -> `BatchRemediating` -> `Converged`

- 新增改动始终受 `IncrementProtected` 约束。
- 历史问题按批次从 `BatchRemediating` 收敛至 `Converged`。
