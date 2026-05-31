import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { VirtualAccountsView } from 'src/sections/virtual-accounts/view';

export const metadata: Metadata = { title: `虚拟账户 - ${CONFIG.appName}` };

export default function Page() {
  return <VirtualAccountsView />;
}
