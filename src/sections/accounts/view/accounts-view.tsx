'use client';

import { useMemo, useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { formatDateTime } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ActionBar, DataTable, StatusChip } from 'src/components/common';

export function AccountsView() {
  const router = useRouter();
  const { entities, globalAccounts, createGlobalAccount } = useBaasDemo();
  const [query, setQuery] = useState('');
  const activeEntities = entities.filter((entity) => entity.status === 'active');
  const [draft, setDraft] = useState({ entityId: activeEntities[0]?.id ?? '', name: '' });

  const filtered = useMemo(
    () =>
      globalAccounts.filter((account) =>
        [account.name, account.accountId].join(' ').toLowerCase().includes(query.toLowerCase())
      ),
    [globalAccounts, query]
  );

  const handleCreateAccount = async () => {
    if (!draft.entityId || !draft.name) return;

    const account = await createGlobalAccount(draft);
    setDraft({ entityId: activeEntities[0]?.id ?? '', name: '' });
    toast.success('全球账户已创建');
    router.push(paths.dashboard.baas.accountDetails(account.id));
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="全球账户"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '全球账户' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ActionBar title="创建 Global Account" description="仅 Active 实体可创建账户；创建后进入独立账户详情页。">
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ width: { xs: 1, md: 'auto' } }}>
          <TextField
            select
            size="small"
            label="实体"
            value={draft.entityId}
            onChange={(event) => setDraft({ ...draft, entityId: event.target.value })}
            sx={{ minWidth: 220 }}
          >
            {activeEntities.map((entity) => (
              <MenuItem key={entity.id} value={entity.id}>
                {entity.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="账户名称"
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          />
          <Button
            variant="contained"
            onClick={handleCreateAccount}
            disabled={!draft.entityId || !draft.name}
            startIcon={<Iconify icon="mingcute:add-line" />}
          >
            创建
          </Button>
        </Stack>
      </ActionBar>

      <DataTable
        title="Global Account 列表"
        search={query}
        onSearch={setQuery}
        rows={filtered}
        rowKey={(row) => row.id}
        onRowClick={(row) => router.push(paths.dashboard.baas.accountDetails(row.id))}
        columns={[
          {
            id: 'account',
            label: '账户',
            render: (row) => (
              <Stack spacing={0.25}>
                <Typography variant="body2">{row.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.accountId}
                </Typography>
              </Stack>
            ),
          },
          {
            id: 'entity',
            label: '所属实体',
            render: (row) => entities.find((entity) => entity.id === row.entityId)?.name ?? '-',
          },
          { id: 'status', label: '状态', width: 110, render: (row) => <StatusChip status={row.status} /> },
          {
            id: 'crypto',
            label: '数字货币',
            width: 110,
            render: (row) => (row.cryptoEnabled ? '已激活' : '未激活'),
          },
          { id: 'createdAt', label: '创建时间', width: 160, render: (row) => formatDateTime(row.createdAt) },
        ]}
      />
    </DashboardContent>
  );
}
