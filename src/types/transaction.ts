import type { PayeeRail, PayeeOwnershipType } from './payee';
import type { ApiStatus, CurrencyCode, TimelineEvent } from './common';

export type TransactionType =
  | 'fiat_deposit'
  | 'fiat_withdraw'
  | 'crypto_deposit'
  | 'crypto_withdraw'
  | 'otc_buy'
  | 'otc_sell'
  | 'internal_transfer';

export type Transaction = {
  id: string;
  referenceId: string;
  accountId: string;
  entityId: string;
  type: TransactionType;
  amount: number;
  fee: number;
  currency: CurrencyCode;
  status: ApiStatus;
  source: string;
  destination: string;
  exchangeRate?: number;
  errorReason?: string;
  createdAt: string;
  timeline: TimelineEvent[];
};

export type TransferPayload = {
  accountId: string;
  amount: number;
  currency: CurrencyCode;
  payeeName: string;
  destination: string;
};

export type ApiCallLog = {
  id: string;
  method: 'GET' | 'POST' | 'PATCH';
  endpoint: string;
  statusCode: number;
  message: string;
  at: string;
};

export type PayoutTransaction = {
  id: string;
  referenceId: string;
  senderId: string;
  senderName: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  payeeType: PayeeOwnershipType;
  receivingAccountId: string;
  bankName: string;
  accountNumber: string;
  rail: PayeeRail;
  currency: CurrencyCode;
  amount: number;
  fee: number;
  payeeGets: number;
  purpose: string;
  memo?: string;
  status: ApiStatus;
  createdAt: string;
  updatedAt?: string;
  estimatedArrival: string;
  timeline: TimelineEvent[];
  apiLogs: ApiCallLog[];
};

export type CreatePayoutPayload = {
  senderId: string;
  senderName: string;
  payerName: string;
  payeeId: string;
  payeeName: string;
  payeeType: PayeeOwnershipType;
  receivingAccountId: string;
  bankName: string;
  accountNumber: string;
  rail: PayeeRail;
  currency: CurrencyCode;
  amount: number;
  fee: number;
  payeeGets: number;
  purpose: string;
  memo?: string;
  estimatedArrival: string;
};
