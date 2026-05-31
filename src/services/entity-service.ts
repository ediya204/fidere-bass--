import type { Entity, CreateEntityPayload } from 'src/types/entity';

import { mockEntities } from 'src/mocks/entities';

import { makeId, mockDelay } from './mock-service-utils';

export async function getEntities() {
  await mockDelay();
  return mockEntities;
}

export async function getEntityById(id: string) {
  await mockDelay();
  return mockEntities.find((entity) => entity.id === id) ?? null;
}

export async function createEntity(payload: CreateEntityPayload): Promise<Entity> {
  await mockDelay();

  const now = new Date().toISOString();

  return {
    id: makeId('ent'),
    entityId: `LE-${now.slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
    ...payload,
    status: 'draft',
    kybStatus: 'draft',
    createdAt: now,
    updatedAt: now,
    ownerName: payload.type === 'company' ? '待补充联系人' : payload.name,
    industry: '待补充',
    riskLevel: 'low',
  };
}
