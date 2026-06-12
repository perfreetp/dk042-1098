import React, { useState, useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { BookCondition, BatchItem, Order } from '@/types';
import { textbookList, conditionList } from '@/data/textbooks';
import { calculatePrice, getConditionLabel, formatMoney, generateOrderNo } from '@/utils';
import { useAppStore } from '@/store/useAppStore';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

const BatchPage: React.FC = () => {
  const [selectedTextbookId, setSelectedTextbookId] = useState<string>('');
  const [condition, setCondition] = useState<BookCondition>('good');
  const [quantity, setQuantity] = useState<number>(1);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  const { batchItems, addBatchItem, removeBatchItem, clearBatchItems, addOrder } = useAppStore();

  const currentPrice = useMemo(() => {
    const book = textbookList.find((t) => t.id === selectedTextbookId);
    if (!book) return 0;
    return calculatePrice(book.basePrice, condition, false, quantity);
  }, [selectedTextbookId, condition, quantity]);

  const totalQuantity = useMemo(() => {
    return batchItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [batchItems]);

  const subtotal = useMemo(() => {
    return batchItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  }, [batchItems]);

  const bonusRate = useMemo(() => {
    if (totalQuantity >= 100) return 0.15;
    if (totalQuantity >= 50) return 0.1;
    if (totalQuantity >= 20) return 0.05;
    return 0;
  }, [totalQuantity]);

  const totalPrice = useMemo(() => {
    return Number((subtotal * (1 + bonusRate)).toFixed(2));
  }, [subtotal, bonusRate]);

  const handleAddItem = () => {
    if (!selectedTextbookId) {
      Taro.showToast({ title: '请选择教材', icon: 'none' });
      return;
    }
    const book = textbookList.find((t) => t.id === selectedTextbookId);
    if (!book) return;

    const estimatedPrice = calculatePrice(book.basePrice, condition, false, quantity);
    const item: BatchItem = {
      textbook: book,
      condition,
      quantity,
      estimatedPrice
    };

    addBatchItem(item);
    console.log('[Batch] 添加批量教材:', book.name, '数量:', quantity);
    Taro.showToast({ title: '已添加', icon: 'success' });

    setSelectedTextbookId('');
    setCondition('good');
    setQuantity(1);
  };

  const handleClear = () => {
    Taro.showModal({
      title: '确认清空',
      content: '确定要清空所有已添加的教材吗？',
      success: (res) => {
        if (res.confirm) {
          clearBatchItems();
        }
      }
    });
  };

  const handleSubmit = () => {
    if (batchItems.length === 0) {
      Taro.showToast({ title: '请先添加教材', icon: 'none' });
      return;
    }

    const order: Order = {
      id: 'o' + Date.now(),
      orderNo: generateOrderNo(),
      status: 'pending',
      items: batchItems.map((b) => ({
        ...b,
        isSet: false
      })),
      totalQuantity,
      estimatedPrice: totalPrice,
      pickupType: 'spot',
      spotName: '班级统一回收',
      contactName: '班级负责人',
      contactPhone: '138****0000',
      createdAt: new Date().toLocaleString()
    };

    addOrder(order);
    setLastOrder(order);
    clearBatchItems();
    setShowSuccess(true);
    console.log('[Batch] 创建批量订单:', order.orderNo, '总数量:', totalQuantity, '总金额:', totalPrice);
  };

  const handleViewRecords = () => {
    setShowSuccess(false);
    Taro.switchTab({ url: '/pages/records/index' });
  };

  const selectedBook = textbookList.find((t) => t.id === selectedTextbookId);

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>班级批量回收</Text>
        <Text className={styles.subtitle}>班级负责人集中回收，享受额外补贴</Text>
        <View className={styles.benefitTags}>
          <Text className={styles.benefitTag}>满20本 +5%</Text>
          <Text className={styles.benefitTag}>满50本 +10%</Text>
          <Text className={styles.benefitTag}>满100本 +15%</Text>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{totalQuantity}</Text>
          <Text className={styles.statLabel}>已添加（本）</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>¥{formatMoney(subtotal)}</Text>
          <Text className={styles.statLabel}>小计金额</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>+{(bonusRate * 100).toFixed(0)}%</Text>
          <Text className={styles.statLabel}>批量补贴</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>添加教材</Text>
      <View className={styles.addSection}>
        <View className={styles.formRow}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>选择教材</Text>
            <View className={styles.formSelect} onClick={() => setShowBookPicker(true)}>
              {selectedBook ? (
                <Text>{selectedBook.name}</Text>
              ) : (
                <Text className={styles.placeholder}>点击选择教材</Text>
              )}
              <Text>›</Text>
            </View>
          </View>
        </View>

        <View className={styles.formRow}>
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>成色</Text>
            <View className={styles.conditionOptions}>
              {conditionList.map((c) => (
                <View
                  key={c.value}
                  className={classnames(styles.conditionOption, condition === c.value && styles.active)}
                  onClick={() => setCondition(c.value as BookCondition)}
                >
                  <Text className={styles.conditionLabel}>{c.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.quantityRow}>
          <Text className={styles.quantityLabel}>数量</Text>
          <View className={styles.quantityControl}>
            <View
              className={styles.quantityBtn}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Text>-</Text>
            </View>
            <Text className={styles.quantityValue}>{quantity}</Text>
            <View
              className={styles.quantityBtn}
              onClick={() => setQuantity(quantity + 1)}
            >
              <Text>+</Text>
            </View>
          </View>
        </View>

        <View className={styles.pricePreview}>
          <Text className={styles.priceLabel}>预估回收价</Text>
          <Text className={styles.priceValue}>¥{formatMoney(currentPrice)}</Text>
        </View>

        <View className={styles.addBtn} onClick={handleAddItem}>
          <Text>添加到清单</Text>
        </View>
      </View>

      {batchItems.length > 0 && (
        <View className={styles.bookList}>
          <View className={styles.listCard}>
            <View className={styles.listHeader}>
              <Text className={styles.listTitle}>回收清单（{batchItems.length}种）</Text>
              <Text className={styles.clearBtn} onClick={handleClear}>清空</Text>
            </View>
            {batchItems.map((item, idx) => (
              <View className={styles.listItem} key={idx}>
                <View className={styles.itemInfo}>
                  <Text className={styles.itemName}>{item.textbook.name}</Text>
                  <View className={styles.itemMeta}>
                    <Text className={styles.metaTag}>{getConditionLabel(item.condition)}</Text>
                    <Text className={styles.metaTag}>x{item.quantity}</Text>
                  </View>
                </View>
                <View className={styles.itemRight}>
                  <Text className={styles.itemPrice}>¥{formatMoney(item.estimatedPrice)}</Text>
                  <Text className={styles.removeBtn} onClick={() => removeBatchItem(idx)}>删除</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {batchItems.length === 0 && (
        <EmptyState title="暂无回收清单" description="请先添加需要回收的教材" />
      )}

      <View className={styles.bottomBar}>
        <View className={styles.totalInfo}>
          <Text className={styles.totalLabel}>
            共{totalQuantity}本，预估
            {bonusRate > 0 && <Text className={styles.bonusTag}>含补贴</Text>}
          </Text>
          <Text className={styles.totalPrice}>¥{formatMoney(totalPrice)}</Text>
        </View>
        <View
          className={classnames(styles.submitBtn, batchItems.length === 0 && styles.disabled)}
          onClick={handleSubmit}
        >
          <Text>提交回收</Text>
        </View>
      </View>

      {showBookPicker && (
        <View className={styles.modalMask} onClick={() => setShowBookPicker(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>选择教材</Text>
            {textbookList.map((book) => (
              <Text
                key={book.id}
                className={classnames(styles.optionItem, selectedTextbookId === book.id && styles.active)}
                onClick={() => {
                  setSelectedTextbookId(book.id);
                  setShowBookPicker(false);
                }}
              >
                {book.name}
              </Text>
            ))}
          </View>
        </View>
      )}

      {showSuccess && (
        <View className={styles.modalMask} onClick={() => setShowSuccess(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.successModal}>
              <View className={styles.successIcon}>✓</View>
              <Text className={styles.successTitle}>提交成功</Text>
              <Text className={styles.successDesc}>回收清单已提交，请等待回收员联系</Text>
              {lastOrder && (
                <View className={styles.successInfo}>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>订单编号</Text>
                    <Text className={styles.infoValue}>{lastOrder.orderNo}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>回收数量</Text>
                    <Text className={styles.infoValue}>{lastOrder.totalQuantity}本</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>预估金额</Text>
                    <Text className={styles.infoValue}>¥{formatMoney(lastOrder.estimatedPrice)}</Text>
                  </View>
                  <View className={styles.infoRow}>
                    <Text className={styles.infoLabel}>批量补贴</Text>
                    <Text className={styles.infoValue}>+{(bonusRate * 100).toFixed(0)}%</Text>
                  </View>
                </View>
              )}
              <View className={styles.addBtn} onClick={handleViewRecords}>
                <Text>查看订单记录</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BatchPage;
