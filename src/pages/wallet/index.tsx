import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney } from '@/utils';
import { WalletEntry } from '@/types';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const entryIconMap: Record<WalletEntry['type'], string> = {
  recycle_income: '💰',
  withdraw_freeze: '❄️',
  withdraw_success: '✅',
  withdraw_failed: '↩️'
};

const entryColorMap: Record<WalletEntry['type'], string> = {
  recycle_income: '#22c55e',
  withdraw_freeze: '#f59e0b',
  withdraw_success: '#3b82f6',
  withdraw_failed: '#ef4444'
};

const entryAmountPrefix: Record<WalletEntry['type'], string> = {
  recycle_income: '+',
  withdraw_freeze: '-',
  withdraw_success: '',
  withdraw_failed: '+'
};

const WalletPage: React.FC = () => {
  const { walletEntries, user } = useAppStore();

  const handleEntryClick = (entry: WalletEntry) => {
    if (entry.relatedType === 'order' && entry.relatedId) {
      Taro.navigateTo({ url: `/pages/order-detail/index?id=${entry.relatedId}` });
    } else if (entry.relatedType === 'withdraw' && entry.relatedId) {
      Taro.navigateTo({ url: `/pages/withdraw/index` });
    }
  };

  if (walletEntries.length === 0) {
    return (
      <View className={styles.page}>
        <View className={styles.header}>
          <Text className={styles.headerTitle}>钱包明细</Text>
          <View className={styles.balanceRow}>
            <View className={styles.balanceItem}>
              <Text className={styles.balanceLabel}>可提现余额</Text>
              <Text className={styles.balanceValue}>¥{formatMoney(user.balance)}</Text>
            </View>
            <View className={styles.balanceItem}>
              <Text className={styles.balanceLabel}>冻结中</Text>
              <Text className={styles.balanceValue}>¥{formatMoney(user.frozenBalance || 0)}</Text>
            </View>
          </View>
        </View>
        <EmptyState title="暂无明细" description="回收或提现后这里会有记录" />
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>钱包明细</Text>
        <View className={styles.balanceRow}>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>可提现余额</Text>
            <Text className={styles.balanceValue}>¥{formatMoney(user.balance)}</Text>
          </View>
          <View className={styles.balanceItem}>
            <Text className={styles.balanceLabel}>冻结中</Text>
            <Text className={styles.balanceValue}>¥{formatMoney(user.frozenBalance || 0)}</Text>
          </View>
        </View>
      </View>

      {walletEntries.map((entry) => (
        <View
          key={entry.id}
          className={styles.entryCard}
          onClick={() => handleEntryClick(entry)}
        >
          <View className={styles.entryIcon} style={{ background: entryColorMap[entry.type] + '20' }}>
            <Text>{entryIconMap[entry.type]}</Text>
          </View>
          <View className={styles.entryInfo}>
            <View className={styles.entryTop}>
              <Text className={styles.entryTitle}>{entry.title}</Text>
              <Text className={styles.entryAmount} style={{ color: entryColorMap[entry.type] }}>
                {entryAmountPrefix[entry.type]}¥{formatMoney(Math.abs(entry.amount))}
              </Text>
            </View>
            <View className={styles.entryBottom}>
              <Text className={styles.entryDetail}>{entry.detail || ''}</Text>
              <Text className={styles.entryTime}>{entry.time}</Text>
            </View>
            {entry.relatedType && (
              <Text className={styles.entryLink}>
                {entry.relatedType === 'order' ? '查看订单 ›' : '查看提现 ›'}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

export default WalletPage;
