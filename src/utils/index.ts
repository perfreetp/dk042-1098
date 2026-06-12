import { BookCondition } from '@/types';
import { conditionList } from '@/data/textbooks';

export const calculatePrice = (
  basePrice: number,
  condition: BookCondition,
  isSet: boolean = false,
  quantity: number = 1
): number => {
  const condInfo = conditionList.find((c) => c.value === condition);
  const rate = condInfo ? condInfo.priceRate : 0.5;
  let price = basePrice * rate * quantity;
  if (isSet) {
    price *= 1.1;
  }
  return Number(price.toFixed(2));
};

export const getConditionLabel = (condition: BookCondition): string => {
  const condInfo = conditionList.find((c) => c.value === condition);
  return condInfo ? condInfo.label : '一般';
};

export const getStatusText = (status: string): string => {
  const map: Record<string, string> = {
    pending: '待处理',
    recycled: '已回收',
    rejected: '已驳回'
  };
  return map[status] || status;
};

export const getStatusColor = (status: string): string => {
  const map: Record<string, string> = {
    pending: '#f59e0b',
    recycled: '#22c55e',
    rejected: '#ef4444'
  };
  return map[status] || '#9ca3af';
};

export const formatMoney = (amount: number): string => {
  return amount.toFixed(2);
};

export const generateOrderNo = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `RB${year}${month}${day}${random}`;
};
