import type { ApiStatus } from './common';

/**
 * INTERLACE_FIELD_MAP: Entity (Create/Get/Update Legal Entity)
 * Docs: https://developer.interlace.money/docs/getting-started-with-baas
 * Local Entity field          -> Interlace Legal Entity field
 * --------------------------------------------------------------------------
 * Entity.id                    -> entity.id            (Interlace 内部主键/UUID)
 * Entity.entityId (LE-XXXX...) -> entity.entityId      (业务标识；当前 mock 自造，需替换为 API 返回值)
 * Entity.name                  -> entity.entityName
 * Entity.type                  -> entity.personType    ('individual' -> INDIVIDUAL, 'company' -> COMPANY)
 * Entity.country               -> entity.jurisdiction  (国家/地区代码)
 * Entity.email                 -> entity.contactInfo.email
 * Entity.phone                 -> entity.contactInfo.phone
 * Entity.ownerName             -> entity.legalRepresentative (公司：授权代表；个人：本人，当前由 service 生成)
 * Entity.industry              -> entity.industry      (当前 mock 占位 '待补充')
 * Entity.status                -> entity.status        (实体生命周期，见 EntityStatus 注释)
 * Entity.kybStatus             -> entity.complianceStatus (KYB/合规状态，见 ApiStatus)
 * Entity.riskLevel             -> entity.riskRating    (low/medium/high)
 * Entity.createdAt/updatedAt   -> entity.createdAt/updatedAt
 * Note: 真实接入时以 Get Legal Entity 响应回填本地 Entity；onboarding 状态变更靠 Webhook + 回查。
 */
export type EntityType = 'company' | 'individual';

export type EntityStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'failed'
  | 'suspended';

export type Entity = {
  id: string;
  entityId: string;
  name: string;
  type: EntityType;
  country: string;
  email: string;
  phone: string;
  status: EntityStatus;
  kybStatus: ApiStatus;
  createdAt: string;
  updatedAt: string;
  ownerName: string;
  industry: string;
  riskLevel: 'low' | 'medium' | 'high';
};

export type CreateEntityPayload = {
  name: string;
  type: EntityType;
  country: string;
  email: string;
  phone: string;
};

/**
 * INTERLACE_FIELD_MAP: CreateEntityPayload -> Create Legal Entity request body
 * name    -> entityName
 * type    -> personType (INDIVIDUAL | COMPANY)
 * country -> jurisdiction
 * email   -> contactInfo.email
 * phone   -> contactInfo.phone
 * 缺失字段（真实 API 可能必填，当前由 service 默认/占位生成）：
 *   - legalRepresentative / ownerName、industry、businessRegistrationNo（公司）。
 * 个人开户的完整 KYC 资料走 KYB 通道（见 src/types/kyb.ts 的 IndividualKybProfile）。
 */
