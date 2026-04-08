# Data Model - CLI Welcome Greeting Demo

## 实体：SessionInputName

- **描述**: 单次 CLI 会话中用户输入的姓名值。  
- **字段**:
  - `raw`: `string`，提示组件返回的原始输入。
  - `trimmed`: `string`，去除前后空白后的显示值。
  - `isValid`: `boolean`，是否通过 valibot 非空校验。  
- **校验规则**:
  - 输入必须为字符串。
  - `trimmed.length >= 1`。
  - 全空白输入判定失败并触发重试提示。  
- **状态变化**:
  - `raw entered` -> `trimmed` -> `validated(valid|invalid)`。

## 实体：WelcomePanel

- **描述**: 可复用欢迎面板视图模型，用于首屏和最终结果页。  
- **字段**:
  - `title`: `string`
  - `body`: `string`
  - `borderStyle`: `string`（boxen 配置）
  - `colorTokens`: `ReadonlyArray<string>`（picocolors 策略）  
- **约束**:
  - 在首屏与结果页渲染内容一致（除非需求后续扩展）。
  - 低色彩终端可降级为纯文本，但结构不变。

## 实体：RunState

- **描述**: CLI 流程状态机，保证交互顺序与时序要求。  
- **枚举值**:
  - `welcome`
  - `prompt`
  - `loading`
  - `result`
  - `cancelled`（用户中断）  
- **转换规则**:
  - `welcome` -> `prompt`
  - `prompt` -> `prompt`（输入非法重试）
  - `prompt(valid)` -> `loading`
  - `loading(2s done)` -> `result`
  - `loading(interrupted)` -> `cancelled`

## 实体：GreetingViewModel

- **描述**: 最终渲染所需数据载体。  
- **字段**:
  - `panel`: `WelcomePanel`
  - `message`: `string`（格式 `Hello, <name>`）
  - `status`: `'success' | 'cancelled'`  
- **生成规则**:
  - 仅当 `SessionInputName.isValid === true` 才生成 `success` 消息。
  - `cancelled` 状态不输出误导性成功文案。
