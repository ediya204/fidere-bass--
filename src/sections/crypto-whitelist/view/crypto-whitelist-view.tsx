'use client';

import type { ReactNode } from 'react';
import type { ApiStatus } from 'src/types/common';
import type { GlobalAccount } from 'src/types/account';
import type { IconifyName } from 'src/components/iconify';
import type { CryptoNetwork, PayeeExternalCall, SensitiveWhitelistOperation } from 'src/types/payee';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { formatDateTime } from 'src/utils/baas-format';
import { buildQueryHref } from 'src/utils/baas-navigation';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ActionBar, DataTable, StatusChip, DetailDrawer } from 'src/components/common';

// ----------------------------------------------------------------------

type ChainType = CryptoNetwork;

type WhitelistForm = {
  name: string;
  network: ChainType;
  address: string;
  purpose: string;
};

type PendingAction = {
  operation: SensitiveWhitelistOperation;
  targetId?: string;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  run: () => Promise<void>;
};

const CHAIN_OPTIONS: Record<ChainType, { label: string; helper: string; icon: IconifyName }> = {
  TRC20: {
    label: 'TRC20',
    helper: '必须以 T 开头，常用于低手续费 USDT 出金。',
    icon: 'solar:verified-check-bold',
  },
  ERC20: {
    label: 'ERC20',
    helper: '必须以 0x 开头，常用于以太坊生态 USDT 出金。',
    icon: 'solar:settings-bold',
  },
};

const whitelistStatusOptions: Array<ApiStatus | 'all'> = [
  'all',
  'pending_email_verification',
  'pending_sync',
  'processing',
  'completed',
  'failed',
  'disabled',
];

const accountStatusOptions: Array<ApiStatus | 'all'> = ['all', 'active', 'pending', 'syncing'];

const getPayeeChain = (payee: PayeeExternalCall): ChainType => {
  if (payee.network) return payee.network;

  return payee.destination.toUpperCase().startsWith('ERC20') ? 'ERC20' : 'TRC20';
};

const getPayeeAddress = (payee: PayeeExternalCall) =>
  payee.address ?? payee.destination.replace(/^TRON\s+/i, '').replace(/^ERC20\s+/i, '');

const shortenAddress = (address: string) =>
  address.length <= 18 ? address : `${address.slice(0, 10)}...${address.slice(-8)}`;

const normalizeAddress = (address: string) => address.trim();

const validateAddress = (network: ChainType, address: string) => {
  const value = normalizeAddress(address);

  if (!value) return '链上地址必填';

  if (network === 'TRC20' && !/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)) {
    return 'TRC20 地址必须以 T 开头，且长度为 34 位 Base58 字符';
  }

  if (network === 'ERC20' && !/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return 'ERC20 地址必须以 0x 开头，且包含 40 位十六进制字符';
  }

  return '';
};

const getCounts = (payees: PayeeExternalCall[]) => ({
  total: payees.length,
  trc20: payees.filter((item) => getPayeeChain(item) === 'TRC20').length,
  erc20: payees.filter((item) => getPayeeChain(item) === 'ERC20').length,
  pendingEmail: payees.filter((item) => item.status === 'pending_email_verification').length,
  pendingSync: payees.filter((item) => item.status === 'pending_sync').length,
  processing: payees.filter((item) => item.status === 'processing').length,
  completed: payees.filter((item) => item.status === 'completed').length,
  failed: payees.filter((item) => item.status === 'failed').length,
  disabled: payees.filter((item) => item.status === 'disabled').length,
});

const getLatestUpdate = (payees: PayeeExternalCall[], account: GlobalAccount) => {
  const timestamps = payees.map((item) => item.updatedAt ?? item.createdAt);

  return timestamps.sort().at(-1) ?? account.createdAt;
};

// ----------------------------------------------------------------------

type EmailVerificationDialogProps = {
  open: boolean;
  action: PendingAction | null;
  onClose: () => void;
  onVerified: () => Promise<void>;
};

function EmailVerificationDialog({
  open,
  action,
  onClose,
  onVerified,
}: EmailVerificationDialogProps) {
  const { sendPayeeEmailVerificationCode, verifyPayeeEmailCode } = useBaasDemo();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const sendCode = useCallback(async () => {
    if (!action) return;

    setSending(true);
    setError('');
    try {
      const result = await sendPayeeEmailVerificationCode({
        operation: action.operation,
        targetId: action.targetId,
      });
      setExpiresAt(result.expiresAt);
      setCountdown(60);
      toast.success('邮箱验证码已发送');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : '验证码发送失败');
    } finally {
      setSending(false);
    }
  }, [action, sendPayeeEmailVerificationCode]);

  useEffect(() => {
    if (!open) {
      setCode('');
      setError('');
      setExpiresAt('');
      setCountdown(0);
      return;
    }

    sendCode();
  }, [open, sendCode]);

  useEffect(() => {
    if (!countdown) return undefined;

    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (!action) return;

    if (!code.trim()) {
      setError('请输入邮箱验证码');
      return;
    }

    setVerifying(true);
    setError('');
    try {
      await verifyPayeeEmailCode(code.trim());
      await onVerified();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : '邮箱验证码校验失败');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={verifying ? undefined : onClose}>
      <DialogTitle>邮箱验证码确认</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Alert severity="warning">
            {action?.title ?? '敏感操作'} 需要邮箱验证码确认，验证成功后才会执行。
          </Alert>

          <TextField
            fullWidth
            autoFocus
            label="邮箱验证码"
            value={code}
            inputProps={{ maxLength: 6 }}
            disabled={verifying}
            error={!!error}
            helperText={error || (expiresAt ? `验证码有效期至 ${formatDateTime(expiresAt)}` : '')}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    disabled={sending || verifying || countdown > 0}
                    onClick={sendCode}
                  >
                    {countdown > 0 ? `${countdown}s` : '发送'}
                  </Button>
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Demo 验证码：123456。输入 000000 可模拟错误，999999 可模拟过期。
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={verifying} onClick={onClose}>
          取消
        </Button>
        <Button variant="contained" disabled={verifying || sending} onClick={handleVerify}>
          {verifying ? '验证中...' : '验证并执行'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export function CryptoWhitelistView() {
  const {
    globalAccounts,
    payeeCalls,
    createCryptoWhitelistAddress,
    updateCryptoWhitelistAddress,
    deleteCryptoWhitelistAddress,
    retryCryptoWhitelistSync,
    setCryptoWhitelistStatus,
  } = useBaasDemo();

  const cryptoAccounts = useMemo(
    () => globalAccounts.filter((account) => account.cryptoEnabled),
    [globalAccounts]
  );

  const cryptoPayees = useMemo(
    () => payeeCalls.filter((call) => call.type === 'crypto'),
    [payeeCalls]
  );

  const [accountQuery, setAccountQuery] = useState('');
  const [accountStatus, setAccountStatus] = useState<ApiStatus | 'all'>('all');
  const [networkFilter, setNetworkFilter] = useState<ChainType | 'all'>('all');
  const [whitelistStatus, setWhitelistStatus] = useState<ApiStatus | 'all'>('all');
  const [detailQuery, setDetailQuery] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayee, setEditingPayee] = useState<PayeeExternalCall | null>(null);
  const [selectedPayee, setSelectedPayee] = useState<PayeeExternalCall | null>(null);
  const [confirmAction, setConfirmAction] = useState<PendingAction | null>(null);
  const [emailAction, setEmailAction] = useState<PendingAction | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [form, setForm] = useState<WhitelistForm>({
    name: '',
    network: 'TRC20',
    address: '',
    purpose: '',
  });

  const selectedAccount = useMemo(
    () => cryptoAccounts.find((account) => account.id === selectedAccountId) ?? null,
    [cryptoAccounts, selectedAccountId]
  );

  const selectedAccountPayees = useMemo(
    () => cryptoPayees.filter((payee) => payee.accountId === selectedAccountId),
    [cryptoPayees, selectedAccountId]
  );

  const overallCounts = getCounts(cryptoPayees);
  const detailCounts = getCounts(selectedAccountPayees);

  useEffect(() => {
    if (!selectedPayee) return;

    setSelectedPayee(cryptoPayees.find((payee) => payee.id === selectedPayee.id) ?? null);
  }, [cryptoPayees, selectedPayee]);

  const filteredAccounts = useMemo(
    () =>
      cryptoAccounts.filter((account) => {
        const payees = cryptoPayees.filter((item) => item.accountId === account.id);
        const text = [account.name, account.accountId, account.id].join(' ').toLowerCase();
        const matchesQuery = text.includes(accountQuery.toLowerCase());
        const matchesStatus = accountStatus === 'all' || account.status === accountStatus;
        const matchesNetwork =
          networkFilter === 'all' || payees.some((payee) => getPayeeChain(payee) === networkFilter);
        const matchesWhitelistStatus =
          whitelistStatus === 'all' || payees.some((payee) => payee.status === whitelistStatus);

        return matchesQuery && matchesStatus && matchesNetwork && matchesWhitelistStatus;
      }),
    [accountQuery, accountStatus, cryptoAccounts, cryptoPayees, networkFilter, whitelistStatus]
  );

  const filteredDetailPayees = useMemo(
    () =>
      selectedAccountPayees.filter((payee) => {
        const text = [payee.name, payee.referenceId, getPayeeAddress(payee), payee.purpose]
          .join(' ')
          .toLowerCase();
        const matchesQuery = text.includes(detailQuery.toLowerCase());
        const matchesNetwork = networkFilter === 'all' || getPayeeChain(payee) === networkFilter;
        const matchesStatus = whitelistStatus === 'all' || payee.status === whitelistStatus;

        return matchesQuery && matchesNetwork && matchesStatus;
      }),
    [detailQuery, networkFilter, selectedAccountPayees, whitelistStatus]
  );

  const resetForm = () => {
    setForm({
      name: '',
      network: 'TRC20',
      address: '',
      purpose: '',
    });
    setEditingPayee(null);
  };

  const openCreateDrawer = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditDrawer = (payee: PayeeExternalCall) => {
    setEditingPayee(payee);
    setForm({
      name: payee.name,
      network: getPayeeChain(payee),
      address: getPayeeAddress(payee),
      purpose: payee.purpose ?? '',
    });
    setFormOpen(true);
  };

  const sameAccountDuplicate = selectedAccountPayees.some(
    (payee) =>
      payee.id !== editingPayee?.id &&
      getPayeeChain(payee) === form.network &&
      getPayeeAddress(payee).toLowerCase() === normalizeAddress(form.address).toLowerCase()
  );

  const otherAccountDuplicate = cryptoPayees.some(
    (payee) =>
      payee.accountId !== selectedAccountId &&
      getPayeeChain(payee) === form.network &&
      getPayeeAddress(payee).toLowerCase() === normalizeAddress(form.address).toLowerCase()
  );

  const addressError = editingPayee ? '' : validateAddress(form.network, form.address);
  const nameError = !form.name.trim() ? '白名单名称必填' : '';
  const submitDisabled = !!nameError || !!addressError || sameAccountDuplicate || !selectedAccount;

  const runWithEmail = (action: PendingAction) => {
    setConfirmAction(action);
  };

  const handleConfirmedAction = () => {
    if (!confirmAction) return;

    setEmailAction(confirmAction);
    setConfirmAction(null);
  };

  const handleVerifiedAction = async () => {
    if (!emailAction) return;

    setOperationLoading(true);
    try {
      await emailAction.run();
      setEmailAction(null);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleSubmitForm = () => {
    if (!selectedAccount || submitDisabled) return;

    if (editingPayee) {
      runWithEmail({
        operation: 'update',
        targetId: editingPayee.id,
        title: '确认编辑白名单地址',
        confirmLabel: '确认编辑',
        description: '本次仅修改白名单名称和用途备注。链上地址与网络不可直接修改。',
        run: async () => {
          await updateCryptoWhitelistAddress({
            id: editingPayee.id,
            name: form.name.trim(),
            purpose: form.purpose.trim(),
          });
          toast.success('白名单地址已更新');
          setFormOpen(false);
          resetForm();
        },
      });
      return;
    }

    runWithEmail({
      operation: 'create',
      title: '确认新增白名单地址',
      confirmLabel: '确认新增',
      description: (
        <Stack spacing={1}>
          <Typography variant="body2">新增后会进入待同步/处理中状态。</Typography>
          {otherAccountDuplicate && (
            <Alert severity="warning">
              该地址已存在于其他账户，请确认当前业务确实需要继续添加。
            </Alert>
          )}
        </Stack>
      ),
      run: async () => {
        await createCryptoWhitelistAddress({
          accountId: selectedAccount.id,
          network: form.network,
          name: form.name.trim(),
          address: normalizeAddress(form.address),
          purpose: form.purpose.trim(),
        });
        toast.success('白名单地址已创建，正在同步');
        setFormOpen(false);
        resetForm();
      },
    });
  };

  const handleDelete = (payee: PayeeExternalCall) => {
    runWithEmail({
      operation: 'delete',
      targetId: payee.id,
      title: '确认删除白名单地址',
      confirmLabel: '确认删除',
      description:
        '删除后该地址不可再用于数字货币出金，重新添加需要再次邮箱验证。该操作不可撤销。',
      run: async () => {
        await deleteCryptoWhitelistAddress(payee.id);
        toast.success('白名单地址已删除');
        setSelectedPayee(null);
      },
    });
  };

  const handleRetry = (payee: PayeeExternalCall) => {
    runWithEmail({
      operation: 'retry_sync',
      targetId: payee.id,
      title: '确认重试同步',
      confirmLabel: '确认重试',
      description: '系统将重新同步该白名单地址，成功后状态会流转为已完成。',
      run: async () => {
        await retryCryptoWhitelistSync(payee.id);
        toast.success('已发起同步重试');
      },
    });
  };

  const handleToggleDisabled = (payee: PayeeExternalCall) => {
    const nextStatus = payee.status === 'disabled' ? 'completed' : 'disabled';

    runWithEmail({
      operation: payee.status === 'disabled' ? 'enable' : 'disable',
      targetId: payee.id,
      title: payee.status === 'disabled' ? '确认重新启用地址' : '确认禁用地址',
      confirmLabel: payee.status === 'disabled' ? '确认启用' : '确认禁用',
      description:
        payee.status === 'disabled'
          ? '启用后该地址可重新用于数字货币出金。'
          : '禁用后该地址不会出现在数字货币出金可选地址中。',
      run: async () => {
        setCryptoWhitelistStatus(payee.id, nextStatus);
        toast.success(nextStatus === 'disabled' ? '白名单地址已禁用' : '白名单地址已启用');
      },
    });
  };

  const canEdit = (payee: PayeeExternalCall) =>
    payee.status === 'completed' || payee.status === 'failed' || payee.status === 'disabled';

  const canDelete = (payee: PayeeExternalCall) =>
    payee.status === 'completed' ||
    payee.status === 'failed' ||
    payee.status === 'disabled' ||
    payee.status === 'pending_email_verification';

  const accountRows = filteredAccounts.map((account) => {
    const payees = cryptoPayees.filter((item) => item.accountId === account.id);
    const counts = getCounts(payees);

    return {
      account,
      payees,
      counts,
      updatedAt: getLatestUpdate(payees, account),
      networks: Array.from(new Set(payees.map(getPayeeChain))),
    };
  });

  const renderAccountOverview = () => {
    const overviewStats: Array<{ label: string; value: number; icon: IconifyName }> = [
      { label: '账户总数', value: cryptoAccounts.length, icon: 'solar:wad-of-money-bold' },
      { label: '白名单地址总数', value: overallCounts.total, icon: 'solar:shield-check-bold' },
      { label: '待邮箱验证', value: overallCounts.pendingEmail, icon: 'solar:letter-bold' },
      {
        label: '待同步/处理中',
        value: overallCounts.pendingSync + overallCounts.processing,
        icon: 'solar:settings-bold',
      },
      { label: '已完成', value: overallCounts.completed, icon: 'solar:check-circle-bold' },
    ];

    return (
      <>
      <ActionBar
        title="数字货币白名单管理"
        description="统一维护各账户的 USDT 出金地址，所有新增、编辑、删除操作均需邮箱验证码确认。"
      >
        <Button
          component={RouterLink}
          href={paths.dashboard.baas.crypto}
          variant="outlined"
          color="inherit"
          startIcon={<Iconify icon="solar:export-bold" />}
        >
          去数字货币出金
        </Button>
      </ActionBar>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {overviewStats.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={1.25}>
                  <Iconify icon={item.icon} width={28} />
                  <Typography variant="h4">{item.value}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item.label}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '2fr repeat(3, 1fr)' },
            }}
          >
            <TextField
              size="small"
              label="搜索账户名称 / Account ID"
              value={accountQuery}
              onChange={(event) => setAccountQuery(event.target.value)}
            />
            <TextField
              select
              size="small"
              label="账户状态"
              value={accountStatus}
              onChange={(event) => setAccountStatus(event.target.value as ApiStatus | 'all')}
            >
              {accountStatusOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item === 'all' ? '全部账户状态' : <StatusChip status={item} />}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="网络"
              value={networkFilter}
              onChange={(event) => setNetworkFilter(event.target.value as ChainType | 'all')}
            >
              <MenuItem value="all">全部网络</MenuItem>
              <MenuItem value="TRC20">TRC20</MenuItem>
              <MenuItem value="ERC20">ERC20</MenuItem>
            </TextField>
            <TextField
              select
              size="small"
              label="白名单状态"
              value={whitelistStatus}
              onChange={(event) => setWhitelistStatus(event.target.value as ApiStatus | 'all')}
            >
              {whitelistStatusOptions.map((item) => (
                <MenuItem key={item} value={item}>
                  {item === 'all' ? '全部白名单状态' : <StatusChip status={item} />}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </CardContent>
      </Card>

      <DataTable
        title="所有可出金账户"
        rows={accountRows}
        rowKey={(row) => row.account.id}
        onRowClick={(row) => setSelectedAccountId(row.account.id)}
        emptyText="暂无匹配账户"
        emptyDescription="可调整账户状态、网络或白名单状态筛选条件。"
        columns={[
          {
            id: 'account',
            label: '账户名称',
            width: 220,
            render: (row) => (
              <Stack spacing={0.25}>
                <Typography variant="body2">{row.account.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.account.accountId} / {row.account.id}
                </Typography>
              </Stack>
            ),
          },
          {
            id: 'status',
            label: '账户状态',
            width: 120,
            render: (row) => <StatusChip status={row.account.status} />,
          },
          {
            id: 'network',
            label: '支持网络',
            width: 150,
            render: (row) =>
              row.networks.length ? (
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  {row.networks.map((network) => (
                    <Chip
                      key={network}
                      size="small"
                      label={network}
                      color={network === 'TRC20' ? 'success' : 'info'}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              ) : (
                '待添加'
              ),
          },
          { id: 'total', label: '地址数量', width: 100, render: (row) => row.counts.total },
          {
            id: 'stats',
            label: '待验证 / 待同步 / 已完成',
            width: 220,
            render: (row) =>
              `${row.counts.pendingEmail} / ${row.counts.pendingSync + row.counts.processing} / ${
                row.counts.completed
              }`,
          },
          {
            id: 'updatedAt',
            label: '最近更新时间',
            width: 160,
            render: (row) => formatDateTime(row.updatedAt),
          },
          {
            id: 'action',
            label: '',
            align: 'right',
            render: (row) => (
              <Button
                size="small"
                color="inherit"
                endIcon={<Iconify icon="solar:forward-bold" />}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedAccountId(row.account.id);
                }}
              >
                查看白名单
              </Button>
            ),
          },
        ]}
      />
    </>
    );
  };

  const renderAccountDetail = () => {
    if (!selectedAccount) return null;

    return (
      <>
        <ActionBar
          title="账户白名单详情"
          description="仅在当前账户内新增、编辑、删除数字货币白名单地址。"
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              color="inherit"
              variant="outlined"
              startIcon={<Iconify icon="solar:multiple-forward-left-broken" />}
              onClick={() => {
                setSelectedAccountId(null);
                setDetailQuery('');
              }}
            >
              返回账户列表
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={openCreateDrawer}
            >
              新增白名单地址
            </Button>
          </Stack>
        </ActionBar>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Iconify icon="solar:wad-of-money-bold" width={32} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" noWrap>
                        {selectedAccount.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {selectedAccount.accountId} / {selectedAccount.id}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ borderStyle: 'dashed' }} />
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      账户状态
                    </Typography>
                    <StatusChip status={selectedAccount.status} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      数字货币能力
                    </Typography>
                    <Typography variant="body2">
                      {selectedAccount.cryptoEnabled ? '已启用' : '未启用'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      最近更新时间
                    </Typography>
                    <Typography variant="body2">
                      {formatDateTime(getLatestUpdate(selectedAccountPayees, selectedAccount))}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  }}
                >
                  {[
                    { label: '白名单总数', value: detailCounts.total },
                    { label: 'TRC20 / ERC20', value: `${detailCounts.trc20}/${detailCounts.erc20}` },
                    { label: '待邮箱验证', value: detailCounts.pendingEmail },
                    { label: '待同步', value: detailCounts.pendingSync + detailCounts.processing },
                    { label: '已完成', value: detailCounts.completed },
                    { label: '失败', value: detailCounts.failed },
                    { label: '已禁用', value: detailCounts.disabled },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography variant="h5">{item.value}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
              }}
            >
              <TextField
                size="small"
                label="搜索名称 / 地址 / Reference ID"
                value={detailQuery}
                onChange={(event) => setDetailQuery(event.target.value)}
              />
              <TextField
                select
                size="small"
                label="网络"
                value={networkFilter}
                onChange={(event) => setNetworkFilter(event.target.value as ChainType | 'all')}
              >
                <MenuItem value="all">全部网络</MenuItem>
                <MenuItem value="TRC20">TRC20</MenuItem>
                <MenuItem value="ERC20">ERC20</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="状态"
                value={whitelistStatus}
                onChange={(event) => setWhitelistStatus(event.target.value as ApiStatus | 'all')}
              >
                {whitelistStatusOptions.map((item) => (
                  <MenuItem key={item} value={item}>
                    {item === 'all' ? '全部状态' : <StatusChip status={item} />}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </CardContent>
        </Card>

        <DataTable
          title="白名单地址"
          rows={filteredDetailPayees}
          rowKey={(row) => row.id}
          emptyText="暂无白名单地址"
          emptyDescription="点击右上角新增白名单地址，完成邮箱验证后将自动进入同步流程。"
          onRowClick={(row) => setSelectedPayee(row)}
          columns={[
            {
              id: 'name',
              label: '白名单名称',
              width: 190,
              render: (row) => (
                <Stack spacing={0.25}>
                  <Typography variant="body2">{row.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {row.referenceId}
                  </Typography>
                </Stack>
              ),
            },
            {
              id: 'network',
              label: '网络',
              width: 100,
              render: (row) => getPayeeChain(row),
            },
            {
              id: 'address',
              label: '链上地址',
              width: 230,
              render: (row) => (
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {shortenAddress(getPayeeAddress(row))}
                </Typography>
              ),
            },
            { id: 'status', label: '状态', width: 120, render: (row) => <StatusChip status={row.status} /> },
            {
              id: 'updatedAt',
              label: '更新时间',
              width: 150,
              render: (row) => formatDateTime(row.updatedAt ?? row.createdAt),
            },
            {
              id: 'actions',
              label: '',
              align: 'right',
              render: (row) => (
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  {row.status === 'completed' && (
                    <Button
                      component={RouterLink}
                      href={buildQueryHref(paths.dashboard.baas.crypto, {
                        accountId: row.accountId,
                        network: getPayeeChain(row),
                        payeeId: row.id,
                      })}
                      size="small"
                      color="warning"
                      onClick={(event) => event.stopPropagation()}
                    >
                      出金
                    </Button>
                  )}
                  <Button
                    size="small"
                    color="inherit"
                    disabled={!canEdit(row)}
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditDrawer(row);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    disabled={!canDelete(row)}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(row);
                    }}
                  >
                    删除
                  </Button>
                </Stack>
              ),
            },
          ]}
        />
      </>
    );
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="数字货币白名单管理"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '数字货币白名单管理' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {selectedAccount ? renderAccountDetail() : renderAccountOverview()}

      <DetailDrawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          resetForm();
        }}
        title={editingPayee ? '编辑白名单地址' : '新增白名单地址'}
        subtitle={selectedAccount ? `${selectedAccount.name} · ${selectedAccount.accountId}` : ''}
        actions={
          <Alert severity="info">
            链上地址和网络创建后不可直接修改。如需修改地址，请删除后重新添加并再次验证。
          </Alert>
        }
      >
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            size="small"
            label="白名单名称"
            value={form.name}
            error={!!nameError}
            helperText={nameError}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />

          <ToggleButtonGroup
            exclusive
            fullWidth
            color="primary"
            value={form.network}
            disabled={!!editingPayee}
            onChange={(_, value: ChainType | null) => {
              if (value) setForm((current) => ({ ...current, network: value, address: '' }));
            }}
          >
            {(Object.keys(CHAIN_OPTIONS) as ChainType[]).map((item) => (
              <ToggleButton key={item} value={item} sx={{ py: 1.2 }}>
                <Stack spacing={0.25} alignItems="center">
                  <Iconify icon={CHAIN_OPTIONS[item].icon} width={22} />
                  <Typography variant="subtitle2">{CHAIN_OPTIONS[item].label}</Typography>
                </Stack>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Alert severity="info" icon={<Iconify icon="solar:info-circle-bold" />}>
            {CHAIN_OPTIONS[form.network].helper}
          </Alert>

          <TextField
            fullWidth
            size="small"
            label="链上地址"
            value={form.address}
            disabled={!!editingPayee}
            placeholder={form.network === 'TRC20' ? 'T...' : '0x...'}
            error={!!addressError || sameAccountDuplicate}
            helperText={
              sameAccountDuplicate
                ? '同一账户下不允许重复地址'
                : addressError ||
                  (otherAccountDuplicate
                    ? '该地址已存在于其他账户，请确认是否继续'
                    : '提交后将进入邮箱验证流程')
            }
            onChange={(event) =>
              setForm((current) => ({ ...current, address: event.target.value }))
            }
          />

          <TextField
            fullWidth
            multiline
            minRows={3}
            size="small"
            label="用途备注"
            value={form.purpose}
            onChange={(event) =>
              setForm((current) => ({ ...current, purpose: event.target.value }))
            }
          />

          <Button
            fullWidth
            size="large"
            variant="contained"
            disabled={submitDisabled || operationLoading}
            startIcon={
              <Iconify icon={editingPayee ? 'solar:pen-bold' : 'solar:add-circle-bold'} />
            }
            onClick={handleSubmitForm}
          >
            {editingPayee ? '保存修改' : '提交新增'}
          </Button>
        </Stack>
      </DetailDrawer>

      <DetailDrawer
        open={!!selectedPayee}
        onClose={() => setSelectedPayee(null)}
        title={selectedPayee?.name ?? '白名单详情'}
        subtitle={selectedPayee ? selectedPayee.referenceId : ''}
        actions={
          selectedPayee && (
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button
                size="small"
                variant="outlined"
                disabled={!canEdit(selectedPayee)}
                onClick={() => openEditDrawer(selectedPayee)}
              >
                编辑
              </Button>
              <Button
                size="small"
                variant="outlined"
                color={selectedPayee.status === 'disabled' ? 'success' : 'warning'}
                disabled={selectedPayee.status !== 'completed' && selectedPayee.status !== 'disabled'}
                onClick={() => handleToggleDisabled(selectedPayee)}
              >
                {selectedPayee.status === 'disabled' ? '启用' : '禁用'}
              </Button>
              {selectedPayee.status === 'failed' && (
                <Button size="small" variant="outlined" onClick={() => handleRetry(selectedPayee)}>
                  重试同步
                </Button>
              )}
              {selectedPayee.status === 'completed' && (
                <Button
                  component={RouterLink}
                  size="small"
                  variant="contained"
                  color="warning"
                  href={buildQueryHref(paths.dashboard.baas.crypto, {
                    accountId: selectedPayee.accountId,
                    network: getPayeeChain(selectedPayee),
                    payeeId: selectedPayee.id,
                  })}
                >
                  发起出金
                </Button>
              )}
              <IconButton color="error" disabled={!canDelete(selectedPayee)} onClick={() => handleDelete(selectedPayee)}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Stack>
          )
        }
      >
        {selectedPayee && (
          <Stack spacing={2}>
            {[
              { label: '白名单名称', value: selectedPayee.name },
              { label: '绑定账户', value: selectedAccount?.name ?? selectedPayee.accountId },
              { label: '网络', value: getPayeeChain(selectedPayee) },
              { label: '完整链上地址', value: getPayeeAddress(selectedPayee), mono: true },
              { label: '状态', value: <StatusChip status={selectedPayee.status} /> },
              { label: '创建时间', value: formatDateTime(selectedPayee.createdAt) },
              {
                label: '更新时间',
                value: formatDateTime(selectedPayee.updatedAt ?? selectedPayee.createdAt),
              },
              { label: '创建人', value: selectedPayee.createdBy ?? 'demo.operator@fidere.local' },
              {
                label: '最近一次邮箱验证时间',
                value: selectedPayee.lastEmailVerifiedAt
                  ? formatDateTime(selectedPayee.lastEmailVerifiedAt)
                  : '暂无',
              },
              {
                label: '最近一次同步时间',
                value: selectedPayee.lastSyncedAt ? formatDateTime(selectedPayee.lastSyncedAt) : '暂无',
              },
              { label: '用途备注', value: selectedPayee.purpose || '暂无' },
            ].map((item) => (
              <Stack key={item.label} spacing={0.5}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Typography
                  component="div"
                  variant="body2"
                  sx={{ wordBreak: 'break-all', ...(item.mono && { fontFamily: 'monospace' }) }}
                >
                  {item.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title}
        content={confirmAction?.description}
        action={
          <Button
            variant="contained"
            color={confirmAction?.operation === 'delete' ? 'error' : 'primary'}
            onClick={handleConfirmedAction}
          >
            {confirmAction?.confirmLabel ?? '确认'}
          </Button>
        }
      />

      <EmailVerificationDialog
        open={!!emailAction}
        action={emailAction}
        onClose={() => setEmailAction(null)}
        onVerified={handleVerifiedAction}
      />
    </DashboardContent>
  );
}
