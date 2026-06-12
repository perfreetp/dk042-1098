import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface PriceTagProps {
  price: number;
  size?: 'small' | 'medium' | 'large';
  prefix?: string;
}

const PriceTag: React.FC<PriceTagProps> = ({
  price,
  size = 'medium',
  prefix = '¥'
}) => {
  return (
    <View className={classnames(styles.priceTag, styles[size])}>
      <Text className={styles.prefix}>{prefix}</Text>
      <Text className={styles.price}>{price.toFixed(2)}</Text>
    </View>
  );
};

export default PriceTag;
