'use client';

import type { Entity } from 'src/types/entity';
import type { ApiStatus } from 'src/types/common';
import type { GlobalAccount } from 'src/types/account';
import type {
  KybRecord,
  KybReviewItem,
  KybReviewStatus,
  KybSupportingDocument,
  KybSupportingDocumentType,
  KybSupportingDocumentStatus,
} from 'src/types/kyb';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Step from '@mui/material/Step';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Tooltip from '@mui/material/Tooltip';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import StepConnector from '@mui/material/StepConnector';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { formatMoney, formatDateTime, entityTypeLabel } from 'src/utils/baas-format';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { DataTable, StatusChip, InfoSection } from 'src/components/common';

import {
  findPassportIssues,
  buildKybSubmissionDecision,
  buildRequiredDocumentSpecs,
} from './kyb-review-rules';

type Props = {
  open: boolean;
  entity: Entity | null;
  kybRecord?: KybRecord;
  accounts: GlobalAccount[];
  onClose: () => void;
  onSubmitKyb: () => Promise<void>;
  onUpdateReviewItem: (
    entityId: string,
    reviewItemId: string,
    status: KybReviewStatus,
    note?: string
  ) => void;
  onUpdateDocumentReview: (
    entityId: string,
    documentId: string,
    status: KybSupportingDocumentStatus,
    note?: string
  ) => void;
  onApproveKybAndCreateEntity: (entityId: string) => void;
  onSubmitGlobalAccountOpening: (entityId: string) => Promise<GlobalAccount | null>;
  onActivateGlobalAccount: (entityId: string) => void;
};

type TabValue = 'overview' | 'individual' | 'documents' | 'checklist' | 'accounts' | 'logs';
type ConfirmAction = 'approve-kyb' | 'open-account' | null;

type ApiLogRow = {
  id: string;
  action: string;
  objectId: string;
  status: ApiStatus;
  at: string;
};

const riskLabels: Record<Entity['riskLevel'], string> = {
  low: '低',
  medium: '中',
  high: '高',
};

const documentTypeLabels: Record<KybSupportingDocumentType, string> = {
  PASSPORT_PHOTO: 'Passport Photo',
  SELFIE_LIVENESS: 'Selfie / Liveness',
  PROOF_OF_ADDRESS: 'Proof of Address',
  SOURCE_OF_WEALTH: 'Source of Wealth',
};

const defaultReviewItems: KybReviewItem[] = [
  {
    id: 'review-basic-info',
    category: 'BASIC_INFO',
    label: '基本信息',
    required: true,
    status: 'Pending',
  },
  {
    id: 'review-passport',
    category: 'PASSPORT',
    label: '护照信息',
    required: true,
    status: 'Pending',
  },
  {
    id: 'review-passport-photo',
    category: 'PASSPORT_PHOTO',
    label: '护照照片',
    required: true,
    status: 'Pending',
  },
  {
    id: 'review-liveness',
    category: 'LIVENESS',
    label: '活体认证',
    required: false,
    status: 'Pending',
  },
  {
    id: 'review-address',
    category: 'PROOF_OF_ADDRESS',
    label: '地址证明',
    required: true,
    status: 'Pending',
  },
  {
    id: 'review-wealth',
    category: 'SOURCE_OF_WEALTH',
    label: '资产来源证明',
    required: true,
    status: 'Pending',
  },
  {
    id: 'review-risk',
    category: 'RISK_REVIEW',
    label: '风控备注',
    required: false,
    status: 'Pending',
  },
];

const steps = [
  'Customer Submitted',
  'KYB Review',
  'Entity Approved',
  'Global Account Opening',
  'Account Active',
];

function SectionPanel({ children, title }: { title: string; children: React.ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Paper>
  );
}

function CopyableValue({ label, value }: { label: string; value: string }) {
  const handleCopy = async () => {
    await navigator.clipboard?.writeText(value);
    toast.success(`${label} 已复制`);
  };

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
      <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>
        {value}
      </Typography>
      <Tooltip title={`复制 ${label}`}>
        <IconButton size="small" aria-label={`复制 ${label}`} onClick={handleCopy}>
          <Iconify icon="solar:copy-bold" width={16} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function ReviewStatusChip({ status }: { status: KybReviewStatus }) {
  const apiStatus: ApiStatus =
    status === 'Approved'
      ? 'approved'
      : status === 'Rejected'
        ? 'rejected'
        : status === 'Need More Info'
          ? 'need_more_info'
          : 'pending';

  return <StatusChip status={apiStatus} />;
}

function DocumentStatusChip({ status }: { status: KybSupportingDocumentStatus }) {
  const apiStatus: ApiStatus =
    status === 'Approved'
      ? 'approved'
      : status === 'Rejected'
        ? 'rejected'
        : status === 'Need Replacement'
          ? 'need_more_info'
          : status === 'Missing'
            ? 'failed'
            : 'pending';

  return <StatusChip status={apiStatus} />;
}

function accountBalanceSummary(account: GlobalAccount) {
  const balances = [...account.fiatBalances, ...account.cryptoBalances];

  if (!balances.length) {
    return '-';
  }

  return balances.map((balance) => formatMoney(balance.available, balance.currency)).join(' / ');
}

function getGlobalAccountStatus(accounts: GlobalAccount[]): ApiStatus {
  if (accounts.some((account) => account.status === 'active')) return 'active';
  if (accounts.some((account) => ['pending', 'syncing', 'processing'].includes(account.status))) {
    return 'pending';
  }
  if (accounts.some((account) => account.status === 'failed')) return 'failed';
  return 'not_created';
}

function getActiveStep(entity: Entity, globalAccountStatus: ApiStatus) {
  if (globalAccountStatus === 'active') return 4;
  if (globalAccountStatus === 'pending') return 3;
  if (entity.kybStatus === 'approved') return 2;
  if (['submitted', 'pending', 'need_more_info', 'rejected'].includes(entity.kybStatus)) return 1;
  return 0;
}

function getReviewItem(reviewItems: KybReviewItem[], category: KybReviewItem['category']) {
  return reviewItems.find((item) => item.category === category);
}

function getFieldStatus(
  value: unknown,
  reviewItem?: KybReviewItem,
  warning?: string
): 'missing' | 'warning' | KybReviewStatus {
  if (!value) return 'missing';
  if (warning) return 'warning';
  return reviewItem?.status ?? 'Pending';
}

function FieldTile({
  label,
  value,
  status,
}: {
  label: string;
  value: React.ReactNode;
  status: 'missing' | 'warning' | KybReviewStatus;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: 1 }}>
      <Stack spacing={0.75}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{ minHeight: 22, fontWeight: 600, wordBreak: 'break-word' }}
        >
          {value || 'Missing / 未提交'}
        </Typography>
        {status === 'missing' && <Label color="error">Missing</Label>}
        {status === 'warning' && <Label color="warning">Warning</Label>}
        {status !== 'missing' && status !== 'warning' && <ReviewStatusChip status={status} />}
      </Stack>
    </Paper>
  );
}

function buildSupportingDocuments(record?: KybRecord): KybSupportingDocument[] {
  const documents = record?.supportingDocuments ?? [];

  return buildRequiredDocumentSpecs().map((spec) => {
    const existing = documents.find((document) => document.type === spec.type);

    return (
      existing ?? {
        id: `missing-${spec.type}`,
        type: spec.type,
        name: spec.label,
        required: spec.required,
        status: 'Missing',
      }
    );
  });
}

export function EntityDetailDialog({
  open,
  entity,
  kybRecord,
  accounts,
  onClose,
  onSubmitKyb,
  onUpdateReviewItem,
  onActivateGlobalAccount,
  onUpdateDocumentReview,
  onApproveKybAndCreateEntity,
  onSubmitGlobalAccountOpening,
}: Props) {
  const [tab, setTab] = useState<TabValue>('overview');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setTab('overview');
      setNotes({});
    }
  }, [entity?.id, open]);

  const reviewItems = kybRecord?.reviewItems?.length ? kybRecord.reviewItems : defaultReviewItems;
  const supportingDocuments = useMemo(() => buildSupportingDocuments(kybRecord), [kybRecord]);
  const globalAccountStatus = getGlobalAccountStatus(accounts);
  const activeStep = entity ? getActiveStep(entity, globalAccountStatus) : 0;

  const submissionDecision = useMemo(() => {
    if (!entity) return { canSubmit: false, reasons: ['未选择实体'] };

    return buildKybSubmissionDecision({
      entityStatus: entity.status,
      kybStatus: entity.kybStatus,
      individualProfile: kybRecord?.individualProfile,
      passportInfo: kybRecord?.passportInfo,
      supportingDocuments,
      reviewItems,
    });
  }, [entity, kybRecord, reviewItems, supportingDocuments]);

  const canOpenAccount =
    !!entity &&
    entity.kybStatus === 'approved' &&
    ['approved', 'active'].includes(entity.status) &&
    ['not_created', 'failed'].includes(globalAccountStatus);

  const openAccountReason =
    (globalAccountStatus === 'active' && '全球账户已开通') ||
    (globalAccountStatus === 'pending' && '账户开通处理中') ||
    (entity?.kybStatus !== 'approved' && '请先完成 KYB 审核并创建实体') ||
    '';

  const apiLogs = useMemo<ApiLogRow[]>(() => {
    if (!entity) return [];

    return [
      {
        id: 'entity-created',
        action: '创建实体',
        objectId: entity.entityId,
        status: entity.status,
        at: entity.createdAt,
      },
      ...(kybRecord?.apiLogs ?? []).map((log) => ({
        id: log.id,
        action: `${log.method} ${log.endpoint}`,
        objectId: log.message,
        status: log.statusCode >= 400 ? ('failed' as ApiStatus) : ('completed' as ApiStatus),
        at: log.at,
      })),
      ...accounts.map((account) => ({
        id: `account-${account.id}`,
        action: 'Global Account',
        objectId: account.accountId,
        status: account.status,
        at: account.createdAt,
      })),
    ];
  }, [accounts, entity, kybRecord]);

  if (!entity) {
    return null;
  }

  const basicReviewItem = getReviewItem(reviewItems, 'BASIC_INFO');
  const passportReviewItem = getReviewItem(reviewItems, 'PASSPORT');
  const passportIssues = findPassportIssues(kybRecord?.passportInfo);
  const passportHasError = passportIssues.length > 0;
  const passportExpiry = kybRecord?.passportInfo?.expiryDate;
  const passportExpiresSoon =
    !!passportExpiry &&
    !passportHasError &&
    new Date(passportExpiry).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 180;

  const handleNoteChange = (id: string, value: string) => {
    setNotes((current) => ({ ...current, [id]: value }));
  };

  const handleReviewItemAction = (item: KybReviewItem, status: KybReviewStatus) => {
    const note = notes[item.id]?.trim();

    if ((status === 'Rejected' || status === 'Need More Info') && !note) {
      toast.error('驳回或要求补充时必须填写备注');
      return;
    }

    onUpdateReviewItem(entity.id, item.id, status, note);
    toast.success('审核项已更新');
  };

  const handleDocumentAction = (
    document: KybSupportingDocument,
    status: KybSupportingDocumentStatus
  ) => {
    const note = notes[document.id]?.trim();

    if ((status === 'Rejected' || status === 'Need Replacement') && !note) {
      toast.error('驳回或要求重传时必须填写原因');
      return;
    }

    onUpdateDocumentReview(entity.id, document.id, status, note);
    toast.success('文件审核已更新');
  };

  const handleConfirm = async () => {
    if (confirmAction === 'approve-kyb') {
      onApproveKybAndCreateEntity(entity.id);
      toast.success('KYB 已通过，实体已创建/激活');
    }

    if (confirmAction === 'open-account') {
      const account = await onSubmitGlobalAccountOpening(entity.id);
      toast.success(account ? '全球账户开通已提交' : '请先完成 KYB 审核并创建实体');
    }

    setConfirmAction(null);
  };

  return (
    <>
      <Dialog
        fullWidth
        maxWidth={false}
        open={open}
        onClose={onClose}
        scroll="paper"
        PaperProps={{
          sx: {
            m: { xs: 1, md: 4 },
            width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 32px)', md: 1120 },
            maxWidth: 1200,
            maxHeight: { xs: 'calc(100% - 16px)', md: 'calc(100% - 64px)' },
          },
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ px: 3, py: 2.5 }}>
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
              >
                <Typography variant="h6">实体详情 / KYB 审核</Typography>
                <StatusChip status={entity.kybStatus} />
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                  {entity.name}
                </Typography>
                <Divider flexItem orientation="vertical" />
                <CopyableValue label="Entity ID" value={entity.entityId} />
              </Stack>
            </Box>
            <IconButton aria-label="关闭弹窗" onClick={onClose}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            p: 0,
            display: 'flex',
            overflow: 'hidden',
            flexDirection: 'column',
          }}
        >
          <Tabs
            value={tab}
            variant="scrollable"
            allowScrollButtonsMobile
            onChange={(_, value: TabValue) => setTab(value)}
            sx={{ px: 2.5, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
          >
            <Tab value="overview" label="Overview" />
            <Tab value="individual" label="Individual KYC" />
            <Tab value="documents" label="Documents" />
            <Tab value="checklist" label="Review Checklist" />
            <Tab value="accounts" label="Account Opening" />
            <Tab value="logs" label="Timeline & Logs" />
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 2.5 }, overflow: 'auto' }}>
            {tab === 'overview' && (
              <Stack spacing={2.5}>
                <SectionPanel title="状态总览">
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Entity Name', value: entity.name },
                      { label: 'Entity ID', value: entity.entityId },
                      { label: 'Entity Type', value: entityTypeLabel(entity.type) },
                      { label: 'KYB Status', value: <StatusChip status={entity.kybStatus} /> },
                      { label: 'Entity Status', value: <StatusChip status={entity.status} /> },
                      {
                        label: 'Global Account Status',
                        value: <StatusChip status={globalAccountStatus} />,
                      },
                      { label: 'Created Time', value: formatDateTime(entity.createdAt) },
                      { label: 'Last Updated Time', value: formatDateTime(entity.updatedAt) },
                    ].map((item) => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
                        <FieldTile label={item.label} value={item.value} status="Approved" />
                      </Grid>
                    ))}
                  </Grid>
                </SectionPanel>

                <SectionPanel title="业务流程">
                  <Stepper
                    alternativeLabel
                    activeStep={activeStep}
                    connector={<StepConnector />}
                    sx={{ overflowX: 'auto', pb: 1 }}
                  >
                    {steps.map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </SectionPanel>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SectionPanel title="实体档案">
                      <InfoSection
                        title="Profile"
                        rows={[
                          { label: '国家/地区', value: entity.country },
                          { label: '邮箱', value: entity.email },
                          { label: '手机号', value: entity.phone || '未填写' },
                          { label: '行业', value: entity.industry },
                          { label: '风险等级', value: riskLabels[entity.riskLevel] },
                          { label: '申请人 / UBO', value: entity.ownerName },
                        ]}
                      />
                    </SectionPanel>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <SectionPanel title="提交条件">
                      <Alert severity={submissionDecision.canSubmit ? 'success' : 'warning'}>
                        {submissionDecision.reasons.slice(0, 4).join(' / ')}
                      </Alert>
                    </SectionPanel>
                  </Grid>
                </Grid>
              </Stack>
            )}

            {tab === 'individual' && (
              <Stack spacing={2.5}>
                <SectionPanel title="个人开户资料审核 / Required Basic Information">
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'personType', value: kybRecord?.individualProfile?.personType },
                      { label: 'firstName', value: kybRecord?.individualProfile?.firstName },
                      { label: 'lastName', value: kybRecord?.individualProfile?.lastName },
                      { label: 'dateOfBirth', value: kybRecord?.individualProfile?.dateOfBirth },
                      { label: 'nationality', value: kybRecord?.individualProfile?.nationality },
                      {
                        label: 'countryOfResidence',
                        value: kybRecord?.individualProfile?.countryOfResidence,
                      },
                      { label: 'email', value: kybRecord?.individualProfile?.email },
                      { label: 'phoneNumber', value: kybRecord?.individualProfile?.phoneNumber },
                      {
                        label: 'address',
                        value: kybRecord?.individualProfile?.address
                          ? [
                              kybRecord.individualProfile.address.street,
                              kybRecord.individualProfile.address.city,
                              kybRecord.individualProfile.address.state,
                              kybRecord.individualProfile.address.postalCode,
                              kybRecord.individualProfile.address.country,
                            ]
                              .filter(Boolean)
                              .join(', ')
                          : '',
                      },
                    ].map((item) => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <FieldTile
                          label={item.label}
                          value={item.value ?? ''}
                          status={getFieldStatus(item.value, basicReviewItem)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </SectionPanel>

                <SectionPanel title="身份证件信息 / Passport">
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'documentType', value: kybRecord?.passportInfo?.documentType },
                      { label: 'documentNumber', value: kybRecord?.passportInfo?.documentNumber },
                      { label: 'issueDate', value: kybRecord?.passportInfo?.issueDate },
                      { label: 'expiryDate', value: kybRecord?.passportInfo?.expiryDate },
                      { label: 'countryOfIssue', value: kybRecord?.passportInfo?.countryOfIssue },
                    ].map((item) => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: 4 }}>
                        <FieldTile
                          label={item.label}
                          value={item.value ?? ''}
                          status={getFieldStatus(
                            item.value,
                            passportReviewItem,
                            item.label === 'expiryDate' && (passportHasError || passportExpiresSoon)
                              ? 'expiry warning'
                              : ''
                          )}
                        />
                      </Grid>
                    ))}
                  </Grid>
                  {(passportHasError || passportExpiresSoon) && (
                    <Alert severity={passportHasError ? 'error' : 'warning'} sx={{ mt: 2 }}>
                      {passportHasError ? passportIssues.join(' / ') : '护照将在 180 天内过期'}
                    </Alert>
                  )}
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="护照审核备注"
                    value={notes[passportReviewItem?.id ?? 'passport-note'] ?? ''}
                    onChange={(event) =>
                      handleNoteChange(
                        passportReviewItem?.id ?? 'passport-note',
                        event.target.value
                      )
                    }
                    sx={{ mt: 2 }}
                  />
                </SectionPanel>
              </Stack>
            )}

            {tab === 'documents' && (
              <Grid container spacing={2}>
                {supportingDocuments.map((document) => {
                  const spec = buildRequiredDocumentSpecs().find(
                    (item) => item.type === document.type
                  );

                  return (
                    <Grid key={document.id} size={{ xs: 12, md: 6 }}>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 1, height: 1 }}>
                        <Stack spacing={1.5}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="flex-start"
                            justifyContent="space-between"
                          >
                            <Box>
                              <Typography variant="subtitle2">
                                {documentTypeLabels[document.type]}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {spec?.description}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.75}>
                              <Label color={document.required ? 'error' : 'default'}>
                                {document.required ? 'Required' : 'Optional'}
                              </Label>
                              <DocumentStatusChip status={document.status} />
                            </Stack>
                          </Stack>

                          <InfoSection
                            title="文件信息"
                            rows={[
                              { label: '文件名称', value: document.name },
                              {
                                label: '文件 URL',
                                value: document.fileUrl ? (
                                  <Link href={document.fileUrl} target="_blank" rel="noreferrer">
                                    View
                                  </Link>
                                ) : (
                                  'Missing / 未提交'
                                ),
                              },
                              {
                                label: '上传时间',
                                value: document.uploadedAt
                                  ? formatDateTime(document.uploadedAt)
                                  : '未提交',
                              },
                              { label: '字段路径', value: spec?.fieldPath ?? '-' },
                              { label: '审核备注', value: document.reviewerNote ?? '无' },
                            ]}
                          />

                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="文件审核备注"
                            value={notes[document.id] ?? ''}
                            onChange={(event) => handleNoteChange(document.id, event.target.value)}
                            disabled={document.status === 'Missing'}
                          />

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              disabled={document.status === 'Missing'}
                              onClick={() => handleDocumentAction(document, 'Approved')}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              disabled={document.status === 'Missing'}
                              onClick={() => handleDocumentAction(document, 'Rejected')}
                            >
                              Reject
                            </Button>
                            <Button
                              size="small"
                              color="warning"
                              variant="outlined"
                              disabled={document.status === 'Missing'}
                              onClick={() => handleDocumentAction(document, 'Need Replacement')}
                            >
                              Request Replacement
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}

            {tab === 'checklist' && (
              <DataTable
                title="Review Checklist / 审核清单"
                rows={reviewItems}
                rowKey={(row) => row.id}
                columns={[
                  { id: 'label', label: '资料项', render: (row) => row.label },
                  {
                    id: 'required',
                    label: '必需',
                    width: 90,
                    render: (row) => (
                      <Label color={row.required ? 'error' : 'default'}>
                        {row.required ? 'Required' : 'Optional'}
                      </Label>
                    ),
                  },
                  {
                    id: 'status',
                    label: '审核状态',
                    width: 140,
                    render: (row) => <ReviewStatusChip status={row.status} />,
                  },
                  {
                    id: 'note',
                    label: 'Reviewer Note',
                    render: (row) => (
                      <Stack spacing={1}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {row.reviewerNote ?? '无'}
                        </Typography>
                        <TextField
                          size="small"
                          placeholder="填写驳回原因或补充要求"
                          value={notes[row.id] ?? ''}
                          onChange={(event) => handleNoteChange(row.id, event.target.value)}
                        />
                      </Stack>
                    ),
                  },
                  {
                    id: 'reviewedAt',
                    label: 'Last Reviewed',
                    width: 180,
                    render: (row) =>
                      row.reviewedAt ? (
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{formatDateTime(row.reviewedAt)}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {row.reviewerName}
                          </Typography>
                        </Stack>
                      ) : (
                        '未审核'
                      ),
                  },
                  {
                    id: 'actions',
                    label: '操作',
                    width: 260,
                    render: (row) => (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        <Button
                          size="small"
                          color="success"
                          variant="outlined"
                          onClick={() => handleReviewItemAction(row, 'Approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleReviewItemAction(row, 'Rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          size="small"
                          color="warning"
                          variant="outlined"
                          onClick={() => handleReviewItemAction(row, 'Need More Info')}
                        >
                          Need Info
                        </Button>
                      </Stack>
                    ),
                  },
                ]}
              />
            )}

            {tab === 'accounts' && (
              <Stack spacing={2.5}>
                <SectionPanel title="账户开通状态">
                  <InfoSection
                    title="Global Account"
                    rows={[
                      { label: '创建实体状态', value: <StatusChip status={entity.status} /> },
                      { label: 'KYB 状态', value: <StatusChip status={entity.kybStatus} /> },
                      {
                        label: '全球账户开通状态',
                        value: <StatusChip status={globalAccountStatus} />,
                      },
                      {
                        label: 'Global Account ID',
                        value: accounts[0]?.accountId ? (
                          <CopyableValue label="Global Account ID" value={accounts[0].accountId} />
                        ) : (
                          '未生成'
                        ),
                      },
                    ]}
                  />
                  {globalAccountStatus === 'pending' && (
                    <Button
                      color="success"
                      variant="outlined"
                      sx={{ mt: 2 }}
                      onClick={() => {
                        onActivateGlobalAccount(entity.id);
                        toast.success('已模拟账户开通成功');
                      }}
                    >
                      模拟账户开通成功
                    </Button>
                  )}
                </SectionPanel>

                <DataTable
                  title="关联 Global Account"
                  rows={accounts}
                  rowKey={(row) => row.id}
                  emptyText="暂无关联账户"
                  columns={[
                    {
                      id: 'accountId',
                      label: 'Account ID',
                      render: (row) => <CopyableValue label="Account ID" value={row.accountId} />,
                    },
                    {
                      id: 'name',
                      label: '账户名称',
                      render: (row) => (
                        <Link
                          component={RouterLink}
                          href={paths.dashboard.baas.accountDetails(row.id)}
                          color="inherit"
                          underline="hover"
                          sx={{ fontWeight: 600 }}
                        >
                          {row.name}
                        </Link>
                      ),
                    },
                    {
                      id: 'status',
                      label: '状态',
                      width: 120,
                      render: (row) => <StatusChip status={row.status} />,
                    },
                    {
                      id: 'balances',
                      label: '可用余额',
                      render: (row) => accountBalanceSummary(row),
                    },
                    {
                      id: 'createdAt',
                      label: '创建时间',
                      width: 160,
                      render: (row) => formatDateTime(row.createdAt),
                    },
                  ]}
                />
              </Stack>
            )}

            {tab === 'logs' && (
              <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, md: 5 }}>
                  <SectionPanel title="状态时间线">
                    <Stack spacing={1.5}>
                      {(
                        kybRecord?.timeline ?? [
                          { label: '创建实体', status: entity.status, at: entity.createdAt },
                        ]
                      ).map((event) => (
                        <Stack
                          key={`${event.label}-${event.at}`}
                          direction="row"
                          spacing={1.5}
                          alignItems="flex-start"
                        >
                          <Box
                            sx={{
                              mt: 0.75,
                              width: 8,
                              height: 8,
                              flexShrink: 0,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              justifyContent="space-between"
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {event.label}
                              </Typography>
                              <StatusChip status={event.status} />
                            </Stack>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {formatDateTime(event.at)}
                            </Typography>
                            {event.description && (
                              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                {event.description}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  </SectionPanel>
                </Grid>
                <Grid size={{ xs: 12, md: 7 }}>
                  <DataTable
                    title="Mock API Logs"
                    rows={apiLogs}
                    rowKey={(row) => row.id}
                    emptyText="暂无 Mock API Logs"
                    columns={[
                      { id: 'action', label: '事件', render: (row) => row.action },
                      {
                        id: 'objectId',
                        label: 'Reference / Object ID',
                        render: (row) => (
                          <CopyableValue label="Reference ID" value={row.objectId} />
                        ),
                      },
                      {
                        id: 'status',
                        label: '状态',
                        width: 120,
                        render: (row) => <StatusChip status={row.status} />,
                      },
                      {
                        id: 'at',
                        label: '时间',
                        width: 160,
                        render: (row) => formatDateTime(row.at),
                      },
                    ]}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            gap: 1,
            px: 3,
            py: 2,
            alignItems: { xs: 'stretch', md: 'flex-start' },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <Box sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{ color: submissionDecision.canSubmit ? 'success.main' : 'warning.main' }}
            >
              {submissionDecision.reasons.slice(0, 3).join(' / ')}
            </Typography>
            {!canOpenAccount && openAccountReason && (
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                {openAccountReason}
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            color="inherit"
            onClick={onClose}
            sx={{ width: { xs: 1, md: 'auto' } }}
          >
            关闭
          </Button>
          <Button
            variant="outlined"
            onClick={() => setTab('checklist')}
            sx={{ width: { xs: 1, md: 'auto' } }}
          >
            审核清单
          </Button>
          <Tooltip
            title={submissionDecision.canSubmit ? '' : submissionDecision.reasons.join(' / ')}
          >
            <span>
              <Button
                variant="contained"
                disabled={!submissionDecision.canSubmit}
                onClick={() => setConfirmAction('approve-kyb')}
                sx={{ width: { xs: 1, md: 'auto' } }}
              >
                提交创建实体并通过 KYB
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={canOpenAccount ? '' : openAccountReason}>
            <span>
              <Button
                color="success"
                variant="contained"
                disabled={!canOpenAccount}
                onClick={() => setConfirmAction('open-account')}
                sx={{ width: { xs: 1, md: 'auto' } }}
              >
                提交开通全球账户
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'approve-kyb' ? '确认通过 KYB？' : '确认提交账户开通？'}
        content={
          confirmAction === 'approve-kyb'
            ? '确认后将更新 KYB Status、Entity Status，并写入 Mock API Log。'
            : '确认后将创建一个 Pending 状态的 Global Account，并写入时间线。'
        }
        action={
          <Button variant="contained" onClick={handleConfirm}>
            Confirm
          </Button>
        }
      />
    </>
  );
}
