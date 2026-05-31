import type { ApiCallLog } from './transaction';
import type { ApiStatus, CurrencyCode, TimelineEvent } from './common';

export type OTCType = 'buy' | 'sell';

export type OtcQuoteStatus = 'Active' | 'Expired';

export type OtcTransactionStatus = Extract<
  ApiStatus,
  'pending' | 'processing' | 'completed' | 'failed' | 'expired'
>;

export type OtcQuote = {
  id: string;
  quoteId: string;
  accountId: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  rate: number;
  inverseRate?: number;
  fee: number;
  expiresAt: string;
  estimatedSettlement: string;
  status: OtcQuoteStatus;
};

export type OtcTransaction = {
  id: string;
  referenceId: string;
  accountId: string;
  accountName: string;
  type: OTCType;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  rate: number;
  inverseRate?: number;
  fee: number;
  quoteId: string;
  quoteExpiresAt: string;
  estimatedSettlement: string;
  status: OtcTransactionStatus;
  createdAt: string;
  updatedAt?: string;
  timeline: TimelineEvent[];
  apiLogs: ApiCallLog[];
};

export type OtcTrade = OtcTransaction;

export type OtcTradePayload = {
  accountId: string;
  accountName: string;
  type: OTCType;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  toAmount: number;
  rate: number;
  inverseRate?: number;
  fee: number;
  quoteId: string;
  quoteExpiresAt: string;
  estimatedSettlement: string;
};

export type OtcQuotePayload = {
  accountId: string;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
};
