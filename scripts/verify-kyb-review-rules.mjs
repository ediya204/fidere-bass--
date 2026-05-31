import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const root = process.cwd();
const sourcePath = path.join(root, 'src/sections/entities/kyb-review-rules.ts');
const source = fs.readFileSync(sourcePath, 'utf8');

const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});

const sandbox = {
  exports: {},
  module: { exports: {} },
  require,
};

vm.runInNewContext(transpiled.outputText, sandbox, { filename: sourcePath });

const {
  buildKybSubmissionDecision,
  buildRequiredDocumentSpecs,
  isKybReviewComplete,
} = { ...sandbox.exports, ...sandbox.module.exports };

const baseReviewItems = [
  { id: 'basic-info', category: 'BASIC_INFO', label: '基本信息', required: true, status: 'Approved' },
  { id: 'passport', category: 'PASSPORT', label: '护照信息', required: true, status: 'Approved' },
  { id: 'passport-photo', category: 'PASSPORT_PHOTO', label: '护照照片', required: true, status: 'Approved' },
  { id: 'liveness', category: 'LIVENESS', label: '活体认证', required: false, status: 'Pending' },
  { id: 'proof-of-address', category: 'PROOF_OF_ADDRESS', label: '地址证明', required: true, status: 'Approved' },
  { id: 'source-of-wealth', category: 'SOURCE_OF_WEALTH', label: '资产来源证明', required: true, status: 'Approved' },
  { id: 'risk-review', category: 'RISK_REVIEW', label: '风控备注', required: false, status: 'Pending' },
];

const baseProfile = {
  personType: 'INDIVIDUAL',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  nationality: 'US',
  countryOfResidence: 'US',
  email: 'john.doe@example.com',
  phoneNumber: '+85212345678',
  address: {
    street: '100 Queen Road',
    city: 'Hong Kong',
    state: 'Central',
    postalCode: '000000',
    country: 'HK',
  },
};

const basePassport = {
  documentType: 'PASSPORT',
  documentNumber: '123456789',
  issueDate: '2015-05-10',
  expiryDate: '2030-05-10',
  countryOfIssue: 'US',
};

const baseDocuments = [
  {
    id: 'passport-photo',
    type: 'PASSPORT_PHOTO',
    name: 'passport.pdf',
    fileUrl: 'https://example.com/passport.pdf',
    uploadedAt: '2026-05-30T10:46:00.000Z',
    required: true,
    status: 'Approved',
  },
  {
    id: 'proof-of-address',
    type: 'PROOF_OF_ADDRESS',
    name: 'address.pdf',
    fileUrl: 'https://example.com/address.pdf',
    uploadedAt: '2026-05-30T10:47:00.000Z',
    required: true,
    status: 'Approved',
  },
  {
    id: 'source-of-wealth',
    type: 'SOURCE_OF_WEALTH',
    name: 'wealth.pdf',
    fileUrl: 'https://example.com/wealth.pdf',
    uploadedAt: '2026-05-30T10:48:00.000Z',
    required: true,
    status: 'Approved',
  },
];

assert.equal(buildRequiredDocumentSpecs().length, 4);
assert.equal(isKybReviewComplete(baseReviewItems), true);

assert.equal(
  JSON.stringify(
    buildKybSubmissionDecision({
      entityStatus: 'submitted',
      kybStatus: 'submitted',
      individualProfile: baseProfile,
      passportInfo: basePassport,
      supportingDocuments: baseDocuments,
      reviewItems: baseReviewItems,
    })
  ),
  JSON.stringify({ canSubmit: true, reasons: ['资料已满足提交条件'] })
);

assert.equal(
  buildKybSubmissionDecision({
    entityStatus: 'submitted',
    kybStatus: 'submitted',
    individualProfile: baseProfile,
    passportInfo: { ...basePassport, expiryDate: '2020-01-01' },
    supportingDocuments: baseDocuments,
    reviewItems: baseReviewItems,
  }).canSubmit,
  false
);

assert.match(
  buildKybSubmissionDecision({
    entityStatus: 'submitted',
    kybStatus: 'submitted',
    individualProfile: baseProfile,
    passportInfo: basePassport,
    supportingDocuments: baseDocuments.filter((document) => document.type !== 'PROOF_OF_ADDRESS'),
    reviewItems: baseReviewItems,
  }).reasons.join(' / '),
  /缺少地址证明/
);

assert.match(
  buildKybSubmissionDecision({
    entityStatus: 'submitted',
    kybStatus: 'submitted',
    individualProfile: { ...baseProfile, email: '' },
    passportInfo: basePassport,
    supportingDocuments: baseDocuments,
    reviewItems: baseReviewItems,
  }).reasons.join(' / '),
  /email 未提交/
);

assert.match(
  buildKybSubmissionDecision({
    entityStatus: 'submitted',
    kybStatus: 'submitted',
    individualProfile: baseProfile,
    passportInfo: basePassport,
    supportingDocuments: baseDocuments,
    reviewItems: [{ ...baseReviewItems[0], status: 'Rejected' }, ...baseReviewItems.slice(1)],
  }).reasons.join(' / '),
  /基本信息已驳回/
);

console.log('KYB review rules verified');
