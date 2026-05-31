import type {
  Transaction,
  TransferPayload,
  PayoutTransaction,
  CreatePayoutPayload,
} from 'src/types/transaction';

import { makeId, mockDelay, makeReference } from './mock-service-utils';

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
