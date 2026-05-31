'use client';

import type { OtcQuote, OtcTrade } from 'src/types/otc';
import type { Balance, ApiStatus, CurrencyCode } from 'src/types/common';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Timeline from '@mui/lab/Timeline';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import TimelineDot from '@mui/lab/TimelineDot';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import { alpha, useTheme } from '@mui/material/styles';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { paths } from 'src/routes/paths';

import { formatMoney, formatDateTime } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { STATUS_COLORS } from 'src/constants/status-options';
import { useBaasDemo } from 'src/contexts/baas-demo-context';
import { createMockOtcQuote } from 'src/services/otc-service';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { DataTable, StatusChip, InfoSection, DetailDrawer } from 'src/components/common';

const CURRENCY_ORDER: CurrencyCode[] = ['USDT', 'USD', 'USDC', 'HKD', 'EUR', 'WUSD'];

const getBalances = (account?: { fiatBalances: Balance[]; cryptoBalances: Balance[] }) =>
  account ? [...account.cryptoBalances, ...account.fiatBalances] : [];

const getTimelineDotColor = (status: ApiStatus) => {
  const color = STATUS_COLORS[status];
  return color === 'default' ? 'grey' : color;
};

const formatRate = (quote: Pick<OtcQuote, 'fromCurrency' | 'toCurrency' | 'rate'>) =>
  `1 ${quote.fromCurrency} = ${quote.rate.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  })} ${quote.toCurrency}`;

function CurrencyMark({ currency }: { currency: CurrencyCode }) {
  return (
    <Box
      sx={{
        width: 30,
        height: 30,
        display: 'grid',
        borderRadius: '50%',
        placeItems: 'center',
        typography: 'caption',
        fontWeight: 800,
        bgcolor: 'grey.900',
        color: 'common.white',
      }}
    >
      {currency.startsWith('USD') ? '$' : currency.slice(0, 2)}
    </Box>
  );
}

function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="subtitle1">{value}</Typography>
    </Box>
  );
}

type AmountBoxProps = {
  label: 'From' | 'To';
  amount: string;
  balance?: Balance;
  currency: CurrencyCode;
  currencies: CurrencyCode[];
  error?: string;
  readOnly?: boolean;
  onAmountChange?: (value: string) => void;
  onCurrencyChange: (value: CurrencyCode) => void;
  onMax?: () => void;
};

function AmountBox({
  label,
  amount,
  error,
  balance,
  currency,
  readOnly,
  currencies,
  onMax,
  onAmountChange,
  onCurrencyChange,
}: AmountBoxProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.06),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Available {balance ? formatMoney(balance.available, balance.currency) : '-'}
          </Typography>
          {onMax && (
            <Button size="small" color="inherit" onClick={onMax} sx={{ minWidth: 0 }}>
              Max
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="center">
        <TextField
          select
          value={currency}
          onChange={(event) => onCurrencyChange(event.target.value as CurrencyCode)}
          sx={{ width: 138, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', borderRadius: 99 } }}
        >
          {currencies.map((item) => (
            <MenuItem key={item} value={item}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CurrencyMark currency={item} />
                <span>{item}</span>
              </Stack>
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          type="number"
          value={amount}
          placeholder="0.00"
          error={!!error}
          helperText={error}
          disabled={readOnly}
          onChange={(event) => onAmountChange?.(event.target.value)}
          sx={{
            '& input': { py: 1.5, textAlign: 'right', fontSize: { xs: 26, sm: 30 }, fontWeight: 700 },
            '& .MuiOutlinedInput-root': {
              bgcolor: 'transparent',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'transparent' },
              '&.Mui-focused fieldset': { borderColor: 'transparent' },
              '&.Mui-disabled fieldset': { borderColor: 'transparent' },
            },
          }}
        />
      </Stack>
    </Box>
  );
}

export function OtcView() {
  const theme = useTheme();
  const historyRef = useRef<HTMLDivElement | null>(null);
  const { loading, error, globalAccounts, otcTrades, otcTrade, advanceOtcStatus } = useBaasDemo();

  const [now, setNow] = useState(() => new Date());
  const [quote, setQuote] = useState<OtcQuote | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('1000');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(globalAccounts[0]?.id ?? '');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USDT');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('USD');

  const selectedAccount = useMemo(
    () => globalAccounts.find((account) => account.id === accountId),
    [accountId, globalAccounts]
  );
  const balances = useMemo(() => getBalances(selectedAccount), [selectedAccount]);
  const currencies = useMemo(
    () =>
      [...new Set(balances.map((balance) => balance.currency))].sort(
        (a, b) => CURRENCY_ORDER.indexOf(a) - CURRENCY_ORDER.indexOf(b)
      ),
    [balances]
  );

  const amount = Number(amountInput);
  const fromBalance = balances.find((balance) => balance.currency === fromCurrency);
  const toBalance = balances.find((balance) => balance.currency === toCurrency);
  const selectedTrade = selectedId ? otcTrades.find((trade) => trade.id === selectedId) ?? null : null;
  const secondsLeft = quote
    ? Math.max(0, Math.ceil((new Date(quote.expiresAt).getTime() - now.getTime()) / 1000))
    : 0;
  const quoteExpired = !!quote && secondsLeft <= 0;
  const amountError =
    (!amountInput && 'Enter an amount') ||
    (amountInput && amount <= 0 && 'Amount must be greater than 0') ||
    (fromBalance && amount > fromBalance.available && 'Amount exceeds available balance') ||
    '';
  const currencyError = fromCurrency === toCurrency ? 'Choose different currencies' : '';
  const canQuote = !!accountId && !!fromBalance && !!toBalance && !amountError && !currencyError;
  const canConvert = canQuote && !!quote && !quoteExpired;

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todayTrades = otcTrades.filter((trade) => trade.createdAt.slice(0, 10) === today);

    return {
      volume: todayTrades.reduce((total, trade) => total + trade.fromAmount, 0),
      pending: otcTrades.filter((trade) => ['pending', 'processing'].includes(trade.status)).length,
      count: todayTrades.length,
      exception: otcTrades.filter((trade) => ['failed', 'expired'].includes(trade.status)).length,
    };
  }, [otcTrades]);

  const refreshQuote = useCallback(() => {
    if (!canQuote) {
      setQuote(null);
      return;
    }

    setQuote(createMockOtcQuote({ accountId, fromCurrency, toCurrency, fromAmount: amount }));
  }, [accountId, amount, canQuote, fromCurrency, toCurrency]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!accountId && globalAccounts[0]?.id) setAccountId(globalAccounts[0].id);
  }, [accountId, globalAccounts]);

  useEffect(() => {
    if (currencies.length === 0) return;
    if (!currencies.includes(fromCurrency)) {
      setFromCurrency(currencies[0]);
      return;
    }
    if (!currencies.includes(toCurrency) || fromCurrency === toCurrency) {
      setToCurrency(currencies.find((currency) => currency !== fromCurrency) ?? currencies[0]);
    }
  }, [currencies, fromCurrency, toCurrency]);

  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  const handleFromCurrencyChange = (currency: CurrencyCode) => {
    setFromCurrency(currency);
    if (currency === toCurrency) {
      setToCurrency(currencies.find((item) => item !== currency) ?? toCurrency);
    }
  };

  const handleToCurrencyChange = (currency: CurrencyCode) => {
    setToCurrency(currency);
    if (currency === fromCurrency) {
      setFromCurrency(currencies.find((item) => item !== currency) ?? fromCurrency);
    }
  };

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setAmountInput(quote?.toAmount ? String(quote.toAmount) : '');
  };

  const handleConvert = async () => {
    if (!selectedAccount || !quote || quoteExpired || !canConvert) return;

    const result = await otcTrade({
      accountId,
      accountName: selectedAccount.name,
      type: fromCurrency === 'USDT' || fromCurrency === 'USDC' ? 'sell' : 'buy',
      fromCurrency,
      toCurrency,
      fromAmount: amount,
      toAmount: quote.toAmount,
      rate: quote.rate,
      inverseRate: quote.inverseRate,
      fee: quote.fee,
      quoteId: quote.quoteId,
      quoteExpiresAt: quote.expiresAt,
      estimatedSettlement: quote.estimatedSettlement,
    });

    setConfirmOpen(false);

    if (result) {
      toast.success('Mock convert created');
      setAmountInput('');
      setQuote(null);
      setSelectedId(result.id);
    }
  };

  const handleCopyReference = async (trade: OtcTrade) => {
    await navigator.clipboard.writeText(trade.referenceId);
    toast.success('Reference ID copied');
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
        sx={{ mb: 1.5 }}
      />

      <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', maxWidth: 720 }}>
        模拟指定 Global Account 的数字资产与法币兑换、报价、成交与交易流水追踪。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Card sx={{ width: 1, maxWidth: 640, p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
          {loading ? (
            <Stack spacing={2}>
              <Typography variant="h4" textAlign="center">
                Convert
              </Typography>
              <Box sx={{ height: 70, borderRadius: 1, bgcolor: 'background.neutral' }} />
              <Box sx={{ height: 148, borderRadius: 2, bgcolor: 'background.neutral' }} />
              <Box sx={{ height: 148, borderRadius: 2, bgcolor: 'background.neutral' }} />
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <Box sx={{ position: 'relative', textAlign: 'center' }}>
                <Typography variant="h4">Convert</Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                  <Label variant="soft" color="success">
                    No fees
                  </Label>
                  <Label variant="soft" color="info">
                    Mock Quote
                  </Label>
                </Stack>
                <Tooltip title="查看 OTC 历史">
                  <IconButton
                    onClick={() => historyRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                  >
                    <Iconify icon="solar:list-bold" />
                  </IconButton>
                </Tooltip>
              </Box>

              <TextField
                select
                fullWidth
                label="SUB-ACCOUNT"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
              >
                {globalAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </TextField>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {balances.map((balance) => (
                  <Label key={balance.currency} variant="soft" color="default">
                    {balance.currency} {balance.available.toLocaleString()}
                  </Label>
                ))}
              </Stack>

              <AmountBox
                label="From"
                amount={amountInput}
                error={amountError || currencyError}
                balance={fromBalance}
                currency={fromCurrency}
                currencies={currencies}
                onMax={() => setAmountInput(String(fromBalance?.available ?? 0))}
                onAmountChange={setAmountInput}
                onCurrencyChange={handleFromCurrencyChange}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center', my: -1.5, position: 'relative', zIndex: 1 }}>
                <Tooltip title="Swap currencies">
                  <IconButton
                    onClick={handleSwap}
                    sx={{
                      width: 42,
                      height: 42,
                      border: (currentTheme) => `1px solid ${currentTheme.palette.divider}`,
                      bgcolor: 'background.paper',
                      boxShadow: theme.customShadows?.z8,
                    }}
                  >
                    <Iconify icon="solar:restart-bold" />
                  </IconButton>
                </Tooltip>
              </Box>

              <AmountBox
                label="To"
                readOnly
                amount={quote ? String(quote.toAmount) : ''}
                balance={toBalance}
                currency={toCurrency}
                currencies={currencies}
                onCurrencyChange={handleToCurrencyChange}
              />

              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Quote</Typography>
                    {quote ? <StatusChip status={quoteExpired ? 'expired' : 'active'} /> : null}
                  </Stack>
                  {quote ? (
                    <>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Rate
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatRate(quote)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Quote ID
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {quote.quoteId}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Settlement
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {formatDateTime(quote.estimatedSettlement)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Fee
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          No fees
                        </Typography>
                      </Stack>
                      <Divider />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {quoteExpired ? 'Quote expired' : `Refreshes required in ${secondsLeft}s`}
                        </Typography>
                        <Button size="small" color="inherit" onClick={refreshQuote}>
                          Refresh Quote
                        </Button>
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Enter a valid amount and choose two different currencies to generate a mock quote.
                    </Typography>
                  )}
                </Stack>
              </Box>

              <Button
                fullWidth
                size="large"
                variant="contained"
                disabled={!canConvert}
                onClick={() => setConfirmOpen(true)}
                sx={{ py: 1.35, borderRadius: 2, bgcolor: 'grey.900', '&:hover': { bgcolor: 'grey.800' } }}
              >
                Convert
              </Button>
            </Stack>
          )}
        </Card>
      </Box>

      <Card sx={{ mb: 3, p: 2, borderRadius: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} justifyContent="space-between">
          <MetricItem label="今日兑换金额" value={stats.volume.toLocaleString()} />
          <MetricItem label="待处理交易" value={String(stats.pending)} />
          <MetricItem label="今日成交笔数" value={String(stats.count)} />
          <MetricItem label="异常交易" value={String(stats.exception)} />
        </Stack>
      </Card>

      <Box ref={historyRef}>
        <DataTable
          title="OTC 历史"
          rows={otcTrades}
          rowKey={(row) => row.id}
          onRowClick={(row) => setSelectedId(row.id)}
          columns={[
            { id: 'referenceId', label: 'Reference ID', width: 170, render: (row) => row.referenceId },
            { id: 'account', label: 'Account', width: 180, render: (row) => row.accountName },
            { id: 'fromCurrency', label: 'From', width: 90, render: (row) => row.fromCurrency },
            { id: 'toCurrency', label: 'To', width: 90, render: (row) => row.toCurrency },
            {
              id: 'from',
              label: 'From Amount',
              width: 140,
              render: (row) => formatMoney(row.fromAmount, row.fromCurrency),
            },
            {
              id: 'to',
              label: 'To Amount',
              width: 140,
              render: (row) => formatMoney(row.toAmount, row.toCurrency),
            },
            { id: 'rate', label: 'Rate', width: 110, render: (row) => row.rate },
            { id: 'fee', label: 'Fee', width: 90, render: () => 'No fees' },
            { id: 'quoteId', label: 'Quote ID', width: 150, render: (row) => row.quoteId },
            { id: 'status', label: 'Status', width: 120, render: (row) => <StatusChip status={row.status} /> },
            { id: 'createdAt', label: 'Created Time', width: 150, render: (row) => formatDateTime(row.createdAt) },
            {
              id: 'action',
              label: 'Action',
              width: 210,
              render: (row) => (
                <Stack direction="row" spacing={0.5} onClick={(event) => event.stopPropagation()}>
                  <Tooltip title="View Detail">
                    <IconButton size="small" onClick={() => setSelectedId(row.id)}>
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Copy Reference ID">
                    <IconButton size="small" onClick={() => handleCopyReference(row)}>
                      <Iconify icon="solar:copy-bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Advance Status">
                    <span>
                      <IconButton
                        size="small"
                        disabled={!['pending', 'processing'].includes(row.status)}
                        onClick={() => advanceOtcStatus(row.id)}
                      >
                        <Iconify icon="solar:forward-bold" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  {row.status === 'processing' && (
                    <Tooltip title="Mark Failed">
                      <IconButton size="small" color="error" onClick={() => advanceOtcStatus(row.id, 'failed')}>
                        <Iconify icon="solar:danger-bold" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              ),
            },
          ]}
        />
      </Box>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Convert"
        content={
          quote && selectedAccount ? (
            <InfoSection
              title="Conversion"
              rows={[
                { label: 'Account', value: selectedAccount.name },
                { label: 'From amount', value: formatMoney(amount, fromCurrency) },
                { label: 'To amount', value: formatMoney(quote.toAmount, toCurrency) },
                { label: 'Exchange rate', value: formatRate(quote) },
                { label: 'Fee', value: 'No fees' },
                { label: 'Quote ID', value: quote.quoteId },
                { label: 'Estimated settlement', value: formatDateTime(quote.estimatedSettlement) },
              ]}
            />
          ) : null
        }
        action={
          <Button variant="contained" onClick={handleConvert}>
            Confirm Convert
          </Button>
        }
      />

      {selectedTrade && (
        <DetailDrawer
          open={!!selectedTrade}
          title={selectedTrade.referenceId}
          subtitle={`${selectedTrade.fromCurrency} → ${selectedTrade.toCurrency}`}
          onClose={() => setSelectedId(null)}
          actions={
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" onClick={() => handleCopyReference(selectedTrade)}>
                Copy Reference ID
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={!['pending', 'processing'].includes(selectedTrade.status)}
                onClick={() => advanceOtcStatus(selectedTrade.id)}
              >
                Advance Status
              </Button>
            </Stack>
          }
        >
          <InfoSection
            title="Convert Summary"
            rows={[
              { label: 'Status', value: <StatusChip status={selectedTrade.status} /> },
              { label: 'Reference ID', value: selectedTrade.referenceId },
              { label: 'Pair', value: `${selectedTrade.fromCurrency} → ${selectedTrade.toCurrency}` },
              { label: 'Created Time', value: formatDateTime(selectedTrade.createdAt) },
            ]}
          />
          <InfoSection
            title="Account Information"
            rows={[
              { label: 'Account', value: selectedTrade.accountName },
              { label: 'Account ID', value: selectedTrade.accountId },
            ]}
          />
          <InfoSection
            title="Quote Information"
            rows={[
              { label: 'Quote ID', value: selectedTrade.quoteId },
              { label: 'Rate', value: formatRate(selectedTrade) },
              { label: 'Inverse Rate', value: selectedTrade.inverseRate ?? '-' },
              { label: 'Quote Expires At', value: formatDateTime(selectedTrade.quoteExpiresAt) },
              { label: 'Estimated Settlement', value: formatDateTime(selectedTrade.estimatedSettlement) },
            ]}
          />
          <InfoSection
            title="Amount Breakdown"
            rows={[
              { label: 'From Amount', value: formatMoney(selectedTrade.fromAmount, selectedTrade.fromCurrency) },
              { label: 'To Amount', value: formatMoney(selectedTrade.toAmount, selectedTrade.toCurrency) },
              { label: 'Fee', value: 'No fees' },
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
              {selectedTrade.timeline.map((event, index) => (
                <TimelineItem key={`${event.label}-${event.at}`}>
                  <TimelineSeparator>
                    <TimelineDot color={getTimelineDotColor(event.status)} />
                    {index < selectedTrade.timeline.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ pb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{event.label}</Typography>
                      <StatusChip status={event.status} />
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatDateTime(event.at)}
                    </Typography>
                    {event.description && (
                      <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                        {event.description}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Stack>
          <DataTable
            title="Mock API Logs"
            rows={selectedTrade.apiLogs}
            rowKey={(row) => row.id}
            columns={[
              { id: 'method', label: 'Method', width: 90, render: (row) => row.method },
              { id: 'endpoint', label: 'Endpoint', render: (row) => row.endpoint },
              { id: 'status', label: 'Status', width: 90, render: (row) => row.statusCode },
              { id: 'message', label: 'Message', render: (row) => row.message },
            ]}
          />
        </DetailDrawer>
      )}
    </DashboardContent>
  );
}
