# BaaS Demo 完成报告

## 新增文件
- 类型：`src/types/entity.ts`、`account.ts`、`kyb.ts`、`usdt.ts`、`payee.ts`、`transaction.ts`、`otc.ts`、`baas.ts`。
- Mock：`src/mocks/entities.ts`、`kyb.ts`、`accounts.ts`、`payees.ts`、`fiat.ts`、`crypto.ts`、`otc.ts`、`transactions.ts`。
- Service：`src/services/*-service.ts`。
- 状态：`src/contexts/baas-demo-context.tsx`。
- 组件：`src/components/common/*`。
- 页面：`src/app/dashboard/baas/**/page.tsx`、`src/sections/*/view/*`。

## 修改文件
- `src/routes/paths.ts` 新增 BaaS 路由。
- `src/layouts/nav-config-dashboard.tsx` 新增 BaaS Demo 菜单。
- `src/global-config.ts` 开启 Demo 免登录。
- `src/types/common.ts` 保留模板公共类型并扩展 BaaS 公共类型。
- `src/sections/fiat/view/fiat-view.tsx` 重构为三步式 Create Payout 流程。
- `src/types/payee.ts`、`src/types/transaction.ts` 扩展外部 Payee、收款账户和 Payout 交易模型。
- `src/mocks/payees.ts`、`src/mocks/transactions.ts` 增加 Payee 选择数据与 Payout 历史。
- `src/services/payee-service.ts`、`src/services/fiat-service.ts` 增加外部 Payee 查询和创建 Payout mock service。
- `src/contexts/baas-demo-context.tsx` 增加 `externalPayees`、`payoutTransactions`、`createFiatPayout` 和 `advancePayoutStatus`。

## 已实现功能
- 创建实体、提交 KYB、Demo 审核通过。
- 创建 Global Account、创建 VA。
- 在 Global Account 详情页中创建/查看 USDT 地址。
- 法币操作已改为 Recipient Details、Payout Details、Review Payout 三步式创建流程，并模拟外部 Payee 选择、收款账户选择、费用计算、确认提交、详情查看和状态推进。
- 数字货币出金，并模拟外部 Payee 调用。
- 指定账户 OTC 买卖。
- 交易流水查询和详情 Timeline。

## 页面路径
- `/dashboard/baas`
- `/dashboard/baas/entities`
- `/dashboard/baas/accounts`
- `/dashboard/baas/accounts/[id]`
- `/dashboard/baas/virtual-accounts`
- `/dashboard/baas/virtual-accounts/[id]`
- `/dashboard/baas/fiat`
- `/dashboard/baas/crypto`
- `/dashboard/baas/otc`
- `/dashboard/baas/transactions`

## Mock 数据说明
- 所有数据从 `src/mocks/` 初始化，经 `src/services/` 以 Promise 形式返回。
- 前端运行时状态统一存放在 `BaasDemoProvider`。
- 刷新页面会回到初始 mock 数据。
- 法币 Payout 使用 `ExternalPayee`、`PayeeReceivingAccount`、`PayoutTransaction` 独立描述创建流程，同时会同步生成通用 `Transaction`，便于交易流水页复用。
- Payout 状态推进为前端模拟：`pending -> processing -> completed -> failed -> pending`。

## 已知限制
- 不接真实 API。
- 不实现真实文件上传、webhook、认证、余额清结算。
- Payee 是外部调用模拟，不提供独立后台管理页面。
- USDT 地址只属于 Global Account 详情页。

## 后续真实 API 建议
- 保持页面和 Context 调用不变，逐步替换 `src/services/`。
- 将状态推进改为 webhook 或轮询更新。
- 引入真实表单校验、上传、错误码映射和审计日志。
