# Phase 1 数据模型

## 实体：ServiceConfiguration（服务配置）
- 字段：
  - `port: number`（必填，范围 1-65535）
  - `nodeEnv: "development" | "test" | "production"`（必填）
  - `logLevel: "debug" | "info" | "warn" | "error"`（可选，默认 `info`）
- 校验规则：
  - 启动时在边界层解析并校验；缺失或非法值直接失败退出（FR-005）。
- 状态转换：
  - `unvalidated -> valid`：全部必需字段通过校验。
  - `unvalidated -> invalid`：任一必需字段缺失/格式错误。

## 实体：HealthStatus（健康状态）
- 字段：
  - `status: "ok"`（必填）
  - `service: string`（必填，固定子应用标识）
  - `timestamp: string`（必填，ISO-8601）
- 校验规则：
  - 对外响应必须符合标准成功结构（FR-003）。
- 状态转换：
  - 无持久化状态；每次请求按当前运行状态即时生成。

## 实体：ErrorResponse（错误响应）
- 字段：
  - `code: string`（必填，如 `NOT_FOUND` / `CONFIG_INVALID`）
  - `message: string`（必填，可读）
  - `requestId?: string`（可选）
  - `timestamp: string`（必填）
- 校验规则：
  - 未定义路由统一输出 `NOT_FOUND`（FR-004）。
  - 不泄露敏感内部栈信息（Edge Case 对齐）。

## 实体关系
- `ServiceConfiguration` 决定应用能否进入可服务状态。
- `HealthStatus` 仅在应用成功启动后可被返回。
- `ErrorResponse` 用于配置失败与路由未命中等错误通道。
