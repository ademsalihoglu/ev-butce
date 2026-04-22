import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from '../utils/format';

interface Props {
  title: string;
  amount: number;
  icon: string;
  tone?: 'income' | 'expense' | 'net';
  subtitle?: string;
}

export function SummaryCard({ title, amount, icon, tone = 'net', subtitle }: Props) {
  const theme = useTheme();
  const toneColor =
    tone === 'income'
      ? theme.colors.secondary
      : tone === 'expense'
      ? theme.colors.error
      : amount >= 0
      ? theme.colors.secondary
      : theme.colors.error;

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content>
        <View style={styles.row}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: toneColor + '22' },
            ]}
          >
            <MaterialCommunityIcons name={icon} size={22} color={toneColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {title}
            </Text>
            <Text variant="headlineSmall" style={{ fontWeight: '700', color: toneColor }}>
              {formatCurrency(amount)}
            </Text>
            {subtitle ? (
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
