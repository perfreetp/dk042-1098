import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, getConditionLabel, getStatusText } from '@/utils';
import { TimelineEvent } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const timelineIconMap: Record<TimelineEvent['type'], string> = {
  created: '📋',
  accepted: '🤝',
  photo: '📸',
  settled: '💰',
  rejected: '❌',
  handover: '交接'
};

const timelineColorMap: Record<TimelineEvent['type'], string> = {
  created: '#3b82f6',
  accepted: '#8b5cf6',
  photo: '#f59e0b',
  settled: '#22c55e',
  rejected: '#ef4444',
  handover: '#06b6d4'
};

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id;
  const { orders } = useAppStore();

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  const handlePreviewImage = (current: string) => {
    if (!order?.images) return;
    Taro.previewImage({ current, urls: order.images });
  };

  if (!order) {
    return (
      <View className={styles.page}>
        <EmptyState title="订单不存在" description="请返回重试" />
      </View>
    );
  }

  const timeline: TimelineEvent[] = order.timeline || [
    { type: 'created', label: '预约提交', time: order.createdAt, detail: order.pickupType === 'door' ? `上门回收 · ${order.address}` : `定点交书 · ${order.spotName}` }
  ];

  if (order.handoverNo && !timeline.find(e => e.type === 'handover')) {
    timeline.push({
      type: 'handover',
      label: '批量交接',
      time: order.createdAt,
      detail: `交接编号：${order.handoverNo}${order.className ? ` · ${order.className}` : ''}`
    });
  }

  if (order.status === 'recycled' && !timeline.find(e => e.type === 'accepted')) {
    timeline.splice(1, 0, { type: 'accepted', label: '回收员接单', time: order.recycledAt || order.createdAt, detail: order.collectorName ? `回收员：${order.collectorName}` : '已分配回收员' });
  }

  if (order.status === 'rejected' && !timeline.find(e => e.type === 'accepted')) {
    timeline.splice(1, 0, { type: 'accepted', label: '回收员接单', time: order.rejectedAt || order.createdAt, detail: order.collectorName ? `回收员：${order.collectorName}` : '已分配回收员' });
  }

  timeline.sort((a, b) => {
    const order_map: Record<string, number> = { created: 0, handover: 1, accepted: 2, photo: 3, settled: 4, rejected: 4 };
    return (order_map[a.type] || 0) - (order_map[b.type] || 0);
  });

  return (
    <View className={styles.page}>
      <View
        className={classnames(
          styles.statusCard,
          order.status === 'rejected' && styles.rejected,
          order.status === 'recycled' && styles.recycled
        )}
      >
        <Text className={styles.statusText}>{getStatusText(order.status)}</Text>
        <Text className={styles.statusDesc}>
          {order.status === 'pending' && '请等待回收员联系，预计24小时内处理'}
          {order.status === 'recycled' && `回收完成，款项已到账 · ${order.recycledAt}`}
          {order.status === 'rejected' && '订单已被驳回，详见下方原因'}
        </Text>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>处理时间线</Text>
        <View className={styles.timeline}>
          {timeline.map((event, idx) => (
            <View className={styles.timelineItem} key={idx}>
              <View className={styles.timelineLeft}>
                <View className={styles.timelineDot} style={{ background: timelineColorMap[event.type] }}>
                  {event.type === 'handover' ? (
                    <Text className={styles.timelineDotText}>交</Text>
                  ) : (
                    <Text className={styles.timelineDotText}>{timelineIconMap[event.type]}</Text>
                  )}
                </View>
                {idx < timeline.length - 1 && <View className={styles.timelineLine} />}
              </View>
              <View className={styles.timelineContent}>
                <View className={styles.timelineHeader}>
                  <Text className={styles.timelineLabel}>{event.label}</Text>
                  <Text className={styles.timelineTime}>{event.time}</Text>
                </View>
                {event.detail && <Text className={styles.timelineDetail}>{event.detail}</Text>}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>订单信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>订单编号</Text>
          <Text className={styles.infoValue}>{order.orderNo}</Text>
        </View>
        {order.handoverNo && (
          <View className={styles.handoverRow}>
            <Text className={styles.handoverLabel}>交接编号</Text>
            <Text className={styles.handoverValue}>{order.handoverNo}</Text>
          </View>
        )}
        {order.className && (
          <View className={styles.classRow}>
            <Text className={styles.classLabel}>班级</Text>
            <Text className={styles.classValue}>{order.className}</Text>
          </View>
        )}
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>提交时间</Text>
          <Text className={styles.infoValue}>{order.createdAt}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>回收方式</Text>
          <Text className={styles.infoValue}>
            {order.pickupType === 'door' ? '上门回收' : '定点交书'}
          </Text>
        </View>
        {order.remark && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>备注</Text>
            <Text className={styles.infoValue}>{order.remark}</Text>
          </View>
        )}
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>联系方式</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>联系人</Text>
          <Text className={styles.infoValue}>{order.contactName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>联系电话</Text>
          <Text className={styles.infoValue}>{order.contactPhone}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>
            {order.pickupType === 'door' ? '上门地址' : '回收地点'}
          </Text>
          <Text className={styles.infoValue}>
            {order.pickupType === 'door' ? order.address : order.spotName}
          </Text>
        </View>
      </View>

      <View className={styles.infoCard}>
        <Text className={styles.cardTitle}>教材清单（{order.totalQuantity}本）</Text>
        {order.items.map((item, idx) => (
          <View className={styles.itemRow} key={idx}>
            <View className={styles.itemInfo}>
              <Text className={styles.itemName}>{item.textbook.name}</Text>
              <View className={styles.itemMeta}>
                <Text className={styles.metaTag}>{getConditionLabel(item.condition)}</Text>
                {item.isSet && <Text className={styles.metaTag}>成套</Text>}
                <Text className={styles.metaTag}>x{item.quantity}</Text>
              </View>
            </View>
            <Text className={styles.itemPrice}>¥{formatMoney(item.estimatedPrice)}</Text>
          </View>
        ))}

        <View className={styles.priceSummary}>
          <View className={styles.priceRow}>
            <Text className={styles.priceLabel}>预估总价</Text>
            <Text className={styles.priceValue}>¥{formatMoney(order.estimatedPrice)}</Text>
          </View>
          {order.bonusRate && order.bonusRate > 0 && (
            <View className={styles.bonusRow}>
              <Text className={styles.bonusLabel}>批量补贴</Text>
              <Text className={styles.bonusValue}>+{(order.bonusRate * 100).toFixed(0)}%</Text>
            </View>
          )}
          {order.status === 'recycled' && order.finalPrice !== undefined && (
            <>
              <View className={styles.priceRow}>
                <Text className={styles.priceLabel}>价格调整</Text>
                <Text className={styles.priceValue}>
                  {(order.finalPrice - order.estimatedPrice) >= 0 ? '+' : ''}
                  ¥{formatMoney(order.finalPrice - order.estimatedPrice)}
                </Text>
              </View>
              <View className={styles.totalRow}>
                <Text className={styles.totalLabel}>实际结算</Text>
                <Text className={styles.totalValue}>¥{formatMoney(order.finalPrice)}</Text>
              </View>
            </>
          )}
        </View>

        {order.images && order.images.length > 0 && (
          <View className={styles.photoSection}>
            <Text className={styles.photoTitle}>核验照片（{order.images.length}张）</Text>
            <View className={styles.photoList}>
              {order.images.map((img, idx) => (
                <View className={styles.photoItem} key={idx} onClick={() => handlePreviewImage(img)}>
                  <Image className={styles.photoImg} src={img} mode="aspectFill" />
                </View>
              ))}
            </View>
          </View>
        )}

        {order.status === 'recycled' && (!order.images || order.images.length === 0) && (
          <View className={styles.photoSection}>
            <Text className={styles.photoTitle}>核验照片</Text>
            <View className={styles.noPhoto}>
              <Text>⚠️ 该订单缺少核验照片</Text>
            </View>
          </View>
        )}

        {order.collectorName && (
          <View className={styles.infoRow} style={{ marginTop: '24rpx', paddingTop: '24rpx', borderTop: '1rpx solid #f3f4f6' }}>
            <Text className={styles.infoLabel}>回收员</Text>
            <Text className={styles.infoValue}>{order.collectorName}</Text>
          </View>
        )}

        {order.rejectReason && (
          <View className={styles.rejectBox}>
            <Text className={styles.rejectLabel}>驳回原因</Text>
            <Text className={styles.rejectText}>{order.rejectReason}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default OrderDetailPage;
