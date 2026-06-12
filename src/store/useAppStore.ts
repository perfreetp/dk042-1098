import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EvaluateItem, BatchItem, Order, UserInfo, WithdrawRecord, WalletEntry, TimelineEvent } from '@/types';
import { orderList as mockOrders } from '@/data/orders';
import { mockUser } from '@/data/notices';
import { withdrawRecords as mockWithdrawRecords } from '@/data/notices';

interface AppState {
  evaluateItems: EvaluateItem[];
  batchItems: BatchItem[];
  orders: Order[];
  user: UserInfo;
  withdrawRecords: WithdrawRecord[];
  walletEntries: WalletEntry[];
  lastHandoverOrder: Order | null;

  addEvaluateItem: (item: EvaluateItem) => void;
  removeEvaluateItem: (index: number) => void;
  clearEvaluateItems: () => void;

  addBatchItem: (item: BatchItem) => void;
  removeBatchItem: (index: number) => void;
  clearBatchItems: () => void;
  updateBatchItemQuantity: (index: number, quantity: number) => void;

  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], finalPrice?: number, rejectReason?: string) => void;
  updateOrderImages: (orderId: string, images: string[]) => void;
  appendTimelineEvent: (orderId: string, event: TimelineEvent) => void;
  setLastHandoverOrder: (order: Order | null) => void;

  updateUserBalance: (amount: number, type: 'add' | 'subtract' | 'freeze' | 'unfreeze') => void;
  addWithdrawRecord: (record: WithdrawRecord) => void;
  failWithdrawRecord: (recordId: string, reason: string) => void;
  addWalletEntry: (entry: WalletEntry) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      evaluateItems: [],
      batchItems: [],
      orders: mockOrders,
      user: mockUser,
      withdrawRecords: mockWithdrawRecords,
      walletEntries: [
        { id: 'we1', type: 'recycle_income', amount: 130, title: '回收到账', time: '2024-01-12 16:30:00', relatedId: mockOrders[2]?.id, relatedType: 'order', detail: '高等数学等3本教材' },
        { id: 'we2', type: 'withdraw_freeze', amount: -100, title: '提现冻结', time: '2024-01-10 14:30:00', relatedId: 'w1', relatedType: 'withdraw', detail: '提现至微信钱包' },
        { id: 'we3', type: 'withdraw_success', amount: 100, title: '提现成功', time: '2024-01-11 10:00:00', relatedId: 'w1', relatedType: 'withdraw', detail: '微信钱包到账' },
        { id: 'we4', type: 'recycle_income', amount: 56.5, title: '回收到账', time: '2024-01-08 11:20:00', relatedId: mockOrders[3]?.id, relatedType: 'order', detail: '大学英语等2本教材' }
      ],
      lastHandoverOrder: null,

      addEvaluateItem: (item) =>
        set((state) => ({ evaluateItems: [...state.evaluateItems, item] })),
      removeEvaluateItem: (index) =>
        set((state) => ({
          evaluateItems: state.evaluateItems.filter((_, i) => i !== index)
        })),
      clearEvaluateItems: () => set({ evaluateItems: [] }),

      addBatchItem: (item) =>
        set((state) => ({ batchItems: [...state.batchItems, item] })),
      removeBatchItem: (index) =>
        set((state) => ({
          batchItems: state.batchItems.filter((_, i) => i !== index)
        })),
      clearBatchItems: () => set({ batchItems: [] }),
      updateBatchItemQuantity: (index, quantity) =>
        set((state) => {
          const newItems = [...state.batchItems];
          if (newItems[index]) {
            const basePrice = newItems[index].estimatedPrice / newItems[index].quantity;
            newItems[index] = {
              ...newItems[index],
              quantity,
              estimatedPrice: Number((basePrice * quantity).toFixed(2))
            };
          }
          return { batchItems: newItems };
        }),

      addOrder: (order) =>
        set((state) => ({ orders: [order, ...state.orders] })),

      updateOrderStatus: (orderId, status, finalPrice, rejectReason) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        const now = new Date().toLocaleString();
        const newEvents: TimelineEvent[] = [];

        if (status === 'recycled' && finalPrice !== undefined) {
          set({
            user: {
              ...state.user,
              balance: Number((state.user.balance + finalPrice).toFixed(2)),
              totalEarning: Number(((state.user.totalEarning || 0) + finalPrice).toFixed(2))
            }
          });

          newEvents.push({ type: 'settled', label: '结算到账', time: now, detail: `¥${finalPrice.toFixed(2)}已到账` });

          get().addWalletEntry({
            id: 'we' + Date.now(),
            type: 'recycle_income',
            amount: finalPrice,
            title: '回收到账',
            time: now,
            relatedId: orderId,
            relatedType: 'order',
            detail: order.items.map(i => i.textbook.name).slice(0, 2).join('、') + (order.items.length > 2 ? `等${order.items.length}种` : '')
          });
        }

        if (status === 'rejected') {
          newEvents.push({ type: 'rejected', label: '订单驳回', time: now, detail: rejectReason || '原因未填写' });
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  finalPrice: status === 'recycled' ? finalPrice : o.finalPrice,
                  rejectReason,
                  recycledAt: status === 'recycled' ? now : undefined,
                  rejectedAt: status === 'rejected' ? now : undefined,
                  timeline: [...(o.timeline || []), ...newEvents]
                }
              : o
          )
        }));
      },

      updateOrderImages: (orderId, images) => {
        const state = get();
        const order = state.orders.find((o) => o.id === orderId);
        const hadImages = (order?.images?.length || 0) > 0;
        const nowHasImages = images.length > 0;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, images } : o
          )
        }));

        if (!hadImages && nowHasImages && order) {
          get().appendTimelineEvent(orderId, {
            type: 'photo',
            label: '拍照核验',
            time: new Date().toLocaleString(),
            detail: `已上传${images.length}张核验照片`
          });
        }
      },

      appendTimelineEvent: (orderId, event) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, timeline: [...(o.timeline || []), event] }
              : o
          )
        }));
      },

      setLastHandoverOrder: (order) => set({ lastHandoverOrder: order }),

      updateUserBalance: (amount, type) => {
        set((state) => {
          let newBalance = state.user.balance;
          let newFrozen = state.user.frozenBalance || 0;

          switch (type) {
            case 'add':
              newBalance = Number((newBalance + amount).toFixed(2));
              break;
            case 'subtract':
              newBalance = Number((newBalance - amount).toFixed(2));
              break;
            case 'freeze':
              newBalance = Number((newBalance - amount).toFixed(2));
              newFrozen = Number((newFrozen + amount).toFixed(2));
              break;
            case 'unfreeze':
              newBalance = Number((newBalance + amount).toFixed(2));
              newFrozen = Number((newFrozen - amount).toFixed(2));
              break;
          }

          return {
            user: { ...state.user, balance: newBalance, frozenBalance: newFrozen }
          };
        });
      },

      addWithdrawRecord: (record) => {
        set((state) => ({
          withdrawRecords: [record, ...state.withdrawRecords]
        }));
      },

      failWithdrawRecord: (recordId, reason) => {
        const state = get();
        const record = state.withdrawRecords.find((r) => r.id === recordId);
        if (!record || record.status !== 'pending') return;

        get().updateUserBalance(record.amount, 'unfreeze');

        set((state) => ({
          withdrawRecords: state.withdrawRecords.map((r) =>
            r.id === recordId ? { ...r, status: 'failed' as const, failReason: reason } : r
          )
        }));

        get().addWalletEntry({
          id: 'we' + Date.now(),
          type: 'withdraw_failed',
          amount: record.amount,
          title: '提现失败退回',
          time: new Date().toLocaleString(),
          relatedId: recordId,
          relatedType: 'withdraw',
          detail: reason
        });

        console.log('[Store] 提现失败退回:', record.amount, '原因:', reason);
      },

      addWalletEntry: (entry) => {
        set((state) => ({
          walletEntries: [entry, ...state.walletEntries]
        }));
      }
    }),
    {
      name: 'textbook-recycle-storage',
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          try { return Taro.getStorageSync(key); } catch { return null; }
        },
        setItem: (key, value) => {
          try { Taro.setStorageSync(key, value); } catch { console.error('[Storage] 保存失败'); }
        },
        removeItem: (key) => {
          try { Taro.removeStorageSync(key); } catch { console.error('[Storage] 删除失败'); }
        }
      }))
    }
  )
);
