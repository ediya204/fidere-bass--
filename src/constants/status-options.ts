import type { ApiStatus } from 'src/types/common';

export const STATUS_LABELS: Record<ApiStatus, string> = {
  draft: '草稿',
  submitted: '已提交',
  pending: '待处理',
  pending_email_verification: '待邮箱验证',
  pending_sync: '待同步',
  approved: '已通过',
  rejected: '已驳回',
  active: '正常',
  failed: '失败',
  suspended: '暂停',
  syncing: '同步中',
  completed: '已完成',
  processing: '处理中',
  expired: '已过期',
  reversed: '已冲正',
  disabled: '已禁用',
  not_created: '未开通',
  need_more_info: '需补充',
};

export const STATUS_COLORS: Record<
  ApiStatus,
  'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error'
> = {
  draft: 'default',
  submitted: 'info',
  pending: 'warning',
  pending_email_verification: 'warning',
  pending_sync: 'info',
  approved: 'success',
  rejected: 'error',
  active: 'success',
  failed: 'error',
  suspended: 'warning',
  syncing: 'info',
  completed: 'success',
  processing: 'info',
  expired: 'default',
  reversed: 'secondary',
  disabled: 'default',
  not_created: 'default',
  need_more_info: 'warning',
};

export const ALL_STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));
