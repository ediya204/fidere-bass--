import type { KybRecord, SubmitKybPayload } from 'src/types/kyb';

import { mockKybRecords } from 'src/mocks/kyb';

import { makeId, mockDelay } from './mock-service-utils';

export async function getKybRecords() {
  await mockDelay();
  return mockKybRecords;
}

export async function submitKyb(payload: SubmitKybPayload): Promise<KybRecord> {
  await mockDelay();

  const now = new Date().toISOString();

  return {
    id: makeId('kyb'),
    entityId: payload.entityId,
    status: 'submitted',
    reviewer: 'Interlace Compliance',
    submittedAt: now,
    documents: payload.documentNames.map((name, index) => ({
      id: makeId('doc'),
      name,
      type: index === 0 ? 'company' : 'other',
      status: 'submitted',
      uploadedAt: now,
    })),
    supportingDocuments: [
      {
        id: makeId('support-doc'),
        type: 'PASSPORT_PHOTO',
        name: 'Passport Photo',
        required: true,
        status: 'Missing',
      },
      {
        id: makeId('support-doc'),
        type: 'SELFIE_LIVENESS',
        name: 'Selfie / Liveness',
        required: false,
        status: 'Missing',
      },
      {
        id: makeId('support-doc'),
        type: 'PROOF_OF_ADDRESS',
        name: 'Proof of Address',
        required: true,
        status: 'Missing',
      },
      {
        id: makeId('support-doc'),
        type: 'SOURCE_OF_WEALTH',
        name: 'Source of Wealth',
        required: true,
        status: 'Missing',
      },
    ],
    reviewItems: [
      { id: makeId('review'), category: 'BASIC_INFO', label: '基本信息', required: true, status: 'Pending' },
      { id: makeId('review'), category: 'PASSPORT', label: '护照信息', required: true, status: 'Pending' },
      { id: makeId('review'), category: 'PASSPORT_PHOTO', label: '护照照片', required: true, status: 'Pending' },
      { id: makeId('review'), category: 'LIVENESS', label: '活体认证', required: false, status: 'Pending' },
      { id: makeId('review'), category: 'PROOF_OF_ADDRESS', label: '地址证明', required: true, status: 'Pending' },
      { id: makeId('review'), category: 'SOURCE_OF_WEALTH', label: '资产来源证明', required: true, status: 'Pending' },
      { id: makeId('review'), category: 'RISK_REVIEW', label: '风控备注', required: false, status: 'Pending' },
    ],
    timeline: [
      { label: '提交 KYB', status: 'submitted', at: now },
      { label: '等待审核', status: 'pending', at: now, description: 'Webhook 将在真实接入后更新状态。' },
    ],
    apiLogs: [
      {
        id: makeId('api-log'),
        method: 'POST',
        endpoint: '/mock/kyb/submit',
        statusCode: 202,
        message: 'submit-kyb',
        at: now,
      },
    ],
  };
}
