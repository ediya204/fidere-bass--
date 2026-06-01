import type { PayeeRail, PayeeOwnershipType } from './payee';
import type { ApiStatus, CurrencyCode, TimelineEvent } from './common';

/**
 * INTERLACE_FIELD_MAP: TransactionType -> Interlace transaction type / channel
 * Docs: https://developer.interlace.money/docs/getting-started-with-baas
 * 'fiat_deposit'     -> 法币入金 (incoming fiat / VA credit)
 * 'fiat_withdraw'    -> 法币出金 (payout via external payee)
 * 'crypto_deposit'   -> 链上入金 (on-chain credit)
 * 'crypto_withdraw'  -> 链上出金 (on-chain payout)
 * 'otc_buy'/'otc_sell' -> OTC 兑换 (conversion)
 * 'internal_transfer'-> Intra-account / Different-account Business Transfer
 * 真实接入：Get Account Transactions 用 type 作为 query param 过滤。
 */
export type TransactionType =
  | 'fiat_deposit'
  | 'fiat_withdraw'
  | 'crypto_deposit'
  | 'crypto_withdraw'
  | 'otc_buy'
  | 'otc_sell'
  | 'internal_transfer';

/**
 * INTERLACE_FIELD_MAP: Transaction (Get Account Transactions 响应)
 * Local Transaction field   -> Interlace transaction field
 * --------------------------------------------------------------------------
 * Transaction.id            -> transaction.id
 * Transaction.referenceId   -> transaction.referenceId (业务流水号)
 * Transaction.accountId     -> transaction.accountId (查询过滤条件)
 * Transaction.entityId      -> transaction.legalEntityId
 * Transaction.type          -> transaction.type/channel (见 TransactionType 注释)
 * Transaction.amount/fee    -> transaction.amount / transaction.fee
 * Transaction.currency      -> transaction.currency
 * Transaction.status        -> transaction.status (pending/processing/completed/failed/reversed)
 * Transaction.source        -> transaction.source (付款方/来源账户)
 * Transaction.destination   -> transaction.destination (收款方/目标地址)
 * Transaction.exchangeRate  -> transaction.fxRate (OTC/换汇时)
 * Transaction.errorReason   -> transaction.failureReason
 * Transaction.timeline      -> transaction.statusHistory / events (真实接入靠 Webhook 推进)
 */
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

/**
 * INTERLACE_FIELD_MAP: TransferPayload -> Business Transfer request
 *   (Intra-account: 同一实体名下账户互转 / Different-account: 同一 Master 下不同 Business Account 互转)
 * accountId   -> sourceAccountId (出款账户)
 * amount      -> amount
 * currency    -> currency
 * payeeName   -> 展示用收款方名称
 * destination -> destinationAccountId / payee 标识
 * 当前 demo：无独立 internalTransfer service，复用 fiatWithdraw / createFiatPayout（见 fiat-service.ts）。
 * 真实接入需区分 intra vs different-account 端点，并在 UI 提示转账类型。
 */
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
