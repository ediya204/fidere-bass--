# 法币操作

## 页面字段
- 顶部统计：今日 Payout 金额、待处理 Payout、可用 Payee 数量、异常交易数量。
- Step 1 Recipient Details：Sender / Sub Merchant、merchant / account id、Counterparty / Payee、Payee 类型、quota、Payee 状态、Receiving Account、币种、rail、银行名称、银行账号、选中状态。
- Step 2 Payout Details：Account to Payout、Payer Name、Select Balance、You Send、Purpose、Memo、Fee、Estimated arrival、Payee Gets、balance after payout。
- Step 3 Review Payout：Sender、Payer name、Payee、Payee type、Receiving bank、Account number、Rail、You Send、Fee、Payee Gets、Currency、Purpose、Memo、Estimated arrival、Reference ID。
- 交易历史：Reference ID、Sender、Payee、Receiving Account、Rail、Currency、Amount、Fee、Payee Gets、Status、Created Time、Action。

## Mock 数据结构
- `ExternalPayee`：外部 Payee 选择数据，包含 `referenceId`、`type`、`status`、`availableQuota`、`quotaCurrency` 和多个 `PayeeReceivingAccount`。
- `PayeeReceivingAccount`：Payee 的收款账户，包含 `currency`、`rail`、`bankName`、`accountNumber`、`country`、`status`。
- `CreatePayoutPayload`：三步表单确认后提交到 service 的 payload。
- `PayoutTransaction`：法币 Payout 交易记录，包含金额拆分、收款账户、状态、timeline、mock API logs。

## 组件调用方式
- `Stepper` 承载三步创建流程。
- `StatCard` 展示 Payout 统计。
- `StatusChip` 展示 Payee、Receiving Account、Payout 状态。
- `DataTable` 展示法币交易历史与详情中的 Mock API Logs。
- `DetailDrawer` 展示 Payout 详情。
- `InfoSection` 展示确认信息、Sender、Payee、Amount Breakdown。

## 操作逻辑
- Step 1 必须选择 Sender、Payee、Receiving Account 后才可点击 Next。
- 选择 Payee 后右侧 Receiving Account 列表按 Payee 联动，默认选中该 Payee 的第一条账户。
- Step 2 自动带入 Sender、Payer Name、Payee 和收款账户信息。
- You Send 输入后自动计算 `fee = max(amount * 0.001, 5)`、Payee Gets、balance after payout。
- 金额为空、为 0、超过余额，或 Purpose 未填写时，`Review payout` 禁用并展示字段错误。
- Step 3 确认后调用 `createFiatPayout`，生成 `FW-YYYYMMDD-XXXX` Reference ID，并写入 `payoutTransactions` 和通用 `transactions`。
- 成功后显示完成态，提供 New Payout 和 View Transaction。

## 状态流程
- Payout 创建后初始为 `pending`。
- 历史表格的 `Advance` 可模拟状态推进：`pending -> processing -> completed -> failed -> pending`。
- 详情 Drawer 的 Status Timeline 记录每次状态变化。
- Mock API Logs 记录 Payee 收款账户读取、Payout 创建和状态推进。
