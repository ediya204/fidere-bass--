import type { Transaction } from 'src/types/transaction';

import { mockTransactions } from 'src/mocks/transactions';

import { mockDelay } from './mock-service-utils';

/**
 * INTERLACE_API_MAPPING: getTransactions
 * Real API: Get Account Transactions
 * Endpoint: GET /transactions (预期)
 * Params (query): accountId, type, status, 日期范围/分页
 *   -> 当前 TransactionsView 在前端按 accountId/type/status 过滤，真实接入改为 query params。
 * Response: Transaction[] <- Interlace transaction list (见 types/transaction.ts 字段映射)
 * Current: 返回 mockTransactions。
 */
export async function getTransactions() {
  await mockDelay();
  return mockTransactions;
}

/**
 * INTERLACE_API_MAPPING: getTransactionById
 * Real API: Get Account Transactions (single)
 * Endpoint: GET /transactions/{transactionId} (预期)
 * Response: Transaction | null
 * Current: 在 mockTransactions 中按 id 查找。
 *
 * INTERLACE_API_TODO: 资金类写操作（当前不在本 service 内）
 * - Intra-account / Different-account Business Transfer 暂复用 fiat-service.ts 的
 *   fiatWithdraw / createFiatPayout（见 TransferPayload 注释）。真实接入时建议在此 service
 *   新增 internalTransfer()，对应 Business Transfer 端点。
 */
export async function getTransactionById(id: string): Promise<Transaction | null> {
  await mockDelay();
  return mockTransactions.find((transaction) => transaction.id === id) ?? null;
}
