# Interlace BaaS API 映射总表

> 本文件汇总 fidere-baas-demo 各页面未来接入 Interlace BaaS API 的映射关系。
> 配合代码内注释使用，可全局搜索以下标记定位：
> - `PAGE_API_MAP`（页面/视图顶部）
> - `INTERLACE_API_TODO`（关键 handler 附近）
> - `INTERLACE_API_MAPPING`（service 函数）
> - `INTERLACE_FIELD_MAP`（type 定义）
>
> 官方文档：https://developer.interlace.money/docs/getting-started-with-baas
> 当前所有 service 均为 **mock 实现**，无真实 Interlace 请求、无真实密钥。

---

## 一、页面 → Interlace API 映射

| 页面 / 视图 | 路径 | 关联 Interlace API | 触发时机 |
|---|---|---|---|
| 开户向导 | `app/accopen/page.tsx` | Create Legal Entity、Update Legal Entity | 提交开户资料 |
| BaaS 总览 | `sections/baas-dashboard/view/baas-dashboard-view.tsx` | Get Legal Entity、Get Business Accounts、Get Account Transactions | 页面初始化 |
| 实体与 KYB | `sections/entities/view/entities-view.tsx` | Get / Create / Update Legal Entity | 列表加载、创建、提交 KYB |
| 实体详情弹窗 | `sections/entities/entity-detail-dialog.tsx` | Get / Update Legal Entity、Create Business Account | 详情查看、KYB 审核、开户 |
| 全球账户列表 | `sections/accounts/view/accounts-view.tsx` | Get Business Accounts、Create Business Account | 列表加载、创建账户 |
| 全球账户详情 | `sections/accounts/view/account-details-view.tsx` | Get Business Accounts、Get Account Balance、Get Virtual Accounts、Get Account Transactions、Create Crypto Deposit Address | 页面初始化、创建 USDT 地址 |
| 虚拟账户列表 | `sections/virtual-accounts/view/virtual-accounts-view.tsx` | Get Virtual Accounts | 列表加载 |
| 虚拟账户详情 | `sections/virtual-accounts/view/virtual-account-details-view.tsx` | Get Virtual Accounts、Get Account Transactions | 页面初始化 |
| 交易流水 | `sections/transactions/view/transactions-view.tsx` | Get Account Transactions | 列表加载、筛选 |
| 法币出金 | `sections/fiat/view/fiat-view.tsx` | Get Business Accounts、Get Payees、Create Payee、Create Payout、Different-account Business Transfer | 提交出金 |
| 出金向导布局 | `sections/fiat/payout-wizard-layout.tsx` | Create Payout、Intra-/Different-account Business Transfer | 向导各步骤 |
| 数字货币出金 | `sections/crypto/view/crypto-view.tsx` | Get Business Accounts、Get Payees、Crypto Payout（+ 邮箱验证） | 提交出金 |
| 数字货币白名单 | `sections/crypto-whitelist/view/crypto-whitelist-view.tsx` | Create / Update / Delete Crypto Whitelist、Retry Sync（+ 邮箱验证） | 白名单维护 |
| OTC | `sections/otc/view/otc-view.tsx` | OTC Quote、OTC Conversion、Get Account Transactions | 提交兑换 |

---

## 二、字段映射要点

### Create / Get / Update Legal Entity ↔ `types/entity.ts`

| 本地字段 | Interlace 字段 | 备注 |
|---|---|---|
| `Entity.id` | `entity.id` | 内部主键 |
| `Entity.entityId` | `entity.entityId` | 业务标识，当前 mock 自造 `LE-XXXX-XXXX` |
| `Entity.name` | `entity.entityName` | |
| `Entity.type` | `entity.personType` | `individual→INDIVIDUAL`，`company→COMPANY` |
| `Entity.country` | `entity.jurisdiction` | |
| `Entity.email` / `Entity.phone` | `entity.contactInfo.email` / `.phone` | |
| `Entity.ownerName` | `entity.legalRepresentative` | 当前由 service 生成 |
| `Entity.status` | `entity.status` | 实体生命周期 |
| `Entity.kybStatus` | `entity.complianceStatus` | KYB/合规状态 |
| `Entity.riskLevel` | `entity.riskRating` | |

### Get Business Accounts / Get Account Balance ↔ `types/account.ts` + `types/common.ts`

| 本地字段 | Interlace 字段 | 备注 |
|---|---|---|
| `GlobalAccount.accountId` | `account.accountId` | 当前 mock `GA-XXXX` |
| `GlobalAccount.entityId` | `account.legalEntityId` | |
| `GlobalAccount.status` | `account.status` | |
| `GlobalAccount.fiatBalances` / `cryptoBalances` | Get Account Balance 响应 | 真实 API 可能是独立端点 |
| `GlobalAccount.cryptoEnabled` | `account.capabilities.crypto` | |
| `Balance.available` / `pending` | `balance.available` / `pending` | Interlace 可能另含 `ledger/total` |

### Create Virtual Account ↔ `types/account.ts`

| 本地字段 | Interlace 字段 |
|---|---|
| `VirtualAccount.vaId` | `virtualAccount.vaId` |
| `VirtualAccount.globalAccountId` | `virtualAccount.businessAccountId` |
| `VirtualAccount.bankName` / `accountNumber` / `routingNumber` / `swiftCode` | 银行下发字段 |
| `VirtualAccount.status` | `virtualAccount.status`（`syncing`=等待银行下发） |

### Get Account Transactions ↔ `types/transaction.ts`

| 本地字段 | Interlace 字段 | 备注 |
|---|---|---|
| `Transaction.referenceId` | `transaction.referenceId` | |
| `Transaction.accountId` | `transaction.accountId` | 查询过滤条件 |
| `Transaction.type` | `transaction.type/channel` | 见枚举映射 |
| `Transaction.amount` / `fee` / `currency` | 同名 | |
| `Transaction.status` | `transaction.status` | |
| `Transaction.exchangeRate` | `transaction.fxRate` | |
| `Transaction.errorReason` | `transaction.failureReason` | |

**TransactionType 枚举：** `fiat_deposit / fiat_withdraw / crypto_deposit / crypto_withdraw / otc_buy / otc_sell / internal_transfer`

### Business Transfer ↔ `TransferPayload`

| 本地字段 | Interlace 字段 |
|---|---|
| `accountId` | `sourceAccountId` |
| `destination` | `destinationAccountId` / payee |
| `amount` / `currency` | 同名 |

- **Intra-account**：同一实体名下账户互转。
- **Different-account**：同一 Master 下不同 Business Account 互转（Master↔Sub / Sub↔Sub）。
- 当前 demo 未单独区分，复用 `fiat-service.ts` 的 `fiatWithdraw` / `createFiatPayout`。

---

## 三、Service ↔ API 对照（当前均为 mock）

| Service 函数 | 文件 | 对应 Interlace API |
|---|---|---|
| `getEntities` / `getEntityById` | `services/entity-service.ts` | Get Legal Entity |
| `createEntity` | `services/entity-service.ts` | Create Legal Entity |
| `getKybRecords` | `services/kyb-service.ts` | Get Legal Entity (compliance) |
| `submitKyb` | `services/kyb-service.ts` | Update Legal Entity |
| `getAccounts` | `services/account-service.ts` | Get Business Accounts |
| `getVirtualAccounts` | `services/account-service.ts` | Get Virtual Accounts |
| `createAccount` | `services/account-service.ts` | Create Business Account |
| `createVirtualAccount` | `services/account-service.ts` | Create Virtual Account |
| `getTransactions` / `getTransactionById` | `services/transaction-service.ts` | Get Account Transactions |
| `fiatWithdraw` / `createFiatPayout` | `services/fiat-service.ts` | Create Payee + Create Payout |
| `cryptoWithdraw` | `services/crypto-service.ts` | Crypto Payout |
| `otcTrade` / `createMockOtcQuote` | `services/otc-service.ts` | OTC Quote + OTC Conversion |
| `getUSDTAddresses` / `createUSDTAddress` | `services/usdt-service.ts` | Get / Create Crypto Deposit Address |
| Payee / Whitelist 系列 | `services/payee-service.ts` | Create/Update/Delete Payee & Crypto Whitelist + 邮箱验证 |

> 全局聚合点：`contexts/baas-demo-context.tsx`（`useBaasDemo()`）。
> 真实接入时只需把上述 service 替换为 Interlace adapter，context handler 签名基本不变。

---

## 四、建议接入顺序（先读后写、资金类最后）

1. **Get Legal Entity** — 查询类，风险最低
2. **Get Business Accounts**
3. **Get Account Balance**
4. **Get Account Transactions**
5. **Create Legal Entity** — 创建类
6. **Update Legal Entity / KYB 提交**
7. **Create Virtual Account**
8. **Intra-account Business Transfer** — 资金类
9. **Different-account Business Transfer**

---

## 五、Mock 与真实接入的关键差异（待处理）

- **状态推进**：Demo 用按钮 / `setTimeout` 模拟（账户激活、Payout/OTC 状态、白名单同步）。真实环境应改为 **Webhook 驱动**的状态机。
- **文件上传**：KYB `submitKyb` 仅传文件名占位，无真实上传。真实接入需先调用文件上传端点取得 `documentId/fileUrl`。
- **自造标识**：`entityId (LE-...)`、`accountId (GA-...)`、`vaId (VA-...)`、`referenceId` 等当前在 service 内生成，真实接入须改用 API 返回值。
- **余额结构**：余额内嵌在账户对象中，真实环境可能需要独立调用 Get Account Balance。
- **邮箱验证**：验证码固定 `123456`（`000000`=错误，`999999`=过期），仅供 Demo。
- **密钥/凭证**：当前代码不含任何真实 key/secret/token/商户号，接入时通过环境变量注入，禁止写死。
