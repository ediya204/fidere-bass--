import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { AccountDetailsView } from 'src/sections/accounts/view';

export const metadata: Metadata = { title: `全球账户详情 - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <AccountDetailsView id={id} />;
}
