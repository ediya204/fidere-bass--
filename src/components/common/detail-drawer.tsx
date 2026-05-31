import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
};

export function DetailDrawer({ open, title, subtitle, onClose, children, actions }: Props) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: 1, sm: 520 } } }}
    >
      <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Divider />

      {actions && (
        <>
          <Box sx={{ p: 2 }}>{actions}</Box>
          <Divider />
        </>
      )}

      <Scrollbar>
        <Stack spacing={3} sx={{ p: 2.5 }}>
          {children}
        </Stack>
      </Scrollbar>
    </Drawer>
  );
}
