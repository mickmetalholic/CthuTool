# Quickstart：Web 子应用

## 1. 前置条件
- Node.js >= 20
- pnpm >= 9
- 在仓库根目录执行命令

## 2. 使用 Nest CLI 生成子应用（仅工具生成）
```bash
pnpm dlx @nestjs/cli@latest generate app web
```

> 要求：不得手工创建脚手架文件；如需新增资源（如健康检查控制器），同样使用 Nest CLI 命令生成。

## 3. 生成健康检查资源
```bash
pnpm dlx @nestjs/cli@latest g module health --project web
pnpm dlx @nestjs/cli@latest g service health --project web
pnpm dlx @nestjs/cli@latest g controller health --project web
```

## 4. 移除默认 lint 体系并切换 Biome
1. 删除 `apps/web` 内 ESLint 配置文件（如 `.eslintrc.js`）及相关 npm script。
2. 确保子应用质量检查走仓库根脚本：
   - `pnpm run biome:check`
   - `pnpm run biome:write`

## 5. 启动与验证
```bash
pnpm dlx @nestjs/cli@latest start web --watch
```

健康检查：
```bash
curl http://localhost:3000/health
```

预期：
- 返回 200，包含服务可用状态字段（如 `status: "ok"`）。
- 请求未定义路由时返回统一 not-found 错误结构。

## 6. 测试建议（TDD）
- 先写失败测试：
  - `GET /health` 返回 200 与标准成功结构。
  - 未定义路由返回统一错误结构。
- 再实现最小代码让测试转绿。
