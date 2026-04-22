import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Card, FAB, Text, useTheme, Button, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionItem } from '../components/TransactionItem';
import { useData } from '../context/DataContext';
import { currentMonthKey, monthKey, monthLabel, formatCurrency } from '../utils/format';
import { computeUpcomingPayments, describeRecurrence, formatDaysUntil } from '../utils/recurring';
import type { RootStackParamList, TabsParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'Dashboard'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function DashboardScreen({ navigation }: { navigation: Nav }) {
  const theme = useTheme();
  const { transactions, categories } = useData();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const month = currentMonthKey();
  const monthTxs = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === month),
    [transactions, month]
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of monthTxs) {
      if (t.type === 'income') income += t.amount;
      else expense += t.amount;
    }
    return { income, expense, net: income - expense };
  }, [monthTxs]);

  const recent = useMemo(() => transactions.slice(0, 8), [transactions]);
  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  const upcomingPayments = useMemo(
    () => computeUpcomingPayments(transactions, 45).slice(0, 5),
    [transactions]
  );

  const topCategories = useMemo(() => {
    const totalsByCat = new Map<string, number>();
    for (const t of monthTxs) {
      if (t.type !== 'expense') continue;
      totalsByCat.set(t.categoryId, (totalsByCat.get(t.categoryId) ?? 0) + t.amount);
    }
    return [...totalsByCat.entries()]
      .map(([id, value]) => ({
        id,
        value,
        name: categoryById[id]?.name ?? 'Diğer',
        color: categoryById[id]?.color ?? theme.colors.primary,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  }, [monthTxs, categoryById, theme.colors.primary]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Bu Ay
            </Text>
            <Text variant="headlineMedium" style={{ fontWeight: '700' }}>
              {monthLabel(month)}
            </Text>
          </View>
          <Button
            mode="contained-tonal"
            icon="plus"
            onPress={() => navigation.navigate('AddTransaction', {})}
          >
            Ekle
          </Button>
        </View>

        <View style={[styles.summaryGrid, isWide && styles.summaryGridWide]}>
          <SummaryCard
            title="Gelir"
            amount={totals.income}
            icon="arrow-down-circle"
            tone="income"
          />
          <SummaryCard
            title="Gider"
            amount={totals.expense}
            icon="arrow-up-circle"
            tone="expense"
          />
          <SummaryCard title="Net Bakiye" amount={totals.net} icon="wallet" tone="net" />
        </View>

        {upcomingPayments.length > 0 ? (
          <Card mode="elevated">
            <Card.Title
              title="Yaklaşan Ödemeler"
              subtitle="Tekrarlayan işlemlerin"
              titleVariant="titleMedium"
              left={(props) => (
                <MaterialCommunityIcons
                  {...props}
                  name="bell-ring-outline"
                  size={24}
                  color={theme.colors.tertiary}
                />
              )}
            />
            <Card.Content style={{ gap: 10 }}>
              {upcomingPayments.map((up) => {
                const cat = categoryById[up.categoryId];
                const overdue = up.daysUntil < 0;
                return (
                  <View key={up.transactionId} style={styles.upcomingRow}>
                    <View
                      style={[
                        styles.upcomingIcon,
                        { backgroundColor: (cat?.color ?? theme.colors.primary) + '22' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={cat?.icon ?? 'calendar-clock'}
                        size={20}
                        color={cat?.color ?? theme.colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600' }} numberOfLines={1}>
                        {up.description}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          fontSize: 12,
                        }}
                      >
                        {describeRecurrence({
                          frequency: up.frequency,
                          dueDay: up.dueDate.getDay(),
                        })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontWeight: '700',
                          fontVariant: ['tabular-nums'],
                          color:
                            up.type === 'income' ? theme.colors.secondary : theme.colors.onSurface,
                        }}
                      >
                        {formatCurrency(up.amount)}
                      </Text>
                      <Chip
                        compact
                        style={{
                          marginTop: 2,
                          backgroundColor: overdue
                            ? theme.colors.errorContainer
                            : up.daysUntil <= 3
                            ? theme.colors.tertiaryContainer
                            : theme.colors.surfaceVariant,
                        }}
                        textStyle={{ fontSize: 10 }}
                      >
                        {formatDaysUntil(up.daysUntil)}
                      </Chip>
                    </View>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        ) : null}

        <View style={[styles.twoCol, isWide && styles.twoColWide]}>
          <Card style={{ flex: 1 }} mode="elevated">
            <Card.Title title="Kategori Öne Çıkanlar" titleVariant="titleMedium" />
            <Card.Content style={{ gap: 10 }}>
              {topCategories.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Bu ay için gider kaydı yok.
                </Text>
              ) : (
                topCategories.map((c) => (
                  <View key={c.id} style={styles.categoryRow}>
                    <View style={[styles.colorDot, { backgroundColor: c.color }]} />
                    <Text style={{ flex: 1 }} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={{ fontVariant: ['tabular-nums'], fontWeight: '600' }}>
                      {formatCurrency(c.value)}
                    </Text>
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          <Card style={{ flex: 1 }} mode="elevated">
            <Card.Title title="Son İşlemler" titleVariant="titleMedium" />
            <Card.Content style={{ paddingHorizontal: 0 }}>
              {recent.length === 0 ? (
                <Text
                  style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: 16, paddingBottom: 12 }}
                >
                  Henüz işlem eklenmedi.
                </Text>
              ) : (
                recent.map((t) => (
                  <TransactionItem
                    key={t.id}
                    transaction={t}
                    category={categoryById[t.categoryId]}
                    onPress={() => navigation.navigate('AddTransaction', { id: t.id })}
                  />
                ))
              )}
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction', {})}
        label="Yeni İşlem"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 96,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryGridWide: {
    flexWrap: 'nowrap',
  },
  twoCol: {
    flexDirection: 'column',
    gap: 12,
  },
  twoColWide: {
    flexDirection: 'row',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upcomingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
