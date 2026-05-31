'use client';

import { useMemo, useState } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { paths } from 'src/routes/paths';

import { formatMoney, formatDateTime, transactionTypeLabel } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ActionBar, DataTable, StatusChip } from 'src/components/common';

export function CryptoView() {
  const { globalAccounts, transactions, payeeCalls, cryptoWithdraw } = useBaasDemo();
  const cryptoAccounts = globalAccounts.filter((account) => account.cryptoEnabled);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    accountId: cryptoAccounts[0]?.id ?? '',
    amount: 500,
    currency: 'USDT' as const,
    payeeName: 'Treasury Wallet',
    destination: 'TRON TJtQwV6Yh9mYyXkR6m6Lx4Gd4b9ZJz8YLa',
  });

  const cryptoTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type.includes('crypto')),
    [transactions]
  );

  const handleSubmit = async () => {
    const result = await cryptoWithdraw(form);
    setConfirmOpen(false);
    if (result) toast.success('数字货币出金已提交，外部 Payee 调用已模拟');
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="数字货币操作"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '数字货币操作' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ActionBar title="数字货币出金" description="仅展示已激活数字货币能力的 Global Account；Payee 由外部调用模拟创建。">
        <Grid container spacing={1.5} sx={{ maxWidth: 940 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField select fullWidth size="small" label="账户" value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })}>
              {cryptoAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField select fullWidth size="small" label="币种" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as 'USDT' })}>
              <MenuItem value="USDT">USDT</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField fullWidth size="small" type="number" label="金额" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth size="small" label="外部 Payee" value={form.payeeName} onChange={(event) => setForm({ ...form, payeeName: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button fullWidth variant="contained" onClick={() => setConfirmOpen(true)} disabled={!form.accountId || form.amount <= 0}>
              提交出金
            </Button>
          </Grid>
        </Grid>
      </ActionBar>

      <Stack spacing={3}>
        <DataTable
          title="数字货币交易历史"
          rows={cryptoTransactions}
          rowKey={(row) => row.id}
          columns={[
            { id: 'referenceId', label: 'Reference ID', render: (row) => row.referenceId },
            { id: 'type', label: '类型', render: (row) => transactionTypeLabel(row.type) },
            { id: 'amount', label: '金额', render: (row) => formatMoney(row.amount, row.currency) },
            { id: 'destination', label: '目标地址', render: (row) => row.destination },
            { id: 'status', label: '状态', render: (row) => <StatusChip status={row.status} /> },
            { id: 'createdAt', label: '创建时间', render: (row) => formatDateTime(row.createdAt) },
          ]}
        />

        <DataTable
          title="外部 Payee 调用记录"
          rows={payeeCalls.filter((call) => call.type === 'crypto')}
          rowKey={(row) => row.id}
          columns={[
            { id: 'referenceId', label: 'Reference ID', render: (row) => row.referenceId },
            { id: 'name', label: 'Payee', render: (row) => row.name },
            { id: 'destination', label: '目标', render: (row) => row.destination },
            { id: 'status', label: '状态', render: (row) => <StatusChip status={row.status} /> },
          ]}
        />
      </Stack>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="确认数字货币出金"
        content={`将从所选账户出金 ${formatMoney(form.amount, form.currency)} 至 ${form.destination}。`}
        action={
          <Button variant="contained" onClick={handleSubmit}>
            确认
          </Button>
        }
      />
    </DashboardContent>
  );
}
