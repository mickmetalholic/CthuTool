# Phase 0 研究结论

## 决策 1：在 monorepo 中通过 Nest CLI 创建子应用
- Decision: 使用 `nest generate app web`（或等效 `nest g app web`）在工作区生成 `apps/web`，并由 `nest-cli.json` 维护项目映射。CLI 包为 `apps/web` 的 `devDependencies`（`@nestjs/cli`，与 Nest 主版本对齐），在仓库根通过 `pnpm --filter @cthutool/web exec nest …` 调用，避免 `pnpm dlx @nestjs/cli@latest` 浮动版本。
- Rationale: Context7 的 NestJS 官方文档明确推荐通过 `generate app` 将工作区扩展为 monorepo 应用，且可通过 `nest start <project>` 启动指定项目，符合“必须使用工具创建文件”的要求。
- Alternatives considered:
  - 手动复制模板目录：违反“必须使用脚手架工具”约束，且易与官方结构漂移。
  - 直接 `nest new` 在子目录初始化：会生成独立仓库结构，不利于当前 Turborepo 一体化管理。

## 决策 2：移除默认 ESLint，统一切换 Biome
- Decision: 删除新子应用中由脚手架带入的 ESLint 配置与相关脚本依赖，改为复用根目录 `biome.jsonc` 与根脚本（`biome:check` / `biome:write`）。
- Rationale: 仓库已定义 Biome 为统一质量门禁；Context7 文档给出 Biome `lint/check/format` 标准命令与迁移路径，适合替代 ESLint+Prettier 双栈。
- Alternatives considered:
  - 保留 ESLint 与 Biome 并存：增加规则冲突与维护成本，不符合“根据项目 biome 重新配置”要求。
  - 仅在子应用局部新增 biome 配置：会与仓库统一规则重复，降低一致性。

## 决策 3：新增独立健康检查接口
- Decision: 在 `apps/web/src/health` 使用 Nest CLI 生成 `controller`（及配套模块/服务）并暴露 `GET /health`。
- Rationale: Context7 文档提供了 `nest g controller health` 的生成方式，适合作为可观测性基线接口；可独立验证服务可达与就绪状态。
- Alternatives considered:
  - 复用根 `app.controller` 暴露健康接口：职责混杂，不利于后续扩展探针（readiness/liveness）。
  - 直接引入 Terminus 完整探针：超出本次“基线接口”范围，增加实现复杂度。

## 决策 4：配置失败快速退出与可读日志
- Decision: 启动阶段校验必要环境变量（最小集合），缺失时阻止应用监听端口并输出结构化错误信息。
- Rationale: 对齐 FR-005 / FR-006，优先保障部署可诊断性。
- Alternatives considered:
  - 缺失配置时给默认值继续运行：会隐藏配置错误，增加线上故障概率。
