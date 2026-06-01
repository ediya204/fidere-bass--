'use client';

import type { CurrencyCode } from 'src/types/common';
import type { ExternalPayee, PayeeReceivingAccount } from 'src/types/payee';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { buildQueryHref } from 'src/utils/baas-navigation';
import { formatMoney, formatDateTime } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ActionBar, DataTable, StatusChip } from 'src/components/common';

// ----------------------------------------------------------------------

type FiatForm = {
  accountId: string;
  currency: CurrencyCode;
  amount: number;
  simulateFailed: boolean;
  receivingAccountId: string;
  reference: string;
};

const calcFee = (amount: number) => Math.max(amount * 0.001, 5);

const maskAccount = (accountNumber: string, last4?: string) =>
  last4 || accountNumber.length > 4 ? `**** ${last4 ?? accountNumber.slice(-4)}` : accountNumber;

// ----------------------------------------------------------------------

type WhitelistAccountOption = {
  payee: ExternalPayee;
  account: PayeeReceivingAccount;
};

export function FiatView() {
  const router = useRouter();
  const { globalAccounts, externalPayees, transactions, fiatWithdraw } = useBaasDemo();

  const activeAccounts = useMemo(
    () => globalAccounts.filter((account) => account.status === 'active'),
    [globalAccounts]
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FiatForm>(() => {
    const first = globalAccounts.find((account) => account.status === 'active');
    return {
      accountId: first?.id ?? '',
      currency: (first?.fiatBalances[0]?.currency ?? 'USD') as CurrencyCode,
      amount: 1000,
      simulateFailed: false,
      receivingAccountId: '',
      reference: '',
    };
  });

  useEffect(() => {
    if (form.accountId || activeAccounts.length === 0) {
      return;
    }

    const first = activeAccounts[0];
    setForm((current) => ({
      ...current,
      accountId: first.id,
      currency: (first.fiatBalances[0]?.currency ?? current.currency) as CurrencyCode,
    }));
  }, [activeAccounts, form.accountId]);

  const selectedAccount = useMemo(
    () => activeAccounts.find((account) => account.id === form.accountId),
    [activeAccounts, form.accountId]
  );

  const currencyOptions = useMemo(() => selectedAccount?.fiatBalances ?? [], [selectedAccount]);
  const currencySelectValue = currencyOptions.some((balance) => balance.currency === form.currency)
    ? form.currency
    : '';

  useEffect(() => {
    if (currencyOptions.length === 0 || currencySelectValue) {
      return;
    }

    setForm((current) => ({
      ...current,
      currency: currencyOptions[0].currency,
      receivingAccountId: '',
    }));
  }, [currencyOptions, currencySelectValue]);

  const availableBalance = useMemo(() => {
    const balance = selectedAccount?.fiatBalances.find((item) => item.currency === form.currency);
    return balance?.available ?? 0;
  }, [selectedAccount, form.currency]);

  const whitelistAccountOptions = useMemo<WhitelistAccountOption[]>(
    () =>
      externalPayees
        .filter((payee) => payee.status === 'active')
        .flatMap((payee) =>
          payee.accounts
            .filter((account) => account.status === 'active' && account.currency === form.currency)
            .map((account) => ({ payee, account }))
        ),
    [externalPayees, form.currency]
  );

  const selectedWhitelistAccount = useMemo(
    () =>
      whitelistAccountOptions.find((option) => option.account.id === form.receivingAccountId) ??
      null,
    [form.receivingAccountId, whitelistAccountOptions]
  );
  const receivingAccountSelectValue = selectedWhitelistAccount ? form.receivingAccountId : '';

  useEffect(() => {
    if (whitelistAccountOptions.length === 0 || receivingAccountSelectValue) {
      return;
    }

    setForm((current) => ({
      ...current,
      receivingAccountId: whitelistAccountOptions[0]?.account.id ?? '',
    }));
  }, [receivingAccountSelectValue, whitelistAccountOptions]);

  const fee = calcFee(form.amount);
  const netDebit = form.amount + fee;
  const amountInvalid = form.amount <= 0 || form.amount > availableBalance;
  const submitDisabled = !form.accountId || amountInvalid || !selectedWhitelistAccount;

  const handleAccountChange = (accountId: string) => {
    const account = activeAccounts.find((item) => item.id === accountId);
    const nextCurrency = (account?.fiatBalances[0]?.currency ?? form.currency) as CurrencyCode;
    setForm((current) => ({
      ...current,
      accountId,
      currency: nextCurrency,
      receivingAccountId: '',
    }));
  };

  const handleSubmit = async () => {
    if (!selectedWhitelistAccount) {
      toast.error('请选择匹配的白名单收款账户');
      return;
    }

    setSubmitting(true);
    try {
      const { payee, account } = selectedWhitelistAccount;
      const destination = [
        account.country,
        account.bankName,
        account.rail,
        maskAccount(account.accountNumber, account.accountLast4),
      ]
        .filter(Boolean)
        .join(' · ');

      const result = await fiatWithdraw({
        accountId: form.accountId,
        amount: form.amount,
        currency: form.currency,
        payeeName: payee.name,
        destination,
      });

      setConfirmOpen(false);

      if (!result) {
        toast.error('法币出金提交失败：未找到关联实体');
        return;
      }

      const transactionHref = buildQueryHref(paths.dashboard.baas.transactions, {
        accountId: form.accountId,
        transactionId: result.id,
      });

      if (form.simulateFailed) {
        toast.error('法币出金已提交，但外部 Payee 调用模拟失败', {
          action: { label: '查看流水', onClick: () => router.push(transactionHref) },
        });
      } else {
        toast.success('法币出金已提交，外部 Payee 调用已模拟', {
          action: { label: '查看流水', onClick: () => router.push(transactionHref) },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fiatTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'fiat_withdraw'),
    [transactions]
  );

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="法币出金"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '法币出金' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ActionBar
        title="法币出金"
        description="选择已激活的 Global Account，填写收款方信息，系统先模拟外部 Payee 创建，再生成出金交易。"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardHeader
              title="法币出金"
              subheader="资金将从所选账户的可用余额扣除"
              avatar={<Iconify icon="solar:wad-of-money-bold" width={28} />}
            />
            <CardContent>
              <Stack spacing={2.5}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="出金账户"
                  value={form.accountId}
                  onChange={(event) => handleAccountChange(event.target.value)}
                  helperText={
                    selectedAccount
                      ? `可用余额：${formatMoney(availableBalance, form.currency)}`
                      : '请选择一个已激活的账户'
                  }
                >
                  {activeAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" spacing={2}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="币种"
                    value={currencySelectValue}
                    disabled={currencyOptions.length === 0}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        currency: event.target.value as CurrencyCode,
                        receivingAccountId: '',
                      })
                    }
                  >
                    {currencyOptions.map((balance) => (
                      <MenuItem key={balance.currency} value={balance.currency}>
                        {balance.currency}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="出金金额"
                    value={form.amount}
                    onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                    error={amountInvalid}
                    helperText={form.amount > availableBalance ? '金额超出可用余额' : '最低费用 5'}
                  />
                </Stack>

                <FormControlLabel
                  control={
                    <Switch
                      checked={form.simulateFailed}
                      onChange={(event) =>
                        setForm({ ...form, simulateFailed: event.target.checked })
                      }
                    />
                  }
                  label="模拟外部 Payee 调用失败"
                />

                <Divider />

                <Card variant="outlined" sx={{ boxShadow: 'none' }}>
                  <CardHeader
                    title="收款方"
                    subheader="选择与出金币种匹配的白名单账户"
                    titleTypographyProps={{ variant: 'subtitle1' }}
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="白名单账户"
                        value={receivingAccountSelectValue}
                        disabled={whitelistAccountOptions.length === 0}
                        helperText={
                          whitelistAccountOptions.length
                            ? '仅显示与当前出金币种匹配的已激活收款账户'
                            : '当前出金币种暂无可用白名单账户'
                        }
                        onChange={(event) =>
                          setForm({ ...form, receivingAccountId: event.target.value })
                        }
                      >
                        {whitelistAccountOptions.map(({ payee, account }) => (
                          <MenuItem key={account.id} value={account.id}>
                            {payee.name} · {account.bankName} · {account.rail} ·{' '}
                            {maskAccount(account.accountNumber, account.accountLast4)}
                          </MenuItem>
                        ))}
                      </TextField>

                      <Stack direction="row" spacing={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="银行国家/地区"
                          value={selectedWhitelistAccount?.account.country ?? ''}
                          slotProps={{ input: { readOnly: true } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="银行名称"
                          value={selectedWhitelistAccount?.account.bankName ?? ''}
                          slotProps={{ input: { readOnly: true } }}
                        />
                      </Stack>

                      <TextField
                        fullWidth
                        size="small"
                        label="收款人名称"
                        value={selectedWhitelistAccount?.payee.name ?? ''}
                        slotProps={{ input: { readOnly: true } }}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        label="账号"
                        value={selectedWhitelistAccount?.account.accountNumber ?? ''}
                        slotProps={{ input: { readOnly: true } }}
                      />

                      <Stack direction="row" spacing={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="收款通道"
                          value={selectedWhitelistAccount?.account.rail ?? ''}
                          slotProps={{ input: { readOnly: true } }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="账户尾号"
                          value={selectedWhitelistAccount?.account.accountLast4 ?? ''}
                          slotProps={{ input: { readOnly: true } }}
                        />
                      </Stack>

                      <TextField
                        fullWidth
                        size="small"
                        label="备注"
                        value={form.reference}
                        onChange={(event) => setForm({ ...form, reference: event.target.value })}
                      />
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined" sx={{ boxShadow: 'none', bgcolor: 'background.neutral' }}>
                  <CardContent>
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          出金金额
                        </Typography>
                        <Typography variant="body2">
                          {formatMoney(form.amount, form.currency)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          手续费 (0.1%，最低 5)
                        </Typography>
                        <Typography variant="body2">{formatMoney(fee, form.currency)}</Typography>
                      </Stack>
                      <Divider sx={{ borderStyle: 'dashed' }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">净扣款</Typography>
                        <Typography variant="subtitle2">
                          {formatMoney(netDebit, form.currency)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  startIcon={<Iconify icon="solar:export-bold" />}
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitDisabled}
                >
                  提交出金
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            <DataTable
              title="信托白名单账户列表"
              rows={whitelistAccountOptions}
              rowKey={(row) => row.account.id}
              emptyText="暂无信托白名单账户"
              columns={[
                { id: 'name', label: '白名单账户', render: (row) => row.payee.name },
                { id: 'currency', label: '币种', render: (row) => row.account.currency },
                {
                  id: 'bank',
                  label: '银行信息',
                  render: (row) => `${row.account.country ?? '-'} · ${row.account.bankName}`,
                },
                {
                  id: 'accountNumber',
                  label: '账号',
                  render: (row) => maskAccount(row.account.accountNumber, row.account.accountLast4),
                },
                { id: 'rail', label: '收款通道', render: (row) => row.account.rail },
                {
                  id: 'status',
                  label: '状态',
                  render: (row) => <StatusChip status={row.account.status} />,
                },
              ]}
            />

            <DataTable
              title="法币出金交易"
              rows={fiatTransactions}
              rowKey={(row) => row.id}
              emptyText="暂无法币出金交易"
              columns={[
                { id: 'referenceId', label: 'Reference ID', render: (row) => row.referenceId },
                {
                  id: 'amount',
                  label: '金额',
                  render: (row) => formatMoney(row.amount, row.currency),
                },
                { id: 'currency', label: '币种', render: (row) => row.currency },
                { id: 'destination', label: '收款方', render: (row) => row.destination },
                {
                  id: 'status',
                  label: '状态',
                  render: (row) => <StatusChip status={row.status} />,
                },
                {
                  id: 'createdAt',
                  label: '创建时间',
                  render: (row) => formatDateTime(row.createdAt),
                },
              ]}
            />
          </Stack>
        </Grid>
      </Grid>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="确认法币出金"
        content={
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                出金金额
              </Box>
              <Box component="span">{formatMoney(form.amount, form.currency)}</Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                收款方
              </Box>
              <Box component="span">{selectedWhitelistAccount?.payee.name ?? '—'}</Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                手续费
              </Box>
              <Box component="span">{formatMoney(fee, form.currency)}</Box>
            </Stack>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ fontWeight: 'fontWeightSemiBold' }}>
                净扣款
              </Box>
              <Box component="span" sx={{ fontWeight: 'fontWeightSemiBold' }}>
                {formatMoney(netDebit, form.currency)}
              </Box>
            </Stack>
          </Stack>
        }
        action={
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            确认出金
          </Button>
        }
      />
    </DashboardContent>
  );
}
