import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { OtcView } from 'src/sections/otc/view';

export const metadata: Metadata = { title: `OTC 操作 - ${CONFIG.appName}` };

export default function Page() {
  return <OtcView />;
}
