# 虚拟账户

## 页面字段
- 列表页：VA ID、账号、币种、余额、银行、状态。
- 详情页：银行地址、账户名、Routing Number、SWIFT、所属实体、Global Account、交易记录。

## Mock 数据结构
- `VirtualAccount` 来自 `src/mocks/accounts.ts`。
- 交易记录通过 `Transaction.source` 与 VA ID 匹配。

## 组件调用方式
- `DataTable` 列表行点击进入 `/dashboard/baas/virtual-accounts/[id]`。
- `InfoSection` 在详情页展示银行账户信息。

## 操作逻辑
- 列表页只读；创建入口在 Global Account 详情页。

## 状态流程
- `syncing` 表示银行账户信息仍在同步。
- `active` 表示可收款。
