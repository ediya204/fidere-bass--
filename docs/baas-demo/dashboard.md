# BaaS 中台总览

## 页面字段
- 统计：实体总数、账户总数、待审核 KYB、今日交易金额、异常状态。
- 列表：最近交易、最近新增实体。

## Mock 数据结构
- `Entity[]` 来自 `src/mocks/entities.ts`。
- `GlobalAccount[]` 来自 `src/mocks/accounts.ts`。
- `Transaction[]` 来自 `src/mocks/transactions.ts`。

## 组件调用方式
- `StatCard` 展示核心指标。
- `DataTable` 展示最近交易和实体。
- `StatusChip` 统一状态颜色和中文标签。

## 操作逻辑
- 首页只读，通过 `useBaasDemo()` 聚合 Context 中的 mock 状态。

## 状态流程
- 异常状态统计覆盖 `failed`、`rejected`、`suspended`。
