import type { ApiStatus } from 'src/types/common';

import { STATUS_COLORS, STATUS_LABELS } from 'src/constants/status-options';

import { Label } from 'src/components/label';

type Props = {
  status: ApiStatus;
};

export function StatusChip({ status }: Props) {
  return (
    <Label variant="soft" color={STATUS_COLORS[status] ?? 'default'}>
      {STATUS_LABELS[status] ?? status}
    </Label>
  );
}
