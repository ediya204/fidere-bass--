import type { Balance, ApiStatus } from './common';

export type AccountType = 'global' | 'virtual';

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

export type CreateAccountPayload = {
  entityId: string;
  name: string;
};
