import type { Transaction, TransferPayload } from 'src/types/transaction';

import { makeId, mockDelay, makeReference } from './mock-service-utils';

export async function cryptoWithdraw(
  payload: TransferPayload,
  entityId: string
): Promise<Transaction> {
  await mockDelay();

  const now = new Date().toISOString();

  return {
    id: makeId('txn'),
    referenceId: makeReference('CW'),
    accountId: payload.accountId,
    entityId,
    type: 'crypto_withdraw',
    amount: payload.amount,
    fee: 2.5,
    currency: payload.currency,
    status: 'processing',
    source: payload.accountId,
    destination: payload.destination,
    createdAt: now,
    timeline: [
      { label: '创建外部 Payee', status: 'completed', at: now },
      { label: '提交链上出金', status: 'processing', at: now },
    ],
  };
}
