import type { PayeeExternalCall, CreatePayeePayload } from 'src/types/payee';

import { mockPayeeCalls, mockExternalPayees } from 'src/mocks/payees';

import { makeId, mockDelay, makeReference } from './mock-service-utils';

export async function getPayeeExternalCalls() {
  await mockDelay();
  return mockPayeeCalls;
}

export async function getExternalPayees() {
  await mockDelay();
  return mockExternalPayees;
}

export async function createPayeeExternalCall(
  payload: CreatePayeePayload
): Promise<PayeeExternalCall> {
  await mockDelay();

  return {
    id: makeId('payee-call'),
    ...payload,
    status: 'completed',
    referenceId: makeReference('PAYEE-EXT'),
    createdAt: new Date().toISOString(),
  };
}
