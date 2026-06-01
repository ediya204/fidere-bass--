import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { JwtSignInView } from 'src/auth/view/jwt';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `登录 | Fidere BaaS - ${CONFIG.appName}` };

export default function Page() {
  return <JwtSignInView />;
}
