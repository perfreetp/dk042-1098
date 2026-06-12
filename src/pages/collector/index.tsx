import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, getConditionLabel, getStatusText } from '@/utils';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const CollectorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const { orders, updateOrderStatus, updateOrderImages, user } = useAppStore();

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

  useEffect(() => {
    if (selectedOrder) {
      setFinalPrice(selectedOrder.estimatedPrice);
      setPhotos(selectedOrder.images || []);
      console.log('[Collector] 加载订单照片:', selectedOrder.images?.length || 0);
    }
  }, [selectedOrder?.id]);

  const handleAddPhoto = () => {
    if (!selectedOrder) return;
    Taro.chooseImage({
      count: 3 - photos.length,
      success: (res) => {
        const newPhotos = [...photos, ...res.tempFilePaths];
        setPhotos(newPhotos);
        updateOrderImages(selectedOrder.id, newPhotos);
        console.log('[Collector] 上传照片成功，当前共:', newPhotos.length);
      }
    });
  };

  const handleRemovePhoto = (idx: number) => {
    if (!selectedOrder) return;
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    updateOrderImages(selectedOrder.id, newPhotos);
  };

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({
      phoneNumber: phone.replace(/\*/g, '0'),
      fail: () => {
        Taro.showToast({ title: '拨号失败', icon: 'none' });
      }
    });
  };

  const handleNavigate = () => {
    if (!selectedOrder) return;
    if (selectedOrder.pickupType === 'door' && selectedOrder.address) {
      console.log('[Collector] 打开导航:', selectedOrder.address);
      Taro.openLocation({
        latitude: 39.908823,
        longitude: 116.39747,
        name: '用户地址',
        address: selectedOrder.address,
        scale: 18,
        fail: () => {
          Taro.showToast({ title: '地图打开失败', icon: 'none' });
        }
      });
    } else if (selectedOrder.pickupType === 'spot' && selectedOrder.spotName) {
      console.log('[Collector] 查看回收点:', selectedOrder.spotName);
      Taro.openLocation({
        latitude: 39.908823,
        longitude: 116.39747,
        name: selectedOrder.spotName,
        address: '校内回收点',
        scale: 18,
        fail: () => {
          Taro.showToast({ title: '地图打开失败', icon: 'none' });
        }
      });
    }
  };

  const handleViewDetail = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };

  const handleConfirm = () => {
    if (!selectedOrder) return;
    if (photos.length === 0) {
      Taro.showToast({ title: '请拍照留证后再结算', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '确认回收',
      content: `确认以 ¥${formatMoney(finalPrice)} 完成回收？`,
      success: (res) => {
        if (res.confirm) {
          updateOrderImages(selectedOrder.id, photos);
          updateOrderStatus(selectedOrder.id, 'recycled', finalPrice);
          console.log('[Collector] 确认回收订单:', selectedOrder.orderNo, '最终价格:', finalPrice, '照片数:', photos.length);
          Taro.showToast({ title: '回收完成', icon: 'success' });
          setPhotos([]);
          setRejectReason('');
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
          setPhotos([]);
          setSelectedOrderId('');
        }
      }
    });
  };

  const spotLocations: Record<string, { addr: string; lat: number; lng: number }> = {
    '图书馆门口': { addr: '图书馆一楼正门', lat: 39.9088, lng: 116.3975 },
    '教学楼大厅': { addr: '主教学楼一楼大厅', lat: 39.9090, lng: 116.3980 },
    '宿舍区': { addr: '学生宿舍区1号楼楼下', lat: 39.9100, lng: 116.3965 },
    '班级统一回收': { addr: '班级负责人统一收集', lat: 39.9088, lng: 116.3975 }
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
          onClick={() => {
            setActiveTab('todo');
            setSelectedOrderId('');
          }}
        >
          <Text>待处理（{pendingOrders.length}）</Text>
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'done' && styles.active)}
          onClick={() => {
            setActiveTab('done');
            setSelectedOrderId('');
          }}
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
              <View className={styles.orderHeader}>
                <Text className={styles.orderNo}>{order.orderNo}</Text>
                {order.status !== 'pending' && (
                  <Text
                    className={classnames(
                      styles.doneBadge,
                      order.status === 'recycled' && styles.recycled,
                      order.status === 'rejected' && styles.rejected
                    )}
                  >
                    {getStatusText(order.status)}
                  </Text>
                )}
              </View>
              <Text className={styles.typeTag}>
                {order.pickupType === 'door' ? '上门回收' : '定点交书'}
              </Text>
            </View>

            <View className={styles.contactRow}>
              <Text className={styles.contactLabel}>联系人</Text>
              <Text className={styles.contactValue}>{order.contactName}</Text>
              <View className={styles.phoneBtn} onClick={(e) => {
                e.stopPropagation();
                handleCall(order.contactPhone);
              }}>
                <Text>📞</Text>
              </View>
            </View>

            <View className={styles.addressRow}>
              <Text className={styles.contactLabel}>
                {order.pickupType === 'door' ? '地址' : '回收点'}
              </Text>
              <Text className={styles.addressValue}>
                {order.pickupType === 'door' ? order.address : order.spotName}
              </Text>
              <View className={styles.navBtn} onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}>
                <Text>🧭</Text>
              </View>
            </View>

            {order.pickupType === 'spot' && order.spotName && spotLocations[order.spotName] && (
              <View className={styles.spotMap} onClick={(e) => e.stopPropagation()}>
                <View className={styles.spotIcon}>
                  <Text>📍</Text>
                </View>
                <View className={styles.spotInfo}>
                  <Text className={styles.spotName}>{order.spotName}</Text>
                  <Text className={styles.spotAddr}>{spotLocations[order.spotName].addr}</Text>
                </View>
                <View className={styles.navBtn} onClick={(e) => {
                  e.stopPropagation();
                  handleNavigate();
                }}>
                  <Text>导航</Text>
                </View>
              </View>
            )}

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
              {order.status === 'recycled' && order.finalPrice && (
                <View className={styles.priceRow}>
                  <Text className={styles.priceLabel}>实际结算</Text>
                  <Text className={styles.priceValue} style={{ color: '#ef4444', fontWeight: 'bold' }}>
                    ¥{formatMoney(order.finalPrice)}
                  </Text>
                </View>
              )}
            </View>

            {order.status !== 'pending' && (
              <View className={styles.orderFooter} onClick={(e) => e.stopPropagation()}>
                <View className={styles.viewDetailBtn} onClick={() => handleViewDetail(order.id)}>
                  <Text>查看详情 →</Text>
                </View>
              </View>
            )}

            {order.status === 'pending' && selectedOrder?.id === order.id && (
              <>
                <View className={styles.finalPriceRow}>
                  <Text className={styles.finalLabel}>最终结算价</Text>
                  <View className={styles.finalControl}>
                    <View
                      className={styles.finalBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFinalPrice(Math.max(0, finalPrice - 1));
                      }}
                    >
                      <Text>-</Text>
                    </View>
                    <Text className={styles.finalValue}>¥{formatMoney(finalPrice)}</Text>
                    <View
                      className={styles.finalBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFinalPrice(finalPrice + 1);
                      }}
                    >
                      <Text>+</Text>
                    </View>
                  </View>
                </View>

                <View className={styles.photoSection}>
                  <Text className={styles.photoLabel}>
                    拍照留证（至少1张） {photos.length > 0 && `(${photos.length}/3)`}
                  </Text>
                  <View className={styles.photoList}>
                    {photos.map((p, idx) => (
                      <View className={styles.photoItemWrapper} key={idx} onClick={(e) => e.stopPropagation()}>
                        <Image className={styles.photoView} src={p} mode="aspectFill" />
                        <View className={styles.photoRemove} onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(idx);
                        }}>
                          <Text>×</Text>
                        </View>
                      </View>
                    ))}
                    {photos.length < 3 && (
                      <View className={styles.photoAdd} onClick={(e) => {
                        e.stopPropagation();
                        handleAddPhoto();
                      }}>
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
                    onClick={(e) => e.stopPropagation()}
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
