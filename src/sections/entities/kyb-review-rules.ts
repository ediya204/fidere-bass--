import type { ApiStatus } from 'src/types/common';
import type { EntityStatus } from 'src/types/entity';
import type {
  KybReviewItem,
  KybReviewCategory,
  IndividualKybProfile,
  PassportDocumentInfo,
  KybSupportingDocument,
  KybSupportingDocumentType,
} from 'src/types/kyb';

export type RequiredDocumentSpec = {
  type: KybSupportingDocumentType;
  label: string;
  description: string;
  required: boolean;
  fieldPath: string;
};

export type KybSubmissionDecision = {
  canSubmit: boolean;
  reasons: string[];
};

type KybSubmissionInput = {
  entityStatus: EntityStatus;
  kybStatus: ApiStatus;
  individualProfile?: IndividualKybProfile;
  passportInfo?: PassportDocumentInfo;
  supportingDocuments: KybSupportingDocument[];
  reviewItems: KybReviewItem[];
};

const requiredProfileFields: Array<{
  key: keyof Omit<IndividualKybProfile, 'address'>;
  label: string;
}> = [
  { key: 'personType', label: 'personType' },
  { key: 'firstName', label: 'firstName' },
  { key: 'lastName', label: 'lastName' },
  { key: 'dateOfBirth', label: 'dateOfBirth' },
  { key: 'nationality', label: 'nationality' },
  { key: 'countryOfResidence', label: 'countryOfResidence' },
  { key: 'email', label: 'email' },
  { key: 'phoneNumber', label: 'phoneNumber' },
];

const requiredAddressFields: Array<keyof IndividualKybProfile['address']> = [
  'street',
  'city',
  'postalCode',
  'country',
];

const reviewCategoryLabels: Record<KybReviewCategory, string> = {
  BASIC_INFO: '基本信息',
  PASSPORT: '护照信息',
  PASSPORT_PHOTO: '护照照片',
  LIVENESS: '活体认证',
  PROOF_OF_ADDRESS: '地址证明',
  SOURCE_OF_WEALTH: '资产来源证明',
  RISK_REVIEW: '风控备注',
};

export function buildRequiredDocumentSpecs(): RequiredDocumentSpec[] {
  return [
    {
      type: 'PASSPORT_PHOTO',
      label: '护照照片',
      description: '护照资料页',
      required: true,
      fieldPath: 'identityDocuments.fileUrl',
    },
    {
      type: 'SELFIE_LIVENESS',
      label: '自拍 / 活体认证',
      description: '用于活体验证',
      required: false,
      fieldPath: 'liveness.fileUrl / selfie.fileUrl',
    },
    {
      type: 'PROOF_OF_ADDRESS',
      label: '地址证明',
      description: '银行账单、水电账单或政府信件，3 个月内',
      required: true,
      fieldPath: 'proofOfAddress.fileUrl',
    },
    {
      type: 'SOURCE_OF_WEALTH',
      label: '资产来源证明',
      description: '资产来源证明',
      required: true,
      fieldPath: 'sourceOfWealth.fileUrl / sourceOfFunds.fileUrl',
    },
  ];
}

export function isKybReviewComplete(reviewItems: KybReviewItem[]) {
  return reviewItems.filter((item) => item.required).every((item) => item.status === 'Approved');
}

export function findMissingProfileFields(profile?: IndividualKybProfile) {
  if (!profile) {
    return ['个人开户资料未提交'];
  }

  const missing = requiredProfileFields
    .filter(({ key }) => !profile[key])
    .map(({ label }) => `${label} 未提交`);

  requiredAddressFields.forEach((key) => {
    if (!profile.address?.[key]) {
      missing.push(`address.${key} 未提交`);
    }
  });

  return missing;
}

export function findPassportIssues(passportInfo?: PassportDocumentInfo, now = new Date()) {
  if (!passportInfo) {
    return ['护照信息未提交'];
  }

  const issues: string[] = [];

  if (passportInfo.documentType !== 'PASSPORT') {
    issues.push('documentType 必须为 PASSPORT');
  }

  if (!passportInfo.documentNumber) {
    issues.push('documentNumber 未提交');
  }

  if (!passportInfo.issueDate) {
    issues.push('issueDate 未提交');
  }

  if (!passportInfo.expiryDate) {
    issues.push('expiryDate 未提交');
  } else if (new Date(passportInfo.expiryDate).getTime() < now.getTime()) {
    issues.push('护照已过期');
  }

  if (!passportInfo.countryOfIssue) {
    issues.push('countryOfIssue 未提交');
  }

  return issues;
}

export function findRequiredDocumentIssues(documents: KybSupportingDocument[]) {
  return buildRequiredDocumentSpecs()
    .filter((spec) => spec.required)
    .flatMap((spec) => {
      const document = documents.find((item) => item.type === spec.type);

      if (!document || !document.fileUrl || document.status === 'Missing') {
        return [`缺少${spec.label}`];
      }

      if (document.status === 'Rejected') {
        return [`${spec.label}已驳回`];
      }

      if (document.status === 'Need Replacement') {
        return [`${spec.label}需重新上传`];
      }

      if (document.status !== 'Approved') {
        return [`${spec.label}未审核`];
      }

      return [];
    });
}

export function findReviewItemIssues(reviewItems: KybReviewItem[]) {
  return reviewItems
    .filter((item) => item.required && item.status !== 'Approved')
    .map((item) => {
      const label = reviewCategoryLabels[item.category] ?? item.label;

      if (item.status === 'Rejected') {
        return `${label}已驳回`;
      }

      if (item.status === 'Need More Info') {
        return `${label}需补充`;
      }

      return `${label}未审核`;
    });
}

export function buildKybSubmissionDecision(input: KybSubmissionInput): KybSubmissionDecision {
  const reasons = [
    ...findMissingProfileFields(input.individualProfile),
    ...findPassportIssues(input.passportInfo),
    ...findRequiredDocumentIssues(input.supportingDocuments),
    ...findReviewItemIssues(input.reviewItems),
  ];

  if (input.kybStatus === 'approved') {
    reasons.push('KYB 已通过');
  }

  if (input.entityStatus === 'active') {
    reasons.push('实体已激活');
  }

  if (reasons.length) {
    return { canSubmit: false, reasons };
  }

  return { canSubmit: true, reasons: ['资料已满足提交条件'] };
}
