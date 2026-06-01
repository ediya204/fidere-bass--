import type { Entity, CreateEntityPayload } from 'src/types/entity';

import { mockEntities } from 'src/mocks/entities';

import { makeId, mockDelay } from './mock-service-utils';

/**
 * INTERLACE_API_MAPPING: getEntities
 * Real API: Get Legal Entity (list)
 * Endpoint: GET /legal-entities (预期)
 * Params: 分页/筛选 (status, type...)
 * Response: Entity[] <- Interlace legal entity list (见 src/types/entity.ts 字段映射)
 * Current: 返回 mockEntities，无真实请求。
 * Next: 替换为 Interlace adapter；列表页 EntitiesView / Dashboard 初始化时调用。
 */
export async function getEntities() {
  await mockDelay();
  return mockEntities;
}

/**
 * INTERLACE_API_MAPPING: getEntityById
 * Real API: Get Legal Entity (single)
 * Endpoint: GET /legal-entities/{entityId} (预期)
 * Params: entityId (本地 Entity.id -> Interlace entityId)
 * Response: Entity | null <- Interlace legal entity
 * Current: 在 mockEntities 中按 id 查找。
 * Next: 用于详情回查、Webhook 后状态刷新（onboarding/compliance status）。
 */
export async function getEntityById(id: string) {
  await mockDelay();
  return mockEntities.find((entity) => entity.id === id) ?? null;
}

/**
 * INTERLACE_API_MAPPING: createEntity
 * Real API: Create Legal Entity
 * Endpoint: POST /legal-entities (预期)
 * Params (CreateEntityPayload -> request body):
 *   name -> entityName, type -> personType (INDIVIDUAL|COMPANY),
 *   country -> jurisdiction, email/phone -> contactInfo
 * Response: Entity <- 真实 API 返回的 entityId / status / complianceStatus 需回填
 * Current: 直接构造对象返回；entityId (LE-XXXX-XXXX)、ownerName、industry、riskLevel 均为 mock 占位。
 * Next: 真实接入后用 API 响应替换自造字段；status 初始应来自 API 而非硬编码 'draft'。
 */
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
