'use client';

import { useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatMoney } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ActionBar, DataTable, StatusChip } from 'src/components/common';

export function VirtualAccountsView() {
  const router = useRouter();
  const { virtualAccounts } = useBaasDemo();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      virtualAccounts.filter((account) =>
        [account.vaId, account.accountName, account.accountNumber]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [query, virtualAccounts]
  );

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="虚拟账户"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '虚拟账户' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ActionBar title="VA 银行账户" description="Virtual Account 由 Global Account 详情触发创建，这里负责查询和核对银行收款信息。" />

      <DataTable
        title="VA 列表"
        rows={filtered}
        search={query}
        onSearch={setQuery}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(paths.dashboard.baas.virtualAccountDetails(row.id))}
        columns={[
          {
            id: 'va',
            label: 'VA 账户',
            render: (row) => (
              <Stack spacing={0.25}>
                <Typography variant="body2">{row.vaId}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.accountNumber}
                </Typography>
              </Stack>
            ),
          },
          { id: 'currency', label: '币种', width: 90, render: (row) => row.currency },
          { id: 'balance', label: '余额', render: (row) => formatMoney(row.balance, row.currency) },
          { id: 'bank', label: '银行', render: (row) => row.bankName },
          { id: 'status', label: '状态', width: 110, render: (row) => <StatusChip status={row.status} /> },
        ]}
      />
    </DashboardContent>
  );
}
