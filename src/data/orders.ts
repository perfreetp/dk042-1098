import { Order } from '@/types';
import { textbookList } from './textbooks';

export const orderList: Order[] = [
  {
    id: 'o1',
    orderNo: 'RB20240115001',
    status: 'pending',
    items: [
      {
        textbook: textbookList[0],
        condition: 'good',
        isSet: false,
        quantity: 1,
        estimatedPrice: 13.5
      },
      {
        textbook: textbookList[1],
        condition: 'good',
        isSet: false,
        quantity: 1,
        estimatedPrice: 12
      }
    ],
    totalQuantity: 2,
    estimatedPrice: 25.5,
    pickupType: 'door',
    address: '东区12号楼302室',
    contactName: '张三',
    contactPhone: '138****8888',
    remark: '下午3点后方便',
    createdAt: '2024-01-15 10:30:00'
  },
  {
    id: 'o2',
    orderNo: 'RB20240114002',
    status: 'pending',
    items: [
      {
        textbook: textbookList[2],
        condition: 'new',
        isSet: false,
        quantity: 1,
        estimatedPrice: 12
      },
      {
        textbook: textbookList[3],
        condition: 'normal',
        isSet: false,
        quantity: 1,
        estimatedPrice: 7
      },
      {
        textbook: textbookList[8],
        condition: 'good',
        isSet: false,
        quantity: 1,
        estimatedPrice: 12
      }
    ],
    totalQuantity: 3,
    estimatedPrice: 31,
    pickupType: 'spot',
    spotName: '图书馆门口回收点',
    contactName: '李四',
    contactPhone: '139****6666',
    createdAt: '2024-01-14 15:20:00'
  },
  {
    id: 'o3',
    orderNo: 'RB20240113003',
    status: 'recycled',
    items: [
      {
        textbook: textbookList[4],
        condition: 'good',
        isSet: true,
        quantity: 2,
        estimatedPrice: 24.75
      },
      {
        textbook: textbookList[5],
        condition: 'good',
        isSet: true,
        quantity: 2,
        estimatedPrice: 24.75
      }
    ],
    totalQuantity: 4,
    estimatedPrice: 49.5,
    finalPrice: 48,
    pickupType: 'door',
    address: '西区5号楼201室',
    contactName: '王五',
    contactPhone: '137****5555',
    createdAt: '2024-01-13 09:15:00',
    recycledAt: '2024-01-13 14:30:00',
    collectorName: '回收员小刘',
    images: ['https://picsum.photos/id/24/200/200']
  },
  {
    id: 'o4',
    orderNo: 'RB20240112004',
    status: 'recycled',
    items: [
      {
        textbook: textbookList[13],
        condition: 'normal',
        isSet: false,
        quantity: 1,
        estimatedPrice: 3
      },
      {
        textbook: textbookList[14],
        condition: 'normal',
        isSet: false,
        quantity: 1,
        estimatedPrice: 3
      }
    ],
    totalQuantity: 2,
    estimatedPrice: 6,
    finalPrice: 6,
    pickupType: 'spot',
    spotName: '教学楼A座大厅',
    contactName: '赵六',
    contactPhone: '136****4444',
    createdAt: '2024-01-12 16:45:00',
    recycledAt: '2024-01-12 17:20:00',
    collectorName: '回收员小张'
  },
  {
    id: 'o5',
    orderNo: 'RB20240111005',
    status: 'rejected',
    items: [
      {
        textbook: textbookList[9],
        condition: 'worn',
        isSet: false,
        quantity: 1,
        estimatedPrice: 5.5
      }
    ],
    totalQuantity: 1,
    estimatedPrice: 5.5,
    pickupType: 'door',
    address: '南区8号楼405室',
    contactName: '孙七',
    contactPhone: '135****3333',
    remark: '希望尽快回收',
    createdAt: '2024-01-11 11:00:00',
    rejectReason: '书籍损坏严重，内页有大面积涂画和水渍'
  },
  {
    id: 'o6',
    orderNo: 'RB20240110006',
    status: 'recycled',
    items: [
      {
        textbook: textbookList[10],
        condition: 'good',
        isSet: false,
        quantity: 1,
        estimatedPrice: 13.5
      }
    ],
    totalQuantity: 1,
    estimatedPrice: 13.5,
    finalPrice: 14,
    pickupType: 'spot',
    spotName: '图书馆门口回收点',
    contactName: '周八',
    contactPhone: '134****2222',
    createdAt: '2024-01-10 08:30:00',
    recycledAt: '2024-01-10 10:15:00',
    collectorName: '回收员小刘'
  }
];

export const pendingOrders = orderList.filter(o => o.status === 'pending');
export const recycledOrders = orderList.filter(o => o.status === 'recycled');
export const rejectedOrders = orderList.filter(o => o.status === 'rejected');
