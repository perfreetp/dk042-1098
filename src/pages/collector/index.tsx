import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, getConditionLabel, getStatusText } from '@/utils';
import { Order } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

export const spotLocations: Record<string, { addr: string; lat: number; lng: number; region: string }> = {
  '图书馆门口': { addr: '图书馆一楼正门', lat: 39.9088, lng: 116.3975, region: '图书馆' },
  '图书馆门口回收点': { addr: '图书馆一楼正门 · 教材回收点', lat: 39.90875, lng: 116.3976, region: '图书馆' },
  '图书馆': { addr: '图书馆一楼大厅', lat: 39.9089, lng: 116.3974, region: '图书馆' },
  '教学楼大厅': { addr: '主教学楼一楼大厅', lat: 39.9090, lng: 116.3980, region: '教学楼' },
  '教学楼A座大厅': { addr: '教学楼A座一楼大厅 · 前台旁', lat: 39.9092, lng: 116.3982, region: '教学楼' },
  '教学楼B座': { addr: '教学楼B座入口处', lat: 39.9091, lng: 116.3984, region: '教学楼' },
  '宿舍区': { addr: '学生宿舍区1号楼楼下', lat: 39.9100, lng: 116.3965, region: '宿舍区' },
  '东区12号楼': { addr: '东区学生宿舍12号楼', lat: 39.9102, lng: 116.3963, region: '宿舍区' },
  '西区5号楼': { addr: '西区学生宿舍5号楼', lat: 39.9098, lng: 116.3961, region: '宿舍区' },
  '南区8号楼': { addr: '南区学生宿舍8号楼', lat: 39.9095, lng: 116.3968, region: '宿舍区' },
  '班级统一回收': { addr: '班级负责人统一收集', lat: 39.9088, lng: 116.3975, region: '班级' }
};

export const regionPriority: Record<string, number> = {
  '宿舍区': 1,
  '教学楼': 2,
  '图书馆': 3,
  '班级': 4,
  '其他': 5
};

export const getSpotLocation = (spotName?: string) => {
  if (!spotName) return null;
  if (spotLocations[spotName]) return spotLocations[spotName];
  for (const key of Object.keys(spotLocations)) {
    if (spotName.includes(key) || key.includes(spotName)) {
      return spotLocations[key];
    }
  }
  return null;
};

export const extractRegion = (order: Order): string => {
  if (order.pickupType === 'spot') {
    const spot = getSpotLocation(order.spotName);
    if (spot) return spot.region;
    if (order.spotName?.includes('图书馆')) return '图书馆';
    if (order.spotName?.includes('教学楼')) return '教学楼';
    if (order.spotName?.includes('宿舍')) return '宿舍区';
    if (order.spotName?.includes('班级')) return '班级';
    return '其他';
  } else {
    const addr = order.address || '';
    if (addr.includes('东区') || addr.includes('西区') || addr.includes('南区') || addr.includes('北区') || addr.includes('宿舍') || addr.includes('号楼')) return '宿舍区';
    if (addr.includes('教学')) return '教学楼';
    if (addr.includes('图书馆')) return '图书馆';
    return '其他';
  }
};

export const sortOrdersByRoute = (orders: Order[]): Order[] => {
  return [...orders].sort((a, b) => {
    const ra = regionPriority[extractRegion(a)] || 99;
    const rb = regionPriority[extractRegion(b)] || 99;
    if (ra !== rb) return ra - rb;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

const CollectorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'todo' | 'done' | 'route'>('todo');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [rejectReason, setRejectReason] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const { orders, updateOrderStatus, updateOrderImages, appendTimelineEvent } = useAppStore();

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);
  const doneOrders = useMemo(() => orders.filter((o) => o.status !== 'pending'), [orders]);
  const doorOrders = useMemo(() => sortOrdersByRoute(pendingOrders.filter((o) => o.pickupType === 'door')), [pendingOrders]);
  const spotOrders = useMemo(() => sortOrdersByRoute(pendingOrders.filter((o) => o.pickupType === 'spot')), [pendingOrders]);
  const allRouteOrders = useMemo(() => sortOrdersByRoute(pendingOrders), [pendingOrders]);

  const routeStats = useMemo(() => {
    const totalBooks = pendingOrders.reduce((s, o) => s + o.totalQuantity, 0);
    const totalAmount = pendingOrders.reduce((s, o) => s + o.estimatedPrice, 0);
    return { totalBooks, totalAmount, orderCount: pendingOrders.length, doorCount: doorOrders.length, spotCount: spotOrders.length };
  }, [pendingOrders, doorOrders, spotOrders]);

  const stats = useMemo(() => {
    const today = pendingOrders.length;
    const done = doneOrders.filter((o) => o.status === 'recycled').length;
    const earnings = doneOrders.filter((o) => o.status === 'recycled').reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice), 0);
    return { today, done, earnings };
  }, [pendingOrders, doneOrders]);

  const selectedOrder = useMemo(() => selectedOrderId ? orders.find((o) => o.id === selectedOrderId) : null, [selectedOrderId, orders]);

  useEffect(() => {
    if (selectedOrder) {
      setFinalPrice(selectedOrder.estimatedPrice);
      setPhotos(selectedOrder.images || []);
    }
  }, [selectedOrder?.id]);

  const navigateToOrder = (order: Order) => {
    let lat = 39.908823, lng = 116.39747, name = '', address = '';
    if (order.pickupType === 'door') {
      lat = 39.908823 + Math.random() * 0.005;
      lng = 116.39747 + Math.random() * 0.005;
      name = `${order.contactName} · 上门回收`;
      address = order.address || '';
    } else {
      const spot = getSpotLocation(order.spotName);
      lat = spot ? spot.lat : lat;
      lng = spot ? spot.lng : lng;
      name = order.spotName || '校内回收点';
      address = spot ? spot.addr : '校内回收点';
    }
    Taro.openLocation({
      latitude: lat, longitude: lng, name, address, scale: 18,
      fail: () => Taro.showToast({ title: '地图打开失败', icon: 'none' })
    });
  };

  const handleCall = (phone: string) => {
    Taro.makePhoneCall({
      phoneNumber: phone.replace(/\*/g, '0'),
      fail: () => Taro.showToast({ title: '拨号失败', icon: 'none' })
    });
  };

  const handleViewDetail = (orderId: string) => Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });

  const handleAddPhoto = () => {
    if (!selectedOrder) return;
    Taro.chooseImage({
      count: 3 - photos.length,
      success: (res) => {
        const newPhotos = [...photos, ...res.tempFilePaths];
        setPhotos(newPhotos);
        updateOrderImages(selectedOrder.id, newPhotos);
      }
    });
  };

  const handleRemovePhoto = (idx: number) => {
    if (!selectedOrder) return;
    const newPhotos = photos.filter((_, i) => i !== idx);
    setPhotos(newPhotos);
    updateOrderImages(selectedOrder.id, newPhotos);
  };

  const handleAcceptAndSelect = (order: Order) => {
    if (!order.timeline?.find(e => e.type === 'accepted')) {
      appendTimelineEvent(order.id, {
        type: 'accepted',
        label: '回收员接单',
        time: new Date().toLocaleString(),
        detail: '回收员已接单，将按路线顺序处理'
      });
    }
    setSelectedOrderId(order.id);
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
          Taro.showToast({ title: '回收完成', icon: 'success' });
          setPhotos([]); setRejectReason(''); setSelectedOrderId('');
        }
      }
    });
  };

  const handleReject = () => {
    if (!selectedOrder) return;
    if (!rejectReason.trim()) { Taro.showToast({ title: '请填写驳回原因', icon: 'none' }); return; }
    Taro.showModal({
      title: '确认驳回',
      content: '确定要驳回此订单吗？',
      success: (res) => {
        if (res.confirm) {
          updateOrderStatus(selectedOrder.id, 'rejected', undefined, rejectReason);
          Taro.showToast({ title: '已驳回', icon: 'success' });
          setRejectReason(''); setPhotos([]); setSelectedOrderId('');
        }
      }
    });
  };

  const renderOrderCard = (order: Order, index?: number) => {
    const region = extractRegion(order);
    const regionTag = { '宿舍区': '🏠 宿舍', '教学楼': '🏫 教学', '图书馆': '📚 图书', '班级': '🎓 班级', '其他': '📍 其他' }[region] || '📍';
    return (
      <View key={order.id} className={styles.orderCard} onClick={() => activeTab !== 'route' ? setSelectedOrderId(order.id) : handleAcceptAndSelect(order)}>
        <View className={styles.cardHeader}>
          <View className={styles.orderHeader}>
            {index !== undefined && <Text className={styles.routeIndex}>{index + 1}</Text>}
            <Text className={styles.orderNo}>{order.orderNo}</Text>
            <Text className={styles.regionTag}>{regionTag}</Text>
            {order.status !== 'pending' && (
              <Text className={classnames(styles.doneBadge, order.status === 'recycled' && styles.recycled, order.status === 'rejected' && styles.rejected)}>
                {getStatusText(order.status)}
              </Text>
            )}
          </View>
          <Text className={styles.typeTag}>{order.pickupType === 'door' ? '🏠 上门' : '📍 定点'}</Text>
        </View>
        <View className={styles.contactRow}>
          <Text className={styles.contactLabel}>联系人</Text>
          <Text className={styles.contactValue}>{order.contactName}</Text>
          <View className={styles.phoneBtn} onClick={(e) => { e.stopPropagation(); handleCall(order.contactPhone); }}><Text>📞</Text></View>
        </View>
        <View className={styles.addressRow}>
          <Text className={styles.contactLabel}>{order.pickupType === 'door' ? '地址' : '回收点'}</Text>
          <Text className={styles.addressValue}>{order.pickupType === 'door' ? order.address : order.spotName}</Text>
          <View className={styles.navBtn} onClick={(e) => { e.stopPropagation(); navigateToOrder(order); }}><Text>🧭</Text></View>
        </View>
        {order.pickupType === 'spot' && order.spotName && getSpotLocation(order.spotName) && (
          <View className={styles.spotMap} onClick={(e) => e.stopPropagation()}>
            <View className={styles.spotIcon}><Text>📍</Text></View>
            <View className={styles.spotInfo}>
              <Text className={styles.spotName}>{order.spotName}</Text>
              <Text className={styles.spotAddr}>{getSpotLocation(order.spotName)!.addr}</Text>
            </View>
            <View className={styles.navBtn} onClick={(e) => { e.stopPropagation(); navigateToOrder(order); }}><Text>导航</Text></View>
          </View>
        )}
        <View className={styles.itemsSection}>
          <Text className={styles.itemsTitle}>教材（{order.totalQuantity}本）</Text>
          {order.items.slice(0, 2).map((item, idx) => (
            <View className={styles.itemRow} key={idx}>
              <Text className={styles.itemName}>{item.textbook.name}</Text>
              <Text className={styles.itemInfo}>{getConditionLabel(item.condition)} x{item.quantity}</Text>
            </View>
          ))}
          {order.items.length > 2 && <Text className={styles.moreItems}>还有{order.items.length - 2}种...</Text>}
        </View>
        <View className={styles.priceSection}>
          <View className={styles.priceRow}>
            <Text className={styles.priceLabel}>预估价格</Text>
            <Text className={styles.priceValue}>¥{formatMoney(order.estimatedPrice)}</Text>
          </View>
          {order.status === 'recycled' && order.finalPrice && (
            <View className={styles.priceRow}>
              <Text className={styles.priceLabel}>实际结算</Text>
              <Text className={styles.priceValue} style={{ color: '#ef4444', fontWeight: 'bold' }}>¥{formatMoney(order.finalPrice)}</Text>
            </View>
          )}
        </View>
        {order.status !== 'pending' && (
          <View className={styles.orderFooter} onClick={(e) => e.stopPropagation()}>
            <View className={styles.viewDetailBtn} onClick={() => handleViewDetail(order.id)}><Text>查看详情 →</Text></View>
          </View>
        )}
        {activeTab === 'todo' && selectedOrder?.id === order.id && (
          <>
            <View className={styles.finalPriceRow}>
              <Text className={styles.finalLabel}>最终结算价</Text>
              <View className={styles.finalControl}>
                <View className={styles.finalBtn} onClick={(e) => { e.stopPropagation(); setFinalPrice(Math.max(0, finalPrice - 1)); }}><Text>-</Text></View>
                <Text className={styles.finalValue}>¥{formatMoney(finalPrice)}</Text>
                <View className={styles.finalBtn} onClick={(e) => { e.stopPropagation(); setFinalPrice(finalPrice + 1); }}><Text>+</Text></View>
              </View>
            </View>
            <View className={styles.photoSection}>
              <Text className={styles.photoLabel}>拍照留证（至少1张）{photos.length > 0 && ` (${photos.length}/3)`}</Text>
              <View className={styles.photoList}>
                {photos.map((p, idx) => (
                  <View className={styles.photoItemWrapper} key={idx} onClick={(e) => e.stopPropagation()}>
                    <Image className={styles.photoView} src={p} mode="aspectFill" />
                    <View className={styles.photoRemove} onClick={(e) => { e.stopPropagation(); handleRemovePhoto(idx); }}><Text>×</Text></View>
                  </View>
                ))}
                {photos.length < 3 && (
                  <View className={styles.photoAdd} onClick={(e) => { e.stopPropagation(); handleAddPhoto(); }}><Text>+</Text></View>
                )}
              </View>
            </View>
            <View className={styles.rejectSection}>
              <Text className={styles.rejectLabel}>驳回原因（驳回时必填）</Text>
              <Textarea className={styles.rejectInput} placeholder="如书籍损坏、版本不符等" value={rejectReason} onInput={(e) => setRejectReason(e.detail.value)} onClick={(e) => e.stopPropagation()} />
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>回收员工作台</Text>
        <Text className={styles.subtitle}>核验实物、调整价格、完成回收</Text>
        <View className={styles.statsRow}>
          <View className={styles.statItem}><Text className={styles.statValue}>{stats.today}</Text><Text className={styles.statLabel}>待处理</Text></View>
          <View className={styles.statItem}><Text className={styles.statValue}>{stats.done}</Text><Text className={styles.statLabel}>已完成</Text></View>
          <View className={styles.statItem}><Text className={styles.statValue}>¥{formatMoney(stats.earnings)}</Text><Text className={styles.statLabel}>回收金额</Text></View>
        </View>
      </View>
      <View className={styles.tabs}>
        <View className={classnames(styles.tabItem, activeTab === 'todo' && styles.active)} onClick={() => { setActiveTab('todo'); setSelectedOrderId(''); }}>
          <Text>待处理（{pendingOrders.length}）</Text>
        </View>
        <View className={classnames(styles.tabItem, activeTab === 'route' && styles.active)} onClick={() => { setActiveTab('route'); setSelectedOrderId(''); }}>
          <Text>🗺 路线</Text>
        </View>
        <View className={classnames(styles.tabItem, activeTab === 'done' && styles.active)} onClick={() => { setActiveTab('done'); setSelectedOrderId(''); }}>
          <Text>已处理（{doneOrders.length}）</Text>
        </View>
      </View>

      {activeTab === 'todo' && (
        pendingOrders.length === 0
          ? <EmptyState title="暂无订单" description="暂无待处理订单" />
          : pendingOrders.map((order) => renderOrderCard(order))
      )}

      {activeTab === 'route' && (
        pendingOrders.length === 0 ? (
          <EmptyState title="今日路线已清空" description="所有订单已处理完毕 🎉" />
        ) : (
          <View>
            <View className={styles.routeSummary}>
              <Text className={styles.routeSummaryTitle}>📋 今日路线规划</Text>
              <Text className={styles.routeSubtitle}>建议顺序：宿舍区 → 教学楼 → 图书馆</Text>
              <View className={styles.routeStats}>
                <View className={styles.routeStatItem}>
                  <Text className={styles.routeStatValue}>{routeStats.orderCount}</Text>
                  <Text className={styles.routeStatLabel}>待处理单</Text>
                </View>
                <View className={styles.routeStatItem}>
                  <Text className={styles.routeStatValue}>{routeStats.totalBooks}</Text>
                  <Text className={styles.routeStatLabel}>总本数</Text>
                </View>
                <View className={styles.routeStatItem}>
                  <Text className={styles.routeStatValue}>¥{formatMoney(routeStats.totalAmount)}</Text>
                  <Text className={styles.routeStatLabel}>预估金额</Text>
                </View>
              </View>
            </View>
            {allRouteOrders.map((order, idx) => renderOrderCard(order, idx))}
          </View>
        )
      )}

      {activeTab === 'done' && (
        doneOrders.length === 0
          ? <EmptyState title="暂无订单" description="暂无已处理订单" />
          : doneOrders.map((order) => renderOrderCard(order))
      )}

      {activeTab === 'todo' && selectedOrder && (
        <View className={styles.bottomBar}>
          <View className={`${styles.actionBtn} ${styles.rejectBtn}`} onClick={handleReject}><Text>驳回订单</Text></View>
          <View className={`${styles.actionBtn} ${styles.confirmBtn}`} onClick={handleConfirm}><Text>确认回收</Text></View>
        </View>
      )}
    </View>
  );
};

export default CollectorPage;
