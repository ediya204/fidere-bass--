import type { GlobalAccount, VirtualAccount, CreateAccountPayload } from 'src/types/account';

import { mockGlobalAccounts, mockVirtualAccounts } from 'src/mocks/accounts';

import { makeId, mockDelay } from './mock-service-utils';

/**
 * INTERLACE_API_MAPPING: getAccounts
 * Real API: Get Business Accounts (Global Accounts)
 * Endpoint: GET /business-accounts (预期)
 * Params: 可按 legalEntityId 过滤
 * Response: GlobalAccount[] <- Interlace business account list (含余额，见 types/account.ts)
 * Current: 返回 mockGlobalAccounts。
 * Next: 页面初始化、创建账户成功后刷新时调用。
 */
export async function getAccounts() {
  await mockDelay();
  return mockGlobalAccounts;
}

/**
 * INTERLACE_API_MAPPING: getVirtualAccounts
 * Real API: Get Virtual Accounts (list)
 * Endpoint: GET /virtual-accounts (预期，可按 businessAccountId 过滤)
 * Response: VirtualAccount[] <- Interlace VA list
 * Current: 返回 mockVirtualAccounts。
 */
export async function getVirtualAccounts() {
  await mockDelay();
  return mockVirtualAccounts;
}

/**
 * INTERLACE_API_MAPPING: createAccount
 * Real API: Create Business Account (Global Account)
 * Endpoint: POST /business-accounts (预期)
 * Params (CreateAccountPayload): entityId -> legalEntityId, name -> accountName
 * Precondition: 实体 status 必须为 approved/active。
 * Response: GlobalAccount <- accountId / status / 初始 balances 由 API 返回
 * Current: 直接构造对象；accountId (GA-XXXX) 与初始 USD 余额为 mock。
 */
export async function createAccount(payload: CreateAccountPayload): Promise<GlobalAccount> {
  await mockDelay();

  return {
    id: makeId('ga'),
    accountId: `GA-${Math.random().toString(16).slice(2, 6).toUpperCase()}-${new Date().getFullYear()}`,
    entityId: payload.entityId,
    name: payload.name,
    status: 'pending',
    createdAt: new Date().toISOString(),
    fiatBalances: [{ currency: 'USD', available: 0, pending: 0 }],
    cryptoBalances: [],
    cryptoEnabled: false,
  };
}

/**
 * INTERLACE_API_MAPPING: createVirtualAccount
 * Real API: Create Virtual Account
 * Endpoint: POST /virtual-accounts (预期)
 * Params: businessAccountId (<- GlobalAccount.id), entityId, currency
 * Precondition: 所属 Global Account 已创建/激活。
 * Response: VirtualAccount <- 银行下发的 bankName/accountNumber/routingNumber/swiftCode
 * Current: 直接构造对象；银行信息与账号为 mock，status 初始 'syncing' 模拟等待银行下发。
 * Note: demo 中每个 Global Account 默认关联一个 USD VA（由 context 一并创建）。
 */
export async function createVirtualAccount(account: GlobalAccount): Promise<VirtualAccount> {
  await mockDelay();

  return {
    id: makeId('va'),
    vaId: `VA-USD-${Math.floor(1000 + Math.random() * 9000)}`,
    globalAccountId: account.id,
    entityId: account.entityId,
    bankName: 'Interlace Partner Bank',
    bankAddress: '88 Queen Road Central, Hong Kong',
    accountName: account.name,
    accountNumber: `8800${Math.floor(100000000 + Math.random() * 900000000)}`,
    routingNumber: '021000021',
    swiftCode: 'ILACHKHH',
    currency: 'USD',
    status: 'syncing',
    balance: 0,
    createdAt: new Date().toISOString(),
  };
}
