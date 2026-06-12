import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, getConditionLabel, getStatusText } from '@/utils';
import { Order, WithdrawRecord } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type FilterType = 'recycle' | 'pending' | 'success' | 'failed';

const FILTER_LABELS: Record<FilterType, { title: string; icon: string; subtitle: string }> = {
  recycle: { title: '本月回收到账', icon: '💰', subtitle: '所有已回收订单' },
  pending: { title: '提现处理中', icon: '❄️', subtitle: '冻结中，待银行处理' },
  success: { title: '提现成功记录', icon: '✅', subtitle: '已到账的提现申请' },
  failed: { title: '提现失败退回', icon: '↩️', subtitle: '失败后已退回余额' }
};

const MonthlyDetailPage: React.FC = () => {
  const router = useRouter();
  const rawTab = (router.params.tab || 'recycle') as FilterType;
  const filter: FilterType = (['recycle', 'pending', 'success', 'failed'] as FilterType[]).includes(rawTab) ? rawTab : 'recycle';

  const { orders, withdrawRecords } = useAppStore();

  const monthInfo = useMemo(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      label: `${now.getMonth() + 1}月`
    };
  }, []);

  const isThisMonth = (dateStr: string) => {
    try {
      const d = new Date(dateStr.replace(/\//g, '-'));
      const now = new Date();
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    } catch {
      return dateStr.includes(`${monthInfo.year}-${String(monthInfo.month).padStart(2, '0')}`);
    }
  };

  const filtered = useMemo(() => {
    if (filter === 'recycle') {
      return orders.filter(o =>
        o.status === 'recycled' && o.recycledAt && isThisMonth(o.recycledAt)
      ).sort((a, b) => new Date(b.recycledAt || '').getTime() - new Date(a.recycledAt || '').getTime());
    }
    return withdrawRecords.filter(r => {
      if (!isThisMonth(r.createdAt)) return false;
      if (filter === 'pending') return r.status === 'pending';
      if (filter === 'success') return r.status === 'success';
      if (filter === 'failed') return r.status === 'failed';
      return false;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filter, orders, withdrawRecords]);

  const summary = useMemo(() => {
    if (filter === 'recycle') {
      const arr = filtered as Order[];
      return {
        count: arr.length,
        total: arr.reduce((s, o) => s + (o.finalPrice || o.estimatedPrice), 0),
        label: '订单合计'
      };
    }
    const arr = filtered as WithdrawRecord[];
    return {
      count: arr.length,
      total: arr.reduce((s, r) => s + r.amount, 0),
      label: '金额合计'
    };
  }, [filter, filtered]);

  const handleSwitchTab = (t: FilterType) => {
    Taro.redirectTo({ url: `/pages/monthly-detail/index?tab=${t}` });
  };

  const handleJumpOrder = (orderId: string) => {
    Taro.navigateTo({ url: `/pages/order-detail/index?id=${orderId}` });
  };
  const handleJumpWithdraw = (recordId: string) => {
    Taro.navigateTo({ url: `/pages/withdraw/index?wid=${recordId}` });
  };

  const tabs: { key: FilterType; label: string }[] = [
    { key: 'recycle', label: '回收到账' },
    { key: 'pending', label: '提现中' },
    { key: 'success', label: '已提现' },
    { key: 'failed', label: '失败退回' }
  ];

  const meta = FILTER_LABELS[filter];

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.pageTitle}>{meta.icon} {monthInfo.label} · {meta.title}</Text>
        <Text className={styles.pageSubtitle}>{meta.subtitle}</Text>
        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>{summary.count}</Text>
            <Text className={styles.summaryLabel}>笔数</Text>
          </View>
          <View className={styles.summaryItem}>
            <Text className={styles.summaryValue}>¥{formatMoney(summary.total)}</Text>
            <Text className={styles.summaryLabel}>{summary.label}</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        {tabs.map(t => (
          <View
            key={t.key}
            className={classnames(styles.tabItem, filter === t.key && styles.active)}
            onClick={() => handleSwitchTab(t.key)}
          >
            <Text>{t.label}</Text>
          </View>
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState title={`暂无${meta.title}记录`} description="产生流水后这里会自动列出" />
      ) : (
        <View>
          {filter === 'recycle' && (filtered as Order[]).map(order => (
            <View key={order.id} className={styles.orderCard} onClick={() => handleJumpOrder(order.id)}>
              <View className={styles.cardTop}>
                <View className={styles.cardTitleRow}>
                  <Text className={styles.orderNo}>{order.orderNo}</Text>
                  <Text className={classnames(styles.statusBadge, styles.statusRecycled)}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
                <Text className={styles.cardTime}>回收时间：{order.recycledAt}</Text>
              </View>
              <View className={styles.cardMeta}>
                <Text className={styles.metaItem}>
                  {order.pickupType === 'door' ? '🏠 上门' : '📍 定点'}
                </Text>
                <Text className={styles.metaItem}>📚 {order.totalQuantity}本</Text>
                {order.collectorName && <Text className={styles.metaItem}>🤝 {order.collectorName}</Text>}
              </View>
              <View className={styles.itemsPreview}>
                {order.items.slice(0, 2).map((item, idx) => (
                  <View className={styles.itemRow} key={idx}>
                    <Text className={styles.itemName}>{item.textbook.name}</Text>
                    <Text className={styles.itemInfo}>{getConditionLabel(item.condition)} x{item.quantity}</Text>
                  </View>
                ))}
                {order.items.length > 2 && (
                  <Text className={styles.moreHint}>还有{order.items.length - 2}种教材...</Text>
                )}
              </View>
              <View className={styles.cardBottom}>
                <View>
                  <Text className={styles.estimateLabel}>预估 ¥{formatMoney(order.estimatedPrice)}</Text>
                </View>
                <View className={styles.finalPrice}>
                  <Text className={styles.finalLabel}>实际结算</Text>
                  <Text className={styles.finalValue}>¥{formatMoney(order.finalPrice || order.estimatedPrice)}</Text>
                </View>
              </View>
              <Text className={styles.cardArrow}>查看详情 ›</Text>
            </View>
          ))}

          {filter !== 'recycle' && (filtered as WithdrawRecord[]).map(r => (
            <View key={r.id} className={styles.withdrawCard} onClick={() => handleJumpWithdraw(r.id)}>
              <View className={styles.cardTop}>
                <View className={styles.cardTitleRow}>
                  <Text className={styles.withdrawId}>提现单号 {r.id}</Text>
                  <Text
                    className={classnames(
                      styles.statusBadge,
                      filter === 'pending' && styles.statusPending,
                      filter === 'success' && styles.statusRecycled,
                      filter === 'failed' && styles.statusRejected
                    )}
                  >
                    {r.status === 'pending' ? '处理中' : r.status === 'success' ? '已到账' : '已失败'}
                  </Text>
                </View>
                <Text className={styles.cardTime}>申请时间：{r.createdAt}</Text>
              </View>
              <View className={styles.withdrawBody}>
                <View>
                  <Text className={styles.withdrawLabel}>提现金额</Text>
                  <Text className={styles.withdrawAmount}>-¥{formatMoney(r.amount)}</Text>
                </View>
                <View>
                  <Text className={styles.withdrawLabel}>收款方式</Text>
                  <Text className={styles.withdrawAccount}>{r.account}</Text>
                </View>
              </View>
              {r.failReason && (
                <View className={styles.failBox}>
                  <Text className={styles.failLabel}>失败原因</Text>
                  <Text className={styles.failText}>{r.failReason}</Text>
                </View>
              )}
              <Text className={styles.cardArrow}>查看提现详情 ›</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default MonthlyDetailPage;
