'use client';

import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { getErrorMessage } from '../../utils';
import { signInWithPassword } from '../../context/jwt';

// ----------------------------------------------------------------------

export type SignInSchemaType = zod.infer<typeof SignInSchema>;

export const SignInSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: '请输入邮箱' })
    .email({ message: '请输入有效的邮箱地址' }),
  password: zod
    .string()
    .min(1, { message: '请输入密码' })
    .min(6, { message: '密码至少需要 6 位字符' }),
  remember: zod.boolean(),
});

// ----------------------------------------------------------------------

export function JwtSignInView() {
  const router = useRouter();

  const showPassword = useBoolean();

  const { checkUserSession } = useAuthContext();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = {
    email: 'demo@minimals.cc',
    password: '@2Minimal',
    remember: true,
  };

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ email: data.email, password: data.password });
      await checkUserSession?.();

      router.refresh();
    } catch (error) {
      console.error(error);
      const feedbackMessage = getErrorMessage(error);
      setErrorMessage(feedbackMessage);
    }
  });

  const handleUseDemoAccount = () => {
    methods.setValue('email', defaultValues.email, { shouldValidate: true });
    methods.setValue('password', defaultValues.password, { shouldValidate: true });
  };

  const renderForm = () => (
    <Box sx={{ gap: 2.5, display: 'flex', flexDirection: 'column' }}>
      <Field.Text
        name="email"
        label="工作邮箱"
        placeholder="name@company.com"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="solar:letter-bold" width={20} />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ gap: 1.5, display: 'flex', flexDirection: 'column' }}>
        <Link
          component={RouterLink}
          href="#"
          variant="body2"
          color="inherit"
          sx={{ alignSelf: 'flex-end' }}
        >
          忘记密码？
        </Link>

        <Field.Text
          name="password"
          label="密码"
          placeholder="输入 6 位以上密码"
          type={showPassword.value ? 'text' : 'password'}
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:lock-password-outline" width={20} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={showPassword.onToggle} edge="end" aria-label="切换密码显示">
                    <Iconify
                      icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Field.Checkbox
        name="remember"
        label="保持登录状态"
        sx={{ color: 'text.secondary', alignSelf: 'flex-start' }}
      />

      <Button
        fullWidth
        color="primary"
        size="large"
        type="submit"
        variant="contained"
        startIcon={<Iconify icon="solar:import-bold" />}
        loading={isSubmitting}
        loadingIndicator="正在登录..."
        sx={{
          minHeight: 52,
          boxShadow: (theme) => `0 16px 32px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.24)}`,
        }}
      >
        登录控制台
      </Button>
    </Box>
  );

  return (
    <Box
      sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        border: (theme) => `1px solid ${theme.vars.palette.divider}`,
        bgcolor: 'background.paper',
        boxShadow: (theme) => `0 24px 80px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.16)}`,
      }}
    >
      <Box sx={{ mb: 3.5 }}>
        <Box
          sx={{
            mb: 2,
            gap: 1,
            display: 'inline-flex',
            alignItems: 'center',
            px: 1.25,
            py: 0.75,
            borderRadius: 99,
            color: 'primary.dark',
            bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.12),
            typography: 'caption',
            fontWeight: 'fontWeightBold',
          }}
        >
          <Iconify icon="solar:shield-check-bold" width={18} />
          Fidere BaaS Secure Access
        </Box>

        <Typography variant="h3" sx={{ mb: 1 }}>
          登录控制台
        </Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          进入账户、支付和数字资产运营工作台。
        </Typography>
      </Box>

      <Box
        sx={{
          mb: 3,
          gap: 1.5,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        }}
      >
        {([
          { label: '账户网络', value: 'Global rails', icon: 'solar:wad-of-money-bold' },
          { label: '风险监控', value: 'Live review', icon: 'solar:chart-square-outline' },
        ] as const).map((item) => (
          <Box
            key={item.label}
            sx={{
              gap: 1.25,
              display: 'flex',
              alignItems: 'center',
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'background.neutral',
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 1.5,
                display: 'grid',
                placeItems: 'center',
                color: 'warning.dark',
                bgcolor: (theme) => varAlpha(theme.vars.palette.warning.mainChannel, 0.16),
              }}
            >
              <Iconify icon={item.icon} width={20} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {item.label}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {item.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Alert
        severity="info"
        action={
          <Button color="info" size="small" onClick={handleUseDemoAccount}>
            填入
          </Button>
        }
        sx={{ mb: 3 }}
      >
        演示账号 <strong>{defaultValues.email}</strong> / <strong>{defaultValues.password}</strong>
      </Alert>

      {!!errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm()}
      </Form>

      <Divider sx={{ my: 3 }} />

      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
        还没有账户？{' '}
        <Link component={RouterLink} href={paths.auth.jwt.signUp} variant="subtitle2">
          创建访问权限
        </Link>
      </Typography>
    </Box>
  );
}
