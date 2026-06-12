import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney } from '@/utils';
import { withdrawRecords } from '@/data/notices';
import styles from './index.module.scss';

type AccountType = 'wechat' | 'alipay' | 'bank';

const WithdrawPage: React.FC = () => {
  const { user } = useAppStore();
  const [amount, setAmount] = useState<string>('');
  const [accountType, setAccountType] = useState<AccountType>('wechat');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');

  const amountNum = Number(amount) || 0;
  const canSubmit = amountNum > 0 && amountNum <= user.balance && accountNo.trim() && accountName.trim();

  const handleQuickAmount = (val: string) => {
    if (val === 'all') {
      setAmount(String(user.balance));
    } else {
      setAmount(val);
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      if (amountNum <= 0) {
        Taro.showToast({ title: '请输入提现金额', icon: 'none' });
      } else if (amountNum > user.balance) {
        Taro.showToast({ title: '提现金额超出余额', icon: 'none' });
      } else {
        Taro.showToast({ title: '请完善账户信息', icon: 'none' });
      }
      return;
    }

    Taro.showModal({
      title: '确认提现',
      content: `确认提现 ¥${formatMoney(amountNum)} 到${accountType === 'wechat' ? '微信' : accountType === 'alipay' ? '支付宝' : '银行卡'}？`,
      success: (res) => {
        if (res.confirm) {
          console.log('[Withdraw] 申请提现:', amountNum, '账户类型:', accountType);
          Taro.showToast({ title: '申请已提交', icon: 'success' });
          setTimeout(() => {
            Taro.navigateBack();
          }, 1500);
        }
      }
    });
  };

  const accountOptions = [
    { type: 'wechat' as AccountType, icon: '💚', text: '微信' },
    { type: 'alipay' as AccountType, icon: '💙', text: '支付宝' },
    { type: 'bank' as AccountType, icon: '🏦', text: '银行卡' }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.balanceCard}>
        <Text className={styles.balanceLabel}>可提现余额</Text>
        <Text className={styles.balanceValue}>¥{formatMoney(user.balance)}</Text>
        <Text className={styles.balanceTip}>提现1-3个工作日内到账</Text>
      </View>

      <View className={styles.formCard}>
        <Text className={styles.formTitle}>提现信息</Text>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>提现金额</Text>
          <View className={styles.amountRow}>
            <Text className={styles.amountUnit}>¥</Text>
            <Input
              className={styles.amountInput}
              type="digit"
              placeholder="请输入金额"
              value={amount}
              onInput={(e) => setAmount(e.detail.value)}
            />
          </View>
          <View className={styles.quickAmounts}>
            <View className={styles.quickBtn} onClick={() => handleQuickAmount('50')}>
              <Text>¥50</Text>
            </View>
            <View className={styles.quickBtn} onClick={() => handleQuickAmount('100')}>
              <Text>¥100</Text>
            </View>
            <View className={styles.quickBtn} onClick={() => handleQuickAmount('200')}>
              <Text>¥200</Text>
            </View>
            <View
              className={classnames(styles.quickBtn, styles.allBtn)}
              onClick={() => handleQuickAmount('all')}
            >
              <Text>全部</Text>
            </View>
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>收款方式</Text>
          <View className={styles.accountTypes}>
            {accountOptions.map((opt) => (
              <View
                key={opt.type}
                className={classnames(styles.accountItem, accountType === opt.type && styles.active)}
                onClick={() => setAccountType(opt.type)}
              >
                <Text className={styles.accountIcon}>{opt.icon}</Text>
                <Text className={styles.accountText}>{opt.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>
            {accountType === 'bank' ? '银行卡号' : '账户账号'}
          </Text>
          <Input
            className={styles.formInput}
            placeholder={accountType === 'bank' ? '请输入银行卡号' : '请输入账号'}
            value={accountNo}
            onInput={(e) => setAccountNo(e.detail.value)}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>真实姓名</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入真实姓名"
            value={accountName}
            onInput={(e) => setAccountName(e.detail.value)}
          />
        </View>
      </View>

      <View
        className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
        onClick={handleSubmit}
      >
        <Text>确认提现</Text>
      </View>

      <View className={styles.recordsSection}>
        <Text className={styles.recordsTitle}>提现记录</Text>
        {withdrawRecords.map((record) => (
          <View className={styles.recordCard} key={record.id}>
            <View className={styles.recordLeft}>
              <Text className={styles.recordAmount}>-¥{formatMoney(record.amount)}</Text>
              <Text className={styles.recordMeta}>
                {record.account} · {record.createdAt}
              </Text>
            </View>
            <Text
              className={classnames(
                styles.recordStatus,
                record.status === 'success' && styles.success,
                record.status === 'pending' && styles.pending
              )}
            >
              {record.status === 'success' ? '已到账' : record.status === 'pending' ? '处理中' : '失败'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default WithdrawPage;
