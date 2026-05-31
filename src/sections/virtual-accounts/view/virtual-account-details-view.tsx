'use client';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatMoney, formatDateTime, transactionTypeLabel } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { DataTable, StatusChip, InfoSection } from 'src/components/common';

type Props = {
  id: string;
};

export function VirtualAccountDetailsView({ id }: Props) {
  const router = useRouter();
  const { entities, globalAccounts, virtualAccounts, transactions } = useBaasDemo();

  const account = virtualAccounts.find((item) => item.id === id);

  if (!account) {
    return (
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="虚拟账户详情"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'BaaS Demo', href: paths.dashboard.baas.root },
            { name: '虚拟账户', href: paths.dashboard.baas.virtualAccounts },
            { name: '详情' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <EmptyContent
          title="未找到虚拟账户"
          action={<Button onClick={() => router.push(paths.dashboard.baas.virtualAccounts)}>返回列表</Button>}
        />
      </DashboardContent>
    );
  }

  const entity = entities.find((item) => item.id === account.entityId);
  const globalAccount = globalAccounts.find((item) => item.id === account.globalAccountId);
  const accountTransactions = transactions
    .filter((transaction) => transaction.source.includes(account.vaId))
    .slice(0, 8);

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={account.vaId}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '虚拟账户', href: paths.dashboard.baas.virtualAccounts },
          { name: account.accountNumber },
        ]}
        action={
          <Button variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.baas.virtualAccounts)}>
            返回列表
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoSection
            title="银行账户信息"
            rows={[
              { label: '银行名称', value: account.bankName },
              { label: '银行地址', value: account.bankAddress },
              { label: '账户名', value: account.accountName },
              { label: '账号', value: account.accountNumber },
              { label: 'Routing Number', value: account.routingNumber },
              { label: 'SWIFT', value: account.swiftCode },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <InfoSection
            title="关联信息"
            rows={[
              { label: '所属实体', value: entity?.name ?? '-' },
              { label: 'Global Account', value: globalAccount?.accountId ?? '-' },
              { label: '币种', value: account.currency },
              { label: '余额', value: formatMoney(account.balance, account.currency) },
              { label: '状态', value: <StatusChip status={account.status} /> },
              { label: '创建时间', value: formatDateTime(account.createdAt) },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <DataTable
            title="交易记录"
            rows={accountTransactions}
            rowKey={(row) => row.id}
            emptyText="暂无交易"
            columns={[
              { id: 'type', label: '类型', render: (row) => transactionTypeLabel(row.type) },
              { id: 'amount', label: '金额', render: (row) => formatMoney(row.amount, row.currency) },
              { id: 'status', label: '状态', render: (row) => <StatusChip status={row.status} /> },
              { id: 'createdAt', label: '创建时间', render: (row) => formatDateTime(row.createdAt) },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
