import type { Metadata } from 'next';

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
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { CONFIG } from 'src/global-config';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const metadata: Metadata = { title: `ACCopen - ${CONFIG.appName}` };

const carriedFields = [
  ['名', 'Wanyara'],
  ['姓', 'Wan'],
  ['出生日期', '1990-03-18'],
  ['性别', '女'],
  ['国籍', 'HKG'],
  ['电话国家代码', '852', '模拟从 Sumsub / 手机号国家代码读取。'],
  ['手机号', '91234567'],
  ['证件号码', 'K1234567', '模拟从 Sumsub 护照资料读取。'],
  ['证件签发日期', '2020-06-01', '模拟从 Sumsub 护照资料读取。'],
  ['证件到期日', '2030-06-01', '模拟从 Sumsub 护照资料读取。'],
  ['地区', 'HK', '模拟 Sumsub / 护照国家读取，当前 mock 为 HK。'],
  ['居住地街道地址', '88 Queens Road Central'],
  ['居住地城市', 'Hong Kong'],
  [
    '居住地州/地区',
    'Hong Kong',
    '对于美国和加拿大：必须使用两位字母代码提供细分区域（例如，WA 代表华盛顿州）。对于没有州/省的其他国家，请重复国家名称。允许使用的字符：英文字母、数字和常用符号',
  ],
  ['居住地所在国家', 'HKG'],
  ['居住地邮编', '999077'],
] as const;

const uploadFiles = [
  ['护照文件', 'Passport.png', '仅允许上传护照文件；支持 pdf / jpeg / png，单个文件大小限制 8M。'],
  ['自拍照', 'Selfie.png', '支持 pdf / jpeg / png，单个文件大小限制 8M。'],
  ['地址证明', 'Address Proof.png', '支持 pdf / jpeg / png，单个文件大小限制 8M。'],
  ['资金来源证明', 'Source of Funds.png', '支持 pdf / jpeg / png，单个文件大小限制 8M。'],
] as const;

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: { xs: 2, md: 4 },
        bgcolor: 'oklch(97.5% 0.018 94)',
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Button
            href="/dashboard/baas"
            color="inherit"
            startIcon={<Iconify icon="solar:reply-bold" />}
            sx={{ alignSelf: 'flex-start' }}
          >
            返回开户流程
          </Button>

          <Card sx={{ borderRadius: 1 }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Grid container spacing={3} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                      <Chip color="info" label="ACCopen" size="small" />
                      <Chip color="warning" label="BaaS Create Legal Entity" size="small" />
                    </Stack>

                    <Typography variant="h3">BaaS 开户申请</Typography>

                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 820 }}>
                      先复用系统已有 KYC / KYB / Sumsub 资料，仅补充 BaaS
                      必需但系统缺失的资料。带出的资料格式需要符合 BaaS Create Legal Entity API
                      要求。
                    </Typography>
                  </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      bgcolor: 'success.lighter',
                      border: '1px solid',
                      borderColor: 'success.light',
                    }}
                  >
                    <Typography variant="subtitle2">当前步骤</Typography>
                    <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
                      资料确认 → 缺失资料补充 → 第三方签署
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

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

                    <ToggleButtonGroup exclusive fullWidth color="primary" value="personal">
                      <ToggleButton value="personal" sx={{ gap: 1 }}>
                        <Iconify icon="solar:user-id-bold" />
                        个人开户
                      </ToggleButton>
                      <ToggleButton value="business" sx={{ gap: 1 }}>
                        <Iconify icon="solar:users-group-rounded-bold" />
                        企业开户
                      </ToggleButton>
                    </ToggleButtonGroup>

                    <Divider />

                    <AccountTypeCard
                      icon="solar:user-id-bold"
                      title="个人开户"
                      description="复用个人 KYC / Sumsub 资料。"
                    />

                    <AccountTypeCard
                      icon="solar:bill-list-bold"
                      title="企业开户"
                      description="复用企业 KYB 资料，补充缺失文件、股东和授权代表信息。"
                    />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 8 }}>
              <Stack spacing={3}>
                <Card sx={{ borderRadius: 1 }}>
                  <CardContent>
                    <SectionTitle
                      icon="solar:shield-check-bold"
                      title="已获取资料"
                      description="当前系统已有字段自动带出，只读展示，供用户确认。"
                    />

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      {carriedFields.map(([label, value, helper]) => (
                        <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
                          <TextField
                            fullWidth
                            disabled
                            label={label}
                            value={value}
                            helperText={helper ?? ' '}
                            slotProps={{
                              input: {
                                readOnly: true,
                              },
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>

                <Card sx={{ borderRadius: 1 }}>
                  <CardContent>
                    <Stack spacing={3}>
                      <SectionTitle
                        icon="solar:file-check-bold-duotone"
                        title="待补充资料"
                        description="当前系统缺失的 BaaS 必填字段在这里填写或上传；证件类型仅允许 PASSPORT。"
                      />

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 5 }}>
                          <FormControl fullWidth>
                            <InputLabel id="passport-type-label">证件类型</InputLabel>
                            <Select label="证件类型" value="PASSPORT" labelId="passport-type-label">
                              <MenuItem value="PASSPORT">PASSPORT</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 7 }}>
                          <Typography variant="subtitle2">请选择</Typography>
                          <Typography variant="body2" sx={{ mt: 0.75, color: 'text.secondary' }}>
                            Sumsub 当前证件类型为 HK-HKID，不是
                            PASSPORT，需补充护照资料。页面只允许选择 PASSPORT。
                          </Typography>
                        </Grid>
                      </Grid>

                      <Stack spacing={1.5}>
                        {uploadFiles.map(([title, fileName, helper]) => (
                          <UploadLine
                            key={title}
                            title={title}
                            fileName={fileName}
                            helper={helper}
                          />
                        ))}
                      </Stack>

                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          bgcolor: 'warning.lighter',
                          border: '1px solid',
                          borderColor: 'warning.light',
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
                          <Box>
                            <Typography variant="subtitle1">FATCA 第三方文档签署</Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                              通过第三方签署模拟完成 W-8BEN / W-9，不作为文件上传。
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Chip color="warning" label="待签署" size="small" />
                            <Button variant="contained" endIcon={<Iconify icon="solar:pen-bold" />}>
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

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof Iconify>['icon'];
  title: string;
  description: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          display: 'grid',
          borderRadius: 1,
          flexShrink: 0,
          placeItems: 'center',
          color: 'success.dark',
          bgcolor: 'success.lighter',
        }}
      >
        <Iconify icon={icon} />
      </Box>
      <Box>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function AccountTypeCard({
  icon,
  title,
  description,
}: {
  icon: React.ComponentProps<typeof Iconify>['icon'];
  title: string;
  description: string;
}) {
  return (
    <Stack direction="row" spacing={1.5}>
      <Box
        sx={{
          width: 40,
          height: 40,
          display: 'grid',
          borderRadius: 1,
          flexShrink: 0,
          placeItems: 'center',
          color: 'success.dark',
          bgcolor: 'success.lighter',
        }}
      >
        <Iconify icon={icon} />
      </Box>
      <Box>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
          {description}
        </Typography>
      </Box>
    </Stack>
  );
}

function UploadLine({
  title,
  fileName,
  helper,
}: {
  title: string;
  fileName: string;
  helper: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1.5}>
          <Box
            sx={{
              width: 38,
              height: 38,
              display: 'grid',
              borderRadius: 1,
              flexShrink: 0,
              placeItems: 'center',
              color: 'warning.dark',
              bgcolor: 'warning.lighter',
            }}
          >
            <Iconify icon="solar:file-text-bold" />
          </Box>
          <Box>
            <Typography variant="subtitle2">{title}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {helper}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700 }}>
              {fileName} · 已上传
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1}>
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
