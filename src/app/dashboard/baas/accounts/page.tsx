import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountsView } from 'src/sections/accounts/view';

export const metadata: Metadata = { title: `全球账户 - ${CONFIG.appName}` };

export default function Page() {
  return <AccountsView />;
}
