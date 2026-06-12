import React, { useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney } from '@/utils';
import { WithdrawRecord } from '@/types';
import styles from './index.module.scss';

type AccountType = 'wechat' | 'alipay' | 'bank';

const WithdrawPage: React.FC = () => {
  const { user, withdrawRecords, updateUserBalance, addWithdrawRecord, addWalletEntry, failWithdrawRecord } = useAppStore();
  const [amount, setAmount] = useState<string>('');
  const [accountType, setAccountType] = useState<AccountType>('wechat');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amountNum = Number(amount) || 0;
  const availableBalance = user.balance;

  const validateForm = (): { valid: boolean; message?: string } => {
    if (!amount.trim()) {
      return { valid: false, message: '请输入提现金额' };
    }
    if (amountNum <= 0) {
      return { valid: false, message: '提现金额必须大于0' };
    }
    if (amountNum > availableBalance) {
      return { valid: false, message: '提现金额超出可提现余额' };
    }
    if (!accountNo.trim()) {
      return { valid: false, message: '请填写收款账号' };
    }
    if (!accountName.trim()) {
      return { valid: false, message: '请填写真实姓名' };
    }
    if (accountType === 'bank' && accountNo.length < 16) {
      return { valid: false, message: '请输入正确的银行卡号' };
    }
    if (accountName.trim().length < 2) {
      return { valid: false, message: '请输入正确的姓名' };
    }
    return { valid: true };
  };

  const canSubmit = amountNum > 0 && amountNum <= availableBalance && accountNo.trim() && accountName.trim() && !isSubmitting;

  const handleQuickAmount = (val: string) => {
    if (isSubmitting) return;
    if (val === 'all') {
      setAmount(String(availableBalance));
    } else {
      const numVal = Number(val);
      if (numVal <= availableBalance) {
        setAmount(val);
      } else {
        Taro.showToast({ title: '余额不足', icon: 'none' });
      }
    }
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    const validation = validateForm();
    if (!validation.valid) {
      Taro.showToast({ title: validation.message, icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认提现',
      content: `确认提现 ¥${formatMoney(amountNum)} 到${accountType === 'wechat' ? '微信' : accountType === 'alipay' ? '支付宝' : '银行卡'}？\n提交后金额将被冻结，1-3个工作日内到账。`,
      success: (res) => {
        if (res.confirm) {
          setIsSubmitting(true);

          updateUserBalance(amountNum, 'freeze');

          const newRecord: WithdrawRecord = {
            id: 'w' + Date.now(),
            amount: amountNum,
            status: 'pending',
            createdAt: new Date().toLocaleString(),
            account: accountType === 'wechat' ? '微信钱包' : accountType === 'alipay' ? '支付宝' : '银行卡',
            accountType
          };

          addWithdrawRecord(newRecord);

          addWalletEntry({
            id: 'we' + Date.now(),
            type: 'withdraw_freeze',
            amount: -amountNum,
            title: '提现冻结',
            time: new Date().toLocaleString(),
            relatedId: newRecord.id,
            relatedType: 'withdraw',
            detail: `提现至${newRecord.account}`
          });

          Taro.showToast({ title: '申请已提交', icon: 'success' });

          setTimeout(() => {
            setIsSubmitting(false);
            setAmount('');
            setAccountNo('');
            setAccountName('');
          }, 1500);
        }
      }
    });
  };

  const handleSimulateFail = (recordId: string) => {
    Taro.showModal({
      title: '模拟提现失败',
      content: '确定将此提现标记为失败？冻结金额将退回可提现余额。',
      success: (res) => {
        if (res.confirm) {
          failWithdrawRecord(recordId, '账户信息不符，请核实后重新申请');
          Taro.showToast({ title: '已退回余额', icon: 'success' });
        }
      }
    });
  };

  const handleSimulateSuccess = (recordId: string) => {
    const store = useAppStore.getState();
    const record = store.withdrawRecords.find(r => r.id === recordId);
    if (!record || record.status !== 'pending') return;

    useAppStore.setState((state) => ({
      withdrawRecords: state.withdrawRecords.map(r =>
        r.id === recordId ? { ...r, status: 'success' as const } : r
      ),
      user: {
        ...state.user,
        frozenBalance: Number(((state.user.frozenBalance || 0) - record.amount).toFixed(2))
      }
    }));

    addWalletEntry({
      id: 'we' + Date.now(),
      type: 'withdraw_success',
      amount: record.amount,
      title: '提现成功',
      time: new Date().toLocaleString(),
      relatedId: recordId,
      relatedType: 'withdraw',
      detail: `${record.account}到账`
    });

    Taro.showToast({ title: '提现成功', icon: 'success' });
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
        <Text className={styles.balanceValue}>¥{formatMoney(availableBalance)}</Text>
        {user.frozenBalance && user.frozenBalance > 0 && (
          <Text className={styles.balanceTip}>
            冻结中：¥{formatMoney(user.frozenBalance)}（提现处理中）
          </Text>
        )}
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
              disabled={isSubmitting}
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
                onClick={() => !isSubmitting && setAccountType(opt.type)}
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
            disabled={isSubmitting}
          />
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>真实姓名</Text>
          <Input
            className={styles.formInput}
            placeholder="请输入真实姓名（需与账户一致）"
            value={accountName}
            onInput={(e) => setAccountName(e.detail.value)}
            disabled={isSubmitting}
          />
        </View>
      </View>

      <View
        className={classnames(styles.submitBtn, !canSubmit && styles.disabled)}
        onClick={handleSubmit}
      >
        <Text>{isSubmitting ? '提交中...' : '确认提现'}</Text>
      </View>

      <View className={styles.recordsSection}>
        <Text className={styles.recordsTitle}>提现记录</Text>
        {withdrawRecords.length === 0 ? (
          <View style={{ padding: '60rpx 0', textAlign: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: '26rpx' }}>暂无提现记录</Text>
          </View>
        ) : (
          withdrawRecords.map((record) => (
            <View className={styles.recordCard} key={record.id}>
              <View className={styles.recordLeft}>
                <Text className={styles.recordAmount}>-¥{formatMoney(record.amount)}</Text>
                <Text className={styles.recordMeta}>
                  {record.account} · {record.createdAt}
                </Text>
                {record.failReason && (
                  <Text className={styles.recordFailReason}>失败原因：{record.failReason}</Text>
                )}
              </View>
              <View className={styles.recordRight}>
                <Text
                  className={classnames(
                    styles.recordStatus,
                    record.status === 'success' && styles.success,
                    record.status === 'pending' && styles.pending,
                    record.status === 'failed' && styles.failed
                  )}
                >
                  {record.status === 'success' ? '已到账' : record.status === 'pending' ? '处理中' : '已失败'}
                </Text>
                {record.status === 'pending' && (
                  <View className={styles.recordActions}>
                    <Text className={styles.simulateBtn} onClick={() => handleSimulateSuccess(record.id)}>模拟成功</Text>
                    <Text className={classnames(styles.simulateBtn, styles.failBtn)} onClick={() => handleSimulateFail(record.id)}>模拟失败</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

export default WithdrawPage;
