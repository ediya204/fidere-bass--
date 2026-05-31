import type { ApiStatus } from './common';

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
