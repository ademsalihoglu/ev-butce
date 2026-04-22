import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Category, Transaction } from '../db';
import { formatCurrency, formatDate } from '../utils/format';

interface Props {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
  onDelete?: () => void;
}

export function TransactionItem({ transaction, category, onPress, onDelete }: Props) {
  const theme = useTheme();
  const color = category?.color ?? theme.colors.primary;
  const sign = transaction.type === 'income' ? '+' : '-';
  const amountColor = transaction.type === 'income' ? theme.colors.secondary : theme.colors.error;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.surfaceVariant : theme.colors.surface,
          borderBottomColor: theme.colors.surfaceVariant,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
        <MaterialCommunityIcons name={category?.icon ?? 'cash'} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyLarge" numberOfLines={1} style={{ fontWeight: '600' }}>
          {transaction.description || category?.name || 'İşlem'}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {category?.name ?? 'Kategori yok'} · {formatDate(transaction.date)}
        </Text>
      </View>
      <Text
        variant="titleMedium"
        style={{ fontWeight: '700', color: amountColor, fontVariant: ['tabular-nums'] }}
      >
        {sign}
        {formatCurrency(transaction.amount)}
      </Text>
      {onDelete ? <IconButton icon="trash-can-outline" size={18} onPress={onDelete} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
