# Quickstart: CthuTool Monorepo（001-init-turborepo）

## 前置条件

- **Node.js**：**20.x 或更高**（与仓库根 `package.json` 中 `engines.node` 一致）。
- **pnpm**：与根 `packageManager` 一致（当前 **pnpm@9.15.4**）。推荐：

  ```bash
  corepack enable
  corepack prepare pnpm@9.15.4 --activate
  ```

- **网络**：需能访问 npm registry；若在企业内网，请配置 `npm`/`pnpm` registry 镜像（例如 `.npmrc` 中设置 `registry=`），否则 `pnpm install` 可能长时间重试或超时。

## 安装依赖

在仓库根目录：

```bash
pnpm install
```

## 常用命令

以根目录 `package.json` 的 `scripts` 为准：

```bash
pnpm run build
pnpm run check
```

直接使用 Turborepo：

```bash
pnpm exec turbo run build
pnpm exec turbo run check
```

## 测试（根 Jest）

契约与集成测试位于 `tests/`：

```bash
pnpm run test
```

### 集成测试门控

`tests/integration/root-workspace-check.test.ts` 会在仓库根启动子进程执行 `pnpm run check`。若在受限环境（例如部分 CI 沙箱）下不稳定，可设置：

```bash
# Windows PowerShell
$env:SKIP_ROOT_WORKSPACE_CHECK="1"; pnpm run test

# Unix
SKIP_ROOT_WORKSPACE_CHECK=1 pnpm run test
```

手工等价验证：在仓库根直接执行 `pnpm run check`，确认退出码为 `0`。

## 新增工作区成员（FR-002）

1. 在 `apps/<name>/` 或 `packages/<name>/` 新建目录，并放入有效 `package.json`（`name` 建议使用 `@cthutool/<name>`）。
2. 确认目录被 `pnpm-workspace.yaml` 中已有 glob（`apps/*`、`packages/*`）覆盖；**无需**复制或修改根目录 `scripts`。
3. 在该包的 `package.json` 中提供与 `turbo.json` 一致的脚本（至少包含本仓库已注册的 `build` 与 `check`）。
4. 在仓库根执行 `pnpm install`，再运行 `pnpm run check`，确认 Turborepo 输出包含新包且任务成功。

参考示范包：`packages/example-lib/`（`@cthutool/example-lib`）。

## CI 与本地入口（FR-006）

`.github/workflows/ci.yml` 在仓库根执行 `pnpm install` 与 `pnpm run check`，与上文「常用命令」一致。测试步骤使用 `SKIP_ROOT_WORKSPACE_CHECK=1`，避免与工作流中的 `check` 步骤重复执行同一命令；本地完整验证仍应直接运行 `pnpm run check`。

## 初始化仓库（维护者一次性操作摘要）

1. 在**空临时目录**中执行：`pnpm dlx create-turbo@latest .`，选择 **pnpm**（勿在已有 `.specify` 的仓库根执行）。
2. 将生成物 **合并** 到仓库根，**保留** `.specify/` 等既有内容；冲突文件手工合并。
3. 删除示例应用目录（如 `apps/docs`、`apps/web`），清理 workspace 引用。
4. 维持 `apps/`、`packages/` 骨架（可用 `.gitkeep` 占位）；按 [research.md](./research.md) 保留 `@cthutool/placeholder` 等最小编排成员（本仓库已含 `packages/placeholder` 与示范库 `packages/example-lib`）。
5. 提交前运行 `pnpm install` 与文档中的根级校验命令。

若 `create-turbo` 在临时目录内因**网络问题**导致依赖安装失败：**不要**从零手写根级 monorepo 文件代替脚手架；应跳过临时目录内的安装完成，将脚手架**已写出**的模板文件按 [plan.md](./plan.md) 合并入仓库根，然后在**仓库根**执行 `pnpm install` 并**多次有限重试**；仍失败则检查网络或 registry 镜像（见上文「网络」）。

详细决策见 [plan.md](./plan.md) 与 [research.md](./research.md)。

## 二次运行与缓存（SC-002 / FR-004）

在无代码变更时连续执行两次 `pnpm run check`，第二次应因 Turborepo 缓存明显快于第一次。若在 CI 或特殊环境下无法达到规格中的耗时比例，请在 `README.md` 或本文件中简要说明原因与预期。
