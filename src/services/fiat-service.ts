import type {
  Transaction,
  TransferPayload,
  PayoutTransaction,
  CreatePayoutPayload,
} from 'src/types/transaction';

import { makeId, mockDelay, makeReference } from './mock-service-utils';

/**
 * INTERLACE_API_MAPPING: fiatWithdraw
 * Real API: 法币出金 = Create Payee (external) + Payout，或 Different-account Business Transfer
 * Endpoint: POST /payouts 或 POST /transfers (预期)
 * Params (TransferPayload + entityId): accountId -> sourceAccountId, amount, currency,
 *   payeeName/destination -> 收款方信息。
 * Response: Transaction <- 出金流水，status 初始 'pending'
 * Current: 直接构造 Transaction；context 在调用前先 mock 创建外部 Payee（见 baas-demo-context handleFiatWithdraw）。
 */
export async function fiatWithdraw(
  payload: TransferPayload,
  entityId: string
): Promise<Transaction> {
  await mockDelay();

  const now = new Date().toISOString();

  return {
    id: makeId('txn'),
    referenceId: makeReference('FW'),
    accountId: payload.accountId,
    entityId,
    type: 'fiat_withdraw',
    amount: payload.amount,
    fee: Math.max(5, payload.amount * 0.001),
    currency: payload.currency,
    status: 'pending',
    source: payload.accountId,
    destination: payload.payeeName,
    createdAt: now,
    timeline: [
      { label: '创建外部 Payee', status: 'completed', at: now },
      { label: '提交法币出金', status: 'pending', at: now },
    ],
  };
}

/**
 * INTERLACE_API_MAPPING: createFiatPayout
 * Real API: Create Payout (法币出金，带完整收款方/通道信息)
 * Endpoint: POST /payouts (预期)
 * Params (CreatePayoutPayload): senderId -> sourceAccountId, payeeId/payeeName/rail/bankName/
 *   accountNumber -> 收款方, amount/fee/payeeGets/currency -> 金额, purpose/memo -> 备注。
 * Response: PayoutTransaction <- referenceId、status、estimatedArrival、apiLogs
 * Current: 直接构造 PayoutTransaction，apiLogs 为 mock。status 推进由 context.advancePayoutStatus 模拟。
 */
export async function createFiatPayout(payload: CreatePayoutPayload): Promise<PayoutTransaction> {
  await mockDelay(350);

  const now = new Date().toISOString();
  const referenceId = makeReference('FW');

  return {
    id: makeId('payout'),
    referenceId,
    ...payload,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    timeline: [
      { label: '创建 Payout 草稿', status: 'draft', at: now },
      { label: '提交 Payout', status: 'pending', at: now },
    ],
    apiLogs: [
      {
        id: makeId('api-log'),
        method: 'GET',
        endpoint: `/mock/payees/${payload.payeeId}/accounts`,
        statusCode: 200,
        message: 'Loaded receiving accounts',
        at: now,
      },
      {
        id: makeId('api-log'),
        method: 'POST',
        endpoint: '/mock/fiat/payouts',
        statusCode: 202,
        message: 'Payout accepted',
        at: now,
      },
    ],
  };
}
