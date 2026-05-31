'use client';

import type { ReactNode } from 'react';
import type { Balance, ApiStatus } from 'src/types/common';
import type { PayoutTransaction } from 'src/types/transaction';
import type { ExternalPayee, PayeeReceivingAccount } from 'src/types/payee';

import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Timeline from '@mui/lab/Timeline';
import MenuItem from '@mui/material/MenuItem';
import TimelineDot from '@mui/lab/TimelineDot';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import InputAdornment from '@mui/material/InputAdornment';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { paths } from 'src/routes/paths';

import { formatMoney, formatDateTime } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { STATUS_COLORS } from 'src/constants/status-options';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { StatCard, DataTable, StatusChip, InfoSection, DetailDrawer } from 'src/components/common';

import {
  ReviewRows,
  WizardActions,
  PayoutWizardShell,
  WizardSectionCard,
  PayoutWizardStepper,
  PAYOUT_WIZARD_LAYOUT,
  PayoutWizardStepLayout,
} from '../payout-wizard-layout';

const STEPS = ['Recipient Details', 'Payout Details', 'Review Payout'];
const PURPOSE_OPTIONS = ['供应商付款', '服务费结算', '跨境采购', '退款', '内部资金调拨'];
const ESTIMATED_ARRIVAL = 'T+1 工作日';
const QUOTE_RATE = '1.0000';
const QUOTE_FRESHNESS = 'Fresh for demo review';

const FIELD_SX = {
  '& .MuiInputBase-root': {
    minHeight: 56,
  },
};

const getTimelineDotColor = (status: ApiStatus) => {
  const color = STATUS_COLORS[status];
  return color === 'default' ? 'grey' : color;
};

const payeeTypeLabel = (type: ExternalPayee['type']) =>
  type === 'SELF_OWNED' ? 'SELF OWNED' : 'THIRD PARTY';

const maskAccount = (accountNumber: string) =>
  accountNumber.length > 4 ? `**** ${accountNumber.slice(-4)}` : accountNumber;

function CopyValueButton({ value, label }: { value?: string; label: string }) {
  if (!value) {
    return null;
  }

  return (
    <IconButton
      size="small"
      aria-label={`Copy ${label}`}
      onClick={() => {
        navigator.clipboard?.writeText(value);
        toast.success(`${label} 已复制`);
      }}
      sx={{ ml: 0.5 }}
    >
      <Iconify icon="solar:copy-bold" width={16} />
    </IconButton>
  );
}

function ListHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{
        px: 2,
        height: PAYOUT_WIZARD_LAYOUT.listHeaderHeight,
        borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
      }}
    >
      <Typography variant="subtitle2" noWrap>
        {title}
      </Typography>
      {action}
    </Stack>
  );
}

function EmptyListState({ title, description }: { title: string; description: string }) {
  return (
    <Stack
      spacing={1}
      alignItems="center"
      justifyContent="center"
      sx={{ height: 1, px: 3, textAlign: 'center', color: 'text.secondary' }}
    >
      <Iconify icon="solar:inbox-bold" width={28} />
      <Typography variant="subtitle2" color="text.primary">
        {title}
      </Typography>
      <Typography variant="caption">{description}</Typography>
    </Stack>
  );
}

function CounterpartyListItem({
  payee,
  selected,
  onSelect,
}: {
  payee: ExternalPayee;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = payee.status !== 'active';

  return (
    <Stack
      spacing={0.75}
      onClick={disabled ? undefined : onSelect}
      sx={{
        px: 2,
        py: 1.5,
        minHeight: PAYOUT_WIZARD_LAYOUT.listRowHeight,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.58 : 1,
        borderLeft: (theme) =>
          selected ? `3px solid ${theme.vars.palette.primary.main}` : '3px solid transparent',
        bgcolor: selected ? 'primary.lighter' : 'transparent',
        transition: (theme) =>
          theme.transitions.create(['background-color', 'border-color', 'opacity'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          bgcolor: disabled ? 'transparent' : selected ? 'primary.lighter' : 'action.hover',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 36,
            height: 36,
            display: 'grid',
            flexShrink: 0,
            borderRadius: '50%',
            color: selected ? 'primary.main' : 'text.primary',
            placeItems: 'center',
            bgcolor: selected ? 'primary.lighter' : 'background.neutral',
          }}
        >
          <Iconify icon="solar:user-rounded-bold" width={18} />
        </Box>

        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="subtitle2" noWrap>
            {payee.name}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography
              variant="caption"
              sx={{ color: payee.type === 'SELF_OWNED' ? 'success.main' : 'text.secondary' }}
            >
              {payeeTypeLabel(payee.type)}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Quota {formatMoney(payee.availableQuota ?? 0, payee.quotaCurrency ?? 'USD')}
            </Typography>
          </Stack>
        </Box>

        <StatusChip status={payee.status} />
      </Stack>
    </Stack>
  );
}

function ReceivingAccountItem({
  account,
  selected,
  onSelect,
}: {
  account: PayeeReceivingAccount;
  selected: boolean;
  onSelect: () => void;
}) {
  const disabled = account.status !== 'active';

  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
      onClick={disabled ? undefined : onSelect}
      sx={{
        px: 2,
        py: 1.5,
        minHeight: PAYOUT_WIZARD_LAYOUT.listRowHeight,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.58 : 1,
        bgcolor: selected ? 'success.lighter' : 'transparent',
        borderLeft: (theme) =>
          selected ? `3px solid ${theme.vars.palette.success.main}` : '3px solid transparent',
        transition: (theme) =>
          theme.transitions.create(['background-color', 'border-color', 'opacity'], {
            duration: theme.transitions.duration.shorter,
          }),
        '&:hover': {
          bgcolor: disabled ? 'transparent' : selected ? 'success.lighter' : 'action.hover',
        },
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 24,
          borderRadius: 0.75,
          display: 'grid',
          flexShrink: 0,
          placeItems: 'center',
          color: 'common.white',
          bgcolor: 'grey.800',
          typography: 'caption',
          fontWeight: 700,
        }}
      >
        {account.country ?? 'HK'}
      </Box>

      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="subtitle2" noWrap>
          {account.currency} · {account.rail} · {account.bankName}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {maskAccount(account.accountNumber)}
        </Typography>
      </Box>

      {selected ? <StatusChip status="active" /> : <StatusChip status={account.status} />}
    </Stack>
  );
}

function QuoteMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="subtitle2" noWrap>
        {value}
      </Typography>
    </Stack>
  );
}

export function FiatView() {
  const {
    error,
    loading,
    entities,
    globalAccounts,
    externalPayees,
    payoutTransactions,
    createFiatPayout,
    advancePayoutStatus,
  } = useBaasDemo();

  const senders = useMemo(
    () => globalAccounts.filter((account) => account.fiatBalances.length > 0),
    [globalAccounts]
  );
  const [activeStep, setActiveStep] = useState(0);
  const [senderId, setSenderId] = useState(senders[0]?.id ?? '');
  const [payeeId, setPayeeId] = useState(externalPayees[0]?.id ?? '');
  const [receivingAccountId, setReceivingAccountId] = useState(
    externalPayees[0]?.accounts[0]?.id ?? ''
  );
  const [balanceCurrency, setBalanceCurrency] = useState<Balance['currency']>('USD');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [memo, setMemo] = useState('');
  const [createdPayout, setCreatedPayout] = useState<PayoutTransaction | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PayoutTransaction | null>(null);
  const wizardTopRef = useRef<HTMLDivElement | null>(null);
  const didMountRef = useRef(false);

  const selectedSender = senders.find((account) => account.id === senderId) ?? senders[0];
  const selectedEntity = selectedSender
    ? entities.find((entity) => entity.id === selectedSender.entityId)
    : undefined;
  const selectedPayee = externalPayees.find((payee) => payee.id === payeeId);
  const receivingAccounts = selectedPayee?.accounts ?? [];
  const selectedReceivingAccount = receivingAccounts.find(
    (account) => account.id === receivingAccountId
  );
  const selectedBalance =
    selectedSender?.fiatBalances.find((balance) => balance.currency === balanceCurrency) ??
    selectedSender?.fiatBalances[0];

  useEffect(() => {
    if (!senderId && senders[0]) {
      setSenderId(senders[0].id);
      setBalanceCurrency(senders[0].fiatBalances[0]?.currency ?? 'USD');
    }
  }, [senderId, senders]);

  useEffect(() => {
    if (!payeeId && externalPayees[0]) {
      setPayeeId(externalPayees[0].id);
      setReceivingAccountId(externalPayees[0].accounts[0]?.id ?? '');
    }
  }, [externalPayees, payeeId]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    wizardTopRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [activeStep]);

  const numericAmount = Number(amount);
  const fee = numericAmount > 0 ? Math.max(5, Number((numericAmount * 0.001).toFixed(2))) : 0;
  const payeeGets = numericAmount > 0 ? Number(Math.max(0, numericAmount - fee).toFixed(2)) : 0;
  const balanceAfter =
    selectedBalance && numericAmount > 0
      ? Number((selectedBalance.available - numericAmount).toFixed(2))
      : (selectedBalance?.available ?? 0);
  const amountError =
    amount && numericAmount <= 0
      ? '金额必须大于 0'
      : selectedBalance && numericAmount > selectedBalance.available
        ? '金额超过可用余额'
        : '';

  const canGoNext =
    !!selectedSender &&
    selectedPayee?.status === 'active' &&
    selectedReceivingAccount?.status === 'active';
  const canReview = canGoNext && !!purpose && !!amount && !amountError;

  const payoutStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayAmount = payoutTransactions
      .filter((payout) => payout.createdAt.slice(0, 10) === today && payout.status !== 'failed')
      .reduce((sum, payout) => sum + payout.amount, 0);

    return [
      {
        title: '今日 Payout 金额',
        value: formatMoney(todayAmount, 'USD'),
        icon: 'solar:wad-of-money-bold' as const,
        color: 'primary' as const,
      },
      {
        title: '待处理 Payout',
        value: payoutTransactions.filter((payout) =>
          ['pending', 'processing'].includes(payout.status)
        ).length,
        icon: 'solar:restart-bold' as const,
        color: 'warning' as const,
      },
      {
        title: '可用 Payee 数量',
        value: externalPayees.filter((payee) => payee.status === 'active').length,
        icon: 'solar:users-group-rounded-bold' as const,
        color: 'success' as const,
      },
      {
        title: '异常交易数量',
        value: payoutTransactions.filter((payout) => payout.status === 'failed').length,
        icon: 'solar:danger-triangle-bold' as const,
        color: 'error' as const,
      },
    ];
  }, [externalPayees, payoutTransactions]);

  const handleSelectPayee = (payee: ExternalPayee) => {
    if (payee.status !== 'active') {
      return;
    }

    setPayeeId(payee.id);
    setReceivingAccountId(payee.accounts.find((account) => account.status === 'active')?.id ?? '');
  };

  const resetFlow = () => {
    setActiveStep(0);
    setAmount('');
    setPurpose('');
    setMemo('');
    setCreatedPayout(null);
  };

  const handleConfirm = async () => {
    if (
      !selectedSender ||
      !selectedEntity ||
      !selectedPayee ||
      !selectedReceivingAccount ||
      !selectedBalance
    ) {
      return;
    }

    const payout = await createFiatPayout({
      senderId: selectedSender.id,
      senderName: selectedSender.name,
      payerName: selectedEntity.name,
      payeeId: selectedPayee.id,
      payeeName: selectedPayee.name,
      payeeType: selectedPayee.type,
      receivingAccountId: selectedReceivingAccount.id,
      bankName: selectedReceivingAccount.bankName,
      accountNumber: selectedReceivingAccount.accountNumber,
      rail: selectedReceivingAccount.rail,
      currency: selectedBalance.currency,
      amount: numericAmount,
      fee,
      payeeGets,
      purpose,
      memo,
      estimatedArrival: ESTIMATED_ARRIVAL,
    });

    setCreatedPayout(payout);
    toast.success('Payout 已提交');
  };

  const renderRecipientDetails = () => (
    <PayoutWizardStepLayout
      actions={
        <WizardActions
          actions={[
            {
              label: 'Next',
              variant: 'contained',
              disabled: !canGoNext,
              onClick: () => setActiveStep(1),
              sx: { minWidth: { sm: PAYOUT_WIZARD_LAYOUT.primaryButtonWidth } },
            },
          ]}
        />
      }
    >
      <Stack spacing={3} sx={{ height: 1 }}>
        <WizardSectionCard
          title="Sender Information"
          subtitle="Select the sub merchant initiating this payout."
          minHeight={172}
        >
          <Grid container spacing={2} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 8 }}>
              <TextField
                select
                fullWidth
                required
                label="Sender / Sub Merchant"
                value={senderId}
                sx={FIELD_SX}
                onChange={(event) => {
                  const nextSender = senders.find((sender) => sender.id === event.target.value);
                  setSenderId(event.target.value);
                  setBalanceCurrency(nextSender?.fiatBalances[0]?.currency ?? 'USD');
                }}
              >
                {senders.map((sender) => (
                  <MenuItem key={sender.id} value={sender.id}>
                    {sender.name} ({sender.accountId})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                variant="outlined"
                sx={{
                  px: 2,
                  py: 1.5,
                  minHeight: 56,
                  borderRadius: 1,
                  bgcolor: 'background.neutral',
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Merchant / Account ID
                </Typography>
                <Typography variant="subtitle2" noWrap>
                  {selectedEntity?.name ?? '-'}
                </Typography>
                <Stack direction="row" alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                    {selectedSender?.accountId ?? '-'}
                  </Typography>
                  <CopyValueButton value={selectedSender?.accountId} label="Account ID" />
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </WizardSectionCard>

        <WizardSectionCard
          title="Payee Information"
          subtitle="Select a verified counterparty and one active receiving account."
          minHeight={{ xs: 640, md: 478 }}
          sx={{ flex: 1 }}
        >
          <Grid
            container
            sx={{
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 1,
              overflow: 'hidden',
              minHeight: {
                xs: PAYOUT_WIZARD_LAYOUT.listHeaderHeight + PAYOUT_WIZARD_LAYOUT.listHeight.xs,
                md: PAYOUT_WIZARD_LAYOUT.listHeaderHeight + PAYOUT_WIZARD_LAYOUT.listHeight.md,
              },
            }}
          >
            <Grid
              size={{ xs: 12, md: 6 }}
              sx={{
                borderRight: { md: (theme) => `1px solid ${theme.vars.palette.divider}` },
                borderBottom: { xs: (theme) => `1px solid ${theme.vars.palette.divider}`, md: 0 },
              }}
            >
              <ListHeader
                title={`Counterparty (${externalPayees.length} avail.)`}
                action={
                  <Stack direction="row" spacing={1} sx={{ color: 'text.secondary' }}>
                    <Iconify icon="solar:copy-bold" width={18} />
                    <Iconify icon="solar:list-bold" width={18} />
                  </Stack>
                }
              />
              <Box sx={{ height: PAYOUT_WIZARD_LAYOUT.listHeight, overflowY: 'auto' }}>
                {externalPayees.length ? (
                  externalPayees.map((payee) => (
                    <CounterpartyListItem
                      key={payee.id}
                      payee={payee}
                      selected={payee.id === payeeId}
                      onSelect={() => handleSelectPayee(payee)}
                    />
                  ))
                ) : (
                  <EmptyListState
                    title="No counterparty"
                    description="Create a payee before starting a payout."
                  />
                )}
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <ListHeader
                title={`Receiving Account (${receivingAccounts.length} avail.)`}
                action={
                  <IconButton size="small" aria-label="Add receiving account">
                    <Iconify icon="mingcute:add-line" width={18} />
                  </IconButton>
                }
              />
              <Box sx={{ height: PAYOUT_WIZARD_LAYOUT.listHeight, overflowY: 'auto' }}>
                {receivingAccounts.length ? (
                  receivingAccounts.map((account) => (
                    <ReceivingAccountItem
                      key={account.id}
                      account={account}
                      selected={account.id === receivingAccountId}
                      onSelect={() => setReceivingAccountId(account.id)}
                    />
                  ))
                ) : (
                  <EmptyListState
                    title="No receiving account"
                    description="This counterparty does not have an available fiat receiving account."
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </WizardSectionCard>
      </Stack>
    </PayoutWizardStepLayout>
  );

  const renderPayoutDetails = () => (
    <PayoutWizardStepLayout
      actions={
        <WizardActions
          actions={[
            {
              label: 'Back',
              variant: 'outlined',
              color: 'inherit',
              onClick: () => setActiveStep(0),
            },
            {
              label: 'Review payout',
              variant: 'contained',
              disabled: !canReview,
              onClick: () => setActiveStep(2),
            },
          ]}
        />
      }
    >
      <Stack spacing={3}>
        <WizardSectionCard
          title="Payout Details"
          subtitle="Enter the amount, funding balance, purpose, and payout memo."
          minHeight={316}
        >
          <Grid container spacing={2.25}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                disabled
                label="Account to Payout"
                value={`${selectedSender?.name ?? '-'} (${selectedSender?.accountId ?? '-'})`}
                sx={FIELD_SX}
              />
              <Typography
                variant="caption"
                sx={{ mt: 1, display: 'block', color: 'text.secondary' }}
              >
                Payer name: {selectedEntity?.name ?? '-'}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Select Balance"
                value={selectedBalance?.currency ?? balanceCurrency}
                sx={FIELD_SX}
                onChange={(event) => setBalanceCurrency(event.target.value as Balance['currency'])}
              >
                {(selectedSender?.fiatBalances ?? []).map((balance) => (
                  <MenuItem key={balance.currency} value={balance.currency}>
                    {balance.currency} · {formatMoney(balance.available, balance.currency)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="You Send"
                type="number"
                value={amount}
                error={!!amountError}
                helperText={
                  amountError ||
                  `Balance after payout: ${formatMoney(balanceAfter, selectedBalance?.currency ?? 'USD')}`
                }
                sx={FIELD_SX}
                onChange={(event) => setAmount(event.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {selectedBalance?.currency ?? 'USD'}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                disabled
                label="Payee Gets"
                value={payeeGets > 0 ? payeeGets : ''}
                placeholder="Calculated after amount"
                sx={FIELD_SX}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {selectedBalance?.currency ?? 'USD'}
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Purpose"
                value={purpose}
                error={!purpose && !!amount}
                helperText={!purpose && !!amount ? 'Purpose 为必填项' : ' '}
                sx={FIELD_SX}
                onChange={(event) => setPurpose(event.target.value)}
              >
                {PURPOSE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Memo"
                value={memo}
                helperText=" "
                sx={FIELD_SX}
                onChange={(event) => setMemo(event.target.value)}
              />
            </Grid>
          </Grid>
        </WizardSectionCard>

        <WizardSectionCard
          title="Payee Summary"
          subtitle="Recipient and receiving account are locked from the previous step."
          minHeight={190}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{ p: 2, height: 1, borderRadius: 1, bgcolor: 'background.neutral' }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Counterparty
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <Typography variant="subtitle2">{selectedPayee?.name ?? '-'}</Typography>
                  {selectedPayee && <StatusChip status={selectedPayee.status} />}
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {selectedPayee ? payeeTypeLabel(selectedPayee.type) : '-'} · Quota{' '}
                  {formatMoney(
                    selectedPayee?.availableQuota ?? 0,
                    selectedPayee?.quotaCurrency ?? 'USD'
                  )}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                variant="outlined"
                sx={{ p: 2, height: 1, borderRadius: 1, bgcolor: 'background.neutral' }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Receiving Account
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 0.5 }}>
                  {selectedReceivingAccount?.bankName ?? '-'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {selectedReceivingAccount
                    ? `${selectedReceivingAccount.currency} · ${selectedReceivingAccount.rail} · ${maskAccount(
                        selectedReceivingAccount.accountNumber
                      )}`
                    : '-'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </WizardSectionCard>

        <Paper
          variant="outlined"
          sx={{
            px: { xs: 2, md: 3 },
            py: 1.5,
            minHeight: 64,
            display: 'grid',
            alignItems: 'center',
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.customShadows.z4,
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 2,
          }}
        >
          <QuoteMetric
            label="Exchange rate"
            value={`1 ${selectedBalance?.currency ?? 'USD'} = ${QUOTE_RATE}`}
          />
          <QuoteMetric label="Fee" value={formatMoney(fee, selectedBalance?.currency ?? 'USD')} />
          <QuoteMetric label="Estimated arrival" value={ESTIMATED_ARRIVAL} />
          <QuoteMetric label="Quote" value={QUOTE_FRESHNESS} />
        </Paper>
      </Stack>
    </PayoutWizardStepLayout>
  );

  const renderReview = () => (
    <PayoutWizardStepLayout
      actions={
        createdPayout ? (
          <WizardActions
            actions={[
              {
                label: 'New Payout',
                variant: 'outlined',
                color: 'inherit',
                onClick: resetFlow,
              },
              {
                label: 'View Transaction',
                variant: 'contained',
                onClick: () => setSelectedPayout(createdPayout),
              },
            ]}
          />
        ) : (
          <WizardActions
            actions={[
              {
                label: 'Back',
                variant: 'outlined',
                color: 'inherit',
                onClick: () => setActiveStep(1),
              },
              {
                label: 'Confirm Payout',
                variant: 'contained',
                onClick: handleConfirm,
              },
            ]}
          />
        )
      }
    >
      <Stack spacing={3}>
        <WizardSectionCard
          title={createdPayout ? 'Payout Submitted' : 'Review Payout'}
          subtitle={
            createdPayout
              ? 'The mock payout has been accepted and added to transaction history.'
              : 'Confirm the sender, recipient, receiving account, and amount before submission.'
          }
          minHeight={620}
        >
          {createdPayout && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Reference ID {createdPayout.referenceId} has been generated.
            </Alert>
          )}

          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, md: 2.5 },
              mb: 2.5,
              borderRadius: 1,
              bgcolor: 'background.neutral',
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            }}
          >
            <QuoteMetric
              label="You Send"
              value={formatMoney(numericAmount, selectedBalance?.currency ?? 'USD')}
            />
            <QuoteMetric label="Fee" value={formatMoney(fee, selectedBalance?.currency ?? 'USD')} />
            <QuoteMetric
              label="Payee Gets"
              value={formatMoney(payeeGets, selectedBalance?.currency ?? 'USD')}
            />
            <QuoteMetric label="Estimated arrival" value={ESTIMATED_ARRIVAL} />
          </Paper>

          <Box sx={{ maxHeight: { md: 420 }, overflowY: { md: 'auto' }, pr: { md: 1 } }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Sender Information
                </Typography>
                <ReviewRows
                  rows={[
                    { label: 'Sender', value: selectedSender?.name ?? '-' },
                    { label: 'Payer name', value: selectedEntity?.name ?? '-' },
                    {
                      label: 'Account ID',
                      value: (
                        <Stack direction="row" alignItems="center" justifyContent="flex-end">
                          {selectedSender?.accountId ?? '-'}
                          <CopyValueButton value={selectedSender?.accountId} label="Account ID" />
                        </Stack>
                      ),
                    },
                    { label: 'Currency', value: selectedBalance?.currency ?? '-' },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Payee Information
                </Typography>
                <ReviewRows
                  rows={[
                    { label: 'Payee', value: selectedPayee?.name ?? '-' },
                    {
                      label: 'Payee type',
                      value: selectedPayee ? payeeTypeLabel(selectedPayee.type) : '-',
                    },
                    {
                      label: 'Payee status',
                      value: selectedPayee ? <StatusChip status={selectedPayee.status} /> : '-',
                    },
                    {
                      label: 'Quota',
                      value: formatMoney(
                        selectedPayee?.availableQuota ?? 0,
                        selectedPayee?.quotaCurrency ?? 'USD'
                      ),
                    },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Receiving Account
                </Typography>
                <ReviewRows
                  rows={[
                    { label: 'Receiving bank', value: selectedReceivingAccount?.bankName ?? '-' },
                    { label: 'Rail', value: selectedReceivingAccount?.rail ?? '-' },
                    {
                      label: 'Account number',
                      value: (
                        <Stack direction="row" alignItems="center" justifyContent="flex-end">
                          {selectedReceivingAccount?.accountNumber ?? '-'}
                          <CopyValueButton
                            value={selectedReceivingAccount?.accountNumber}
                            label="Account number"
                          />
                        </Stack>
                      ),
                    },
                    { label: 'Country', value: selectedReceivingAccount?.country ?? '-' },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Amount Breakdown
                </Typography>
                <ReviewRows
                  rows={[
                    {
                      label: 'You Send',
                      value: formatMoney(numericAmount, selectedBalance?.currency ?? 'USD'),
                      emphasized: true,
                    },
                    { label: 'Fee', value: formatMoney(fee, selectedBalance?.currency ?? 'USD') },
                    {
                      label: 'Payee Gets',
                      value: formatMoney(payeeGets, selectedBalance?.currency ?? 'USD'),
                      emphasized: true,
                    },
                    {
                      label: 'Balance after',
                      value: formatMoney(balanceAfter, selectedBalance?.currency ?? 'USD'),
                    },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Purpose & Memo
                </Typography>
                <ReviewRows
                  rows={[
                    { label: 'Purpose', value: purpose },
                    { label: 'Memo', value: memo || '-' },
                  ]}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Quote & Reference
                </Typography>
                <ReviewRows
                  rows={[
                    { label: 'Estimated arrival', value: ESTIMATED_ARRIVAL },
                    { label: 'Quote', value: QUOTE_FRESHNESS },
                    {
                      label: 'Exchange rate',
                      value: `1 ${selectedBalance?.currency ?? 'USD'} = ${QUOTE_RATE}`,
                    },
                    {
                      label: 'Reference ID',
                      value: (
                        <Stack direction="row" alignItems="center" justifyContent="flex-end">
                          {createdPayout?.referenceId ?? '提交后生成'}
                          <CopyValueButton
                            value={createdPayout?.referenceId}
                            label="Reference ID"
                          />
                        </Stack>
                      ),
                    },
                  ]}
                />
              </Grid>
            </Grid>
          </Box>
        </WizardSectionCard>
      </Stack>
    </PayoutWizardStepLayout>
  );

  const renderPayoutDrawer = () =>
    selectedPayout && (
      <DetailDrawer
        open={!!selectedPayout}
        title={selectedPayout.referenceId}
        subtitle={selectedPayout.payeeName}
        onClose={() => setSelectedPayout(null)}
      >
        <InfoSection
          title="Payout Summary"
          rows={[
            { label: 'Status', value: <StatusChip status={selectedPayout.status} /> },
            { label: 'Reference ID', value: selectedPayout.referenceId },
            { label: 'Estimated arrival', value: selectedPayout.estimatedArrival },
            { label: 'Created Time', value: formatDateTime(selectedPayout.createdAt) },
          ]}
        />
        <InfoSection
          title="Sender Information"
          rows={[
            { label: 'Sender', value: selectedPayout.senderName },
            { label: 'Payer name', value: selectedPayout.payerName },
          ]}
        />
        <InfoSection
          title="Payee Information"
          rows={[
            { label: 'Payee', value: selectedPayout.payeeName },
            { label: 'Payee type', value: payeeTypeLabel(selectedPayout.payeeType) },
            { label: 'Receiving bank', value: selectedPayout.bankName },
            { label: 'Account number', value: maskAccount(selectedPayout.accountNumber) },
            { label: 'Rail', value: selectedPayout.rail },
          ]}
        />
        <InfoSection
          title="Amount Breakdown"
          rows={[
            {
              label: 'You Send',
              value: formatMoney(selectedPayout.amount, selectedPayout.currency),
            },
            { label: 'Fee', value: formatMoney(selectedPayout.fee, selectedPayout.currency) },
            {
              label: 'Payee Gets',
              value: formatMoney(selectedPayout.payeeGets, selectedPayout.currency),
            },
            { label: 'Purpose', value: selectedPayout.purpose },
            { label: 'Memo', value: selectedPayout.memo ?? '-' },
          ]}
        />
        <Stack spacing={1}>
          <Typography variant="subtitle2">Status Timeline</Typography>
          <Timeline
            sx={{
              m: 0,
              p: 0,
              [`& .${timelineItemClasses.root}:before`]: { flex: 0, p: 0 },
            }}
          >
            {selectedPayout.timeline.map((event, index) => (
              <TimelineItem key={`${event.label}-${event.at}`}>
                <TimelineSeparator>
                  <TimelineDot color={getTimelineDotColor(event.status)} />
                  {index < selectedPayout.timeline.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent sx={{ pb: 2 }}>
                  <Typography variant="body2">{event.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {formatDateTime(event.at)}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Stack>
        <DataTable
          title="Mock API Logs"
          rows={selectedPayout.apiLogs}
          rowKey={(row) => row.id}
          columns={[
            { id: 'method', label: 'Method', width: 90, render: (row) => row.method },
            { id: 'endpoint', label: 'Endpoint', render: (row) => row.endpoint },
            { id: 'status', label: 'Status', width: 90, render: (row) => row.statusCode },
          ]}
        />
      </DetailDrawer>
    );

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="法币操作"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '法币操作' },
        ]}
        sx={{ mb: 2 }}
      />

      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', maxWidth: 860 }}>
        模拟 Global Account 的法币出金、外部 Payee
        选择、收款账户选择、金额填写、确认提交与交易状态追踪。
      </Typography>

      {(loading || error) && (
        <Alert severity={error ? 'error' : 'info'} sx={{ mb: 3 }}>
          {error || 'Demo 数据加载中...'}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {payoutStats.map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Box ref={wizardTopRef}>
        <PayoutWizardShell>
          <PayoutWizardStepper steps={STEPS} activeStep={activeStep} completed={!!createdPayout} />

          {activeStep === 0 && renderRecipientDetails()}
          {activeStep === 1 && renderPayoutDetails()}
          {activeStep === 2 && renderReview()}
        </PayoutWizardShell>
      </Box>

      <Box sx={{ mt: 5 }}>
        <DataTable
          title="法币交易历史"
          rows={payoutTransactions}
          rowKey={(row) => row.id}
          columns={[
            { id: 'referenceId', label: 'Reference ID', render: (row) => row.referenceId },
            { id: 'sender', label: 'Sender', render: (row) => row.senderName },
            { id: 'payee', label: 'Payee', render: (row) => row.payeeName },
            {
              id: 'account',
              label: 'Receiving Account',
              render: (row) => maskAccount(row.accountNumber),
            },
            { id: 'rail', label: 'Rail', width: 90, render: (row) => row.rail },
            { id: 'currency', label: 'Currency', width: 100, render: (row) => row.currency },
            {
              id: 'amount',
              label: 'Amount',
              render: (row) => formatMoney(row.amount, row.currency),
            },
            { id: 'fee', label: 'Fee', render: (row) => formatMoney(row.fee, row.currency) },
            {
              id: 'gets',
              label: 'Payee Gets',
              render: (row) => formatMoney(row.payeeGets, row.currency),
            },
            { id: 'status', label: 'Status', render: (row) => <StatusChip status={row.status} /> },
            {
              id: 'createdAt',
              label: 'Created Time',
              render: (row) => formatDateTime(row.createdAt),
            },
            {
              id: 'action',
              label: 'Action',
              render: (row) => (
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" color="primary" onClick={() => setSelectedPayout(row)}>
                    <Iconify icon="solar:eye-bold" width={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="default"
                    onClick={() => {
                      navigator.clipboard?.writeText(row.referenceId);
                      toast.success('Reference ID 已复制');
                    }}
                  >
                    <Iconify icon="solar:copy-bold" width={18} />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => advancePayoutStatus(row.id)}
                  >
                    <Iconify icon="solar:restart-bold" width={18} />
                  </IconButton>
                </Stack>
              ),
            },
          ]}
        />
      </Box>

      {renderPayoutDrawer()}
    </DashboardContent>
  );
}
