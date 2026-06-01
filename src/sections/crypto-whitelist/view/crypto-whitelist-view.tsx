'use client';

import type { ApiStatus } from 'src/types/common';
import type { PayeeExternalCall } from 'src/types/payee';
import type { IconifyName } from 'src/components/iconify';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { formatDateTime } from 'src/utils/baas-format';
import { buildQueryHref } from 'src/utils/baas-navigation';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ActionBar, DataTable, StatusChip } from 'src/components/common';

// ----------------------------------------------------------------------

type ChainType = 'TRC20' | 'ERC20';

type WhitelistForm = {
  accountId: string;
  name: string;
  chain: ChainType;
  address: string;
  purpose: string;
};

const CHAIN_OPTIONS: Record<ChainType, { label: string; helper: string; icon: IconifyName }> = {
  TRC20: {
    label: 'TRC20',
    helper: '低手续费，适合日常 USDT 出金',
    icon: 'solar:verified-check-bold',
  },
  ERC20: {
    label: 'ERC20',
    helper: '适合以太坊生态收款方',
    icon: 'solar:settings-bold',
  },
};

const getPayeeChain = (destination: string): ChainType =>
  destination.toUpperCase().startsWith('ERC20') ? 'ERC20' : 'TRC20';

const formatDestination = (destination: string) => destination.replace(/^TRON\s+/i, 'TRC20 ');

const normalizeDestination = (chain: ChainType, address: string) =>
  `${chain === 'TRC20' ? 'TRON' : 'ERC20'} ${address.trim()}`;

const shortenDestination = (destination: string) => {
  const formatted = formatDestination(destination);
  const [chain, address = ''] = formatted.split(' ');

  if (address.length <= 14) {
    return formatted;
  }

  return `${chain} ${address.slice(0, 8)}...${address.slice(-6)}`;
};

const statusOptions: Array<ApiStatus | 'all'> = ['all', 'completed', 'pending', 'failed'];

// ----------------------------------------------------------------------

export function CryptoWhitelistView() {
  const { globalAccounts, payeeCalls, createPayeeExternalCall } = useBaasDemo();

  const cryptoAccounts = useMemo(
    () => globalAccounts.filter((account) => account.status === 'active' && account.cryptoEnabled),
    [globalAccounts]
  );

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<ApiStatus | 'all'>('all');
  const [chain, setChain] = useState<ChainType | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WhitelistForm>(() => ({
    accountId: cryptoAccounts[0]?.id ?? '',
    name: '',
    chain: 'TRC20',
    address: '',
    purpose: '',
  }));

  useEffect(() => {
    if (!form.accountId && cryptoAccounts[0]?.id) {
      setForm((current) => ({ ...current, accountId: cryptoAccounts[0].id }));
    }
  }, [cryptoAccounts, form.accountId]);

  const cryptoPayees = useMemo(
    () => payeeCalls.filter((call) => call.type === 'crypto'),
    [payeeCalls]
  );

  const accountNameById = useMemo(
    () => new Map(globalAccounts.map((account) => [account.id, account.name])),
    [globalAccounts]
  );

  const filteredPayees = useMemo(
    () =>
      cryptoPayees.filter((payee) => {
        const payeeChain = getPayeeChain(payee.destination);
        const matchesQuery = [payee.name, payee.destination, payee.referenceId]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus = status === 'all' || payee.status === status;
        const matchesChain = chain === 'all' || payeeChain === chain;
        const matchesAccount = accountFilter === 'all' || payee.accountId === accountFilter;

        return matchesQuery && matchesStatus && matchesChain && matchesAccount;
      }),
    [accountFilter, chain, cryptoPayees, query, status]
  );

  const completedCount = cryptoPayees.filter((payee) => payee.status === 'completed').length;
  const pendingCount = cryptoPayees.filter((payee) => payee.status === 'pending').length;
  const trc20Count = cryptoPayees.filter(
    (payee) => getPayeeChain(payee.destination) === 'TRC20'
  ).length;
  const erc20Count = cryptoPayees.length - trc20Count;

  const selectedAccount = cryptoAccounts.find((account) => account.id === form.accountId);
  const normalizedDestination = normalizeDestination(form.chain, form.address);
  const duplicateAddress = cryptoPayees.some(
    (payee) =>
      payee.accountId === form.accountId &&
      formatDestination(payee.destination).toLowerCase() ===
        formatDestination(normalizedDestination).toLowerCase()
  );
  const addressInvalid =
    form.address.trim().length < 12 ||
    (form.chain === 'TRC20' && !form.address.trim().toUpperCase().startsWith('T')) ||
    (form.chain === 'ERC20' && !form.address.trim().toLowerCase().startsWith('0x'));
  const submitDisabled = !form.accountId || !form.name.trim() || addressInvalid || duplicateAddress;

  const handleCreate = async () => {
    if (submitDisabled) return;

    setSubmitting(true);
    try {
      const nextPayee = await createPayeeExternalCall({
        accountId: form.accountId,
        type: 'crypto',
        name: form.name.trim(),
        currency: 'USDT',
        destination: normalizedDestination,
      });

      toast.success('白名单地址已创建，可在数字货币出金中选择', {
        action: {
          label: '出金',
          onClick: () =>
            window.location.assign(
              buildQueryHref(paths.dashboard.baas.crypto, { accountId: nextPayee.accountId })
            ),
        },
      });

      setForm((current) => ({
        ...current,
        name: '',
        address: '',
        purpose: '',
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const renderAccount = (row: PayeeExternalCall) => (
    <Stack spacing={0.25}>
      <Typography variant="body2">{accountNameById.get(row.accountId) ?? row.accountId}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {row.accountId}
      </Typography>
    </Stack>
  );

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

      <ActionBar
        title="数字货币白名单管理"
        description="统一维护 USDT 出金地址，先完成账户、链网络与地址校验，再交给数字货币出金流程使用。"
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            component={RouterLink}
            href={paths.dashboard.baas.crypto}
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:export-bold" />}
          >
            去数字货币出金
          </Button>
        </Stack>
      </ActionBar>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Iconify icon="solar:shield-check-bold" width={34} />
                <Typography variant="h4">{cryptoPayees.length}</Typography>
                <Typography variant="subtitle2">白名单地址总数</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {completedCount} 个已完成，{pendingCount} 个待同步。地址创建后会同步到出金表单。
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Iconify icon="solar:settings-bold" width={34} />
                <Typography variant="h4">
                  {trc20Count}/{erc20Count}
                </Typography>
                <Typography variant="subtitle2">TRC20 / ERC20</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  让运营先按链网络筛查，避免把低费率地址和以太坊地址混用。
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Iconify icon="solar:bill-list-bold" width={34} />
                  <Box>
                    <Typography variant="subtitle1">新增前置检查</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      地址格式、重复地址、账户启用状态会在提交前即时拦截。
                    </Typography>
                  </Box>
                </Stack>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <Box
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  }}
                >
                  {['账户已激活', '链网络匹配', '地址未重复'].map((item) => (
                    <Stack key={item} direction="row" spacing={1} alignItems="center">
                      <Iconify icon="solar:check-circle-bold" sx={{ color: 'success.main' }} />
                      <Typography variant="body2">{item}</Typography>
                    </Stack>
                  ))}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardHeader
              title="新增白名单地址"
              subheader="创建后将作为数字货币出金的可选收款方"
              avatar={<Iconify icon="solar:add-circle-bold" width={28} />}
            />
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="绑定账户"
                  value={form.accountId}
                  onChange={(event) => setForm({ ...form, accountId: event.target.value })}
                  helperText={
                    selectedAccount
                      ? `${selectedAccount.name} 已启用数字货币`
                      : '暂无已启用数字货币的活跃账户'
                  }
                >
                  {cryptoAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  size="small"
                  label="白名单名称"
                  value={form.name}
                  placeholder="例如 Treasury Cold Wallet"
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />

                <ToggleButtonGroup
                  exclusive
                  fullWidth
                  color="primary"
                  value={form.chain}
                  onChange={(_, value: ChainType | null) => {
                    if (value) {
                      setForm({ ...form, chain: value, address: '' });
                    }
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
                  {CHAIN_OPTIONS[form.chain].helper}
                </Alert>

                <TextField
                  fullWidth
                  size="small"
                  label="链上地址"
                  value={form.address}
                  placeholder={form.chain === 'TRC20' ? 'T...' : '0x...'}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  error={addressInvalid && form.address.length > 0}
                  helperText={
                    duplicateAddress
                      ? '该账户下已存在相同白名单地址'
                      : addressInvalid && form.address.length > 0
                        ? `${form.chain} 地址格式不正确`
                        : '提交前会自动补充链网络前缀'
                  }
                />

                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  size="small"
                  label="用途备注"
                  value={form.purpose}
                  placeholder="例如：月度资金归集、供应商结算、冷钱包转移"
                  onChange={(event) => setForm({ ...form, purpose: event.target.value })}
                />

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  startIcon={<Iconify icon="solar:user-plus-bold" />}
                  disabled={submitDisabled || submitting}
                  onClick={handleCreate}
                >
                  创建白名单
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  }}
                >
                  <TextField
                    select
                    size="small"
                    label="账户"
                    value={accountFilter}
                    onChange={(event) => setAccountFilter(event.target.value)}
                  >
                    <MenuItem value="all">全部账户</MenuItem>
                    {cryptoAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="链网络"
                    value={chain}
                    onChange={(event) => setChain(event.target.value as ChainType | 'all')}
                  >
                    <MenuItem value="all">全部链网络</MenuItem>
                    <MenuItem value="TRC20">TRC20</MenuItem>
                    <MenuItem value="ERC20">ERC20</MenuItem>
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="状态"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as ApiStatus | 'all')}
                  >
                    {statusOptions.map((item) => (
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
              rows={filteredPayees}
              rowKey={(row) => row.id}
              search={query}
              onSearch={setQuery}
              emptyText="暂无匹配的白名单地址"
              emptyDescription="可调整筛选条件，或先在左侧新增一个 USDT 白名单地址。"
              columns={[
                {
                  id: 'name',
                  label: '白名单名称',
                  width: 180,
                  render: (row) => (
                    <Stack spacing={0.25}>
                      <Typography variant="body2">{row.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {row.referenceId}
                      </Typography>
                    </Stack>
                  ),
                },
                { id: 'account', label: '绑定账户', width: 150, render: renderAccount },
                {
                  id: 'chain',
                  label: '链网络',
                  width: 110,
                  render: (row) => (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Iconify
                        icon={CHAIN_OPTIONS[getPayeeChain(row.destination)].icon}
                        width={20}
                      />
                      <Typography variant="body2">{getPayeeChain(row.destination)}</Typography>
                    </Stack>
                  ),
                },
                {
                  id: 'destination',
                  label: '地址',
                  width: 180,
                  render: (row) => (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {shortenDestination(row.destination)}
                    </Typography>
                  ),
                },
                {
                  id: 'status',
                  label: '状态',
                  width: 100,
                  render: (row) => <StatusChip status={row.status} />,
                },
                {
                  id: 'createdAt',
                  label: '创建时间',
                  width: 160,
                  render: (row) => formatDateTime(row.createdAt),
                },
                {
                  id: 'action',
                  label: '',
                  align: 'right',
                  render: (row) => (
                    <Button
                      component={RouterLink}
                      href={buildQueryHref(paths.dashboard.baas.crypto, {
                        accountId: row.accountId,
                      })}
                      size="small"
                      color="inherit"
                      endIcon={<Iconify icon="solar:forward-bold" />}
                    >
                      出金
                    </Button>
                  ),
                },
              ]}
            />
          </Stack>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
