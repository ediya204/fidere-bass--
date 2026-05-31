# 数字货币操作

## 页面字段
- 表单：账户、币种、金额、外部 Payee、目标地址。
- 历史：Reference ID、类型、金额、目标地址、状态、创建时间。

## Mock 数据结构
- `GlobalAccount.cryptoEnabled` 决定账户是否可用于数字货币出金。
- `PayeeExternalCall` 记录外部 crypto payee 调用。
- `Transaction` 记录链上出金。

## 组件调用方式
- `ActionBar` 承载表单。
- `ConfirmDialog` 二次确认。
- `DataTable` 展示交易和外部调用。

## 操作逻辑
- 仅显示已在账户详情创建过 USDT 地址的 Global Account。
- 确认后先模拟外部 Payee 调用，再生成 `crypto_withdraw`。

## 状态流程
- 新数字货币出金为 `processing`。
- Mock 数据包含 KYT 失败样例。
