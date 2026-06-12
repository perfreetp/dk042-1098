export interface Textbook {
  id: string;
  name: string;
  edition: string;
  course: string;
  courseId: string;
  isbn?: string;
  publisher?: string;
  basePrice: number;
}

export type BookCondition = 'new' | 'good' | 'normal' | 'worn';

export interface EvaluateItem {
  textbook: Textbook;
  condition: BookCondition;
  isSet: boolean;
  quantity: number;
  estimatedPrice: number;
}

export type OrderStatus = 'pending' | 'recycled' | 'rejected';

export type PickupType = 'door' | 'spot';

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  items: EvaluateItem[];
  totalQuantity: number;
  estimatedPrice: number;
  finalPrice?: number;
  pickupType: PickupType;
  address?: string;
  spotName?: string;
  contactName: string;
  contactPhone: string;
  remark?: string;
  createdAt: string;
  recycledAt?: string;
  rejectReason?: string;
  images?: string[];
  collectorName?: string;
}

export interface BatchItem {
  textbook: Textbook;
  condition: BookCondition;
  quantity: number;
  estimatedPrice: number;
}

export interface PriceNotice {
  id: string;
  course: string;
  textbookName: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  updatedAt: string;
  isUp: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  studentId?: string;
  className?: string;
  role: 'student' | 'monitor' | 'collector';
  balance: number;
  avatar?: string;
}

export interface WithdrawRecord {
  id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  createdAt: string;
  account: string;
  accountType: 'wechat' | 'alipay' | 'bank';
}
