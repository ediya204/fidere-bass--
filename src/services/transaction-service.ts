import type { Transaction } from 'src/types/transaction';

import { mockTransactions } from 'src/mocks/transactions';

import { mockDelay } from './mock-service-utils';

export async function getTransactions() {
  await mockDelay();
  return mockTransactions;
}

export async function getTransactionById(id: string): Promise<Transaction | null> {
  await mockDelay();
  return mockTransactions.find((transaction) => transaction.id === id) ?? null;
}
