'use client';

/**
 * PAGE_API_MAP:
 * Page: Entity List & KYB / 实体与 KYB
 * Related Interlace APIs:
 * 1. Get Legal Entity (list)  - 实体列表加载与筛选 (kybStatus / 关键字)
 * 2. Create Legal Entity      - 「创建实体」表单提交 (handleCreate)
 * 3. Update Legal Entity      - 提交 KYB (handleSubmitKyb)，详情见 EntityDetailDialog
 * 4. Get Legal Entity (single)- 选中实体回查详情/KYB
 *
 * Current state:
 * - 数据来源: useBaasDemo() context (entities / kybRecords / globalAccounts)
 * - 无真实 Interlace 请求；审核状态推进为 Demo 模拟
 *
 * Integration note:
 * - 保持现有 UI 结构不变；列表筛选未来改为 Get Legal Entity 的 query params
 * - createEntity / submitKyb 替换为 Interlace adapter；真实状态由 Webhook 回写
 * - Docs: docs/baas-demo/entities.md, docs/baas-demo/interlace-api-map.md
 */

import type { Entity } from 'src/types/entity';

import { useMemo, useState, useEffect } from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useUrlQueryState } from 'src/routes/hooks';

import { formatDateTime, entityTypeLabel } from 'src/utils/baas-format';

import { DashboardContent } from 'src/layouts/dashboard';
import { useBaasDemo } from 'src/contexts/baas-demo-context';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ActionBar, DataTable, StatusChip } from 'src/components/common';

import { EntityDetailDialog } from '../entity-detail-dialog';

export function EntitiesView() {
  const { searchParams, setQuery } = useUrlQueryState();
  const {
    entities,
    kybRecords,
    globalAccounts,
    createEntity,
    submitKyb,
    updateKybReviewItem,
    activateGlobalAccount,
    updateKybDocumentReview,
    approveKybAndCreateEntity,
    submitGlobalAccountOpening,
  } = useBaasDemo();
  const [selected, setSelected] = useState<Entity | null>(null);
  const [draft, setDraft] = useState({
    name: '',
    type: 'company' as Entity['type'],
    country: 'HK',
    email: '',
    phone: '',
  });

  const query = searchParams.get('q') ?? '';
  const kybStatus = searchParams.get('kybStatus') ?? 'all';

  const filtered = useMemo(
    () =>
      entities.filter((entity) => {
        const matchesQuery = [entity.name, entity.entityId, entity.email]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesKyb = kybStatus === 'all' || entity.kybStatus === kybStatus;

        return matchesQuery && matchesKyb;
      }),
    [entities, kybStatus, query]
  );

  const selectedEntity = selected
    ? (entities.find((entity) => entity.id === selected.id) ?? selected)
    : null;

  const selectedKyb = selectedEntity
    ? kybRecords.find((record) => record.entityId === selectedEntity.id)
    : undefined;
  const selectedAccounts = selectedEntity
    ? globalAccounts.filter((account) => account.entityId === selectedEntity.id)
    : [];

  useEffect(() => {
    const selectedId = searchParams.get('entityId');

    if (!selectedId) {
      setSelected(null);
      return;
    }

    setSelected(entities.find((entity) => entity.id === selectedId) ?? null);
  }, [entities, searchParams]);

  const handleCreate = async () => {
    // INTERLACE_API_TODO:
    // API: Create Legal Entity
    // Trigger: 点击「创建」按钮
    // Request: draft { name, type, country, email } -> { entityName, personType, jurisdiction, contactInfo }
    // Response: Entity (entityId 由 API 返回)
    // Current: mock via context.createEntity
    if (!draft.name || !draft.email) return;
    const entity = await createEntity(draft);
    setDraft({ name: '', type: 'company', country: 'HK', email: '', phone: '' });
    setSelected(entity);
    setQuery({ entityId: entity.id });
    toast.success('实体已创建');
  };

  const handleSubmitKyb = async () => {
    // INTERLACE_API_TODO:
    // API: Update Legal Entity (提交 KYB)
    // Trigger: 实体详情弹窗内提交 KYB
    // Request: { entityId, documentNames } -> legalEntityId + 已上传文件/KYC 字段
    // Response: KybRecord (complianceStatus)
    // Current: mock via context.submitKyb；documentNames 为占位文件名
    if (!selectedEntity) return;
    await submitKyb({
      entityId: selectedEntity.id,
      documentNames: ['注册文件', '受益人资料', '地址证明'],
    });
    toast.success('KYB 已提交');
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="实体与 KYB"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'BaaS Demo', href: paths.dashboard.baas.root },
          { name: '实体与 KYB' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ActionBar title="创建实体" description="Demo 仅保存到前端状态，提交后进入 KYB/KYC 流程。">
        <Grid container spacing={1.5} sx={{ maxWidth: 780 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="名称"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="类型"
              value={draft.type}
              onChange={(event) =>
                setDraft({ ...draft, type: event.target.value as Entity['type'] })
              }
            >
              <MenuItem value="company">企业</MenuItem>
              <MenuItem value="individual">个人</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="国家/地区"
              value={draft.country}
              onChange={(event) => setDraft({ ...draft, country: event.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="邮箱"
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleCreate}
              disabled={!draft.name || !draft.email}
            >
              创建
            </Button>
          </Grid>
        </Grid>
      </ActionBar>

      <DataTable
        title="实体列表"
        search={query}
        onSearch={(value) => setQuery({ q: value })}
        rows={filtered}
        rowKey={(row) => row.id}
        emptyDescription={
          kybStatus !== 'all' ? '当前筛选条件下暂无实体，可清空筛选后查看全部。' : undefined
        }
        onRowClick={(row) => {
          setSelected(row);
          setQuery({ entityId: row.id });
        }}
        columns={[
          {
            id: 'name',
            label: '实体',
            render: (row) => (
              <Stack spacing={0.25}>
                <Typography variant="body2">{row.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {row.entityId} · {entityTypeLabel(row.type)}
                </Typography>
              </Stack>
            ),
          },
          { id: 'country', label: '国家/地区', width: 110, render: (row) => row.country },
          {
            id: 'kyb',
            label: 'KYB',
            width: 110,
            render: (row) => <StatusChip status={row.kybStatus} />,
          },
          {
            id: 'status',
            label: '实体状态',
            width: 110,
            render: (row) => <StatusChip status={row.status} />,
          },
          {
            id: 'createdAt',
            label: '创建时间',
            width: 160,
            render: (row) => formatDateTime(row.createdAt),
          },
          {
            id: 'actions',
            label: '操作',
            width: 120,
            render: (row) => (
              <Button
                size="small"
                variant="text"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected(row);
                  setQuery({ entityId: row.id });
                }}
              >
                查看详情
              </Button>
            ),
          },
        ]}
      />

      <EntityDetailDialog
        open={!!selectedEntity}
        entity={selectedEntity}
        kybRecord={selectedKyb}
        accounts={selectedAccounts}
        onClose={() => {
          setSelected(null);
          setQuery({ entityId: null });
        }}
        onSubmitKyb={handleSubmitKyb}
        onUpdateReviewItem={updateKybReviewItem}
        onActivateGlobalAccount={activateGlobalAccount}
        onUpdateDocumentReview={updateKybDocumentReview}
        onApproveKybAndCreateEntity={approveKybAndCreateEntity}
        onSubmitGlobalAccountOpening={submitGlobalAccountOpening}
      />
    </DashboardContent>
  );
}
