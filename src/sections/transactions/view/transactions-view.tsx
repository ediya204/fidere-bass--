'use client';

/**
 * PAGE_API_MAP:
 * Page: Transactions / 交易流水
 * Related Interlace APIs:
 * 1. Get Account Transactions - 交易列表 (按 accountId / entityId / type / status 过滤)
 *
 * Current state:
 * - 数据来源: useBaasDemo() context (transactions)，筛选在前端完成
 * - 无真实 Interlace 请求
 *
 * Integration note:
 * - 保持现有 UI 结构不变；前端筛选条件未来映射为 Get Account Transactions 的 query params
 * - 详情 Drawer 的 timeline 真实接入后来自交易状态历史 / Webhook
 * - Docs: docs/baas-demo/transactions.md, docs/baas-demo/interlace-api-map.md
 */

import type { ApiStatus } from 'src/types/common';

import { useMemo, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Timeline from '@mui/lab/Timeline';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TimelineDot from '@mui/lab/TimelineDot';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';

import { paths } from 'src/routes/paths';
import { useUrlQueryState } from 'src/routes/hooks';

import { buildQueryHref, appendQueryHref } from 'src/utils/baas-navigation';
import { formatMoney, formatDateTime, transactionTypeLabel } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';
import { STATUS_COLORS, STATUS_LABELS } from 'src/constants/status-options';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  ActionBar,
  DataTable,
  StatusChip,
  InfoSection,
  RelatedLink,
  DetailDrawer,
} from 'src/components/common';

const getTimelineDotColor = (status: ApiStatus) => {
  const color = STATUS_COLORS[status];
  return color === 'default' ? 'grey' : color;
};

export function TransactionsView() {
  const { currentHref, searchParams, setQuery } = useUrlQueryState();
  const { entities, globalAccounts, transactions } = useBaasDemo();
  const query = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const accountFilter = searchParams.get('accountId') ?? 'all';
  const entityFilter = searchParams.get('entityId') ?? 'all';
  const selectedId = searchParams.get('transactionId');

  const filtered = useMemo(
    () =>
      transactions.filter((transaction) => {
        const matchesQuery = [
          transaction.referenceId,
          transaction.source,
          transaction.destination,
          transaction.currency,
        ]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus = status === 'all' || transaction.status === status;
        const matchesAccount = accountFilter === 'all' || transaction.accountId === accountFilter;
        const matchesEntity = entityFilter === 'all' || transaction.entityId === entityFilter;

        return matchesQuery && matchesStatus && matchesAccount && matchesEntity;
      }),
    [accountFilter, entityFilter, query, status, transactions]
  );

  const selected = useMemo(
    () => transactions.find((transaction) => transaction.id === selectedId) ?? null,
    [selectedId, transactions]
  );
  const selectedEntity = selected
    ? entities.find((entity) => entity.id === selected.entityId)
    : undefined;
  const selectedAccount = selected
    ? globalAccounts.find((account) => account.id === selected.accountId)
    : undefined;

  useEffect(() => {
    if (selectedId && !selected) {
      setQuery({ transactionId: null });
    }
  }, [selected, selectedId, setQuery]);

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="交易流水"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '交易流水' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ActionBar title="流水查询" description="统一查看法币、数字货币、OTC 与内部转账交易。">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {(accountFilter !== 'all' || entityFilter !== 'all') && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => setQuery({ accountId: null, entityId: null })}
            >
              查看全部流水
            </Button>
          )}
          <TextField
            select
            size="small"
            label="状态"
            value={status}
            onChange={(event) => setQuery({ status: event.target.value })}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">全部状态</MenuItem>
            {(['pending', 'processing', 'completed', 'failed', 'reversed'] as ApiStatus[]).map(
              (item) => (
                <MenuItem key={item} value={item}>
                  {STATUS_LABELS[item]}
                </MenuItem>
              )
            )}
          </TextField>
        </Stack>
      </ActionBar>

      <DataTable
        title="交易列表"
        search={query}
        onSearch={(value) => setQuery({ q: value })}
        rows={filtered}
        rowKey={(row) => row.id}
        emptyDescription="可以从账户、VA、出金或 OTC 页面带着上下文跳转到这里继续核对。"
        onRowClick={(row) => setQuery({ transactionId: row.id })}
        columns={[
          { id: 'referenceId', label: 'Reference ID', render: (row) => row.referenceId },
          { id: 'type', label: '类型', render: (row) => transactionTypeLabel(row.type) },
          { id: 'amount', label: '金额', render: (row) => formatMoney(row.amount, row.currency) },
          { id: 'status', label: '状态', render: (row) => <StatusChip status={row.status} /> },
          { id: 'source', label: '来源', render: (row) => row.source },
          { id: 'destination', label: '目标', render: (row) => row.destination },
          { id: 'createdAt', label: '创建时间', render: (row) => formatDateTime(row.createdAt) },
        ]}
      />

      {selected && (
        <DetailDrawer
          open={!!selected}
          onClose={() => setQuery({ transactionId: null })}
          title={selected.referenceId}
          subtitle={transactionTypeLabel(selected.type)}
        >
          <InfoSection
            title="基础信息"
            rows={[
              { label: '状态', value: <StatusChip status={selected.status} /> },
              {
                label: '所属实体',
                value: selectedEntity ? (
                  <RelatedLink
                    href={buildQueryHref(paths.dashboard.baas.entities, {
                      entityId: selectedEntity.id,
                    })}
                    label={selectedEntity.name}
                    caption={selectedEntity.entityId}
                  />
                ) : (
                  '-'
                ),
              },
              {
                label: '账户',
                value: selectedAccount ? (
                  <RelatedLink
                    href={appendQueryHref(paths.dashboard.baas.accountDetails(selectedAccount.id), {
                      returnTo: currentHref,
                    })}
                    label={selectedAccount.name}
                    caption={selectedAccount.accountId}
                  />
                ) : (
                  selected.accountId
                ),
              },
              { label: '创建时间', value: formatDateTime(selected.createdAt) },
            ]}
          />
          <InfoSection
            title="金额与费用"
            rows={[
              { label: '交易金额', value: formatMoney(selected.amount, selected.currency) },
              { label: '费用', value: formatMoney(selected.fee, selected.currency) },
              { label: '汇率', value: selected.exchangeRate ?? '不适用' },
            ]}
          />
          <InfoSection
            title="收付款方"
            rows={[
              { label: '来源', value: selected.source },
              { label: '目标', value: selected.destination },
              { label: '失败原因', value: selected.errorReason ?? '无' },
            ]}
          />

          <Stack spacing={1}>
            <Typography variant="subtitle2">状态变化</Typography>
            <Timeline
              sx={{
                m: 0,
                p: 0,
                [`& .${timelineItemClasses.root}:before`]: { flex: 0, p: 0 },
              }}
            >
              {selected.timeline.map((event, index) => (
                <TimelineItem key={`${event.label}-${event.at}`}>
                  <TimelineSeparator>
                    <TimelineDot color={getTimelineDotColor(event.status)} />
                    {index < selected.timeline.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent sx={{ pb: 2 }}>
                    <Typography variant="body2">{event.label}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {formatDateTime(event.at)}
                    </Typography>
                    {event.description && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: 'text.secondary' }}
                      >
                        {event.description}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Stack>
        </DetailDrawer>
      )}
    </DashboardContent>
  );
}
