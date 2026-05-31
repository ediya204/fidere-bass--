'use client';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatMoney, formatDateTime, transactionTypeLabel } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { DataTable, StatusChip, InfoSection } from 'src/components/common';

type Props = {
  id: string;
};

export function AccountDetailsView({ id }: Props) {
  const router = useRouter();
  const {
    entities,
    globalAccounts,
    virtualAccounts,
    usdtAddresses,
    transactions,
    createVirtualAccount,
    createUSDTAddress,
  } = useBaasDemo();

  const account = globalAccounts.find((item) => item.id === id);

  if (!account) {
    return (
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="全球账户详情"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'BaaS Demo', href: paths.dashboard.baas.root },
            { name: '全球账户', href: paths.dashboard.baas.accounts },
            { name: '详情' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <EmptyContent title="未找到账户" action={<Button onClick={() => router.push(paths.dashboard.baas.accounts)}>返回列表</Button>} />
      </DashboardContent>
    );
  }

  const entity = entities.find((item) => item.id === account.entityId);
  const accountVirtualAccounts = virtualAccounts.filter((item) => item.globalAccountId === account.id);
  const usdtAddress = usdtAddresses.find((address) => address.accountId === account.id);
  const accountTransactions = transactions
    .filter((transaction) => transaction.accountId === account.id)
    .slice(0, 8);

  const handleCreateVa = async () => {
    await createVirtualAccount(account.id);
    toast.success('VA 创建请求已提交');
  };

  const handleCreateAddress = async () => {
    await createUSDTAddress(account.id);
    toast.success('USDT 地址已创建');
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading={account.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '全球账户', href: paths.dashboard.baas.accounts },
          { name: account.accountId },
        ]}
        action={
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" color="inherit" onClick={() => router.push(paths.dashboard.baas.accounts)}>
              返回列表
            </Button>
            <Button variant="contained" onClick={handleCreateVa} startIcon={<Iconify icon="solar:bill-list-bold" />}>
              创建 VA
            </Button>
            <Button variant="outlined" onClick={handleCreateAddress} disabled={!!usdtAddress}>
              {usdtAddress ? '已创建 USDT 地址' : '激活并创建 USDT 地址'}
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoSection
            title="账户信息"
            rows={[
              { label: 'Global Account ID', value: account.accountId },
              { label: '所属实体', value: entity?.name ?? '-' },
              { label: '账户状态', value: <StatusChip status={account.status} /> },
              { label: '创建时间', value: formatDateTime(account.createdAt) },
              { label: '数字货币能力', value: account.cryptoEnabled ? '已激活' : '未激活' },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <InfoSection
            title="数字货币余额与 USDT 地址"
            rows={[
              ...account.cryptoBalances.map((balance) => ({
                label: balance.currency,
                value: `${formatMoney(balance.available, balance.currency)} 可用`,
              })),
              {
                label: 'USDT 地址',
                value: usdtAddress ? (
                  <Box component="span" sx={{ wordBreak: 'break-all' }}>
                    {usdtAddress.chain} · {usdtAddress.address}
                  </Box>
                ) : (
                  '未创建'
                ),
              },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <InfoSection
            title="法币余额"
            rows={account.fiatBalances.map((balance) => ({
              label: balance.currency,
              value: `${formatMoney(balance.available, balance.currency)} 可用 / ${formatMoney(
                balance.pending,
                balance.currency
              )} 在途`,
            }))}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <DataTable
            title="VA 账户"
            rows={accountVirtualAccounts}
            rowKey={(row) => row.id}
            emptyText="暂无 VA"
            onRowClick={(row) => router.push(paths.dashboard.baas.virtualAccountDetails(row.id))}
            columns={[
              { id: 'vaId', label: 'VA ID', render: (row) => row.vaId },
              { id: 'currency', label: '币种', render: (row) => row.currency },
              { id: 'status', label: '状态', render: (row) => <StatusChip status={row.status} /> },
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <DataTable
            title="最近交易"
            rows={accountTransactions}
            rowKey={(row) => row.id}
            emptyText="暂无交易"
            columns={[
              { id: 'type', label: '类型', render: (row) => transactionTypeLabel(row.type) },
              { id: 'amount', label: '金额', render: (row) => formatMoney(row.amount, row.currency) },
              { id: 'status', label: '状态', render: (row) => <StatusChip status={row.status} /> },
            ]}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
