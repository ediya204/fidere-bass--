import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  file: icon('ic-file'),
  user: icon('ic-user'),
  order: icon('ic-order'),
  banking: icon('ic-banking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'BaaS Demo',
    items: [
      { title: '中台总览', path: paths.dashboard.baas.root, icon: ICONS.dashboard },
      { title: '实体与 KYB', path: paths.dashboard.baas.entities, icon: ICONS.user },
      { title: '全球账户', path: paths.dashboard.baas.accounts, icon: ICONS.banking },
      { title: '虚拟账户', path: paths.dashboard.baas.virtualAccounts, icon: ICONS.invoice },
      { title: '法币操作', path: paths.dashboard.baas.fiat, icon: ICONS.order },
      { title: '数字货币操作', path: paths.dashboard.baas.crypto, icon: ICONS.product },
      { title: 'OTC 操作', path: paths.dashboard.baas.otc, icon: ICONS.analytics },
      { title: '交易流水', path: paths.dashboard.baas.transactions, icon: ICONS.file },
    ],
  },
];
