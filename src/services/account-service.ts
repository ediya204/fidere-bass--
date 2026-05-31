import type { GlobalAccount, VirtualAccount, CreateAccountPayload } from 'src/types/account';

import { mockGlobalAccounts, mockVirtualAccounts } from 'src/mocks/accounts';

import { makeId, mockDelay } from './mock-service-utils';

export async function getAccounts() {
  await mockDelay();
  return mockGlobalAccounts;
}

export async function getVirtualAccounts() {
  await mockDelay();
  return mockVirtualAccounts;
}

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
