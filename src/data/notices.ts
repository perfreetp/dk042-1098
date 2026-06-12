import { PriceNotice, FAQ, WithdrawRecord, UserInfo } from '@/types';

export const priceNoticeList: PriceNotice[] = [
  {
    id: 'pn1',
    course: '高等数学',
    textbookName: '高等数学（第七版）上册',
    oldPrice: 16,
    newPrice: 18,
    changePercent: 12.5,
    updatedAt: '2024-01-15',
    isUp: true
  },
  {
    id: 'pn2',
    course: '计算机网络',
    textbookName: '计算机网络（第七版）',
    oldPrice: 25,
    newPrice: 22,
    changePercent: 12,
    updatedAt: '2024-01-14',
    isUp: false
  },
  {
    id: 'pn3',
    course: '线性代数',
    textbookName: '线性代数（第六版）',
    oldPrice: 10,
    newPrice: 12,
    changePercent: 20,
    updatedAt: '2024-01-13',
    isUp: true
  },
  {
    id: 'pn4',
    course: '大学物理',
    textbookName: '大学物理（第四版）上下册',
    oldPrice: 32,
    newPrice: 30,
    changePercent: 6.25,
    updatedAt: '2024-01-12',
    isUp: false
  },
  {
    id: 'pn5',
    course: '数据结构',
    textbookName: '数据结构（C语言版）',
    oldPrice: 14,
    newPrice: 16,
    changePercent: 14.3,
    updatedAt: '2024-01-10',
    isUp: true
  }
];

export const faqList: FAQ[] = [
  {
    id: 'faq1',
    question: '教材回收的价格是如何计算的？',
    answer: '回收价格根据教材版本、课程、成色以及是否成套综合计算。全新教材按基准价100%回收，良好成色按75%，一般成色按50%，较旧成色按25%。成套教材额外享受10%加成。'
  },
  {
    id: 'faq2',
    question: '预约后多久可以完成回收？',
    answer: '上门回收通常在预约后24小时内安排回收员联系；定点回收可在营业时间内随时交书，回收点营业时间为工作日10:00-18:00。'
  },
  {
    id: 'faq3',
    question: '回收款项如何到账？',
    answer: '回收完成并核验无误后，款项将立即转入您的小程序账户余额。您可以申请提现至微信、支付宝或银行卡，提现通常1-3个工作日到账。'
  },
  {
    id: 'faq4',
    question: '哪些教材不回收？',
    answer: '以下情况的教材不予回收：1）内页大面积缺失、严重水渍、霉变；2）盗版或复印版教材；3）非正规出版物；4）教材配套的练习册、辅导书（单独教材可回收）。'
  },
  {
    id: 'faq5',
    question: '班级批量回收有什么优惠？',
    answer: '班级统一回收满20本额外补贴5%，满50本额外补贴10%，满100本额外补贴15%。班级负责人还可获得专属奖励积分。'
  },
  {
    id: 'faq6',
    question: '如何成为回收员？',
    answer: '在校学生可在"我的"页面点击"申请成为回收员"，填写信息并通过审核后即可成为回收员。回收员可获得每单5%的佣金奖励。'
  }
];

export const withdrawRecords: WithdrawRecord[] = [
  {
    id: 'w1',
    amount: 100,
    status: 'success',
    createdAt: '2024-01-10 14:30:00',
    account: '微信钱包',
    accountType: 'wechat'
  },
  {
    id: 'w2',
    amount: 50,
    status: 'pending',
    createdAt: '2024-01-15 09:20:00',
    account: '支付宝',
    accountType: 'alipay'
  }
];

export const mockUser: UserInfo = {
  id: 'u1',
  name: '同学小明',
  phone: '138****8888',
  studentId: '2021010101',
  className: '计算机2101班',
  role: 'student',
  balance: 256.5,
  frozenBalance: 0,
  totalEarning: 386.5,
  avatar: 'https://picsum.photos/id/64/200/200'
};
