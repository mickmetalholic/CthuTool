# Phase 0 Research - 基于 Biome 的代码质量门禁

## 决策 1：统一规则源采用仓库根 `biome.jsonc`

- Decision: 在仓库根目录维护单一 `biome.jsonc`，所有包共享同一规则基线。
- Rationale: 满足 FR-001 的“单一、可版本化约定来源”，并降低多包规则漂移风险。
- Alternatives considered:
  - 各包独立 `biome.jsonc`：灵活但维护成本高，容易出现规则不一致。
  - 仅依赖编辑器插件默认规则：不可版本化，无法保证 CI 一致性。

## 决策 2：编辑器策略采用 onType + onSave

- Decision: 提交仓库级 `.vscode/settings.json`，默认开启输入时检查与保存时格式化。
- Rationale: 与澄清结论一致，减少“写完才发现问题”的反馈延迟。
- Alternatives considered:
  - 仅 onSave：反馈滞后，编辑阶段体验较弱。
  - 仅手动格式化：不符合“默认可操作反馈”的要求。

## 决策 3：提交前门禁采用“仅暂存改动”检查并强制阻断

- Decision: 在 `.husky/pre-commit` 中仅对 staged 文件执行 Biome 检查；失败阻断提交。
- Rationale: 兼顾 FR-003 的强制性与开发效率，避免历史遗留问题一次性阻塞开发。
- Alternatives considered:
  - 每次全仓检查：对大仓库成本高，开发体验差。
  - 失败仅警告不阻断：不满足强制门禁要求。

## 决策 4：CI 门禁对所有分支 push 强制执行

- Decision: CI 中对任意分支 push 触发 Biome 检查任务，失败即流水线失败。
- Rationale: 满足 FR-004，确保任何分支都保持可合并质量基线。
- Alternatives considered:
  - 仅主分支/PR 检查：无法覆盖分支早期质量回归。
  - 夜间批处理：反馈过慢，不能作为持续门禁。

## 决策 5：历史遗留采用“增量强制 + 基线收敛”

- Decision: 短期以增量改动强制为主，建立遗留基线并分阶段收敛。
- Rationale: 避免“一次性全红”导致流程瘫痪，同时保证新增代码持续合规。
- Alternatives considered:
  - 一次性全量修复：风险高、改动面大，影响业务迭代节奏。
  - 永久忽略遗留：会固化技术债，降低规则可信度。

## 决策 6：与 Commitlint 职责边界明确分离

- Decision: Commitlint 仅校验提交信息，Biome 仅校验源码风格与 lint。
- Rationale: 降低重复拦截与认知混乱，符合 Spec 与宪章职责划分。
- Alternatives considered:
  - 在同一钩子中混合处理并输出统一错误：实现简单但责任边界不清。
  - 将源码校验迁移到 commit-msg 阶段：不符合语义，且会延迟反馈。
