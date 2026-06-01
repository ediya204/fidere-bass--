'use client';

import type { OTCType } from 'src/types/otc';
import type { CurrencyCode } from 'src/types/common';

import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
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
import { DataTable, StatusChip } from 'src/components/common';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

type FiatCurrency = Extract<CurrencyCode, 'USD' | 'HKD' | 'EUR'>;

const FIAT_OPTIONS: Array<FiatCurrency | 'SGD'> = ['USD', 'HKD', 'SGD', 'EUR'];

const BUY_RATES: Record<FiatCurrency | 'SGD', number> = {
  USD: 0.998,
  HKD: 0.128,
  SGD: 0.74,
  EUR: 1.08,
};

const SELL_RATES: Record<FiatCurrency | 'SGD', number> = {
  USD: 0.997,
  HKD: 7.78,
  SGD: 1.34,
  EUR: 0.92,
};

const FEE_RATE = 0.002;
const FIAT_CURRENCY: FiatCurrency = 'USD';

type OtcForm = {
  accountId: string;
  type: OTCType;
  fromAmount: number;
  simulateFailed: boolean;
};

const formatSignedMoney = (amount: number, currency: CurrencyCode, sign: '+' | '-') =>
  `${sign} ${formatMoney(Math.abs(amount), currency)}`;

export function OtcView() {
  const router = useRouter();
  const { error, globalAccounts, otcTrades, otcTrade, advanceOtcStatus } = useBaasDemo();

  const activeAccounts = useMemo(
    () => globalAccounts.filter((account) => account.status === 'active'),
    [globalAccounts]
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OtcForm>(() => ({
    accountId:
      globalAccounts.find((account) => account.status === 'active')?.id ??
      globalAccounts[0]?.id ??
      '',
    type: 'buy',
    fromAmount: 1000,
    simulateFailed: false,
  }));

  const accounts = activeAccounts.length ? activeAccounts : globalAccounts;
  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === form.accountId),
    [accounts, form.accountId]
  );

  useEffect(() => {
    if (!form.accountId && accounts[0]?.id) {
      setForm((current) => ({ ...current, accountId: accounts[0].id }));
    }
  }, [accounts, form.accountId]);

  const isBuy = form.type === 'buy';
  const fromCurrency: CurrencyCode = isBuy ? FIAT_CURRENCY : 'USDT';
  const toCurrency: CurrencyCode = isBuy ? 'USDT' : FIAT_CURRENCY;
  const rate = isBuy ? BUY_RATES[FIAT_CURRENCY] : SELL_RATES[FIAT_CURRENCY];
  const fee = Number((form.fromAmount * FEE_RATE).toFixed(2));
  const toAmount = Number(((form.fromAmount - fee) * rate).toFixed(2));
  const inverseRate = Number((1 / rate).toFixed(6));

  const fromBalance = useMemo(() => {
    if (!selectedAccount) return 0;
    const balances =
      fromCurrency === 'USDT' ? selectedAccount.cryptoBalances : selectedAccount.fiatBalances;
    return balances.find((item) => item.currency === fromCurrency)?.available ?? 0;
  }, [fromCurrency, selectedAccount]);

  const toBalance = useMemo(() => {
    if (!selectedAccount) return 0;
    const balances =
      toCurrency === 'USDT' ? selectedAccount.cryptoBalances : selectedAccount.fiatBalances;
    return balances.find((item) => item.currency === toCurrency)?.available ?? 0;
  }, [selectedAccount, toCurrency]);

  const amountInvalid = form.fromAmount <= 0 || form.fromAmount > fromBalance;
  const estimatedSettlement = useMemo(() => new Date(Date.now() + 5 * 60_000).toISOString(), []);
  const quoteExpiresAt = useMemo(() => new Date(Date.now() + 60_000).toISOString(), []);

  const handleSubmit = async () => {
    if (!selectedAccount || amountInvalid) return;

    setSubmitting(true);

    try {
      const result = await otcTrade({
        accountId: form.accountId,
        accountName: selectedAccount.name,
        type: form.type,
        fromCurrency,
        toCurrency,
        fromAmount: form.fromAmount,
        toAmount,
        rate,
        inverseRate,
        fee,
        quoteId: `QOTC-${Date.now().toString(36).toUpperCase()}`,
        quoteExpiresAt,
        estimatedSettlement,
      });

      setConfirmOpen(false);

      if (!result) {
        toast.error('OTC 交易提交失败：未找到关联实体');
        return;
      }

      const transactionHref = buildQueryHref(paths.dashboard.baas.transactions, {
        q: result.referenceId,
      });

      if (form.simulateFailed) {
        advanceOtcStatus(result.id);
        advanceOtcStatus(result.id, 'failed');
        toast.warning('OTC 交易已提交，并模拟为失败状态', {
          action: { label: '查看流水', onClick: () => router.push(transactionHref) },
        });
      } else {
        advanceOtcStatus(result.id);
        advanceOtcStatus(result.id, 'completed');
        toast.success('OTC 交易已完成', {
          action: { label: '查看流水', onClick: () => router.push(transactionHref) },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="OTC 操作"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: 'OTC 操作' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.45fr) minmax(340px, 1fr)' },
          alignItems: 'start',
        }}
      >
        <Card sx={{ p: 3, borderRadius: 1 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            指定账户 OTC 买卖
          </Typography>

          <Stack spacing={2.5}>
            <TextField
              select
              fullWidth
              size="small"
              label="账户"
              value={form.accountId}
              onChange={(event) =>
                setForm((current) => ({ ...current, accountId: event.target.value }))
              }
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="方向"
              value={form.type}
              onChange={(event) =>
                setForm((current) => ({ ...current, type: event.target.value as OTCType }))
              }
            >
              <MenuItem value="buy">买入 USDT ← 法币</MenuItem>
              <MenuItem value="sell">卖出 USDT → 法币</MenuItem>
            </TextField>

            <Box
              sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}
            >
              <TextField
                fullWidth
                size="small"
                type="number"
                label="金额"
                value={form.fromAmount}
                error={amountInvalid}
                helperText={
                  form.fromAmount > fromBalance ? `${fromCurrency} 可用余额不足` : undefined
                }
                onChange={(event) =>
                  setForm((current) => ({ ...current, fromAmount: Number(event.target.value) }))
                }
              />
              <TextField
                fullWidth
                disabled
                size="small"
                label="币种对"
                value={`${fromCurrency} → ${toCurrency}`}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={form.simulateFailed}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, simulateFailed: event.target.checked }))
                  }
                />
              }
              label="模拟交易失败"
            />

            <Divider />

            <Button
              fullWidth
              size="large"
              variant="contained"
              loading={submitting}
              disabled={!form.accountId || amountInvalid}
              onClick={() => setConfirmOpen(true)}
              startIcon={<Iconify icon="solar:transfer-horizontal-bold-duotone" />}
              sx={{
                py: 1.35,
                bgcolor: 'grey.900',
                '&:hover': { bgcolor: 'grey.800' },
              }}
            >
              创建 OTC 交易
            </Button>
          </Stack>
        </Card>

        <Stack spacing={2.5}>
          <Card sx={{ p: 3, borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              汇率预览
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  汇率
                </Typography>
                <Typography variant="body2">
                  1 {fromCurrency} = {rate} {toCurrency}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  手续费 ({(FEE_RATE * 100).toFixed(1)}%)
                </Typography>
                <Typography variant="body2">{formatMoney(fee, fromCurrency)}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="subtitle2">卖出</Typography>
                <Typography variant="subtitle2" color="error">
                  {formatSignedMoney(form.fromAmount, fromCurrency, '-')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="subtitle2">获得</Typography>
                <Typography variant="subtitle2" color="success.main">
                  {formatSignedMoney(toAmount, toCurrency, '+')}
                </Typography>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ p: 3, borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              余额影响
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {fromCurrency} 可用
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{formatMoney(fromBalance, fromCurrency)}</Typography>
                  <Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={14} />
                  <Typography
                    variant="body2"
                    color={fromBalance >= form.fromAmount ? 'success.main' : 'error.main'}
                  >
                    {formatMoney(fromBalance - form.fromAmount, fromCurrency)}
                  </Typography>
                </Stack>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {toCurrency} 可用
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2">{formatMoney(toBalance, toCurrency)}</Typography>
                  <Iconify icon="solar:double-alt-arrow-right-bold-duotone" width={14} />
                  <Typography variant="body2" color="success.main">
                    {formatMoney(toBalance + toAmount, toCurrency)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Card>

          <Card sx={{ p: 3, borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
              参考汇率表
            </Typography>
            <Stack spacing={0.5}>
              {FIAT_OPTIONS.map((currency) => (
                <Box
                  key={currency}
                  sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}
                >
                  <Typography variant="caption">
                    {currency} → USDT (买) / USDT → {currency} (卖)
                  </Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {BUY_RATES[currency]} / {SELL_RATES[currency]}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Box>

      <Box sx={{ mt: 3 }}>
        <DataTable
          title="OTC 历史"
          rows={otcTrades}
          rowKey={(row) => row.id}
          columns={[
            {
              id: 'referenceId',
              label: 'Reference ID',
              width: 180,
              render: (row) => row.referenceId,
            },
            { id: 'account', label: '账户', width: 170, render: (row) => row.accountName },
            {
              id: 'type',
              label: '方向',
              width: 140,
              render: (row) => (row.type === 'buy' ? '买入 USDT' : '卖出 USDT'),
            },
            {
              id: 'from',
              label: '卖出',
              width: 150,
              render: (row) => formatMoney(row.fromAmount, row.fromCurrency),
            },
            {
              id: 'to',
              label: '获得',
              width: 150,
              render: (row) => formatMoney(row.toAmount, row.toCurrency),
            },
            { id: 'rate', label: '汇率', width: 110, render: (row) => row.rate },
            {
              id: 'status',
              label: '状态',
              width: 120,
              render: (row) => <StatusChip status={row.status} />,
            },
            {
              id: 'createdAt',
              label: '时间',
              width: 150,
              render: (row) => formatDateTime(row.createdAt),
            },
          ]}
        />
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="确认 OTC 交易"
        content={
          <Stack spacing={1}>
            <Typography>
              {form.type === 'buy' ? '买入' : '卖出'} {formatMoney(form.fromAmount, fromCurrency)} →{' '}
              {formatMoney(toAmount, toCurrency)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              汇率 {rate} · 手续费 {formatMoney(fee, fromCurrency)}
            </Typography>
            {form.simulateFailed && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                本次交易将模拟失败
              </Alert>
            )}
          </Stack>
        }
        action={
          <Button variant="contained" loading={submitting} onClick={handleSubmit}>
            确认
          </Button>
        }
      />
    </DashboardContent>
  );
}
