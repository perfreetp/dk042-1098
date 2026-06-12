import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { BookCondition, BatchItem, Order } from '@/types';
import { textbookList, conditionList } from '@/data/textbooks';
import { calculatePrice, getConditionLabel, formatMoney, generateOrderNo } from '@/utils';
import { useAppStore } from '@/store/useAppStore';
import EmptyState from '@/components/EmptyState';
import styles from './index.module.scss';

type ImportMode = 'manual' | 'paste';

interface ParsedItem {
  name: string;
  quantity: number;
  matched?: boolean;
  textbookId?: string;
}

const BatchPage: React.FC = () => {
  const [selectedTextbookId, setSelectedTextbookId] = useState<string>('');
  const [condition, setCondition] = useState<BookCondition>('good');
  const [quantity, setQuantity] = useState<number>(1);
  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHandover, setShowHandover] = useState(false);

  const [importMode, setImportMode] = useState<ImportMode>('manual');
  const [className, setClassName] = useState('');
  const [monitorName, setMonitorName] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [parseError, setParseError] = useState('');

  const {
    batchItems,
    addBatchItem,
    removeBatchItem,
    clearBatchItems,
    addOrder,
    setLastHandoverOrder,
    user
  } = useAppStore();

  React.useEffect(() => {
    if (user.className) {
      setClassName(user.className);
    }
    if (user.name) {
      setMonitorName(user.name);
    }
  }, [user.className, user.name]);

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

  const generateHandoverNo = () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `HJ${dateStr}${random}`;
  };

  const handleAddItem = () => {
    if (!selectedTextbookId) {
      Taro.showToast({ title: '请选择教材', icon: 'none' });
      return;
    }
    const book = textbookList.find((t) => t.id === selectedTextbookId);
    if (!book) return;

    const existingIndex = batchItems.findIndex(
      (item) => item.textbook.id === book.id && item.condition === condition
    );

    if (existingIndex >= 0) {
      const existing = batchItems[existingIndex];
      const newQuantity = existing.quantity + quantity;
      const estimatedPrice = calculatePrice(book.basePrice, condition, false, newQuantity);
      const newItems = [...batchItems];
      newItems[existingIndex] = { ...existing, quantity: newQuantity, estimatedPrice };
      clearBatchItems();
      newItems.forEach((item) => addBatchItem(item));
    } else {
      const estimatedPrice = calculatePrice(book.basePrice, condition, false, quantity);
      const item: BatchItem = { textbook: book, condition, quantity, estimatedPrice };
      addBatchItem(item);
    }

    console.log('[Batch] 添加批量教材:', book.name, '数量:', quantity);
    Taro.showToast({ title: '已添加', icon: 'success' });
    setSelectedTextbookId('');
    setCondition('good');
    setQuantity(1);
  };

  const handleParsePaste = () => {
    if (!pasteContent.trim()) {
      Taro.showToast({ title: '请粘贴书目内容', icon: 'none' });
      return;
    }

    const lines = pasteContent.trim().split('\n');
    const items: ParsedItem[] = [];
    const errors: string[] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const match = trimmed.match(/^(.+?)\s*[,，\s]\s*(\d+)\s*[本本本]?$/);
      if (match) {
        const name = match[1].trim();
        const qty = parseInt(match[2], 10);

        const matchedBook = textbookList.find(
          (b) => b.name.includes(name) || name.includes(b.name)
        );

        items.push({
          name,
          quantity: qty,
          matched: !!matchedBook,
          textbookId: matchedBook?.id
        });
      } else {
        const nameOnlyMatch = trimmed.match(/^(.+?)\s*$/);
        if (nameOnlyMatch) {
          const name = nameOnlyMatch[1].trim();
          const matchedBook = textbookList.find(
            (b) => b.name.includes(name) || name.includes(b.name)
          );
          items.push({
            name,
            quantity: 1,
            matched: !!matchedBook,
            textbookId: matchedBook?.id
          });
        } else {
          errors.push(`第${idx + 1}行格式不正确: ${trimmed}`);
        }
      }
    });

    if (errors.length > 0) {
      setParseError(errors.join('\n'));
    } else {
      setParseError('');
    }

    setParsedItems(items);
    console.log('[Batch] 解析书目:', items.length, '条, 错误:', errors.length);
  };

  const handleImportParsed = () => {
    if (parsedItems.length === 0) {
      Taro.showToast({ title: '请先解析书目', icon: 'none' });
      return;
    }

    const unmatched = parsedItems.filter((p) => !p.matched);
    if (unmatched.length > 0) {
      Taro.showModal({
        title: '提示',
        content: `有${unmatched.length}本教材未匹配到，是否跳过并继续导入？`,
        success: (res) => {
          if (res.confirm) {
            doImport(parsedItems.filter((p) => p.matched));
          }
        }
      });
      return;
    }

    doImport(parsedItems);
  };

  const doImport = (items: ParsedItem[]) => {
    let imported = 0;
    items.forEach((item) => {
      const book = textbookList.find((t) => t.id === item.textbookId);
      if (!book) return;

      const existingIndex = batchItems.findIndex(
        (b) => b.textbook.id === book.id && b.condition === condition
      );

      if (existingIndex >= 0) {
        const existing = batchItems[existingIndex];
        const newQuantity = existing.quantity + item.quantity;
        const estimatedPrice = calculatePrice(book.basePrice, condition, false, newQuantity);
        const newItems = [...batchItems];
        newItems[existingIndex] = { ...existing, quantity: newQuantity, estimatedPrice };
        clearBatchItems();
        newItems.forEach((b) => addBatchItem(b));
      } else {
        const estimatedPrice = calculatePrice(book.basePrice, condition, false, item.quantity);
        const batchItem: BatchItem = { textbook: book, condition, quantity: item.quantity, estimatedPrice };
        addBatchItem(batchItem);
      }
      imported++;
    });

    setPasteContent('');
    setParsedItems([]);
    setParseError('');
    setImportMode('manual');
    Taro.showToast({ title: `已导入${imported}本`, icon: 'success' });
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
    if (!className.trim()) {
      Taro.showToast({ title: '请填写班级信息', icon: 'none' });
      return;
    }
    if (!monitorName.trim()) {
      Taro.showToast({ title: '请填写负责人', icon: 'none' });
      return;
    }

    const handoverNo = generateHandoverNo();
    const order: Order = {
      id: 'o' + Date.now(),
      orderNo: generateOrderNo(),
      handoverNo,
      status: 'pending',
      items: batchItems.map((b) => ({ ...b, isSet: false })),
      totalQuantity,
      estimatedPrice: totalPrice,
      pickupType: 'spot',
      spotName: '班级统一回收',
      contactName: monitorName,
      contactPhone: user.phone || '138****0000',
      className,
      bonusRate,
      createdAt: new Date().toLocaleString()
    };

    addOrder(order);
    setLastHandoverOrder(order);
    clearBatchItems();
    setShowHandover(true);
    console.log('[Batch] 创建批量订单:', order.orderNo, '交接单:', handoverNo);
  };

  const handleViewRecords = () => {
    setShowHandover(false);
    setShowSuccess(false);
    Taro.switchTab({ url: '/pages/records/index' });
  };

  const handleShareHandover = () => {
    Taro.showToast({ title: '交接单已保存', icon: 'success' });
  };

  const selectedBook = textbookList.find((t) => t.id === selectedTextbookId);
  const lastHandoverOrder = useAppStore((s) => s.lastHandoverOrder);

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

      <View className={styles.classInfo}>
        <Text className={styles.formLabel}>班级名称</Text>
        <Input
          className={styles.classInput}
          placeholder="如：计算机2101班"
          value={className}
          onInput={(e) => setClassName(e.detail.value)}
        />
      </View>

      <View className={styles.classInfo}>
        <Text className={styles.formLabel}>负责人姓名</Text>
        <Input
          className={styles.classInput}
          placeholder="请输入负责人姓名"
          value={monitorName}
          onInput={(e) => setMonitorName(e.detail.value)}
        />
      </View>

      <View className={styles.importTabs}>
        <View
          className={classnames(styles.importTab, importMode === 'manual' && styles.active)}
          onClick={() => setImportMode('manual')}
        >
          <Text>逐个添加</Text>
        </View>
        <View
          className={classnames(styles.importTab, importMode === 'paste' && styles.active)}
          onClick={() => setImportMode('paste')}
        >
          <Text>批量导入</Text>
        </View>
      </View>

      {importMode === 'manual' && (
        <>
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
                <View className={styles.quantityBtn} onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Text>-</Text>
                </View>
                <Text className={styles.quantityValue}>{quantity}</Text>
                <View className={styles.quantityBtn} onClick={() => setQuantity(quantity + 1)}>
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
        </>
      )}

      {importMode === 'paste' && (
        <View className={styles.importArea}>
          <Text className={styles.importTitle}>粘贴导入书目</Text>
          <Text className={styles.importTip}>
            格式说明：每行一本教材，格式为「教材名,数量」或「教材名 数量」，数量可省略（默认为1）。{'\n'}
            示例：{'\n'}
            高等数学,10{'\n'}
            大学英语 5{'\n'}
            线性代数
          </Text>

          <Textarea
            className={styles.pasteInput}
            placeholder="请粘贴书目列表..."
            value={pasteContent}
            onInput={(e) => setPasteContent(e.detail.value)}
          />

          {parseError && (
            <View className={styles.parseError}>
              <Text>{parseError}</Text>
            </View>
          )}

          {parsedItems.length > 0 && (
            <View className={styles.previewBox}>
              {parsedItems.map((item, idx) => (
                <View className={styles.previewItem} key={idx}>
                  <Text className={styles.previewName}>
                    {item.name}
                    {!item.matched && <Text style={{ color: '#ef4444', fontSize: '20rpx' }}>（未匹配）</Text>}
                  </Text>
                  <Text className={styles.previewQty}>x{item.quantity}</Text>
                </View>
              ))}
            </View>
          )}

          <View className={styles.importBtns}>
            <View className={classnames(styles.importBtn, styles.secondary)} onClick={() => {
              setPasteContent('');
              setParsedItems([]);
              setParseError('');
            }}>
              <Text>清空</Text>
            </View>
            <View className={styles.importBtn} onClick={handleParsePaste}>
              <Text>解析预览</Text>
            </View>
          </View>

          {parsedItems.length > 0 && (
            <View className={styles.importBtns} style={{ marginTop: '24rpx' }}>
              <View className={styles.importBtn} onClick={handleImportParsed}>
                <Text>导入到清单 ({parsedItems.filter(p => p.matched).length}本)</Text>
              </View>
            </View>
          )}
        </View>
      )}

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

      {showHandover && lastHandoverOrder && (
        <View className={styles.modalMask} onClick={() => setShowHandover(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.handoverCard}>
              <View className={styles.handoverHeader}>
                <Text className={styles.handoverTitle}>📋 教材交接清单</Text>
                <Text className={styles.handoverNo}>{lastHandoverOrder.handoverNo}</Text>
              </View>

              <View className={styles.handoverBody}>
                <View className={styles.handoverRow}>
                  <Text className={styles.handoverLabel}>班级</Text>
                  <Text className={styles.handoverValue}>{lastHandoverOrder.className}</Text>
                </View>
                <View className={styles.handoverRow}>
                  <Text className={styles.handoverLabel}>负责人</Text>
                  <Text className={styles.handoverValue}>{lastHandoverOrder.contactName}</Text>
                </View>
                <View className={styles.handoverRow}>
                  <Text className={styles.handoverLabel}>联系电话</Text>
                  <Text className={styles.handoverValue}>{lastHandoverOrder.contactPhone}</Text>
                </View>
                <View className={styles.handoverRow}>
                  <Text className={styles.handoverLabel}>教材种类</Text>
                  <Text className={styles.handoverValue}>{lastHandoverOrder.items.length}种</Text>
                </View>
                <View className={styles.handoverRow}>
                  <Text className={styles.handoverLabel}>书本总数</Text>
                  <Text className={styles.handoverValue}>{lastHandoverOrder.totalQuantity}本</Text>
                </View>
                <View className={styles.handoverRow}>
                  <Text className={styles.handoverLabel}>批量补贴</Text>
                  <Text className={styles.handoverValue}>+{((lastHandoverOrder.bonusRate || 0) * 100).toFixed(0)}%</Text>
                </View>
                <View className={styles.handoverRow}>
                  <Text className={styles.handoverLabel}>提交时间</Text>
                  <Text className={styles.handoverValue}>{lastHandoverOrder.createdAt}</Text>
                </View>
              </View>

              <View className={styles.handoverSummary}>
                <Text className={styles.handoverTotal}>¥{formatMoney(lastHandoverOrder.estimatedPrice)}</Text>
                <Text className={styles.handoverTip}>预估回收金额（以实际核验为准）</Text>
              </View>

              <View className={styles.handoverFooter}>
                <View className={classnames(styles.handoverBtn, styles.secondary)} onClick={handleShareHandover}>
                  <Text>保存交接单</Text>
                </View>
                <View className={classnames(styles.handoverBtn, styles.primary)} onClick={handleViewRecords}>
                  <Text>查看订单</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default BatchPage;
