import type { UsdtAddress } from 'src/types/usdt';

import { mockUsdtAddresses } from 'src/mocks/accounts';

import { makeId, mockDelay } from './mock-service-utils';

/**
 * INTERLACE_API_MAPPING: getUSDTAddresses
 * Real API: Get Crypto Deposit Addresses
 * Endpoint: GET /business-accounts/{accountId}/crypto-addresses (预期)
 * Response: UsdtAddress[] <- 账户的链上收款地址
 * Current: 返回 mockUsdtAddresses。
 */
export async function getUSDTAddresses() {
  await mockDelay();
  return mockUsdtAddresses;
}

/**
 * INTERLACE_API_MAPPING: createUSDTAddress
 * Real API: Create Crypto Deposit Address (开通账户数字货币能力 + 生成收款地址)
 * Endpoint: POST /business-accounts/{accountId}/crypto-addresses (预期)
 * Params: accountId -> businessAccountId
 * Response: UsdtAddress <- chain/address；成功后账户 cryptoEnabled=true（context 中处理）。
 * Current: 直接构造 TRON 地址，address 为随机 mock。
 */
export async function createUSDTAddress(accountId: string): Promise<UsdtAddress> {
  await mockDelay();

  return {
    id: makeId('usdt'),
    accountId,
    chain: 'TRON',
    address: `T${Math.random().toString(36).slice(2, 12)}${Math.random()
      .toString(36)
      .slice(2, 24)}`.padEnd(34, 'x'),
    status: 'active',
    createdAt: new Date().toISOString(),
  };
}
