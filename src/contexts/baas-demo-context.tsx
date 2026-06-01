'use client';

import type { UsdtAddress } from 'src/types/usdt';
import type { OtcTrade, OtcTradePayload } from 'src/types/otc';
import type { Entity, CreateEntityPayload } from 'src/types/entity';
import type { GlobalAccount, VirtualAccount, CreateAccountPayload } from 'src/types/account';
import type {
  KybRecord,
  KybReviewStatus,
  SubmitKybPayload,
  KybSupportingDocumentStatus,
} from 'src/types/kyb';
import type {
  Transaction,
  TransferPayload,
  PayoutTransaction,
  CreatePayoutPayload,
} from 'src/types/transaction';
import type {
  ExternalPayee,
  PayeeExternalCall,
  CreatePayeePayload,
  EmailVerificationPurpose,
  CreateCryptoWhitelistPayload,
  UpdateCryptoWhitelistPayload,
} from 'src/types/payee';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { cryptoWithdraw } from 'src/services/crypto-service';
import { mockPayoutTransactions } from 'src/mocks/transactions';
import { otcTrade, getOtcTrades } from 'src/services/otc-service';
import { getTransactions } from 'src/services/transaction-service';
import { submitKyb, getKybRecords } from 'src/services/kyb-service';
import { getEntities, createEntity } from 'src/services/entity-service';
import { fiatWithdraw, createFiatPayout } from 'src/services/fiat-service';
import { getUSDTAddresses, createUSDTAddress } from 'src/services/usdt-service';
import {
  getAccounts,
  createAccount,
  getVirtualAccounts,
  createVirtualAccount,
} from 'src/services/account-service';
import {
  getExternalPayees,
  verifyPayeeEmailCode,
  getPayeeExternalCalls,
  createPayeeExternalCall,
  retryCryptoWhitelistSync,
  deleteCryptoWhitelistAddress,
  createCryptoWhitelistAddress,
  updateCryptoWhitelistAddress,
  sendPayeeEmailVerificationCode,
} from 'src/services/payee-service';

// ----------------------------------------------------------------------

type BaasDemoContextValue = {
  loading: boolean;
  error: string | null;
  entities: Entity[];
  kybRecords: KybRecord[];
  globalAccounts: GlobalAccount[];
  virtualAccounts: VirtualAccount[];
  usdtAddresses: UsdtAddress[];
  externalPayees: ExternalPayee[];
  payeeCalls: PayeeExternalCall[];
  transactions: Transaction[];
  payoutTransactions: PayoutTransaction[];
  otcTrades: OtcTrade[];
  reload: () => Promise<void>;
  createEntity: (payload: CreateEntityPayload) => Promise<Entity>;
  submitKyb: (payload: SubmitKybPayload) => Promise<KybRecord>;
  approveEntity: (entityId: string) => void;
  updateKybReviewItem: (
    entityId: string,
    reviewItemId: string,
    status: KybReviewStatus,
    note?: string
  ) => void;
  updateKybDocumentReview: (
    entityId: string,
    documentId: string,
    status: KybSupportingDocumentStatus,
    note?: string
  ) => void;
  approveKybAndCreateEntity: (entityId: string) => void;
  submitGlobalAccountOpening: (entityId: string) => Promise<GlobalAccount | null>;
  activateGlobalAccount: (entityId: string) => void;
  createGlobalAccount: (payload: CreateAccountPayload) => Promise<GlobalAccount>;
  createUSDTAddress: (accountId: string) => Promise<UsdtAddress>;
  createPayeeExternalCall: (payload: CreatePayeePayload) => Promise<PayeeExternalCall>;
  sendPayeeEmailVerificationCode: (
    purpose: EmailVerificationPurpose
  ) => Promise<{ expiresAt: string }>;
  verifyPayeeEmailCode: (code: string) => Promise<void>;
  createCryptoWhitelistAddress: (
    payload: CreateCryptoWhitelistPayload
  ) => Promise<PayeeExternalCall>;
  updateCryptoWhitelistAddress: (payload: UpdateCryptoWhitelistPayload) => Promise<void>;
  deleteCryptoWhitelistAddress: (id: string) => Promise<void>;
  retryCryptoWhitelistSync: (id: string) => Promise<void>;
  setCryptoWhitelistStatus: (id: string, status: PayeeExternalCall['status']) => void;
  fiatWithdraw: (payload: TransferPayload) => Promise<Transaction | null>;
  createFiatPayout: (payload: CreatePayoutPayload) => Promise<PayoutTransaction>;
  advancePayoutStatus: (id: string) => void;
  cryptoWithdraw: (payload: TransferPayload) => Promise<Transaction | null>;
  otcTrade: (payload: OtcTradePayload) => Promise<OtcTrade | null>;
  advanceOtcStatus: (id: string, outcome?: 'completed' | 'failed') => void;
};

const BaasDemoContext = createContext<BaasDemoContextValue | null>(null);

const findAccountEntityId = (accounts: GlobalAccount[], accountId: string) =>
  accounts.find((account) => account.id === accountId)?.entityId ?? '';

const statusFromDocumentReview = (status: KybSupportingDocumentStatus) =>
  (status === 'Approved' && 'approved') ||
  (status === 'Rejected' && 'rejected') ||
  (status === 'Need Replacement' && 'rejected') ||
  (status === 'Missing' && 'failed') ||
  'pending';

const payoutToTransaction = (payout: PayoutTransaction, entityId = ''): Transaction => ({
  id: `txn-${payout.id}`,
  referenceId: payout.referenceId,
  accountId: payout.senderId,
  entityId,
  type: 'fiat_withdraw',
  amount: payout.amount,
  fee: payout.fee,
  currency: payout.currency,
  status: payout.status,
  source: payout.senderName,
  destination: payout.payeeName,
  createdAt: payout.createdAt,
  timeline: payout.timeline,
});

// ----------------------------------------------------------------------

export function BaasDemoProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [kybRecords, setKybRecords] = useState<KybRecord[]>([]);
  const [globalAccounts, setGlobalAccounts] = useState<GlobalAccount[]>([]);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [usdtAddresses, setUsdtAddresses] = useState<UsdtAddress[]>([]);
  const [externalPayees, setExternalPayees] = useState<ExternalPayee[]>([]);
  const [payeeCalls, setPayeeCalls] = useState<PayeeExternalCall[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payoutTransactions, setPayoutTransactions] =
    useState<PayoutTransaction[]>(mockPayoutTransactions);
  const [otcTrades, setOtcTrades] = useState<OtcTrade[]>([]);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        nextEntities,
        nextKybRecords,
        nextGlobalAccounts,
        nextVirtualAccounts,
        nextUsdtAddresses,
        nextExternalPayees,
        nextPayeeCalls,
        nextTransactions,
        nextOtcTrades,
      ] = await Promise.all([
        getEntities(),
        getKybRecords(),
        getAccounts(),
        getVirtualAccounts(),
        getUSDTAddresses(),
        getExternalPayees(),
        getPayeeExternalCalls(),
        getTransactions(),
        getOtcTrades(),
      ]);

      setEntities(nextEntities);
      setKybRecords(nextKybRecords);
      setGlobalAccounts(nextGlobalAccounts);
      setVirtualAccounts(nextVirtualAccounts);
      setUsdtAddresses(nextUsdtAddresses);
      setExternalPayees(nextExternalPayees);
      setPayeeCalls(nextPayeeCalls);
      setTransactions(nextTransactions);
      setPayoutTransactions(mockPayoutTransactions);
      setOtcTrades(nextOtcTrades);
    } catch (reloadError) {
      setError(reloadError instanceof Error ? reloadError.message : '加载 Demo 数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleCreateEntity = useCallback(async (payload: CreateEntityPayload) => {
    const nextEntity = await createEntity(payload);
    setEntities((current) => [nextEntity, ...current]);
    return nextEntity;
  }, []);

  const handleSubmitKyb = useCallback(async (payload: SubmitKybPayload) => {
    const nextRecord = await submitKyb(payload);
    setKybRecords((current) => [
      nextRecord,
      ...current.filter((item) => item.entityId !== payload.entityId),
    ]);
    setEntities((current) =>
      current.map((entity) =>
        entity.id === payload.entityId
          ? {
              ...entity,
              status: 'submitted',
              kybStatus: 'submitted',
              updatedAt: new Date().toISOString(),
            }
          : entity
      )
    );
    return nextRecord;
  }, []);

  const approveEntity = useCallback((entityId: string) => {
    const now = new Date().toISOString();

    setEntities((current) =>
      current.map((entity) =>
        entity.id === entityId
          ? { ...entity, status: 'active', kybStatus: 'approved', updatedAt: now }
          : entity
      )
    );
    setKybRecords((current) =>
      current.map((record) =>
        record.entityId === entityId
          ? {
              ...record,
              status: 'approved',
              approvedAt: now,
              timeline: [
                ...record.timeline,
                { label: 'Demo 审核通过', status: 'approved', at: now },
              ],
            }
          : record
      )
    );
  }, []);

  const updateKybReviewItem = useCallback(
    (entityId: string, reviewItemId: string, status: KybReviewStatus, note?: string) => {
      const now = new Date().toISOString();

      setKybRecords((current) =>
        current.map((record) =>
          record.entityId === entityId
            ? {
                ...record,
                status:
                  status === 'Rejected'
                    ? 'rejected'
                    : status === 'Need More Info'
                      ? 'need_more_info'
                      : record.status,
                rejectedReason:
                  status === 'Rejected'
                    ? note || `${reviewItemId} 未通过审核`
                    : record.rejectedReason,
                reviewItems: (record.reviewItems ?? []).map((item) =>
                  item.id === reviewItemId
                    ? {
                        ...item,
                        status,
                        reviewerNote: note,
                        reviewedAt: now,
                        reviewerName: 'Demo Reviewer',
                      }
                    : item
                ),
                timeline: [
                  ...record.timeline,
                  {
                    label: `审核项${status === 'Approved' ? '通过' : status === 'Rejected' ? '驳回' : status === 'Need More Info' ? '需补充' : '更新'}`,
                    status:
                      status === 'Approved'
                        ? 'approved'
                        : status === 'Rejected'
                          ? 'rejected'
                          : status === 'Need More Info'
                            ? 'need_more_info'
                            : 'pending',
                    at: now,
                    description: note,
                  },
                ],
              }
            : record
        )
      );

      if (status === 'Rejected' || status === 'Need More Info') {
        setEntities((current) =>
          current.map((entity) =>
            entity.id === entityId
              ? {
                  ...entity,
                  kybStatus: status === 'Rejected' ? 'rejected' : 'need_more_info',
                  updatedAt: now,
                }
              : entity
          )
        );
      }
    },
    []
  );

  const updateKybDocumentReview = useCallback(
    (entityId: string, documentId: string, status: KybSupportingDocumentStatus, note?: string) => {
      const now = new Date().toISOString();
      const apiStatus = statusFromDocumentReview(status);

      setKybRecords((current) =>
        current.map((record) =>
          record.entityId === entityId
            ? {
                ...record,
                status:
                  status === 'Rejected'
                    ? 'rejected'
                    : status === 'Need Replacement'
                      ? 'need_more_info'
                      : record.status,
                rejectedReason:
                  status === 'Rejected'
                    ? note || `${documentId} 文件未通过审核`
                    : record.rejectedReason,
                documents: record.documents.map((document) =>
                  document.id === documentId ? { ...document, status: apiStatus } : document
                ),
                supportingDocuments: (record.supportingDocuments ?? []).map((document) =>
                  document.id === documentId
                    ? { ...document, status, reviewerNote: note }
                    : document
                ),
                timeline: [
                  ...record.timeline,
                  {
                    label: `文件审核${status === 'Approved' ? '通过' : status === 'Rejected' ? '驳回' : status === 'Need Replacement' ? '需重传' : '更新'}`,
                    status: apiStatus,
                    at: now,
                    description: note,
                  },
                ],
              }
            : record
        )
      );

      if (status === 'Rejected' || status === 'Need Replacement') {
        setEntities((current) =>
          current.map((entity) =>
            entity.id === entityId
              ? {
                  ...entity,
                  kybStatus: status === 'Rejected' ? 'rejected' : 'need_more_info',
                  updatedAt: now,
                }
              : entity
          )
        );
      }
    },
    []
  );

  const approveKybAndCreateEntity = useCallback((entityId: string) => {
    const now = new Date().toISOString();

    setEntities((current) =>
      current.map((entity) =>
        entity.id === entityId
          ? { ...entity, status: 'active', kybStatus: 'approved', updatedAt: now }
          : entity
      )
    );

    setKybRecords((current) =>
      current.map((record) =>
        record.entityId === entityId
          ? {
              ...record,
              status: 'approved',
              approvedAt: now,
              timeline: [
                ...record.timeline,
                {
                  label: '提交创建实体并通过 KYB',
                  status: 'approved',
                  at: now,
                  description: 'Mock create-entity / approve-kyb completed.',
                },
              ],
              apiLogs: [
                ...(record.apiLogs ?? []),
                {
                  id: `api-log-${Date.now()}`,
                  method: 'POST',
                  endpoint: '/mock/entities/create-and-approve-kyb',
                  statusCode: 200,
                  message: 'create-entity / approve-kyb',
                  at: now,
                },
              ],
            }
          : record
      )
    );
  }, []);

  const handleCreateGlobalAccount = useCallback(async (payload: CreateAccountPayload) => {
    const nextAccount = await createAccount(payload);
    const nextVirtualAccount = await createVirtualAccount(nextAccount);

    setGlobalAccounts((current) => [nextAccount, ...current]);
    setVirtualAccounts((current) => [
      nextVirtualAccount,
      ...current.filter((item) => item.globalAccountId !== nextAccount.id),
    ]);

    return nextAccount;
  }, []);

  const submitGlobalAccountOpening = useCallback(
    async (entityId: string) => {
      const entity = entities.find((item) => item.id === entityId);
      if (!entity || entity.kybStatus !== 'approved') return null;

      const currentAccount = globalAccounts.find(
        (account) => account.entityId === entityId && account.status !== 'failed'
      );

      if (currentAccount) return currentAccount;

      const now = new Date().toISOString();
      const nextAccount = await createAccount({
        entityId,
        name: `${entity.name} Global Account`,
      });
      const nextVirtualAccount = await createVirtualAccount(nextAccount);

      setGlobalAccounts((current) => [nextAccount, ...current]);
      setVirtualAccounts((current) => [
        nextVirtualAccount,
        ...current.filter((item) => item.globalAccountId !== nextAccount.id),
      ]);
      setEntities((current) =>
        current.map((item) =>
          item.id === entityId ? { ...item, status: 'active', updatedAt: now } : item
        )
      );
      setKybRecords((current) =>
        current.map((record) =>
          record.entityId === entityId
            ? {
                ...record,
                timeline: [
                  ...record.timeline,
                  {
                    label: '提交开通全球账户',
                    status: 'pending',
                    at: now,
                    description: nextAccount.accountId,
                  },
                ],
                apiLogs: [
                  ...(record.apiLogs ?? []),
                  {
                    id: `api-log-${Date.now()}`,
                    method: 'POST',
                    endpoint: '/mock/global-accounts',
                    statusCode: 202,
                    message: 'create-global-account',
                    at: now,
                  },
                ],
              }
            : record
        )
      );

      return nextAccount;
    },
    [entities, globalAccounts]
  );

  const activateGlobalAccount = useCallback((entityId: string) => {
    const now = new Date().toISOString();
    let accountId = '';

    setGlobalAccounts((current) =>
      current.map((account) => {
        if (account.entityId !== entityId || account.status === 'active') return account;
        accountId = account.accountId;
        return { ...account, status: 'active' };
      })
    );

    setEntities((current) =>
      current.map((entity) =>
        entity.id === entityId ? { ...entity, status: 'active', updatedAt: now } : entity
      )
    );

    setKybRecords((current) =>
      current.map((record) =>
        record.entityId === entityId
          ? {
              ...record,
              timeline: [
                ...record.timeline,
                {
                  label: '全球账户开通成功',
                  status: 'active',
                  at: now,
                  description: accountId,
                },
              ],
              apiLogs: [
                ...(record.apiLogs ?? []),
                {
                  id: `api-log-${Date.now()}`,
                  method: 'PATCH',
                  endpoint: '/mock/global-accounts/status',
                  statusCode: 200,
                  message: 'global-account-active',
                  at: now,
                },
              ],
            }
          : record
      )
    );
  }, []);

  const handleCreateUSDTAddress = useCallback(async (accountId: string) => {
    const nextAddress = await createUSDTAddress(accountId);
    setUsdtAddresses((current) => [
      nextAddress,
      ...current.filter((item) => item.accountId !== accountId),
    ]);
    setGlobalAccounts((current) =>
      current.map((account) =>
        account.id === accountId
          ? {
              ...account,
              cryptoEnabled: true,
              usdtAddressId: nextAddress.id,
              cryptoBalances:
                account.cryptoBalances.length > 0
                  ? account.cryptoBalances
                  : [{ currency: 'USDT', available: 0, pending: 0 }],
            }
          : account
      )
    );
    return nextAddress;
  }, []);

  const handleCreatePayeeExternalCall = useCallback(async (payload: CreatePayeePayload) => {
    const nextCall = await createPayeeExternalCall(payload);
    setPayeeCalls((current) => [nextCall, ...current]);
    return nextCall;
  }, []);

  const scheduleCryptoWhitelistSync = useCallback((id: string) => {
    window.setTimeout(() => {
      const now = new Date().toISOString();

      setPayeeCalls((current) =>
        current.map((call) =>
          call.id === id && call.status === 'pending_sync'
            ? { ...call, status: 'processing', updatedAt: now }
            : call
        )
      );
    }, 1200);

    window.setTimeout(() => {
      const now = new Date().toISOString();

      setPayeeCalls((current) =>
        current.map((call) =>
          call.id === id && call.status === 'processing'
            ? { ...call, status: 'completed', updatedAt: now, lastSyncedAt: now }
            : call
        )
      );
    }, 2800);
  }, []);

  const handleCreateCryptoWhitelistAddress = useCallback(
    async (payload: CreateCryptoWhitelistPayload) => {
      const nextCall = await createCryptoWhitelistAddress(payload);
      setPayeeCalls((current) => [nextCall, ...current]);
      scheduleCryptoWhitelistSync(nextCall.id);
      return nextCall;
    },
    [scheduleCryptoWhitelistSync]
  );

  const handleUpdateCryptoWhitelistAddress = useCallback(
    async (payload: UpdateCryptoWhitelistPayload) => {
      const nextCall = await updateCryptoWhitelistAddress(payload);

      setPayeeCalls((current) =>
        current.map((call) => (call.id === payload.id ? { ...call, ...nextCall } : call))
      );
    },
    []
  );

  const handleDeleteCryptoWhitelistAddress = useCallback(async (id: string) => {
    await deleteCryptoWhitelistAddress(id);
    setPayeeCalls((current) => current.filter((call) => call.id !== id));
  }, []);

  const handleRetryCryptoWhitelistSync = useCallback(
    async (id: string) => {
      const nextCall = await retryCryptoWhitelistSync(id);

      setPayeeCalls((current) =>
        current.map((call) => (call.id === id ? { ...call, ...nextCall } : call))
      );
      scheduleCryptoWhitelistSync(id);
    },
    [scheduleCryptoWhitelistSync]
  );

  const setCryptoWhitelistStatus = useCallback(
    (id: string, status: PayeeExternalCall['status']) => {
      const now = new Date().toISOString();

      setPayeeCalls((current) =>
        current.map((call) => (call.id === id ? { ...call, status, updatedAt: now } : call))
      );
    },
    []
  );

  const handleFiatWithdraw = useCallback(
    async (payload: TransferPayload) => {
      const entityId = findAccountEntityId(globalAccounts, payload.accountId);
      if (!entityId) return null;

      await handleCreatePayeeExternalCall({
        accountId: payload.accountId,
        type: 'fiat',
        name: payload.payeeName,
        currency: payload.currency,
        destination: payload.destination,
      });

      const nextTransaction = await fiatWithdraw(payload, entityId);
      setTransactions((current) => [nextTransaction, ...current]);
      return nextTransaction;
    },
    [globalAccounts, handleCreatePayeeExternalCall]
  );

  const handleCreateFiatPayout = useCallback(
    async (payload: CreatePayoutPayload) => {
      const payout = await createFiatPayout(payload);
      const entityId = findAccountEntityId(globalAccounts, payload.senderId);

      setPayoutTransactions((current) => [payout, ...current]);
      setTransactions((current) => [payoutToTransaction(payout, entityId), ...current]);

      return payout;
    },
    [globalAccounts]
  );

  const advancePayoutStatus = useCallback(
    (id: string) => {
      const now = new Date().toISOString();

      setPayoutTransactions((current) =>
        current.map((payout) => {
          if (payout.id !== id) return payout;

          const nextStatus =
            (payout.status === 'pending' && 'processing') ||
            (payout.status === 'processing' && 'completed') ||
            (payout.status === 'completed' && 'failed') ||
            'pending';

          return {
            ...payout,
            status: nextStatus,
            updatedAt: now,
            timeline: [
              ...payout.timeline,
              {
                label:
                  (nextStatus === 'processing' && '银行处理中') ||
                  (nextStatus === 'completed' && 'Payout 完成') ||
                  (nextStatus === 'failed' && '模拟失败') ||
                  '重新提交',
                status: nextStatus,
                at: now,
              },
            ],
            apiLogs: [
              ...payout.apiLogs,
              {
                id: `api-log-${Date.now()}`,
                method: 'PATCH',
                endpoint: `/mock/fiat/payouts/${payout.id}/status`,
                statusCode: 200,
                message: `Status advanced to ${nextStatus}`,
                at: now,
              },
            ],
          };
        })
      );

      setTransactions((current) =>
        current.map((transaction) => {
          const payout = payoutTransactions.find((item) => item.id === id);
          if (!payout || transaction.referenceId !== payout.referenceId) return transaction;

          const nextStatus =
            (transaction.status === 'pending' && 'processing') ||
            (transaction.status === 'processing' && 'completed') ||
            (transaction.status === 'completed' && 'failed') ||
            'pending';

          return {
            ...transaction,
            status: nextStatus,
            timeline: [
              ...transaction.timeline,
              { label: `状态推进为 ${nextStatus}`, status: nextStatus, at: now },
            ],
          };
        })
      );
    },
    [payoutTransactions]
  );

  const handleCryptoWithdraw = useCallback(
    async (payload: TransferPayload) => {
      const entityId = findAccountEntityId(globalAccounts, payload.accountId);
      if (!entityId) return null;

      const nextTransaction = await cryptoWithdraw(payload, entityId);
      setTransactions((current) => [nextTransaction, ...current]);
      return nextTransaction;
    },
    [globalAccounts]
  );

  const handleOtcTrade = useCallback(
    async (payload: OtcTradePayload) => {
      const entityId = findAccountEntityId(globalAccounts, payload.accountId);
      if (!entityId) return null;

      const result = await otcTrade(payload, entityId);
      setOtcTrades((current) => [result.trade, ...current]);
      setTransactions((current) => [result.transaction, ...current]);
      return result.trade;
    },
    [globalAccounts]
  );

  const advanceOtcStatus = useCallback((id: string, outcome?: 'completed' | 'failed') => {
    const now = new Date().toISOString();
    let referenceId = '';

    setOtcTrades((current) =>
      current.map((trade) => {
        if (trade.id !== id) return trade;

        referenceId = trade.referenceId;

        const nextStatus =
          (trade.status === 'pending' && 'processing') ||
          (trade.status === 'processing' && (outcome ?? 'completed')) ||
          trade.status;

        if (nextStatus === trade.status) return trade;

        return {
          ...trade,
          status: nextStatus,
          updatedAt: now,
          timeline: [
            ...trade.timeline,
            {
              label:
                (nextStatus === 'processing' && 'Conversion processing') ||
                (nextStatus === 'completed' && 'Settlement completed') ||
                'Conversion failed',
              status: nextStatus,
              at: now,
            },
          ],
          apiLogs: [
            ...trade.apiLogs,
            {
              id: `api-log-${Date.now()}`,
              method: 'PATCH',
              endpoint: `/mock/otc/conversions/${trade.id}/status`,
              statusCode: nextStatus === 'failed' ? 422 : 200,
              message: `Status advanced to ${nextStatus}`,
              at: now,
            },
          ],
        };
      })
    );

    setTransactions((current) =>
      current.map((transaction) => {
        if (transaction.referenceId !== referenceId) return transaction;

        const nextStatus =
          (transaction.status === 'pending' && 'processing') ||
          (transaction.status === 'processing' && (outcome ?? 'completed')) ||
          transaction.status;

        if (nextStatus === transaction.status) return transaction;

        return {
          ...transaction,
          status: nextStatus,
          timeline: [
            ...transaction.timeline,
            { label: `OTC status advanced to ${nextStatus}`, status: nextStatus, at: now },
          ],
        };
      })
    );
  }, []);

  const value = useMemo(
    () => ({
      loading,
      error,
      entities,
      kybRecords,
      globalAccounts,
      virtualAccounts,
      usdtAddresses,
      externalPayees,
      payeeCalls,
      transactions,
      payoutTransactions,
      otcTrades,
      reload,
      createEntity: handleCreateEntity,
      submitKyb: handleSubmitKyb,
      approveEntity,
      updateKybReviewItem,
      updateKybDocumentReview,
      approveKybAndCreateEntity,
      submitGlobalAccountOpening,
      activateGlobalAccount,
      createGlobalAccount: handleCreateGlobalAccount,
      createUSDTAddress: handleCreateUSDTAddress,
      createPayeeExternalCall: handleCreatePayeeExternalCall,
      sendPayeeEmailVerificationCode,
      verifyPayeeEmailCode,
      createCryptoWhitelistAddress: handleCreateCryptoWhitelistAddress,
      updateCryptoWhitelistAddress: handleUpdateCryptoWhitelistAddress,
      deleteCryptoWhitelistAddress: handleDeleteCryptoWhitelistAddress,
      retryCryptoWhitelistSync: handleRetryCryptoWhitelistSync,
      setCryptoWhitelistStatus,
      fiatWithdraw: handleFiatWithdraw,
      createFiatPayout: handleCreateFiatPayout,
      advancePayoutStatus,
      cryptoWithdraw: handleCryptoWithdraw,
      otcTrade: handleOtcTrade,
      advanceOtcStatus,
    }),
    [
      loading,
      error,
      entities,
      kybRecords,
      globalAccounts,
      virtualAccounts,
      usdtAddresses,
      externalPayees,
      payeeCalls,
      transactions,
      payoutTransactions,
      otcTrades,
      reload,
      handleCreateEntity,
      handleSubmitKyb,
      approveEntity,
      updateKybReviewItem,
      updateKybDocumentReview,
      approveKybAndCreateEntity,
      submitGlobalAccountOpening,
      activateGlobalAccount,
      handleCreateGlobalAccount,
      handleCreateUSDTAddress,
      handleCreatePayeeExternalCall,
      handleCreateCryptoWhitelistAddress,
      handleUpdateCryptoWhitelistAddress,
      handleDeleteCryptoWhitelistAddress,
      handleRetryCryptoWhitelistSync,
      setCryptoWhitelistStatus,
      handleFiatWithdraw,
      handleCreateFiatPayout,
      advancePayoutStatus,
      handleCryptoWithdraw,
      handleOtcTrade,
      advanceOtcStatus,
    ]
  );

  return <BaasDemoContext.Provider value={value}>{children}</BaasDemoContext.Provider>;
}

export function useBaasDemo() {
  const context = useContext(BaasDemoContext);

  if (!context) {
    throw new Error('useBaasDemo must be used inside BaasDemoProvider');
  }

  return context;
}
