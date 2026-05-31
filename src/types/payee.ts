import type { ApiStatus, CurrencyCode } from './common';

export type PayeeType = 'fiat' | 'crypto';
export type PayeeOwnershipType = 'SELF_OWNED' | 'THIRD_PARTY';
export type PayeeRail = 'RTGS' | 'SWIFT' | 'ACH' | 'FPS';

export type PayeeReceivingAccount = {
  id: string;
  currency: CurrencyCode;
  rail: PayeeRail;
  bankName: string;
  accountNumber: string;
  accountLast4?: string;
  country?: string;
  status: ApiStatus;
};

export type ExternalPayee = {
  id: string;
  referenceId: string;
  name: string;
  type: PayeeOwnershipType;
  status: ApiStatus;
  availableQuota?: number;
  quotaCurrency?: CurrencyCode;
  accounts: PayeeReceivingAccount[];
};

export type PayeeExternalCall = {
  id: string;
  accountId: string;
  type: PayeeType;
  name: string;
  currency: CurrencyCode;
  destination: string;
  status: ApiStatus;
  referenceId: string;
  createdAt: string;
};

export type CreatePayeePayload = {
  accountId: string;
  type: PayeeType;
  name: string;
  currency: CurrencyCode;
  destination: string;
};
