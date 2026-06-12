import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input, Textarea } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { BookCondition, EvaluateItem, PickupType, Order } from '@/types';
import { textbookList, courseList, conditionList } from '@/data/textbooks';
import { calculatePrice, getConditionLabel, formatMoney, generateOrderNo } from '@/utils';
import { useAppStore } from '@/store/useAppStore';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

interface BookFormState {
  condition: BookCondition;
  isSet: boolean;
  quantity: number;
}

const EvaluatePage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [bookForms, setBookForms] = useState<Record<string, BookFormState>>({});
  const [showModal, setShowModal] = useState(false);
  const [pickupType, setPickupType] = useState<PickupType>('door');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [spotName, setSpotName] = useState('');
  const [remark, setRemark] = useState('');

  const { evaluateItems, addEvaluateItem, removeEvaluateItem, addOrder } = useAppStore();

  const filteredTextbooks = useMemo(() => {
    if (selectedCourse === 'all') return textbookList;
    return textbookList.filter((t) => t.courseId === selectedCourse);
  }, [selectedCourse]);

  const totalPrice = useMemo(() => {
    return evaluateItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  }, [evaluateItems]);

  const totalQuantity = useMemo(() => {
    return evaluateItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [evaluateItems]);

  const getBookForm = (bookId: string): BookFormState => {
    return (
      bookForms[bookId] || {
        condition: 'good',
        isSet: false,
        quantity: 1
      }
    );
  };

  const updateBookForm = (bookId: string, patch: Partial<BookFormState>) => {
    setBookForms((prev) => ({
      ...prev,
      [bookId]: { ...getBookForm(bookId), ...patch }
    }));
  };

  const getBookEstimate = (bookId: string): number => {
    const book = textbookList.find((t) => t.id === bookId);
    if (!book) return 0;
    const form = getBookForm(bookId);
    return calculatePrice(book.basePrice, form.condition, form.isSet, form.quantity);
  };

  const handleAddBook = (bookId: string) => {
    const book = textbookList.find((t) => t.id === bookId);
    if (!book) return;
    const form = getBookForm(bookId);
    const estimatedPrice = calculatePrice(book.basePrice, form.condition, form.isSet, form.quantity);

    const item: EvaluateItem = {
      textbook: book,
      condition: form.condition,
      isSet: form.isSet,
      quantity: form.quantity,
      estimatedPrice
    };

    addEvaluateItem(item);
    Taro.showToast({ title: '已添加', icon: 'success' });
    console.log('[Evaluate] 添加教材:', book.name, '预估价格:', estimatedPrice);
  };

  const handleRemoveItem = (index: number) => {
    removeEvaluateItem(index);
  };

  const handleSubmit = () => {
    if (evaluateItems.length === 0) {
      Taro.showToast({ title: '请先添加教材', icon: 'none' });
      return;
    }
    setShowModal(true);
  };

  const handleConfirmOrder = () => {
    if (!contactName.trim()) {
      Taro.showToast({ title: '请输入联系人姓名', icon: 'none' });
      return;
    }
    if (!contactPhone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (pickupType === 'door' && !address.trim()) {
      Taro.showToast({ title: '请输入上门地址', icon: 'none' });
      return;
    }
    if (pickupType === 'spot' && !spotName.trim()) {
      Taro.showToast({ title: '请选择回收点', icon: 'none' });
      return;
    }

    const order: Order = {
      id: 'o' + Date.now(),
      orderNo: generateOrderNo(),
      status: 'pending',
      items: evaluateItems,
      totalQuantity,
      estimatedPrice: Number(totalPrice.toFixed(2)),
      pickupType,
      address: pickupType === 'door' ? address : undefined,
      spotName: pickupType === 'spot' ? spotName : undefined,
      contactName,
      contactPhone,
      remark: remark || undefined,
      createdAt: new Date().toLocaleString()
    };

    addOrder(order);
    setShowModal(false);
    console.log('[Evaluate] 创建订单:', order.orderNo, '预估金额:', totalPrice);
    Taro.showToast({ title: '预约成功', icon: 'success' });

    setTimeout(() => {
      Taro.switchTab({ url: '/pages/records/index' });
    }, 1500);
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>教材估价回收</Text>
        <Text className={styles.subtitle}>选择教材、成色和数量，立即查看参考回收价</Text>
      </View>

      <View className={styles.courseFilter}>
        <Text className={styles.sectionTitle}>选择课程</Text>
        <ScrollView scrollX className={styles.courseScroll}>
          {courseList.map((course) => (
            <Text
              key={course.id}
              className={classnames(styles.courseItem, selectedCourse === course.id && styles.active)}
              onClick={() => setSelectedCourse(course.id)}
            >
              {course.name}
            </Text>
          ))}
        </ScrollView>
      </View>

      {evaluateItems.length > 0 && (
        <View className={styles.selectedSection}>
          <Text className={styles.sectionTitle}>已选教材（{evaluateItems.length}种）</Text>
          <View className={styles.selectedList}>
            {evaluateItems.map((item, idx) => (
              <View className={styles.selectedItem} key={idx}>
                <View className={styles.selectedInfo}>
                  <Text className={styles.selectedName}>{item.textbook.name}</Text>
                  <View className={styles.selectedMeta}>
                    <Text className={styles.metaTag}>{getConditionLabel(item.condition)}</Text>
                    {item.isSet && <Text className={styles.metaTag}>成套</Text>}
                    <Text className={styles.metaTag}>x{item.quantity}</Text>
                  </View>
                </View>
                <View className={styles.selectedRight}>
                  <Text className={styles.selectedPrice}>¥{formatMoney(item.estimatedPrice)}</Text>
                  <Text className={styles.removeBtn} onClick={() => handleRemoveItem(idx)}>
                    删除
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.bookList}>
        <Text className={styles.sectionTitle}>选择教材</Text>
        {filteredTextbooks.length === 0 ? (
          <EmptyState title="暂无教材" description="该课程下暂无回收的教材" />
        ) : (
          filteredTextbooks.map((book) => {
            const form = getBookForm(book.id);
            const estimate = getBookEstimate(book.id);
            return (
              <View className={styles.bookCard} key={book.id}>
                <View className={styles.bookHeader}>
                  <View className={styles.bookInfo}>
                    <Text className={styles.bookName}>{book.name}</Text>
                    <Text className={styles.bookEdition}>{book.edition} · {book.publisher}</Text>
                    <Text className={styles.bookCourse}>{book.course}</Text>
                  </View>
                  <View>
                    <Text className={styles.basePriceLabel}>基准价</Text>
                    <Text className={styles.basePrice}>¥{book.basePrice}</Text>
                  </View>
                </View>

                <View className={styles.conditionSection}>
                  <Text className={styles.sectionLabel}>选择成色</Text>
                  <View className={styles.conditionOptions}>
                    {conditionList.map((c) => (
                      <View
                        key={c.value}
                        className={classnames(styles.conditionOption, form.condition === c.value && styles.active)}
                        onClick={() => updateBookForm(book.id, { condition: c.value as BookCondition })}
                      >
                        <Text className={styles.conditionLabel}>{c.label}</Text>
                        <Text className={styles.conditionDesc}>{c.desc}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className={styles.setSection}>
                  <View>
                    <Text className={styles.setLabel}>是否成套</Text>
                    <Text className={styles.setTip}>成套教材可享受10%价格加成</Text>
                  </View>
                  <View
                    className={classnames(styles.switch, form.isSet && styles.active)}
                    onClick={() => updateBookForm(book.id, { isSet: !form.isSet })}
                  >
                    <View className={styles.switchDot} />
                  </View>
                </View>

                <View className={styles.quantitySection}>
                  <Text className={styles.quantityLabel}>数量</Text>
                  <View className={styles.quantityControl}>
                    <View
                      className={styles.quantityBtn}
                      onClick={() => updateBookForm(book.id, { quantity: Math.max(1, form.quantity - 1) })}
                    >
                      <Text>-</Text>
                    </View>
                    <Text className={styles.quantityValue}>{form.quantity}</Text>
                    <View
                      className={styles.quantityBtn}
                      onClick={() => updateBookForm(book.id, { quantity: form.quantity + 1 })}
                    >
                      <Text>+</Text>
                    </View>
                  </View>
                </View>

                <View className={styles.estPriceRow}>
                  <Text className={styles.estPriceLabel}>预估回收价</Text>
                  <Text className={styles.estPriceValue}>¥{formatMoney(estimate)}</Text>
                </View>

                <View className={styles.addBtn} onClick={() => handleAddBook(book.id)}>
                  <Text>添加到清单</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.totalInfo}>
          <Text className={styles.totalLabel}>共{totalQuantity}本，预估</Text>
          <Text className={styles.totalPrice}>¥{formatMoney(totalPrice)}</Text>
        </View>
        <View
          className={classnames(styles.submitBtn, evaluateItems.length === 0 && styles.disabled)}
          onClick={handleSubmit}
        >
          <Text>预约回收</Text>
        </View>
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>填写回收信息</Text>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>回收方式</Text>
              <View className={styles.typeOptions}>
                <View
                  className={classnames(styles.typeOption, pickupType === 'door' && styles.active)}
                  onClick={() => setPickupType('door')}
                >
                  <Text className={styles.typeIcon}>🏠</Text>
                  <Text className={styles.typeText}>上门回收</Text>
                </View>
                <View
                  className={classnames(styles.typeOption, pickupType === 'spot' && styles.active)}
                  onClick={() => setPickupType('spot')}
                >
                  <Text className={styles.typeIcon}>📍</Text>
                  <Text className={styles.typeText}>定点交书</Text>
                </View>
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>联系人姓名</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入姓名"
                value={contactName}
                onInput={(e) => setContactName(e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>联系电话</Text>
              <Input
                className={styles.formInput}
                type="number"
                placeholder="请输入手机号"
                value={contactPhone}
                onInput={(e) => setContactPhone(e.detail.value)}
              />
            </View>

            {pickupType === 'door' && (
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>上门地址</Text>
                <Input
                  className={styles.formInput}
                  placeholder="例如：东区12号楼302室"
                  value={address}
                  onInput={(e) => setAddress(e.detail.value)}
                />
              </View>
            )}

            {pickupType === 'spot' && (
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>回收地点</Text>
                <Input
                  className={styles.formInput}
                  placeholder="例如：图书馆门口回收点"
                  value={spotName}
                  onInput={(e) => setSpotName(e.detail.value)}
                />
              </View>
            )}

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注（选填）</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="如有特殊需求请备注"
                value={remark}
                onInput={(e) => setRemark(e.detail.value)}
              />
            </View>

            <View className={styles.modalFooter}>
              <View className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                <Text>取消</Text>
              </View>
              <View className={styles.confirmBtn} onClick={handleConfirmOrder}>
                <Text>确认预约</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default EvaluatePage;
