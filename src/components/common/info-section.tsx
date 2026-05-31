import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

type InfoRowProps = {
  label: string;
  value: ReactNode;
};

type InfoSectionProps = {
  title: string;
  rows: InfoRowProps[];
};

export function InfoRow({ label, value }: InfoRowProps) {
  return (
    <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ py: 1 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Box sx={{ typography: 'body2', fontWeight: 600, textAlign: 'right', minWidth: 0 }}>
        {value}
      </Box>
    </Stack>
  );
}

export function InfoSection({ title, rows }: InfoSectionProps) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider />
      <Stack divider={<Divider flexItem />}>
        {rows.map((row) => (
          <InfoRow key={row.label} label={row.label} value={row.value} />
        ))}
      </Stack>
    </Box>
  );
}
