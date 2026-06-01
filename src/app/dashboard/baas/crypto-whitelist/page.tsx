import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { CryptoWhitelistView } from 'src/sections/crypto-whitelist/view';

export const metadata: Metadata = { title: `数字货币白名单管理 - ${CONFIG.appName}` };

export default function Page() {
  return <CryptoWhitelistView />;
}
