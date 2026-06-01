# 全球账户

## 页面字段

- 列表页：Global Account ID、账户名称、所属实体、状态、数字货币能力、创建时间。
- 详情页：法币余额、数字货币余额、默认 VA 账户、USDT 地址、最近交易。

## Mock 数据结构

- `GlobalAccount` 保存账户、余额和 `cryptoEnabled`。
- `UsdtAddress` 严格归属于 Global Account。
- `VirtualAccount` 通过 `globalAccountId` 关联。

## 组件调用方式

- `ActionBar` 创建 Global Account。
- `DataTable` 列表行点击进入 `/dashboard/baas/accounts/[id]`。
- `InfoSection` 在详情页展示余额、USDT 地址和账户属性。

## 操作逻辑

- 仅 Active 实体可创建 Global Account。
- VA 随 Global Account 默认生成，每个 Global Account 仅保留一个默认 VA。
- USDT 地址在 Global Account 详情页中创建/查看，不提供独立路由或抽屉。

## 状态流程

- 新建账户为 `pending`。
- 创建 USDT 地址后设置 `cryptoEnabled = true` 并追加 USDT 余额行。
