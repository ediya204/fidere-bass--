import type { ReactNode } from 'react';
import type { ButtonProps } from '@mui/material/Button';
import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';

export const PAYOUT_WIZARD_LAYOUT = {
  shellMaxWidth: 1040,
  stepperHeight: 68,
  contentMinHeight: 760,
  actionBarHeight: 86,
  sectionRadius: 1,
  sectionPadding: { xs: 2.5, md: 3 },
  listHeight: { xs: 292, md: 348 },
  listHeaderHeight: 54,
  listRowHeight: 76,
  actionButtonWidth: 220,
  primaryButtonWidth: 280,
};

type WizardShellProps = {
  children: ReactNode;
};

export function PayoutWizardShell({ children }: WizardShellProps) {
  return (
    <Box
      sx={{
        width: 1,
        maxWidth: PAYOUT_WIZARD_LAYOUT.shellMaxWidth,
        mx: 'auto',
      }}
    >
      {children}
    </Box>
  );
}

type WizardStepperProps = {
  steps: string[];
  activeStep: number;
  completed?: boolean;
};

export function PayoutWizardStepper({ steps, activeStep, completed = false }: WizardStepperProps) {
  return (
    <Box
      sx={{
        height: PAYOUT_WIZARD_LAYOUT.stepperHeight,
        display: 'flex',
        alignItems: 'center',
        mb: 3,
      }}
    >
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          width: 1,
          minWidth: 0,
          '& .MuiStepLabel-label': {
            typography: { xs: 'caption', sm: 'subtitle2' },
            whiteSpace: 'nowrap',
          },
          '& .MuiStepConnector-line': {
            borderColor: 'divider',
          },
        }}
      >
        {steps.map((label, index) => (
          <Step key={label} completed={completed || activeStep > index}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

type WizardStepLayoutProps = {
  children: ReactNode;
  actions: ReactNode;
};

export function PayoutWizardStepLayout({ children, actions }: WizardStepLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: { md: PAYOUT_WIZARD_LAYOUT.contentMinHeight },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: {
            md: PAYOUT_WIZARD_LAYOUT.contentMinHeight - PAYOUT_WIZARD_LAYOUT.actionBarHeight,
          },
        }}
      >
        {children}
      </Box>

      <WizardActionBar>{actions}</WizardActionBar>
    </Box>
  );
}

type WizardSectionCardProps = {
  title: string;
  subtitle?: string;
  minHeight?: number | object;
  children: ReactNode;
  action?: ReactNode;
  sx?: SxProps<Theme>;
};

export function WizardSectionCard({
  sx,
  title,
  action,
  children,
  subtitle,
  minHeight,
}: WizardSectionCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={[
        {
          width: 1,
          minHeight,
          p: PAYOUT_WIZARD_LAYOUT.sectionPadding,
          borderRadius: PAYOUT_WIZARD_LAYOUT.sectionRadius,
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.customShadows.z4,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: subtitle ? 2.5 : 2 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6">{title}</Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {action}
      </Stack>

      {children}
    </Paper>
  );
}

export type WizardAction = ButtonProps & {
  label: string;
};

type WizardActionsProps = {
  actions: WizardAction[];
};

export function WizardActions({ actions }: WizardActionsProps) {
  return (
    <Stack
      direction={{ xs: 'column-reverse', sm: 'row' }}
      spacing={1.5}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="flex-end"
      sx={{ width: 1 }}
    >
      {actions.map(({ label, sx, ...buttonProps }) => (
        <Button
          key={label}
          size="large"
          {...buttonProps}
          sx={{
            minHeight: 46,
            minWidth: { sm: PAYOUT_WIZARD_LAYOUT.actionButtonWidth },
            px: 3,
            borderRadius: 1,
            ...sx,
          }}
        >
          {label}
        </Button>
      ))}
    </Stack>
  );
}

function WizardActionBar({ children }: { children: ReactNode }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 3,
        px: { xs: 2, sm: 3 },
        py: 2,
        minHeight: { sm: PAYOUT_WIZARD_LAYOUT.actionBarHeight },
        display: 'flex',
        alignItems: 'center',
        borderRadius: PAYOUT_WIZARD_LAYOUT.sectionRadius,
        bgcolor: 'background.paper',
        boxShadow: (theme) => theme.customShadows.z4,
      }}
    >
      {children}
    </Paper>
  );
}

type ReviewRowsProps = {
  rows: { label: string; value: ReactNode; emphasized?: boolean }[];
};

export function ReviewRows({ rows }: ReviewRowsProps) {
  return (
    <Stack divider={<Divider flexItem />}>
      {rows.map((row) => (
        <Stack
          key={row.label}
          direction="row"
          spacing={2}
          alignItems="flex-start"
          justifyContent="space-between"
          sx={{ py: 1.15 }}
        >
          <Typography variant="body2" sx={{ width: 150, flexShrink: 0, color: 'text.secondary' }}>
            {row.label}
          </Typography>
          <Box
            sx={{
              minWidth: 0,
              typography: row.emphasized ? 'subtitle2' : 'body2',
              fontWeight: row.emphasized ? 700 : 500,
              textAlign: 'right',
              wordBreak: 'break-word',
            }}
          >
            {row.value}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
