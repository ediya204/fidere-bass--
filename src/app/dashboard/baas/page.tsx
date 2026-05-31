import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { BaasDashboardView } from 'src/sections/baas-dashboard/view';

export const metadata: Metadata = { title: `BaaS 中台 - ${CONFIG.appName}` };

export default function Page() {
  return <BaasDashboardView />;
}
