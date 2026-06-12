import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import classnames from 'classnames';
import { OrderStatus } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney } from '@/utils';
import OrderCard from '@/components/OrderCard';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const RecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const { orders } = useAppStore();

  const tabs: { key: OrderStatus; label: string }[] = [
    { key: 'pending', label: '待处理' },
    { key: 'recycled', label: '已回收' },
    { key: 'rejected', label: '已驳回' }
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => o.status === activeTab);
  }, [orders, activeTab]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length;
    const recycled = orders.filter((o) => o.status === 'recycled');
    const recycledTotal = recycled.reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice), 0);
    const rejected = orders.filter((o) => o.status === 'rejected').length;
    return { pending, recycled: recycled.length, recycledTotal, rejected };
  }, [orders]);

  const getTabCount = (status: OrderStatus): number => {
    return orders.filter((o) => o.status === status).length;
  };

  return (
    <View className={styles.page}>
      <View className={styles.tabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
            <Text className={styles.tabCount}>{getTabCount(tab.key)}</Text>
            {activeTab === tab.key && <View className={styles.tabIndicator} />}
          </View>
        ))}
      </View>

      <ScrollView scrollY className={styles.listContainer}>
        {activeTab === 'pending' && (
          <View className={styles.statsBar}>
            <Text className={styles.statsTitle}>回收概览</Text>
            <View className={styles.statsRow}>
              <View className={styles.statCol}>
                <Text className={styles.statNum}>{stats.pending}</Text>
                <Text className={styles.statLabel}>待处理</Text>
              </View>
              <View className={styles.statCol}>
                <Text className={styles.statNum}>{stats.recycled}</Text>
                <Text className={styles.statLabel}>已回收</Text>
              </View>
              <View className={styles.statCol}>
                <Text className={styles.statNum}>¥{formatMoney(stats.recycledTotal)}</Text>
                <Text className={styles.statLabel}>累计收入</Text>
              </View>
            </View>
          </View>
        )}

        {filteredOrders.length === 0 ? (
          <EmptyState
            title={activeTab === 'pending' ? '暂无待处理订单' : activeTab === 'recycled' ? '暂无已回收订单' : '暂无已驳回订单'}
            description={activeTab === 'pending' ? '快去估价页预约回收吧~' : '您的所有订单都在这里'}
          />
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default RecordsPage;
