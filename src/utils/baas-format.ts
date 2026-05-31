import type { EntityType } from 'src/types/entity';
import type { CurrencyCode } from 'src/types/common';
import type { TransactionType } from 'src/types/transaction';

import { fDateTime } from './format-time';
import { fNumber, fCurrency } from './format-number';

export const entityTypeLabel = (type: EntityType) => (type === 'company' ? '企业' : '个人');

export const transactionTypeLabel = (type: TransactionType) =>
  ({
    fiat_deposit: '法币入金',
    fiat_withdraw: '法币出金',
    crypto_deposit: '数字货币入金',
    crypto_withdraw: '数字货币出金',
    otc_buy: 'OTC 买入',
    otc_sell: 'OTC 卖出',
    internal_transfer: '内部转账',
  })[type];

export const formatMoney = (amount: number, currency: CurrencyCode) =>
  ['USD', 'HKD', 'EUR'].includes(currency)
    ? fCurrency(amount, { currency })
    : `${fNumber(amount)} ${currency}`;

export const formatDateTime = (date: string) => fDateTime(date, 'YYYY-MM-DD HH:mm');
