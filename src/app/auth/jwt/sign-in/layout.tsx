import { AuthSplitLayout } from 'src/layouts/auth-split';

import { GuestGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <GuestGuard>
      <AuthSplitLayout
        cssVars={{ '--layout-auth-content-width': '472px' }}
        slotProps={{
          section: {
            methods: [],
            title: 'Fidere BaaS',
            subtitle: '统一管理账户、法币、数字资产与交易审核。',
            imgUrl: '/assets/illustrations/illustration-dashboard.webp',
            sx: {
              maxWidth: 560,
              backgroundColor: 'background.neutral',
            },
          },
        }}
      >
        {children}
      </AuthSplitLayout>
    </GuestGuard>
  );
}
