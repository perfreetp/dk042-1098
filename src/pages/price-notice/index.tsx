import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { priceNoticeList } from '@/data/notices';
import { formatMoney } from '@/utils';
import styles from './index.module.scss';

const PriceNoticePage: React.FC = () => {
  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>📈 价格动态</Text>
        <Text className={styles.subtitle}>及时关注教材回收价格变化，高价时出售更划算</Text>
      </View>

      {priceNoticeList.map((notice) => (
        <View className={styles.noticeCard} key={notice.id}>
          <View className={styles.noticeHeader}>
            <Text className={styles.courseTag}>{notice.course}</Text>
            <Text
              className={classnames(
                styles.changeTag,
                notice.isUp ? styles.up : styles.down
              )}
            >
              {notice.isUp ? '↑' : '↓'} {notice.changePercent}%
            </Text>
          </View>

          <Text className={styles.bookName}>{notice.textbookName}</Text>

          <View className={styles.priceRow}>
            <Text className={styles.oldPrice}>原价 ¥{formatMoney(notice.oldPrice)}</Text>
            <Text className={styles.arrow}>→</Text>
            <Text className={styles.newPrice}>¥{formatMoney(notice.newPrice)}</Text>
          </View>

          <Text className={styles.date}>更新于 {notice.updatedAt}</Text>
        </View>
      ))}
    </View>
  );
};

export default PriceNoticePage;
