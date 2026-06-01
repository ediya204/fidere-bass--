import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccopenView } from 'src/sections/accopen/view/accopen-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `ACCopen - ${CONFIG.appName}` };

export default function Page() {
  return <AccopenView />;
}
