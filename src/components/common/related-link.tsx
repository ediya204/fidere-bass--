import type { ReactNode } from 'react';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';

type Props = {
  href: string;
  label: ReactNode;
  caption?: ReactNode;
};

export function RelatedLink({ href, label, caption }: Props) {
  return (
    <Link component={RouterLink} href={href} underline="none" color="inherit">
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        justifyContent="flex-end"
        sx={{ minWidth: 0, color: 'primary.main' }}
      >
        <Stack spacing={0.1} sx={{ minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          {caption && (
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
              {caption}
            </Typography>
          )}
        </Stack>
        <Iconify icon="eva:external-link-fill" width={16} />
      </Stack>
    </Link>
  );
}
