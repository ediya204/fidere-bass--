import type { ReactNode } from 'react';
import type { IconifyName } from 'src/components/iconify';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type Props = {
  title: string;
  description?: string;
  children?: ReactNode;
  actionLabel?: string;
  actionIcon?: IconifyName;
  onAction?: () => void;
};

export function ActionBar({ title, description, children, actionLabel, actionIcon, onAction }: Props) {
  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      justifyContent="space-between"
      sx={{ mb: 3 }}
    >
      <Stack spacing={0.5}>
        <Typography variant="h5">{title}</Typography>
        {description && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {description}
          </Typography>
        )}
      </Stack>

      {children}

      {actionLabel && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          startIcon={actionIcon ? <Iconify icon={actionIcon} /> : undefined}
        >
          {actionLabel}
        </Button>
      )}
    </Stack>
  );
}
