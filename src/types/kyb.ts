import type { ApiStatus, TimelineEvent } from './common';

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

export type SubmitKybPayload = {
  entityId: string;
  documentNames: string[];
};
