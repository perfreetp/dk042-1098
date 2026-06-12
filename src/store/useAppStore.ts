import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EvaluateItem, BatchItem, Order, UserInfo, WithdrawRecord } from '@/types';
import { orderList as mockOrders } from '@/data/orders';
import { mockUser } from '@/data/notices';
import { withdrawRecords as mockWithdrawRecords } from '@/data/notices';

interface AppState {
  evaluateItems: EvaluateItem[];
  batchItems: BatchItem[];
  orders: Order[];
  user: UserInfo;
  withdrawRecords: WithdrawRecord[];
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
  setLastHandoverOrder: (order: Order | null) => void;

  updateUserBalance: (amount: number, type: 'add' | 'subtract' | 'freeze' | 'unfreeze') => void;
  addWithdrawRecord: (record: WithdrawRecord) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      evaluateItems: [],
      batchItems: [],
      orders: mockOrders,
      user: mockUser,
      withdrawRecords: mockWithdrawRecords,
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

        if (order && status === 'recycled' && finalPrice !== undefined) {
          set({
            user: {
              ...state.user,
              balance: Number((state.user.balance + finalPrice).toFixed(2)),
              totalEarning: Number(((state.user.totalEarning || 0) + finalPrice).toFixed(2))
            }
          });
          console.log('[Store] 回收完成，余额增加:', finalPrice, '新余额:', get().user.balance);
        }

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  finalPrice,
                  rejectReason,
                  recycledAt: status === 'recycled' ? new Date().toLocaleString() : undefined
                }
              : o
          )
        }));
      },
      updateOrderImages: (orderId, images) => {
        console.log('[Store] 更新订单照片:', orderId, '照片数:', images.length);
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, images } : o
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

          console.log('[Store] 更新余额:', type, '金额:', amount, '新余额:', newBalance, '冻结:', newFrozen);

          return {
            user: {
              ...state.user,
              balance: newBalance,
              frozenBalance: newFrozen
            }
          };
        });
      },
      addWithdrawRecord: (record) => {
        set((state) => ({
          withdrawRecords: [record, ...state.withdrawRecords]
        }));
        console.log('[Store] 添加提现记录:', record.id, '金额:', record.amount);
      }
    }),
    {
      name: 'textbook-recycle-storage',
      storage: createJSONStorage(() => ({
        getItem: (key) => {
          try {
            return Taro.getStorageSync(key);
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          try {
            Taro.setStorageSync(key, value);
          } catch {
            console.error('[Storage] 保存失败');
          }
        },
        removeItem: (key) => {
          try {
            Taro.removeStorageSync(key);
          } catch {
            console.error('[Storage] 删除失败');
          }
        }
      }))
    }
  )
);
