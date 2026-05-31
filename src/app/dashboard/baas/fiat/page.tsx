import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { FiatView } from 'src/sections/fiat/view';

export const metadata: Metadata = { title: `法币操作 - ${CONFIG.appName}` };

export default function Page() {
  return <FiatView />;
}
