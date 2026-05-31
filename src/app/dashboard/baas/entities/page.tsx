import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { EntitiesView } from 'src/sections/entities/view';

export const metadata: Metadata = { title: `实体与 KYB - ${CONFIG.appName}` };

export default function Page() {
  return <EntitiesView />;
}
