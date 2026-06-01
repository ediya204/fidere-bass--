import type { Transaction, TransferPayload } from 'src/types/transaction';

import { makeId, mockDelay, makeReference } from './mock-service-utils';

/**
 * INTERLACE_API_MAPPING: cryptoWithdraw
 * Real API: Crypto Payout (链上出金到白名单地址)
 * Endpoint: POST /crypto/payouts (预期)
 * Params (TransferPayload + entityId): accountId -> sourceAccountId, amount, currency (USDT),
 *   destination -> 白名单链上地址 (TRC20/ERC20)。
 * Precondition: 目标地址必须是已完成同步的白名单 (见 crypto-whitelist + payee-service)。
 * Response: Transaction <- 链上出金流水，status 初始 'processing'
 * Current: 直接构造 Transaction；出金前需邮箱验证（敏感操作），由 CryptoView 处理。
 */
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
