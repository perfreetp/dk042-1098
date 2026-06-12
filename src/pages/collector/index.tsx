import React, { useState, useMemo } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, getConditionLabel } from '@/utils';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const CollectorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const { orders, updateOrderStatus } = useAppStore();

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const doneOrders = useMemo(() => orders.filter((o) => o.status !== 'pending'), [orders]);
  const displayOrders = activeTab === 'todo' ? pendingOrders : doneOrders;

  const stats = useMemo(() => {
    const today = pendingOrders.length;
    const done = doneOrders.filter((o) => o.status === 'recycled').length;
    const earnings = doneOrders
      .filter((o) => o.status === 'recycled')
      .reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice), 0);
    return { today, done, earnings };
  }, [pendingOrders, doneOrders]);

  const selectedOrder = useMemo(() => {
    if (selectedOrderId) {
      return orders.find((o) => o.id === selectedOrderId);
    }
    return displayOrders[0] || null;
  }, [selectedOrderId, displayOrders, orders]);

  React.useEffect(() => {
    if (selectedOrder) {
      setFinalPrice(selectedOrder.estimatedPrice);
    }
  }, [selectedOrder?.id]);

  const handleAddPhoto = () => {
    Taro.chooseImage({
      count: 3 - photos.length,
      success: (res) => {
        setPhotos([...photos, ...res.tempFilePaths]);
        console.log('[Collector] 上传照片成功:', res.tempFilePaths.length);
      }
    });
  };

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({
      phoneNumber: phone.replace(/\*/g, '0'),
      fail: () => {
        Taro.showToast({ title: '拨号失败', icon: 'none' });
      }
    });
  };

  const handleConfirm = () => {
    if (!selectedOrder) return;
    if (photos.length === 0) {
      Taro.showToast({ title: '请拍照留证', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认回收',
      content: `确认以 ¥${formatMoney(finalPrice)} 完成回收？`,
      success: (res) => {
        if (res.confirm) {
          updateOrderStatus(selectedOrder.id, 'recycled', finalPrice);
          console.log('[Collector] 确认回收订单:', selectedOrder.orderNo, '最终价格:', finalPrice);
          Taro.showToast({ title: '回收完成', icon: 'success' });
          setPhotos([]);
          setSelectedOrderId('');
        }
      }
    });
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请填写驳回原因', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认驳回',
      content: '确定要驳回此订单吗？',
      success: (res) => {
        if (res.confirm) {
          updateOrderStatus(selectedOrder.id, 'rejected', undefined, rejectReason);
          console.log('[Collector] 驳回订单:', selectedOrder.orderNo, '原因:', rejectReason);
          Taro.showToast({ title: '已驳回', icon: 'success' });
          setRejectReason('');
          setSelectedOrderId('');
        }
      }
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>回收员工作台</Text>
        <Text className={styles.subtitle}>核验实物、调整价格、完成回收</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.today}</Text>
            <Text className={styles.statLabel}>待处理</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.done}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{formatMoney(stats.earnings)}</Text>
            <Text className={styles.statLabel}>回收金额</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'todo' && styles.active)}
          onClick={() => setActiveTab('todo')}
        >
          <Text>待处理（{pendingOrders.length}）</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'done' && styles.active)}
          onClick={() => setActiveTab('done')}
        >
          <Text>已处理（{doneOrders.length}）</Text>
        </View>
      </View>

      {displayOrders.length === 0 ? (
        <EmptyState title="暂无订单" description={activeTab === 'todo' ? '暂无待处理订单' : '暂无已处理订单'} />
      ) : (
        displayOrders.map((order) => (
          <View
            key={order.id}
            className={styles.orderCard}
            onClick={() => setSelectedOrderId(order.id)}
          >
            <View className={styles.cardHeader}>
              <Text className={styles.orderNo}>{order.orderNo}</Text>
              <Text className={styles.typeTag}>
                {order.pickupType === 'door' ? '上门回收' : '定点交书'}
              </Text>
            </View>

            <View className={styles.contactRow}>
              <Text className={styles.contactLabel}>联系人</Text>
              <Text className={styles.contactValue}>{order.contactName}</Text>
              <View className={styles.phoneBtn} onClick={() => handleCall(order.contactPhone)}>
                <Text>📞</Text>
              </View>
            </View>

            <View className={styles.contactRow}>
              <Text className={styles.contactLabel}>
                {order.pickupType === 'door' ? '地址' : '回收点'}
              </Text>
              <Text className={styles.contactValue}>
                {order.pickupType === 'door' ? order.address : order.spotName}
              </Text>
            </View>

            <View className={styles.itemsSection}>
              <Text className={styles.itemsTitle}>教材清单（{order.totalQuantity}本）</Text>
              {order.items.slice(0, 3).map((item, idx) => (
                <View className={styles.itemRow} key={idx}>
                  <Text className={styles.itemName}>{item.textbook.name}</Text>
                  <Text className={styles.itemInfo}>
                    {getConditionLabel(item.condition)} x{item.quantity}
                  </Text>
                </View>
              ))}
            </View>

            <View className={styles.priceSection}>
              <View className={styles.priceRow}>
                <Text className={styles.priceLabel}>预估价格</Text>
                <Text className={styles.priceValue}>¥{formatMoney(order.estimatedPrice)}</Text>
              </View>
            </View>

            {order.status === 'pending' && selectedOrder?.id === order.id && (
              <>
                <View className={styles.finalPriceRow}>
                  <Text className={styles.finalLabel}>最终结算价</Text>
                  <View className={styles.finalControl}>
                    <View
                      className={styles.finalBtn}
                      onClick={() => setFinalPrice(Math.max(0, finalPrice - 1))}
                    >
                      <Text>-</Text>
                    </View>
                    <Text className={styles.finalValue}>¥{formatMoney(finalPrice)}</Text>
                    <View
                      className={styles.finalBtn}
                      onClick={() => setFinalPrice(finalPrice + 1)}
                    >
                      <Text>+</Text>
                    </View>
                  </View>
                </View>

                <View className={styles.photoSection}>
                  <Text className={styles.photoLabel}>拍照留证（至少1张）</Text>
                  <View className={styles.photoList}>
                    {photos.map((p, idx) => (
                      <View className={styles.photoItem} key={idx}>
                        <Image className={styles.photoImg} src={p} mode="aspectFill" />
                      </View>
                    ))}
                    {photos.length < 3 && (
                      <View className={styles.photoAdd} onClick={handleAddPhoto}>
                        <Text>+</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View className={styles.rejectSection}>
                  <Text className={styles.rejectLabel}>驳回原因（驳回时必填）</Text>
                  <Textarea
                    className={styles.rejectInput}
                    placeholder="如书籍损坏、版本不符等"
                    value={rejectReason}
                    onInput={(e) => setRejectReason(e.detail.value)}
                  />
                </View>
              </>
            )}
          </View>
        ))
      )}

      {activeTab === 'todo' && selectedOrder && (
        <View className={styles.bottomBar}>
          <View className={`${styles.actionBtn} ${styles.rejectBtn}`} onClick={handleReject}>
            <Text>驳回订单</Text>
          </View>
          <View className={`${styles.actionBtn} ${styles.confirmBtn}`} onClick={handleConfirm}>
            <Text>确认回收</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default CollectorPage;
