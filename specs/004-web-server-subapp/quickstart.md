# Quickstart：Web 子应用

## 1. 前置条件
- Node.js >= 20
- pnpm >= 9
- 在仓库根目录执行命令
- 设置环境变量：`PORT`、`NODE_ENV`，可选 `LOG_LEVEL`

## 2. 使用 Nest CLI 生成子应用（仅工具生成）

`@nestjs/cli` 由 `apps/backend` 的 `devDependencies` 固定版本；在仓库根通过 workspace 调用本地 `nest`，勿使用 `pnpm dlx @nestjs/cli@latest`。

```bash
pnpm --filter @cthutool/backend exec nest generate app backend
```

> 要求：不得手工创建脚手架文件；如需新增资源（如健康检查控制器），同样使用 Nest CLI 命令生成。

## 3. 生成健康检查资源
```bash
pnpm --filter @cthutool/backend exec nest g module health
pnpm --filter @cthutool/backend exec nest g service health
pnpm --filter @cthutool/backend exec nest g controller health
```

## 4. 移除默认 lint 体系并切换 Biome
1. 删除 `apps/backend` 内 ESLint 配置文件（如 `.eslintrc.js`）及相关 npm script。
2. 确保子应用质量检查走仓库根脚本：
   - `pnpm run biome:check`
   - `pnpm run biome:write`

## 5. 启动与验证
```bash
PORT=3000 NODE_ENV=development LOG_LEVEL=info pnpm --filter @cthutool/backend run dev
```

健康检查：
```bash
curl http://localhost:3000/health
```

预期：
- 返回 200，JSON 包含 `status`、`service`、`timestamp`。
- 请求未定义路由时返回 404，JSON 包含 `code`、`message`、`timestamp`，`code=NOT_FOUND`。

## 6. 测试建议（TDD）
- 先写失败测试：
  - `GET /health` 返回 200 与标准成功结构。
  - 未定义路由返回统一错误结构。
- 再实现最小代码让测试转绿。
