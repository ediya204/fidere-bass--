import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { TransactionsView } from 'src/sections/transactions/view';

export const metadata: Metadata = { title: `交易流水 - ${CONFIG.appName}` };

export default function Page() {
  return <TransactionsView />;
}
