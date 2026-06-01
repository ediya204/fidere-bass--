'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type AccountType = 'personal' | 'business';

type ExistingField = {
  label: string;
  value: string;
  helper?: string;
};

type UploadItem = {
  title: string;
  fileName: string;
  helper: string;
};

const existingFields: ExistingField[] = [
  { label: '名', value: 'Wanyara' },
  { label: '姓', value: 'Wan' },
  { label: '出生日期', value: '1990-03-18' },
  { label: '性别', value: '女' },
  { label: '国籍', value: 'HKG' },
  {
    label: '电话国家代码',
    value: '852',
    helper: '模拟从 Sumsub / 手机号国家代码读取。',
  },
  { label: '手机号', value: '91234567' },
  {
    label: '证件号码',
    value: 'K1234567',
    helper: '模拟从 Sumsub 护照资料读取。',
  },
  {
    label: '证件签发日期',
    value: '2020-06-01',
    helper: '模拟从 Sumsub 护照资料读取。',
  },
  {
    label: '证件到期日',
    value: '2030-06-01',
    helper: '模拟从 Sumsub 护照资料读取。',
  },
  {
    label: '地区',
    value: 'HK',
    helper: '模拟 Sumsub / 护照国家读取，当前 mock 为 HK。',
  },
  { label: '居住地街道地址', value: '88 Queens Road Central' },
  { label: '居住地城市', value: 'Hong Kong' },
  {
    label: '居住地州/地区',
    value: 'Hong Kong',
    helper:
      '对于美国和加拿大：必须使用两位字母代码提供细分区域（例如，WA 代表华盛顿州）。对于没有州/省的其他国家，请重复国家名称。允许使用的字符：英文字母、数字和常用符号',
  },
  { label: '居住地所在国家', value: 'HKG' },
  { label: '居住地邮编', value: '999077' },
];

const uploads: UploadItem[] = [
  {
    title: '护照文件',
    fileName: 'Passport.png',
    helper: '仅允许上传护照文件；支持 pdf / jpeg / png，单个文件大小限制 8M。',
  },
  {
    title: '自拍照',
    fileName: 'Selfie.png',
    helper: '支持 pdf / jpeg / png，单个文件大小限制 8M。',
  },
  {
    title: '地址证明',
    fileName: 'Address Proof.png',
    helper: '支持 pdf / jpeg / png，单个文件大小限制 8M。',
  },
  {
    title: '资金来源证明',
    fileName: 'Source of Funds.png',
    helper: '支持 pdf / jpeg / png，单个文件大小限制 8M。',
  },
];

// ----------------------------------------------------------------------

export function AccopenView() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>('personal');

  const handleAccountType = (_event: React.MouseEvent<HTMLElement>, value: AccountType | null) => {
    if (value) {
      setAccountType(value);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'oklch(97.6% 0.018 96)',
        color: 'oklch(22% 0.025 78)',
        py: { xs: 2, md: 4 },
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={{ xs: 3, md: 4 }}>
          <Stack spacing={2}>
            <Button
              color="inherit"
              onClick={() => router.back()}
              startIcon={<Iconify icon="solar:reply-bold" />}
              sx={{ alignSelf: 'flex-start' }}
            >
              返回开户流程
            </Button>

            <Box
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 1,
                bgcolor: 'common.white',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={3}
                sx={{
                  alignItems: { xs: 'flex-start', md: 'center' },
                  justifyContent: 'space-between',
                }}
              >
                <Stack spacing={1.5} sx={{ maxWidth: 760 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                  >
                    <Label color="info">ACCopen</Label>
                    <Label color="warning">BaaS Create Legal Entity</Label>
                  </Stack>

                  <Typography variant="h3">BaaS 开户申请</Typography>

                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    先复用系统已有 KYC / KYB / Sumsub 资料，仅补充 BaaS
                    必需但系统缺失的资料。带出的资料格式需要符合 BaaS Create Legal Entity API 要求。
                  </Typography>
                </Stack>

                <Stack
                  spacing={0.75}
                  sx={{
                    px: 2,
                    py: 1.5,
                    width: { xs: 1, md: 280 },
                    borderRadius: 1,
                    bgcolor: 'oklch(95.5% 0.026 146)',
                    border: '1px solid oklch(84% 0.052 146)',
                  }}
                >
                  <Typography variant="subtitle2">当前步骤</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    资料确认 → 缺失资料补充 → 第三方签署
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ borderRadius: 1 }}>
                <CardContent>
                  <Stack spacing={3}>
                    <Stack spacing={1}>
                      <Typography variant="h6">原型开户类型切换</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        仅用于原型演示切换。真实用户会根据账户类型自动进入个人或企业开户资料页面。
                      </Typography>
                    </Stack>

                    <ToggleButtonGroup
                      exclusive
                      fullWidth
                      color="primary"
                      value={accountType}
                      onChange={handleAccountType}
                      sx={{
                        '& .MuiToggleButton-root': {
                          gap: 1,
                          py: 1.25,
                          borderRadius: 1,
                          textTransform: 'none',
                        },
                      }}
                    >
                      <ToggleButton value="personal">
                        <Iconify icon="solar:user-id-bold" />
                        个人开户
                      </ToggleButton>

                      <ToggleButton value="business">
                        <Iconify icon="solar:users-group-rounded-bold" />
                        企业开户
                      </ToggleButton>
                    </ToggleButtonGroup>

                    <Divider />

                    {accountType === 'personal' ? (
                      <AccountTypeSummary
                        icon="solar:user-id-bold"
                        title="个人开户"
                        description="复用个人 KYC / Sumsub 资料。"
                        status="演示中"
                      />
                    ) : (
                      <AccountTypeSummary
                        icon="solar:bill-list-bold"
                        title="企业开户"
                        description="复用企业 KYB 资料，补充缺失文件、股东和授权代表信息。"
                        status="可切换"
                      />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={3}>
                <Card sx={{ borderRadius: 1 }}>
                  <CardContent>
                    <SectionHeader
                      icon="solar:shield-check-bold"
                      title="已获取资料"
                      description="当前系统已有字段自动带出，只读展示，供用户确认。"
                    />

                    <Box
                      component="dl"
                      sx={{
                        m: 0,
                        mt: 3,
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, minmax(0, 1fr))',
                          md: 'repeat(3, minmax(0, 1fr))',
                        },
                      }}
                    >
                      {existingFields.map((field) => (
                        <FieldTile key={field.label} field={field} />
                      ))}
                    </Box>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 1 }}>
                  <CardContent>
                    <Stack spacing={3}>
                      <SectionHeader
                        icon="solar:file-check-bold-duotone"
                        title="待补充资料"
                        description="当前系统缺失的 BaaS 必填字段在这里填写或上传；证件类型仅允许 PASSPORT。"
                      />

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: 'oklch(98% 0.016 82)',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Grid container spacing={2.5} sx={{ alignItems: 'flex-start' }}>
                          <Grid size={{ xs: 12, md: 5 }}>
                            <FormControl fullWidth>
                              <InputLabel id="passport-type-label">证件类型</InputLabel>
                              <Select
                                label="证件类型"
                                value="PASSPORT"
                                labelId="passport-type-label"
                              >
                                <MenuItem value="PASSPORT">PASSPORT</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          <Grid size={{ xs: 12, md: 7 }}>
                            <Stack spacing={0.75}>
                              <Typography variant="subtitle2">请选择</Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Sumsub 当前证件类型为 HK-HKID，不是
                                PASSPORT，需补充护照资料。页面只允许选择 PASSPORT。
                              </Typography>
                            </Stack>
                          </Grid>
                        </Grid>
                      </Box>

                      <Stack spacing={1.5}>
                        {uploads.map((item) => (
                          <UploadRow key={item.title} item={item} />
                        ))}
                      </Stack>

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid oklch(83% 0.06 72)',
                          bgcolor: 'oklch(96.5% 0.032 80)',
                        }}
                      >
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          sx={{
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle1">FATCA 第三方文档签署</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              通过第三方签署模拟完成 W-8BEN / W-9，不作为文件上传。
                            </Typography>
                          </Stack>

                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Chip color="warning" label="待签署" size="small" variant="soft" />
                            <Button
                              variant="contained"
                              endIcon={<Iconify icon="solar:pen-bold" />}
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              去签署
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

// ----------------------------------------------------------------------

type AccountTypeSummaryProps = {
  icon: React.ComponentProps<typeof Iconify>['icon'];
  title: string;
  status: string;
  description: string;
};

function AccountTypeSummary({ icon, title, status, description }: AccountTypeSummaryProps) {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            display: 'grid',
            borderRadius: 1,
            placeItems: 'center',
            color: 'oklch(34% 0.11 150)',
            bgcolor: 'oklch(94.5% 0.038 150)',
          }}
        >
          <Iconify icon={icon} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1">{title}</Typography>
          <Label color="success" sx={{ mt: 0.5 }}>
            {status}
          </Label>
        </Box>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {description}
      </Typography>
    </Stack>
  );
}

type SectionHeaderProps = {
  icon: React.ComponentProps<typeof Iconify>['icon'];
  title: string;
  description: string;
};

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          display: 'grid',
          borderRadius: 1,
          placeItems: 'center',
          color: 'oklch(35% 0.12 146)',
          bgcolor: 'oklch(94% 0.04 146)',
        }}
      >
        <Iconify icon={icon} />
      </Box>

      <Stack spacing={0.5}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      </Stack>
    </Stack>
  );
}

function FieldTile({ field }: { field: ExistingField }) {
  return (
    <Box
      sx={{
        p: 1.5,
        minHeight: 96,
        borderRadius: 1,
        bgcolor: 'oklch(98.5% 0.01 94)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography component="dt" variant="caption" sx={{ color: 'text.secondary' }}>
        {field.label}
      </Typography>

      <Typography
        component="dd"
        variant="subtitle2"
        sx={{ m: 0, mt: 0.5, wordBreak: 'break-word' }}
      >
        {field.value}
      </Typography>

      {field.helper ? (
        <Typography
          variant="caption"
          sx={{ mt: 0.75, display: 'block', color: 'text.secondary', lineHeight: 1.45 }}
        >
          {field.helper}
        </Typography>
      ) : null}
    </Box>
  );
}

function UploadRow({ item }: { item: UploadItem }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              display: 'grid',
              borderRadius: 1,
              flexShrink: 0,
              placeItems: 'center',
              color: 'oklch(38% 0.1 46)',
              bgcolor: 'oklch(94% 0.045 72)',
            }}
          >
            <Iconify icon="solar:file-text-bold" />
          </Box>

          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2">{item.title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.helper}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: 'break-word' }}>
              {item.fileName} · 已上传
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Button
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="solar:download-bold" />}
          >
            下载
          </Button>
          <Button variant="contained" startIcon={<Iconify icon="eva:cloud-upload-fill" />}>
            上传
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
