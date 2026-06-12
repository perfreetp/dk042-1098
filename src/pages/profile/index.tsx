import React, { useMemo } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney } from '@/utils';
import { priceNoticeList } from '@/data/notices';
import { WalletEntry, WithdrawRecord, Order } from '@/types';
import styles from './index.module.scss';

const ProfilePage: React.FC = () => {
  const { user, orders, walletEntries, withdrawRecords } = useAppStore();

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const recycledOrders = orders.filter((o) => o.status === 'recycled');
    const totalBooks = recycledOrders.reduce((sum, o) => sum + o.totalQuantity, 0);
    const totalEarning = recycledOrders.reduce((sum, o) => sum + (o.finalPrice || o.estimatedPrice), 0);
    return { totalOrders, totalBooks, totalEarning };
  }, [orders]);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const isThisMonth = (dateStr: string) => {
      try {
        const d = new Date(dateStr.replace(/\//g, '-'));
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      } catch {
        return dateStr.includes(thisMonthPrefix);
      }
    };

    const recycledThisMonth: Order[] = orders.filter(o => o.status === 'recycled' && o.recycledAt && isThisMonth(o.recycledAt));
    const recycleIncome = recycledThisMonth.reduce((s, o) => s + (o.finalPrice || o.estimatedPrice), 0);

    const withdrawalsThisMonth: WithdrawRecord[] = withdrawRecords.filter(r => isThisMonth(r.createdAt));
    const pendingWithdrawals = withdrawalsThisMonth.filter(r => r.status === 'pending');
    const pendingAmount = pendingWithdrawals.reduce((s, r) => s + r.amount, 0);
    const succeededWithdrawals = withdrawalsThisMonth.filter(r => r.status === 'success');
    const succeededAmount = succeededWithdrawals.reduce((s, r) => s + r.amount, 0);

    const failedRefunds = withdrawalsThisMonth.filter(r => r.status === 'failed');
    const failedRefundAmount = failedRefunds.reduce((s, r) => s + r.amount, 0);

    return {
      recycleIncome, recycleCount: recycledThisMonth.length,
      pendingWithdrawals: pendingAmount, pendingCount: pendingWithdrawals.length,
      succeededWithdrawals: succeededAmount, succeededCount: succeededWithdrawals.length,
      failedRefunds: failedRefundAmount, failedCount: failedRefunds.length,
      recycledThisMonth, pendingWithdrawals, succeededWithdrawals, failedRefunds
    };
  }, [orders, withdrawRecords]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    return `${now.getMonth() + 1}月对账单`;
  }, []);

  const handleJumpRecycledList = () => {
    Taro.navigateTo({ url: '/pages/monthly-detail/index?tab=recycle' });
  };
  const handleJumpMonthlyDetail = (tab: 'pending' | 'success' | 'failed') => {
    Taro.navigateTo({ url: `/pages/monthly-detail/index?tab=${tab}` });
  };

  const menuGroups = [
    {
      title: '常用功能',
      items: [
        { icon: '💰', text: '账户余额', path: '/pages/withdraw/index', badge: 0 },
        { icon: '📈', text: '价格通知', path: '/pages/price-notice/index', badge: priceNoticeList.length },
        { icon: '📋', text: '回收员工作台', path: '/pages/collector/index', badge: 0 }
      ]
    },
    {
      title: '帮助中心',
      items: [
        { icon: '❓', text: '常见问题', path: '/pages/faq/index', badge: 0 },
        { icon: '📞', text: '联系客服', path: '', badge: 0 },
        { icon: '⚙️', text: '设置', path: '', badge: 0 }
      ]
    }
  ];

  const handleMenuClick = (path: string, text: string) => {
    if (path) {
      Taro.navigateTo({ url: path });
      console.log('[Profile] 点击菜单:', text, '跳转:', path);
    } else {
      Taro.showToast({ title: `${text}功能开发中`, icon: 'none' });
    }
  };

  const handleWithdraw = () => {
    Taro.navigateTo({ url: '/pages/withdraw/index' });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            {user.avatar ? (
              <Image className={styles.avatarImg} src={user.avatar} mode="aspectFill" />
            ) : (
              <Text style={{ fontSize: '60rpx', color: '#fff' }}>👤</Text>
            )}
          </View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>
              {user.name}
              <Text className={styles.roleTag}>
                {user.role === 'student' ? '学生' : user.role === 'monitor' ? '班级负责人' : '回收员'}
              </Text>
            </Text>
            <Text className={styles.userMeta}>
              {user.className} · {user.studentId}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.balanceCard}>
        <View className={styles.balanceRow}>
          <View className={styles.balanceInfo}>
            <Text className={styles.balanceLabel}>账户余额</Text>
            <Text className={styles.balanceValue}>¥{formatMoney(user.balance)}</Text>
            {user.frozenBalance && user.frozenBalance > 0 && (
              <View className={styles.frozenInfo}>
                <Text className={styles.frozenText}>冻结中：¥{formatMoney(user.frozenBalance)}</Text>
              </View>
            )}
            <View className={styles.earningRow}>
              <Text className={styles.earningLabel}>累计总收入</Text>
              <Text className={styles.earningValue}>¥{formatMoney(user.totalEarning || 0)}</Text>
            </View>
          </View>
          <View className={styles.balanceActions}>
            <View className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={handleWithdraw}>
              <Text>提现</Text>
            </View>
            <View className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={() => Taro.navigateTo({ url: '/pages/wallet/index' })}>
              <Text>明细</Text>
            </View>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.totalOrders}</Text>
            <Text className={styles.statLabel}>订单数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.totalBooks}</Text>
            <Text className={styles.statLabel}>回收书本</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>¥{formatMoney(stats.totalEarning)}</Text>
            <Text className={styles.statLabel}>已完成收入</Text>
          </View>
        </View>
      </View>

      <View className={styles.monthCard}>
        <View className={styles.monthHeader}>
          <Text className={styles.monthTitle}>{monthLabel}</Text>
          <View className={styles.monthActions}>
            <Text className={styles.monthAction} onClick={() => Taro.navigateTo({ url: '/pages/wallet/index' })}>查看明细 ›</Text>
          </View>
        </View>
        <View className={styles.monthGrid}>
          <View className={styles.monthItem} onClick={handleJumpRecycledList}>
            <View className={styles.monthItemHeader}>
              <Text className={styles.monthItemIcon}>💰</Text>
              <Text className={styles.monthItemCount}>{monthlyStats.recycleCount}单</Text>
            </View>
            <Text className={styles.monthItemAmount}>¥{formatMoney(monthlyStats.recycleIncome)}</Text>
            <Text className={styles.monthItemLabel}>本月回收到账</Text>
          </View>
          <View className={styles.monthItem} onClick={() => handleJumpMonthlyDetail('pending')}>
            <View className={styles.monthItemHeader}>
              <Text className={styles.monthItemIcon}>❄️</Text>
              <Text className={styles.monthItemCount}>{monthlyStats.pendingCount}笔</Text>
            </View>
            <Text className={styles.monthItemAmount}>¥{formatMoney(monthlyStats.pendingWithdrawals)}</Text>
            <Text className={styles.monthItemLabel}>提现中</Text>
          </View>
          <View className={styles.monthItem} onClick={() => handleJumpMonthlyDetail('success')}>
            <View className={styles.monthItemHeader}>
              <Text className={styles.monthItemIcon}>✅</Text>
              <Text className={styles.monthItemCount}>{monthlyStats.succeededCount}笔</Text>
            </View>
            <Text className={styles.monthItemAmount}>¥{formatMoney(monthlyStats.succeededWithdrawals)}</Text>
            <Text className={styles.monthItemLabel}>已提现</Text>
          </View>
          <View className={styles.monthItem} onClick={() => handleJumpMonthlyDetail('failed')}>
            <View className={styles.monthItemHeader}>
              <Text className={styles.monthItemIcon}>↩️</Text>
              <Text className={styles.monthItemCount}>{monthlyStats.failedCount}笔</Text>
            </View>
            <Text className={styles.monthItemAmount}>¥{formatMoney(monthlyStats.failedRefunds)}</Text>
            <Text className={styles.monthItemLabel}>失败退回</Text>
          </View>
        </View>
      </View>

      {menuGroups.map((group, gi) => (
        <View className={styles.section} key={gi}>
          <Text className={styles.sectionTitle}>{group.title}</Text>
          <View className={styles.menuCard}>
            {group.items.map((item, ii) => (
              <View
                className={styles.menuItem}
                key={ii}
                onClick={() => handleMenuClick(item.path, item.text)}
              >
                <View className={styles.menuIcon}>
                  <Text>{item.icon}</Text>
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuText}>
                    {item.text}
                    {item.badge > 0 && <Text className={styles.badge}>{item.badge}</Text>}
                  </Text>
                </View>
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

export default ProfilePage;
