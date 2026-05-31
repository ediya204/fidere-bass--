import type { UsdtAddress } from 'src/types/usdt';

import { mockUsdtAddresses } from 'src/mocks/accounts';

import { makeId, mockDelay } from './mock-service-utils';

export async function getUSDTAddresses() {
  await mockDelay();
  return mockUsdtAddresses;
}

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
