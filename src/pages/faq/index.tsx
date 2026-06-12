import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import { faqList } from '@/data/notices';
import styles from './index.module.scss';

const FAQPage: React.FC = () => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set([faqList[0]?.id || '']));

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>❓ 常见问题</Text>
        <Text className={styles.subtitle}>解答您关于教材回收的疑问</Text>
      </View>

      {faqList.map((faq) => (
        <View className={styles.faqCard} key={faq.id}>
          <View className={styles.faqHeader} onClick={() => toggleExpand(faq.id)}>
            <Text className={styles.question}>{faq.question}</Text>
            <Text
              className={classnames(
                styles.arrow,
                expandedIds.has(faq.id) && styles.expanded
              )}
            >
              ▼
            </Text>
          </View>
          {expandedIds.has(faq.id) && (
            <Text className={styles.answer}>{faq.answer}</Text>
          )}
        </View>
      ))}
    </View>
  );
};

export default FAQPage;
