# Contract: CLI Greeting Flow

## 1. 入口契约

- **Command**: `bun run --filter @cthutool/cli start`（或在 `apps/cli` 下 `bun run start`）  
- **Arguments**: 无必填参数（FR-010）  
- **Preconditions**:
  - 运行环境为交互式 TTY。
  - 终端允许标准输入。

## 2. 交互契约（顺序不可变）

1. 打印欢迎面板（带边框 + 颜色，降级时保留文本结构）。  
2. 提示输入姓名。  
3. 若输入为空或全空白，展示校验反馈并重复第 2 步。  
4. 输入合法后清屏。  
5. 进入 2 秒动态加载态。  
6. 加载结束后展示最终界面：保留欢迎面板 + `Hello, <name>`。

## 3. 输入与校验契约

- **Input Type**: `string`  
- **Normalize**: `trim()`  
- **Valid Condition**: `trimmed.length >= 1`  
- **Invalid Feedback**: 明确提示“姓名不能为空”并允许继续输入，不退出进程。

## 4. 渲染契约

- **静态渲染**: `boxen` + `picocolors` 生成欢迎面板。  
- **动态渲染**: `React` + `Ink` 管理加载态与最终界面。  
- **加载指示器**: `ink-spinner`，持续时间 2 秒 +/- 0.2 秒。  
- **最终态要求**:
  - 欢迎面板仍可见（FR-007）
  - 成功文案严格匹配 `Hello, <user name>`（FR-008）

## 5. 失败与中断契约

- 用户在加载中断（Ctrl+C）时，流程直接终止；不得输出成功文案。  
- 业务错误通过 `neverthrow` 显式返回，由入口统一映射退出码和提示。

## 6. 可测试性契约

- **Unit**:
  - 姓名规范化与校验（valibot）
  - 问候语拼接纯函数
  - 状态转换纯函数  
- **Integration**:
  - 端到端流程顺序
  - 空输入重试
  - 2 秒加载时序
