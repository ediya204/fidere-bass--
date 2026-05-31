import type { Metadata } from 'next';

import { CONFIG } from 'src/global-config';

import { VirtualAccountDetailsView } from 'src/sections/virtual-accounts/view';

export const metadata: Metadata = { title: `虚拟账户详情 - ${CONFIG.appName}` };

type Props = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: Props) {
  const { id } = await params;

  return <VirtualAccountDetailsView id={id} />;
}
