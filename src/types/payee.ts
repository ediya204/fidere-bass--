import type { ApiStatus, CurrencyCode } from './common';

export type PayeeType = 'fiat' | 'crypto';
export type PayeeOwnershipType = 'SELF_OWNED' | 'THIRD_PARTY';
export type PayeeRail = 'RTGS' | 'SWIFT' | 'ACH' | 'FPS';
export type CryptoNetwork = 'TRC20' | 'ERC20';
export type SensitiveWhitelistOperation =
  | 'create'
  | 'update'
  | 'delete'
  | 'withdraw'
  | 'retry_sync'
  | 'enable'
  | 'disable';

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
  network?: CryptoNetwork;
  address?: string;
  purpose?: string;
  updatedAt?: string;
  createdBy?: string;
  lastEmailVerifiedAt?: string;
  lastSyncedAt?: string;
};

export type CreatePayeePayload = {
  accountId: string;
  type: PayeeType;
  name: string;
  currency: CurrencyCode;
  destination: string;
};

export type CreateCryptoWhitelistPayload = {
  accountId: string;
  network: CryptoNetwork;
  name: string;
  address: string;
  purpose?: string;
};

export type UpdateCryptoWhitelistPayload = {
  id: string;
  name: string;
  purpose?: string;
};

export type EmailVerificationPurpose = {
  operation: SensitiveWhitelistOperation;
  targetId?: string;
};

export type EmailVerificationResult = {
  expiresAt: string;
};
