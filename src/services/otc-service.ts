import type { CurrencyCode } from 'src/types/common';
import type { Transaction } from 'src/types/transaction';
import type { OtcQuote, OtcTrade, OtcQuotePayload, OtcTradePayload } from 'src/types/otc';

import { mockOtcTrades } from 'src/mocks/otc';

import { makeId, mockDelay, makeReference } from './mock-service-utils';

/**
 * INTERLACE_API_MAPPING: OTC service (createMockOtcQuote / getOtcTrades / otcTrade)
 * Real API: OTC Quote + OTC Conversion
 * Endpoints: POST /otc/quotes -> 锁价; POST /otc/conversions -> 执行兑换 (预期)
 * Params: accountId -> businessAccountId, fromCurrency/toCurrency/fromAmount, quoteId
 * Response: OtcQuote / OtcTrade <- rate、toAmount、status、settlement 时间
 * Current: 汇率表与 quote 全部本地 mock；otcTrade 同时构造 OtcTrade + Transaction。
 *   状态推进 (pending->processing->completed/failed) 由 context.advanceOtcStatus 模拟。
 */
const USD_MARK_PRICE: Record<CurrencyCode, number> = {
  USD: 1,
  HKD: 0.1278,
  EUR: 1.085,
  USDT: 0.998,
  USDC: 0.999,
  WUSD: 1,
};

const cryptoCurrencies: CurrencyCode[] = ['USDT', 'USDC', 'WUSD'];

const formatPrecision = (amount: number, currency: CurrencyCode) => {
  const precision = cryptoCurrencies.includes(currency) ? 6 : 2;
  return Number(amount.toFixed(precision));
};

const makeQuoteId = () =>
  `QOTC-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

export function createMockOtcQuote(payload: OtcQuotePayload): OtcQuote {
  const now = new Date();
  const baseRate = USD_MARK_PRICE[payload.fromCurrency] / USD_MARK_PRICE[payload.toCurrency];
  const jitter = 1 + (Math.random() - 0.5) * 0.002;
  const rate = Number((baseRate * jitter).toFixed(6));
  const toAmount = formatPrecision(payload.fromAmount * rate, payload.toCurrency);
  const expiresAt = new Date(now.getTime() + 60_000);
  const estimatedSettlement = new Date(now.getTime() + 5 * 60_000);

  return {
    id: makeId('quote'),
    quoteId: makeQuoteId(),
    accountId: payload.accountId,
    fromCurrency: payload.fromCurrency,
    toCurrency: payload.toCurrency,
    fromAmount: payload.fromAmount,
    toAmount,
    rate,
    inverseRate: Number((1 / rate).toFixed(6)),
    fee: 0,
    expiresAt: expiresAt.toISOString(),
    estimatedSettlement: estimatedSettlement.toISOString(),
    status: 'Active',
  };
}

export async function getOtcTrades() {
  await mockDelay();
  return mockOtcTrades;
}

export async function otcTrade(
  payload: OtcTradePayload,
  entityId: string
): Promise<{ trade: OtcTrade; transaction: Transaction }> {
  await mockDelay();

  const now = new Date().toISOString();
  const referenceId = makeReference('OTC');

  const trade: OtcTrade = {
    id: makeId('otc'),
    referenceId,
    accountId: payload.accountId,
    accountName: payload.accountName,
    type: payload.type,
    fromCurrency: payload.fromCurrency,
    toCurrency: payload.toCurrency,
    fromAmount: payload.fromAmount,
    toAmount: payload.toAmount,
    rate: payload.rate,
    inverseRate: payload.inverseRate,
    fee: payload.fee,
    quoteId: payload.quoteId,
    quoteExpiresAt: payload.quoteExpiresAt,
    estimatedSettlement: payload.estimatedSettlement,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        label: 'Quote accepted',
        status: 'pending',
        at: now,
        description: `${payload.quoteId} locked for mock conversion`,
      },
    ],
    apiLogs: [
      {
        id: makeId('api-log'),
        method: 'POST',
        endpoint: '/mock/otc/quotes',
        statusCode: 200,
        message: 'Mock quote generated',
        at: now,
      },
      {
        id: makeId('api-log'),
        method: 'POST',
        endpoint: '/mock/otc/conversions',
        statusCode: 202,
        message: 'Mock conversion accepted',
        at: now,
      },
    ],
  };

  const transaction: Transaction = {
    id: makeId('txn'),
    referenceId,
    accountId: payload.accountId,
    entityId,
    type: payload.type === 'buy' ? 'otc_buy' : 'otc_sell',
    amount: payload.fromAmount,
    fee: payload.fee,
    currency: payload.fromCurrency,
    status: 'pending',
    source: `${payload.accountName} ${payload.fromCurrency} balance`,
    destination: `${payload.accountName} ${payload.toCurrency} balance`,
    exchangeRate: payload.rate,
    createdAt: now,
    timeline: [
      { label: 'Quote accepted', status: 'pending', at: now },
      { label: 'Conversion created', status: 'pending', at: now },
    ],
  };

  return { trade, transaction };
}
