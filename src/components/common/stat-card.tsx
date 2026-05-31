import type { IconifyName } from 'src/components/iconify';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type Props = {
  title: string;
  value: string | number;
  icon: IconifyName;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  helper?: string;
};

export function StatCard({ title, value, icon, color = 'primary', helper }: Props) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 1 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: 'grid',
            borderRadius: 1,
            placeItems: 'center',
            color: `${color}.main`,
            bgcolor: `${color}.lighter`,
          }}
        >
          <Iconify icon={icon} width={24} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
          {helper && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {helper}
            </Typography>
          )}
        </Box>
      </Stack>
    </Card>
  );
}
