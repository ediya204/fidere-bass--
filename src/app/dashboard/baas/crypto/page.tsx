import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CryptoView } from 'src/sections/crypto/view';

export const metadata: Metadata = { title: `数字货币操作 - ${CONFIG.appName}` };

export default function Page() {
  return <CryptoView />;
}
