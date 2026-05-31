import type { ApiStatus } from './common';

export type UsdtAddress = {
  id: string;
  accountId: string;
  chain: 'TRON' | 'ETHEREUM';
  address: string;
  memo?: string;
  status: ApiStatus;
  createdAt: string;
};
