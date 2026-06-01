import type { ApiStatus, TimelineEvent } from './common';

/**
 * INTERLACE_FIELD_MAP: KYB / KYC types (Update Legal Entity + 合规补件)
 * Docs: https://developer.interlace.money/docs/getting-started-with-baas
 * - IndividualKybProfile     -> Update Legal Entity 的 individual KYC payload
 *     personType/firstName/lastName/dateOfBirth/nationality/countryOfResidence/
 *     email/phoneNumber/address -> Interlace 对应 KYC 字段
 * - PassportDocumentInfo      -> 证件信息 (documentType 仅允许 PASSPORT)
 * - KybSupportingDocument     -> 上传的合规文件 (PASSPORT_PHOTO/SELFIE_LIVENESS/PROOF_OF_ADDRESS/SOURCE_OF_WEALTH)
 *     真实接入需先上传文件拿到 fileUrl/documentId，再随 Update Legal Entity 提交（当前 mock 无真实上传）。
 * - KybRecord.status          -> entity.complianceStatus / kybStatus
 * - KybSupportingDocumentStatus (Missing/Pending Review/Approved/Rejected/Need Replacement)
 *     -> Interlace document review status
 * - SubmitKybPayload          -> 见底部注释
 */
export type IndividualKybProfile = {
  personType: 'INDIVIDUAL';
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  email: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
};

export type PassportDocumentInfo = {
  documentType: 'PASSPORT';
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  countryOfIssue: string;
  reviewerNote?: string;
};

export type KybSupportingDocumentType =
  | 'PASSPORT_PHOTO'
  | 'SELFIE_LIVENESS'
  | 'PROOF_OF_ADDRESS'
  | 'SOURCE_OF_WEALTH';

export type KybSupportingDocumentStatus =
  | 'Missing'
  | 'Pending Review'
  | 'Approved'
  | 'Rejected'
  | 'Need Replacement';

export type KybSupportingDocument = {
  id: string;
  type: KybSupportingDocumentType;
  name: string;
  fileUrl?: string;
  uploadedAt?: string;
  required: boolean;
  status: KybSupportingDocumentStatus;
  reviewerNote?: string;
};

export type KybReviewCategory =
  | 'BASIC_INFO'
  | 'PASSPORT'
  | 'PASSPORT_PHOTO'
  | 'LIVENESS'
  | 'PROOF_OF_ADDRESS'
  | 'SOURCE_OF_WEALTH'
  | 'RISK_REVIEW';

export type KybReviewStatus = 'Pending' | 'Approved' | 'Rejected' | 'Need More Info';

export type KybReviewItem = {
  id: string;
  category: KybReviewCategory;
  label: string;
  required: boolean;
  status: KybReviewStatus;
  reviewerNote?: string;
  reviewedAt?: string;
  reviewerName?: string;
};

export type KybApiLog = {
  id: string;
  method: 'POST' | 'PATCH';
  endpoint: string;
  statusCode: number;
  message: string;
  at: string;
};

export type KybDocument = {
  id: string;
  name: string;
  type: 'identity' | 'address' | 'company' | 'ubo' | 'other';
  status: ApiStatus;
  uploadedAt: string;
};

export type KybRecord = {
  id: string;
  entityId: string;
  status: ApiStatus;
  reviewer: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedReason?: string;
  documents: KybDocument[];
  individualProfile?: IndividualKybProfile;
  passportInfo?: PassportDocumentInfo;
  supportingDocuments?: KybSupportingDocument[];
  reviewItems?: KybReviewItem[];
  timeline: TimelineEvent[];
  apiLogs?: KybApiLog[];
};

/**
 * INTERLACE_FIELD_MAP: SubmitKybPayload -> Update Legal Entity (提交/补充 KYB 资料)
 * entityId      -> legalEntityId
 * documentNames -> 当前仅传文件名占位；真实接入应改为已上传文件的 documentId / fileUrl 列表，
 *                  并携带 IndividualKybProfile / PassportDocumentInfo 等结构化 KYC 字段。
 * Trigger: 开户向导提交、KYB 补件、审核驳回后重新提交。
 */
export type SubmitKybPayload = {
  entityId: string;
  documentNames: string[];
};
