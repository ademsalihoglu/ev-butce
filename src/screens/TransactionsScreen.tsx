import React, { useMemo, useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Chip, Searchbar, Text, useTheme, Menu, Button, Divider } from 'react-native-paper';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TransactionItem } from '../components/TransactionItem';
import { useData } from '../context/DataContext';
import { monthKey, monthLabel } from '../utils/format';
import type { RootStackParamList, TabsParamList } from '../navigation/types';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'Transactions'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function TransactionsScreen({ navigation }: { navigation: Nav }) {
  const theme = useTheme();
  const { transactions, categories, deleteTransaction } = useData();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  const categoryById = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(monthKey(t.date)));
    return ['all', ...[...set].sort((a, b) => b.localeCompare(a))];
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (monthFilter !== 'all' && monthKey(t.date) !== monthFilter) return false;
      if (!q) return true;
      const cat = categoryById[t.categoryId]?.name?.toLowerCase() ?? '';
      return t.description.toLowerCase().includes(q) || cat.includes(q);
    });
  }, [transactions, query, typeFilter, monthFilter, categoryById]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={styles.filters}>
        <Searchbar
          placeholder="Ara"
          value={query}
          onChangeText={setQuery}
          style={{ marginBottom: 8 }}
        />
        <View style={styles.chipRow}>
          <Chip
            selected={typeFilter === 'all'}
            onPress={() => setTypeFilter('all')}
            icon="filter-variant"
          >
            Tümü
          </Chip>
          <Chip
            selected={typeFilter === 'income'}
            onPress={() => setTypeFilter('income')}
            icon="arrow-down"
          >
            Gelir
          </Chip>
          <Chip
            selected={typeFilter === 'expense'}
            onPress={() => setTypeFilter('expense')}
            icon="arrow-up"
          >
            Gider
          </Chip>
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={
              <Button mode="outlined" icon="calendar" onPress={() => setMenuOpen(true)} compact>
                {monthFilter === 'all' ? 'Tüm Aylar' : monthLabel(monthFilter)}
              </Button>
            }
          >
            {monthOptions.map((opt) => (
              <Menu.Item
                key={opt}
                onPress={() => {
                  setMonthFilter(opt);
                  setMenuOpen(false);
                }}
                title={opt === 'all' ? 'Tüm Aylar' : monthLabel(opt)}
              />
            ))}
          </Menu>
        </View>
      </View>
      <Divider />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={categoryById[item.categoryId]}
            onPress={() => navigation.navigate('AddTransaction', { id: item.id })}
            onDelete={() => deleteTransaction(item.id)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', padding: 24, color: theme.colors.onSurfaceVariant }}>
            Hiç işlem yok.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    padding: 12,
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
});
