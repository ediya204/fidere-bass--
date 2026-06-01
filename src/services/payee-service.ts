import type {
  PayeeExternalCall,
  CreatePayeePayload,
  EmailVerificationResult,
  EmailVerificationPurpose,
  CreateCryptoWhitelistPayload,
  UpdateCryptoWhitelistPayload,
} from 'src/types/payee';

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

export async function sendPayeeEmailVerificationCode(
  _purpose: EmailVerificationPurpose
): Promise<EmailVerificationResult> {
  await mockDelay(400);

  return {
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

export async function verifyPayeeEmailCode(code: string): Promise<void> {
  await mockDelay(400);

  if (code === '999999') {
    throw new Error('验证码已过期，请重新发送');
  }

  if (code !== '123456') {
    throw new Error('验证码错误，请检查后重试');
  }
}

export async function createCryptoWhitelistAddress(
  payload: CreateCryptoWhitelistPayload
): Promise<PayeeExternalCall> {
  await mockDelay();

  const now = new Date().toISOString();

  return {
    id: makeId('payee-call'),
    accountId: payload.accountId,
    type: 'crypto',
    name: payload.name,
    currency: 'USDT',
    destination: `${payload.network === 'TRC20' ? 'TRON' : 'ERC20'} ${payload.address}`,
    status: 'pending_sync',
    referenceId: makeReference('PAYEE-EXT'),
    createdAt: now,
    updatedAt: now,
    network: payload.network,
    address: payload.address,
    purpose: payload.purpose,
    createdBy: 'demo.operator@fidere.local',
    lastEmailVerifiedAt: now,
  };
}

export async function updateCryptoWhitelistAddress(
  payload: UpdateCryptoWhitelistPayload
): Promise<Pick<PayeeExternalCall, 'id' | 'name' | 'purpose' | 'updatedAt' | 'lastEmailVerifiedAt'>> {
  await mockDelay();

  const now = new Date().toISOString();

  return {
    id: payload.id,
    name: payload.name,
    purpose: payload.purpose,
    updatedAt: now,
    lastEmailVerifiedAt: now,
  };
}

export async function deleteCryptoWhitelistAddress(_id: string): Promise<void> {
  await mockDelay();
}

export async function retryCryptoWhitelistSync(id: string): Promise<Pick<PayeeExternalCall, 'id' | 'status' | 'updatedAt'>> {
  await mockDelay();

  return {
    id,
    status: 'pending_sync',
    updatedAt: new Date().toISOString(),
  };
}
