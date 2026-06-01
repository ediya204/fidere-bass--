'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import RadioGroup from '@mui/material/RadioGroup';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useUrlQueryState } from 'src/routes/hooks';

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

type ChainType = 'TRC20' | 'ERC20';

type CryptoForm = {
  accountId: string;
  chain: ChainType;
  whitelistPayeeId: string;
  memo: string;
  amount: number;
  simulateFailed: boolean;
};

const NETWORK_FEE: Record<ChainType, number> = { TRC20: 1, ERC20: 8 };

const getPayeeChain = (destination: string): ChainType =>
  destination.toUpperCase().startsWith('ERC20') ? 'ERC20' : 'TRC20';

const formatDestination = (destination: string) => destination.replace(/^TRON\s+/i, 'TRC20 ');

// ----------------------------------------------------------------------

export function CryptoView() {
  const router = useRouter();
  const { searchParams } = useUrlQueryState();
  const {
    globalAccounts,
    transactions,
    payeeCalls,
    cryptoWithdraw,
    verifyPayeeEmailCode,
    sendPayeeEmailVerificationCode,
  } = useBaasDemo();
  const requestedAccountId = searchParams.get('accountId');
  const requestedNetwork = searchParams.get('network') as ChainType | null;
  const requestedPayeeId = searchParams.get('payeeId');

  const cryptoAccounts = useMemo(
    () => globalAccounts.filter((account) => account.status === 'active' && account.cryptoEnabled),
    [globalAccounts]
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailCode, setEmailCode] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailExpiresAt, setEmailExpiresAt] = useState('');
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CryptoForm>(() => {
    const first = globalAccounts.find(
      (account) => account.status === 'active' && account.cryptoEnabled
    );
    return {
      accountId: first?.id ?? '',
      chain: 'TRC20',
      whitelistPayeeId: '',
      memo: '',
      amount: 100,
      simulateFailed: false,
    };
  });

  const selectedAccount = useMemo(
    () => cryptoAccounts.find((account) => account.id === form.accountId),
    [cryptoAccounts, form.accountId]
  );

  useEffect(() => {
    if (
      requestedAccountId &&
      requestedAccountId !== form.accountId &&
      cryptoAccounts.some((account) => account.id === requestedAccountId)
    ) {
      setForm((current) => ({
        ...current,
        accountId: requestedAccountId,
        chain:
          requestedNetwork === 'TRC20' || requestedNetwork === 'ERC20'
            ? requestedNetwork
            : current.chain,
        whitelistPayeeId: requestedPayeeId ?? '',
      }));
      return;
    }

    if (
      (requestedNetwork === 'TRC20' || requestedNetwork === 'ERC20') &&
      requestedNetwork !== form.chain
    ) {
      setForm((current) => ({
        ...current,
        chain: requestedNetwork,
        whitelistPayeeId: requestedPayeeId ?? '',
      }));
      return;
    }

    if (!form.accountId && cryptoAccounts[0]?.id) {
      setForm((current) => ({ ...current, accountId: cryptoAccounts[0].id }));
    }
  }, [
    cryptoAccounts,
    form.accountId,
    form.chain,
    requestedAccountId,
    requestedNetwork,
    requestedPayeeId,
  ]);

  const usdtBalance = useMemo(() => {
    const balance = selectedAccount?.cryptoBalances.find((item) => item.currency === 'USDT');
    return balance?.available ?? 0;
  }, [selectedAccount]);

  const cryptoPayeeCalls = useMemo(
    () => payeeCalls.filter((call) => call.type === 'crypto'),
    [payeeCalls]
  );

  const accountWhitelistPayees = useMemo(
    () =>
      cryptoPayeeCalls.filter(
        (call) =>
          call.accountId === form.accountId &&
          call.status === 'completed' &&
          getPayeeChain(call.destination) === form.chain
      ),
    [cryptoPayeeCalls, form.accountId, form.chain]
  );

  const selectedAccountCompletedPayees = useMemo(
    () =>
      cryptoPayeeCalls.filter(
        (call) => call.accountId === form.accountId && call.status === 'completed'
      ),
    [cryptoPayeeCalls, form.accountId]
  );

  const selectedWhitelistPayee = useMemo(
    () => accountWhitelistPayees.find((call) => call.id === form.whitelistPayeeId) ?? null,
    [accountWhitelistPayees, form.whitelistPayeeId]
  );

  useEffect(() => {
    const requestedCompletedPayee = accountWhitelistPayees.find(
      (call) => call.id === requestedPayeeId
    );
    const firstPayeeId = requestedCompletedPayee?.id ?? accountWhitelistPayees[0]?.id ?? '';

    if (
      !form.whitelistPayeeId ||
      !accountWhitelistPayees.some((call) => call.id === form.whitelistPayeeId)
    ) {
      setForm((current) => ({ ...current, whitelistPayeeId: firstPayeeId }));
    }
  }, [accountWhitelistPayees, form.whitelistPayeeId, requestedPayeeId]);

  const networkFee = NETWORK_FEE[form.chain];
  const netDebit = form.amount + networkFee;
  const payeeInvalid = !selectedWhitelistPayee;
  const amountInvalid = form.amount <= 0 || form.amount > usdtBalance;

  const handleAccountChange = (accountId: string) => {
    setForm((current) => ({ ...current, accountId, whitelistPayeeId: '' }));
  };

  const sendEmailCode = useCallback(async () => {
    setSendingEmailCode(true);
    setEmailError('');
    try {
      const result = await sendPayeeEmailVerificationCode({
        operation: 'withdraw',
        targetId: form.whitelistPayeeId,
      });
      setEmailExpiresAt(result.expiresAt);
      setEmailCountdown(60);
      toast.success('邮箱验证码已发送');
    } catch (sendError) {
      setEmailError(sendError instanceof Error ? sendError.message : '验证码发送失败');
    } finally {
      setSendingEmailCode(false);
    }
  }, [form.whitelistPayeeId, sendPayeeEmailVerificationCode]);

  useEffect(() => {
    if (!emailOpen) {
      setEmailCode('');
      setEmailError('');
      setEmailExpiresAt('');
      setEmailCountdown(0);
      return;
    }

    sendEmailCode();
  }, [emailOpen, sendEmailCode]);

  useEffect(() => {
    if (!emailCountdown) return undefined;

    const timer = window.setInterval(() => {
      setEmailCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [emailCountdown]);

  const handleVerifyAndSubmit = async () => {
    if (!emailCode.trim()) {
      setEmailError('请输入邮箱验证码');
      return;
    }

    setVerifyingEmailCode(true);
    setEmailError('');
    try {
      await verifyPayeeEmailCode(emailCode.trim());
      await handleSubmit();
      setEmailOpen(false);
    } catch (verifyError) {
      setEmailError(verifyError instanceof Error ? verifyError.message : '邮箱验证码校验失败');
    } finally {
      setVerifyingEmailCode(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (!selectedWhitelistPayee) return;

      const destination = `${formatDestination(selectedWhitelistPayee.destination)}${
        form.memo ? ` (memo: ${form.memo})` : ''
      }`;

      const result = await cryptoWithdraw({
        accountId: form.accountId,
        amount: form.amount,
        currency: 'USDT',
        payeeName: selectedWhitelistPayee.name,
        destination,
      });

      setConfirmOpen(false);

      if (!result) {
        toast.error('数字货币出金提交失败：未找到关联实体');
        return;
      }

      const transactionHref = buildQueryHref(paths.dashboard.baas.transactions, {
        accountId: form.accountId,
        transactionId: result.id,
      });

      if (form.simulateFailed) {
        toast.error('数字货币出金已提交，但外部 Payee 调用模拟失败', {
          action: { label: '查看流水', onClick: () => router.push(transactionHref) },
        });
      } else {
        toast.success('数字货币出金已提交，外部 Payee 调用已模拟', {
          action: { label: '查看流水', onClick: () => router.push(transactionHref) },
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const cryptoTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.type === 'crypto_withdraw'),
    [transactions]
  );

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="数字货币出金"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '数字货币出金' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ActionBar
        title="数字货币出金"
        description="选择已激活且启用数字货币的 Global Account，填写链上地址信息，系统先模拟外部 Payee 创建，再生成出金交易。"
      />

      <Grid container spacing={3}>
        {/* 左侧 — 出金表单 */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card>
            <CardHeader
              title="数字货币出金"
              subheader="资金将从所选账户的 USDT 可用余额扣除"
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
                      ? `USDT 可用余额：${formatMoney(usdtBalance, 'USDT')}`
                      : '请选择一个已激活且启用数字货币的账户'
                  }
                >
                  {cryptoAccounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {account.name}
                    </MenuItem>
                  ))}
                </TextField>

                <FormControl>
                  <FormLabel>链网络</FormLabel>
                  <RadioGroup
                    row
                    value={form.chain}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        chain: event.target.value as ChainType,
                        whitelistPayeeId: '',
                      })
                    }
                  >
                    <FormControlLabel value="TRC20" control={<Radio />} label="TRC20 (Tron)" />
                    <FormControlLabel value="ERC20" control={<Radio />} label="ERC20 (Ethereum)" />
                  </RadioGroup>
                </FormControl>

                <TextField
                  select
                  fullWidth
                  size="small"
                  label="目标地址"
                  value={form.whitelistPayeeId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, whitelistPayeeId: event.target.value }))
                  }
                  error={payeeInvalid}
                  helperText={
                    payeeInvalid
                      ? '当前出金账户在该链网络下暂无已完成白名单地址'
                      : '只能选择当前出金账户绑定且已完成的白名单地址'
                  }
                >
                  {accountWhitelistPayees.map((payee) => (
                    <MenuItem key={payee.id} value={payee.id}>
                      {payee.name} · {formatDestination(payee.destination)}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="subtitle2">收款方</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      外部 Payee 信息
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                  >
                    <TextField
                      fullWidth
                      disabled
                      size="small"
                      label="链网络/地区"
                      value={selectedWhitelistPayee ? form.chain : ''}
                    />
                    <TextField
                      fullWidth
                      disabled
                      size="small"
                      label="币种"
                      value={selectedWhitelistPayee?.currency ?? ''}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    disabled
                    size="small"
                    label="收款人名称"
                    value={selectedWhitelistPayee?.name ?? ''}
                  />

                  <TextField
                    fullWidth
                    disabled
                    size="small"
                    label="目标地址"
                    value={
                      selectedWhitelistPayee
                        ? formatDestination(selectedWhitelistPayee.destination)
                        : ''
                    }
                  />

                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    }}
                  >
                    <TextField
                      fullWidth
                      disabled
                      size="small"
                      label="External Request ID"
                      value={selectedWhitelistPayee?.referenceId ?? ''}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Memo（可选）"
                      value={form.memo}
                      onChange={(event) => setForm({ ...form, memo: event.target.value })}
                    />
                  </Box>
                </Stack>

                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="出金金额 (USDT)"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })}
                  error={amountInvalid}
                  helperText={form.amount > usdtBalance ? '金额超出可用余额' : undefined}
                />

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

                <Card variant="outlined" sx={{ boxShadow: 'none', bgcolor: 'background.neutral' }}>
                  <CardContent>
                    <Stack spacing={1.25}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          出金金额
                        </Typography>
                        <Typography variant="body2">{formatMoney(form.amount, 'USDT')}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          网络费用 ({form.chain})
                        </Typography>
                        <Typography variant="body2">{formatMoney(networkFee, 'USDT')}</Typography>
                      </Stack>
                      <Divider sx={{ borderStyle: 'dashed' }} />
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="subtitle2">净扣款</Typography>
                        <Typography variant="subtitle2">{formatMoney(netDebit, 'USDT')}</Typography>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                {payeeInvalid && (
                  <Alert
                    severity="warning"
                    action={
                      <Button
                        component={RouterLink}
                        href={paths.dashboard.baas.cryptoWhitelist}
                        color="inherit"
                        size="small"
                      >
                        去添加
                      </Button>
                    }
                  >
                    当前账户在该链网络下暂无已完成白名单地址，请先去白名单管理中添加。
                  </Alert>
                )}

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  color="warning"
                  startIcon={<Iconify icon="solar:export-bold" />}
                  onClick={() => setConfirmOpen(true)}
                  disabled={!form.accountId || amountInvalid || payeeInvalid}
                >
                  提交出金
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* 右侧 — 操作历史 */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            <DataTable
              title="当前账户可用白名单地址"
              rows={selectedAccountCompletedPayees}
              rowKey={(row) => row.id}
              emptyText="当前账户暂无可用白名单地址"
              emptyDescription="仅展示当前账户下已完成状态的数字货币白名单地址。"
              columns={[
                { id: 'name', label: '白名单账户', render: (row) => row.name },
                { id: 'currency', label: '币种', render: (row) => row.currency },
                { id: 'chain', label: '链网络', render: (row) => getPayeeChain(row.destination) },
                {
                  id: 'destination',
                  label: '目标地址',
                  render: (row) => formatDestination(row.destination),
                },
                {
                  id: 'whitelistId',
                  label: '白名单编号',
                  render: (row) => row.referenceId,
                },
                {
                  id: 'status',
                  label: '状态',
                  render: (row) => <StatusChip status={row.status} />,
                },
              ]}
            />

            <DataTable
              title="数字货币出金交易"
              rows={cryptoTransactions}
              rowKey={(row) => row.id}
              emptyText="暂无数字货币出金交易"
              columns={[
                { id: 'referenceId', label: 'Reference ID', render: (row) => row.referenceId },
                {
                  id: 'amount',
                  label: '金额',
                  render: (row) => formatMoney(row.amount, row.currency),
                },
                { id: 'destination', label: '目标地址', render: (row) => row.destination },
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
        title="确认数字货币出金"
        content={
          <Stack spacing={1.25} sx={{ mt: 1 }}>
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                出金金额
              </Box>
              <Box component="span">{formatMoney(form.amount, 'USDT')}</Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                链网络
              </Box>
              <Box component="span">{form.chain}</Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                目标地址
              </Box>
              <Box component="span" sx={{ wordBreak: 'break-all', maxWidth: 280 }}>
                {selectedWhitelistPayee
                  ? formatDestination(selectedWhitelistPayee.destination)
                  : '—'}
              </Box>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ color: 'text.secondary' }}>
                网络费用
              </Box>
              <Box component="span">{formatMoney(networkFee, 'USDT')}</Box>
            </Stack>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Stack direction="row" justifyContent="space-between">
              <Box component="span" sx={{ fontWeight: 'fontWeightSemiBold' }}>
                净扣款
              </Box>
              <Box component="span" sx={{ fontWeight: 'fontWeightSemiBold' }}>
                {formatMoney(netDebit, 'USDT')}
              </Box>
            </Stack>
          </Stack>
        }
        action={
          <Button
            variant="contained"
            color="warning"
            disabled={submitting}
            onClick={() => {
              setConfirmOpen(false);
              setEmailOpen(true);
            }}
          >
            确认并验证邮箱
          </Button>
        }
      />

      <Dialog
        fullWidth
        maxWidth="xs"
        open={emailOpen}
        onClose={verifyingEmailCode || submitting ? undefined : () => setEmailOpen(false)}
      >
        <DialogTitle>邮箱验证码确认</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">数字货币出金为敏感操作，需邮箱验证码通过后提交。</Alert>
            <TextField
              fullWidth
              autoFocus
              label="邮箱验证码"
              value={emailCode}
              inputProps={{ maxLength: 6 }}
              disabled={verifyingEmailCode || submitting}
              error={!!emailError}
              helperText={
                emailError ||
                (emailExpiresAt ? `验证码有效期至 ${formatDateTime(emailExpiresAt)}` : '')
              }
              onChange={(event) =>
                setEmailCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      disabled={
                        sendingEmailCode || verifyingEmailCode || submitting || emailCountdown > 0
                      }
                      onClick={sendEmailCode}
                    >
                      {emailCountdown > 0 ? `${emailCountdown}s` : '发送'}
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
          <Button
            color="inherit"
            disabled={verifyingEmailCode || submitting}
            onClick={() => setEmailOpen(false)}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={sendingEmailCode || verifyingEmailCode || submitting}
            onClick={handleVerifyAndSubmit}
          >
            {verifyingEmailCode || submitting ? '提交中...' : '验证并提交出金'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
