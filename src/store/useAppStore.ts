import { create } from 'zustand';
import { EvaluateItem, BatchItem, Order, UserInfo } from '@/types';
import { orderList as mockOrders } from '@/data/orders';
import { mockUser } from '@/data/notices';

interface AppState {
  evaluateItems: EvaluateItem[];
  batchItems: BatchItem[];
  orders: Order[];
  user: UserInfo;
  addEvaluateItem: (item: EvaluateItem) => void;
  removeEvaluateItem: (index: number) => void;
  clearEvaluateItems: () => void;
  addBatchItem: (item: BatchItem) => void;
  removeBatchItem: (index: number) => void;
  clearBatchItems: () => void;
  updateBatchItemQuantity: (index: number, quantity: number) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status'], finalPrice?: number, rejectReason?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  evaluateItems: [],
  batchItems: [],
  orders: mockOrders,
  user: mockUser,
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
        newItems[index] = {
          ...newItems[index],
          quantity,
          estimatedPrice: Number((newItems[index].textbook.basePrice * newItems[index].estimatedPrice / newItems[index].quantity * quantity).toFixed(2))
        };
      }
      return { batchItems: newItems };
    }),
  addOrder: (order) =>
    set((state) => ({ orders: [order, ...state.orders] })),
  updateOrderStatus: (orderId, status, finalPrice, rejectReason) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? { ...o, status, finalPrice, rejectReason, recycledAt: status === 'recycled' ? new Date().toLocaleString() : undefined }
          : o
      )
    }))
}));
