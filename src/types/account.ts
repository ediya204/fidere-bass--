import type { Balance, ApiStatus } from './common';

export type AccountType = 'global' | 'virtual';

/**
 * INTERLACE_FIELD_MAP: GlobalAccount (Get Business Accounts / Get Account Balance)
 * Docs: https://developer.interlace.money/docs/getting-started-with-baas
 * Local GlobalAccount field    -> Interlace Business Account field
 * --------------------------------------------------------------------------
 * GlobalAccount.id             -> account.id              (内部主键)
 * GlobalAccount.accountId      -> account.accountId       (业务账户号，GA-XXXX 当前 mock 自造)
 * GlobalAccount.entityId       -> account.legalEntityId   (归属实体)
 * GlobalAccount.name           -> account.accountName / alias
 * GlobalAccount.status         -> account.status          (见 ApiStatus)
 * GlobalAccount.fiatBalances   -> Get Account Balance 响应 (Balance[]，真实 API 可能是独立端点)
 * GlobalAccount.cryptoBalances -> Get Account Balance 响应 (数字货币余额)
 * GlobalAccount.cryptoEnabled  -> account.capabilities.crypto / cryptoEnabled
 * GlobalAccount.usdtAddressId  -> 关联的链上收款地址 ID（创建 USDT 地址后回填）
 * Note: 当前 demo 把余额内嵌在账户对象中；真实接入时余额可能需要单独调用 Get Account Balance。
 */
export type GlobalAccount = {
  id: string;
  accountId: string;
  entityId: string;
  name: string;
  status: ApiStatus;
  createdAt: string;
  fiatBalances: Balance[];
  cryptoBalances: Balance[];
  cryptoEnabled: boolean;
  usdtAddressId?: string;
};

/**
 * INTERLACE_FIELD_MAP: VirtualAccount (Create Virtual Account 响应)
 * Local VirtualAccount field    -> Interlace Virtual Account field
 * --------------------------------------------------------------------------
 * VirtualAccount.id             -> virtualAccount.id
 * VirtualAccount.vaId           -> virtualAccount.vaId / virtualAccountNumber
 * VirtualAccount.globalAccountId-> virtualAccount.businessAccountId (所属 Global Account)
 * VirtualAccount.entityId       -> virtualAccount.legalEntityId
 * VirtualAccount.bankName       -> virtualAccount.bankName
 * VirtualAccount.bankAddress    -> virtualAccount.bankAddress
 * VirtualAccount.accountName    -> virtualAccount.accountHolderName
 * VirtualAccount.accountNumber  -> virtualAccount.accountNumber
 * VirtualAccount.routingNumber  -> virtualAccount.routingNumber (ACH/本地清算)
 * VirtualAccount.swiftCode      -> virtualAccount.swiftCode (SWIFT/BIC)
 * VirtualAccount.currency       -> virtualAccount.currency
 * VirtualAccount.status         -> virtualAccount.status ('syncing' -> 等待银行下发账号)
 * VirtualAccount.balance        -> 可来自 Get Account Balance（VA 级别）
 */
export type VirtualAccount = {
  id: string;
  vaId: string;
  globalAccountId: string;
  entityId: string;
  bankName: string;
  bankAddress: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  currency: 'USD' | 'HKD' | 'EUR';
  status: ApiStatus;
  balance: number;
  createdAt: string;
};

/**
 * INTERLACE_FIELD_MAP: CreateAccountPayload -> Create Virtual Account / Create Business Account request
 * entityId -> legalEntityId (前置条件：实体 status 必须为 approved/active)
 * name     -> accountName / alias
 * 缺失字段（真实 Create Virtual Account 可能需要）：currency、productType。
 * 当前 demo：Global Account 与默认 VA 在 context 中一起创建（USD），见 account-service.ts。
 */
export type CreateAccountPayload = {
  entityId: string;
  name: string;
};
