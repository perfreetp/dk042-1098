import { Textbook } from '@/types';

export const textbookList: Textbook[] = [
  {
    id: '1',
    name: '高等数学（第七版）上册',
    edition: '第七版',
    course: '高等数学',
    courseId: 'c1',
    isbn: '9787040396638',
    publisher: '高等教育出版社',
    basePrice: 18
  },
  {
    id: '2',
    name: '高等数学（第七版）下册',
    edition: '第七版',
    course: '高等数学',
    courseId: 'c1',
    isbn: '9787040396621',
    publisher: '高等教育出版社',
    basePrice: 16
  },
  {
    id: '3',
    name: '线性代数（第六版）',
    edition: '第六版',
    course: '线性代数',
    courseId: 'c2',
    isbn: '9787040396614',
    publisher: '高等教育出版社',
    basePrice: 12
  },
  {
    id: '4',
    name: '概率论与数理统计（第四版）',
    edition: '第四版',
    course: '概率论与数理统计',
    courseId: 'c3',
    isbn: '9787040396607',
    publisher: '高等教育出版社',
    basePrice: 14
  },
  {
    id: '5',
    name: '大学物理（第四版）上册',
    edition: '第四版',
    course: '大学物理',
    courseId: 'c4',
    isbn: '9787040396591',
    publisher: '高等教育出版社',
    basePrice: 15
  },
  {
    id: '6',
    name: '大学物理（第四版）下册',
    edition: '第四版',
    course: '大学物理',
    courseId: 'c4',
    isbn: '9787040396584',
    publisher: '高等教育出版社',
    basePrice: 15
  },
  {
    id: '7',
    name: '有机化学（第六版）',
    edition: '第六版',
    course: '有机化学',
    courseId: 'c5',
    isbn: '9787040396577',
    publisher: '高等教育出版社',
    basePrice: 20
  },
  {
    id: '8',
    name: '无机化学（第五版）',
    edition: '第五版',
    course: '无机化学',
    courseId: 'c6',
    isbn: '9787040396560',
    publisher: '高等教育出版社',
    basePrice: 18
  },
  {
    id: '9',
    name: '数据结构（C语言版）',
    edition: '第二版',
    course: '数据结构',
    courseId: 'c7',
    isbn: '9787302147510',
    publisher: '清华大学出版社',
    basePrice: 16
  },
  {
    id: '10',
    name: '计算机网络（第七版）',
    edition: '第七版',
    course: '计算机网络',
    courseId: 'c8',
    isbn: '9787121302954',
    publisher: '电子工业出版社',
    basePrice: 22
  },
  {
    id: '11',
    name: '操作系统（第四版）',
    edition: '第四版',
    course: '操作系统',
    courseId: 'c9',
    isbn: '9787121293702',
    publisher: '电子工业出版社',
    basePrice: 18
  },
  {
    id: '12',
    name: '大学英语综合教程1',
    edition: '第三版',
    course: '大学英语',
    courseId: 'c10',
    isbn: '9787544648110',
    publisher: '上海外语教育出版社',
    basePrice: 10
  },
  {
    id: '13',
    name: '大学英语综合教程2',
    edition: '第三版',
    course: '大学英语',
    courseId: 'c10',
    isbn: '9787544648127',
    publisher: '上海外语教育出版社',
    basePrice: 10
  },
  {
    id: '14',
    name: '马克思主义基本原理概论',
    edition: '2023年版',
    course: '马克思主义原理',
    courseId: 'c11',
    isbn: '9787040599008',
    publisher: '高等教育出版社',
    basePrice: 6
  },
  {
    id: '15',
    name: '毛泽东思想和中国特色社会主义理论体系概论',
    edition: '2023年版',
    course: '毛概',
    courseId: 'c12',
    isbn: '9787040599015',
    publisher: '高等教育出版社',
    basePrice: 6
  }
];

export const courseList = [
  { id: 'all', name: '全部课程' },
  { id: 'c1', name: '高等数学' },
  { id: 'c2', name: '线性代数' },
  { id: 'c3', name: '概率论与数理统计' },
  { id: 'c4', name: '大学物理' },
  { id: 'c5', name: '有机化学' },
  { id: 'c6', name: '无机化学' },
  { id: 'c7', name: '数据结构' },
  { id: 'c8', name: '计算机网络' },
  { id: 'c9', name: '操作系统' },
  { id: 'c10', name: '大学英语' },
  { id: 'c11', name: '马克思主义原理' },
  { id: 'c12', name: '毛概' }
];

export const conditionList: { value: string; label: string; desc: string; priceRate: number }[] = [
  { value: 'new', label: '全新', desc: '未使用，无笔记无破损', priceRate: 1.0 },
  { value: 'good', label: '良好', desc: '少量笔记，无破损', priceRate: 0.75 },
  { value: 'normal', label: '一般', desc: '有笔记划线，轻微磨损', priceRate: 0.5 },
  { value: 'worn', label: '较旧', desc: '较多笔记，封面破损', priceRate: 0.25 }
];
