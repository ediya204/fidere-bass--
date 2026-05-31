'use client';

import type { IconifyName } from 'src/components/iconify';

import { useMemo } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { formatMoney, formatDateTime, transactionTypeLabel } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { StatCard, DataTable, StatusChip } from 'src/components/common';

type DashboardStat = {
  title: string;
  value: string | number;
  icon: IconifyName;
  color: 'primary' | 'success' | 'warning' | 'error' | 'info';
};

export function BaasDashboardView() {
  const { entities, globalAccounts, transactions, loading } = useBaasDemo();

  const stats = useMemo<DashboardStat[]>(() => {
    const todayAmount = transactions
      .filter((transaction) => transaction.status === 'completed')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const abnormal = [...entities, ...globalAccounts, ...transactions].filter((item) =>
      ['failed', 'rejected', 'suspended'].includes(item.status)
    ).length;

    return [
      { title: '实体总数', value: entities.length, icon: 'solar:users-group-rounded-bold', color: 'primary' as const },
      { title: '账户总数', value: globalAccounts.length, icon: 'solar:wad-of-money-bold', color: 'success' as const },
      {
        title: '待审核 KYB',
        value: entities.filter((entity) => ['submitted', 'pending'].includes(entity.kybStatus)).length,
        icon: 'solar:file-check-bold-duotone',
        color: 'warning' as const,
      },
      {
        title: '今日交易金额',
        value: formatMoney(todayAmount, 'USD'),
        icon: 'solar:chart-square-outline',
        color: 'info' as const,
      },
      { title: '异常状态', value: abnormal, icon: 'solar:danger-triangle-bold', color: 'error' as const },
    ];
  }, [entities, globalAccounts, transactions]);

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="BaaS 中台总览"
        links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'BaaS Demo' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid key={stat.title} size={{ xs: 12, sm: 6, md: 2.4 }}>
            <StatCard {...stat} helper={loading ? '加载中' : undefined} />
          </Grid>
        ))}

        <Grid size={{ xs: 12, lg: 8 }}>
          <DataTable
            title="最近交易"
            rows={transactions.slice(0, 6)}
            rowKey={(row) => row.id}
            columns={[
              { id: 'referenceId', label: 'Reference ID', render: (row) => row.referenceId },
              { id: 'type', label: '类型', render: (row) => transactionTypeLabel(row.type) },
              { id: 'amount', label: '金额', render: (row) => formatMoney(row.amount, row.currency) },
              { id: 'status', label: '状态', render: (row) => <StatusChip status={row.status} /> },
              { id: 'createdAt', label: '创建时间', render: (row) => formatDateTime(row.createdAt) },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <DataTable
            title="最近新增实体"
            rows={entities.slice(0, 5)}
            rowKey={(row) => row.id}
            columns={[
              {
                id: 'name',
                label: '实体',
                render: (row) => (
                  <Stack spacing={0.25}>
                    <Typography variant="body2">{row.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {row.entityId}
                    </Typography>
                  </Stack>
                ),
              },
              { id: 'status', label: '状态', width: 90, render: (row) => <StatusChip status={row.status} /> },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
