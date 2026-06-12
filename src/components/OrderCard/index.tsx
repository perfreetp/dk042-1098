import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { Order } from '@/types';
import { getStatusText, getStatusColor, formatMoney, getConditionLabel } from '@/utils';
import styles from './index.module.scss';

interface OrderCardProps {
  order: Order;
  onClick?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/order-detail/index?id=${order.id}`
      });
    }
  };

  return (
    <View className={styles.card} onClick={handleClick}>
      <View className={styles.header}>
        <Text className={styles.orderNo}>{order.orderNo}</Text>
        <Text className={styles.status} style={{ color: getStatusColor(order.status) }}>
          {getStatusText(order.status)}
        </Text>
      </View>

      <View className={styles.items}>
        {order.items.slice(0, 2).map((item, idx) => (
          <View className={styles.item} key={idx}>
            <View className={styles.itemInfo}>
              <Text className={styles.itemName}>{item.textbook.name}</Text>
              <View className={styles.itemMeta}>
                <Text className={styles.metaTag}>{getConditionLabel(item.condition)}</Text>
                {item.isSet && <Text className={styles.metaTag}>成套</Text>}
                <Text className={styles.metaText}>x{item.quantity}</Text>
              </View>
            </View>
            <Text className={styles.itemPrice}>¥{formatMoney(item.estimatedPrice)}</Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <Text className={styles.moreText}>还有{order.items.length - 2}本教材...</Text>
        )}
      </View>

      <View className={styles.footer}>
        <View className={styles.footerLeft}>
          <Text className={styles.quantityText}>共{order.totalQuantity}本</Text>
          <Text className={styles.typeText}>
            {order.pickupType === 'door' ? '上门回收' : '定点交书'}
          </Text>
        </View>
        <View className={styles.footerRight}>
          {order.status === 'recycled' && order.finalPrice ? (
            <>
              <Text className={styles.finalLabel}>实际结算</Text>
              <Text className={styles.finalPrice}>¥{formatMoney(order.finalPrice)}</Text>
            </>
          ) : (
            <>
              <Text className={styles.estimateLabel}>预估</Text>
              <Text className={styles.estimatePrice}>¥{formatMoney(order.estimatedPrice)}</Text>
            </>
          )}
        </View>
      </View>

      {order.rejectReason && (
        <View className={styles.rejectReason}>
          <Text className={styles.rejectLabel}>驳回原因：</Text>
          <Text className={styles.rejectText}>{order.rejectReason}</Text>
        </View>
      )}
    </View>
  );
};

export default OrderCard;
