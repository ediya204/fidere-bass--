import type { UsdtAddress } from 'src/types/usdt';
import type { GlobalAccount, VirtualAccount } from 'src/types/account';

export const mockGlobalAccounts: GlobalAccount[] = [
  {
    id: 'ga-001',
    accountId: 'GA-8F91-2026',
    entityId: 'ent-001',
    name: '星河主账户',
    status: 'active',
    createdAt: '2026-05-26T12:00:00.000Z',
    fiatBalances: [
      { currency: 'USD', available: 126500.25, pending: 3200 },
      { currency: 'HKD', available: 420000, pending: 0 },
    ],
    cryptoBalances: [
      { currency: 'USDT', available: 48500, pending: 900 },
      { currency: 'USDC', available: 12500, pending: 0 },
    ],
    cryptoEnabled: true,
    usdtAddressId: 'usdt-001',
  },
  {
    id: 'ga-002',
    accountId: 'GA-42B7-2026',
    entityId: 'ent-002',
    name: 'SHENBAO LAW FIRM LTD',
    status: 'pending',
    createdAt: '2026-05-29T07:45:00.000Z',
    fiatBalances: [
      { currency: 'USD', available: 32800, pending: 0 },
      { currency: 'HKD', available: 188000, pending: 2500 },
    ],
    cryptoBalances: [{ currency: 'USDC', available: 15000, pending: 0 }],
    cryptoEnabled: true,
  },
  {
    id: 'ga-003',
    accountId: 'GA-19C2-2026',
    entityId: 'ent-001',
    name: '星河结算账户',
    status: 'syncing',
    createdAt: '2026-05-30T09:15:00.000Z',
    fiatBalances: [
      { currency: 'USD', available: 18500, pending: 600 },
      { currency: 'HKD', available: 92000, pending: 0 },
    ],
    cryptoBalances: [{ currency: 'USDT', available: 8700, pending: 120 }],
    cryptoEnabled: true,
  },
];

export const mockVirtualAccounts: VirtualAccount[] = [
  {
    id: 'va-001',
    vaId: 'VA-USD-7788',
    globalAccountId: 'ga-001',
    entityId: 'ent-001',
    bankName: 'Interlace Partner Bank',
    bankAddress: '88 Queen Road Central, Hong Kong',
    accountName: 'Star Chain Supply Limited',
    accountNumber: '88001992001',
    routingNumber: '021000021',
    swiftCode: 'ILACHKHH',
    currency: 'USD',
    status: 'active',
    balance: 126500.25,
    createdAt: '2026-05-26T12:20:00.000Z',
  },
  {
    id: 'va-002',
    vaId: 'VA-HKD-6612',
    globalAccountId: 'ga-001',
    entityId: 'ent-001',
    bankName: 'Interlace Partner Bank',
    bankAddress: '88 Queen Road Central, Hong Kong',
    accountName: 'Star Chain Supply Limited',
    accountNumber: '88001992002',
    routingNumber: '004',
    swiftCode: 'ILACHKHH',
    currency: 'HKD',
    status: 'active',
    balance: 420000,
    createdAt: '2026-05-27T12:20:00.000Z',
  },
  {
    id: 'va-003',
    vaId: 'VA-USD-0931',
    globalAccountId: 'ga-002',
    entityId: 'ent-002',
    bankName: 'Interlace Partner Bank',
    bankAddress: '1 Raffles Place, Singapore',
    accountName: 'Northstar Digital Pte. Ltd.',
    accountNumber: '88001993001',
    routingNumber: '7339',
    swiftCode: 'ILACSGSG',
    currency: 'USD',
    status: 'syncing',
    balance: 0,
    createdAt: '2026-05-29T08:10:00.000Z',
  },
];

export const mockUsdtAddresses: UsdtAddress[] = [
  {
    id: 'usdt-001',
    accountId: 'ga-001',
    chain: 'TRON',
    address: 'TJtQwV6Yh9mYyXkR6m6Lx4Gd4b9ZJz8YLa',
    status: 'active',
    createdAt: '2026-05-26T13:00:00.000Z',
  },
];
