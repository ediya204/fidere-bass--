import type { Dayjs } from 'dayjs';

export type ApiStatus =
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'pending_email_verification'
  | 'pending_sync'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'failed'
  | 'suspended'
  | 'syncing'
  | 'completed'
  | 'processing'
  | 'expired'
  | 'reversed'
  | 'disabled'
  | 'not_created'
  | 'need_more_info';

export type CurrencyCode = 'USD' | 'HKD' | 'EUR' | 'USDT' | 'USDC' | 'WUSD';

export type Balance = {
  currency: CurrencyCode;
  available: number;
  pending: number;
};

export type TimelineEvent = {
  label: string;
  status: ApiStatus;
  at: string;
  description?: string;
};

export type SearchParams = {
  query?: string;
  status?: string;
  accountId?: string;
};

export type IDateValue = string | number | null;

export type IDatePickerControl = Dayjs | null;

export type ISocialLink = {
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
};

export type IAddressItem = {
  id?: string;
  name: string;
  company?: string;
  primary?: boolean;
  fullAddress: string;
  phoneNumber: string;
  addressType: string;
};

export type IPaymentCard = {
  id: string;
  cardType: string;
  primary?: boolean;
  cardNumber: string;
};
