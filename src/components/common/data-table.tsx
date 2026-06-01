import type { ReactNode } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';

export type DataTableColumn<T> = {
  id: string;
  label: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  title?: string;
  search?: string;
  onSearch?: (value: string) => void;
  emptyText?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  showCount?: boolean;
  onRowClick?: (row: T) => void;
};

export function DataTable<T>({
  rows,
  title,
  search,
  columns,
  rowKey,
  onSearch,
  emptyText = '暂无数据',
  emptyDescription,
  emptyAction,
  showCount = true,
  onRowClick,
}: Props<T>) {
  return (
    <Card sx={{ borderRadius: 1 }}>
      {(title || onSearch) && (
        <Stack
          spacing={2}
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          sx={{ p: 2.5 }}
        >
          {title && (
            <Stack spacing={0.25}>
              <Typography variant="subtitle1">{title}</Typography>
              {showCount && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  共 {rows.length} 条
                </Typography>
              )}
            </Stack>
          )}
          {onSearch && (
            <TextField
              size="small"
              value={search}
              label="搜索"
              onChange={(event) => onSearch(event.target.value)}
              sx={{ minWidth: { md: 280 } }}
            />
          )}
        </Stack>
      )}

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.id} width={column.width} align={column.align}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((row) => (
                <TableRow
                  hover={!!onRowClick}
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.id} align={column.align}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      {rows.length === 0 && (
        <Box sx={{ py: 4 }}>
          <EmptyContent title={emptyText} description={emptyDescription} action={emptyAction} />
        </Box>
      )}
    </Card>
  );
}
