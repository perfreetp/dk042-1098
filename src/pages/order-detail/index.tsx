import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, getConditionLabel, getStatusText } from '@/utils';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const OrderDetailPage: React.FC = () => {
  const router = useRouter();
  const orderId = router.params.id;
  const { orders } = useAppStore();

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <View className={styles.page}>
        <EmptyState title="订单不存在" description="请返回重试" />
      </View>
    );
  }

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
        <Text className={styles.cardTitle}>订单信息</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>订单编号</Text>
          <Text className={styles.infoValue}>{order.orderNo}</Text>
        </View>
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
          {order.status === 'recycled' && order.finalPrice && (
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
