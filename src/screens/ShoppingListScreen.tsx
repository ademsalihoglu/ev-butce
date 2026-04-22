import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  Checkbox,
  Chip,
  FAB,
  IconButton,
  Searchbar,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompositeNavigationProp, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { useData } from '../context/DataContext';
import { RootStackParamList, TabsParamList } from '../navigation/types';
import { designTokens } from '../theme';
import { ShoppingItem } from '../db';
import { formatCurrency } from '../utils/format';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList, 'Shopping'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function ShoppingListScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { shoppingItems, categories, updateShoppingItem, deleteShoppingItem } = useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'bought'>('all');
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    return shoppingItems.filter((it) => {
      if (filter === 'pending' && it.bought) return false;
      if (filter === 'bought' && !it.bought) return false;
      if (!q) return true;
      return (
        it.name.toLocaleLowerCase('tr').includes(q) ||
        it.note.toLocaleLowerCase('tr').includes(q)
      );
    });
  }, [shoppingItems, query, filter]);

  const totals = useMemo(() => {
    const pending = shoppingItems.filter((it) => !it.bought);
    const bought = shoppingItems.filter((it) => it.bought);
    const pendingTotal = pending.reduce((acc, it) => acc + it.estimatedPrice * (it.quantity || 1), 0);
    const boughtTotal = bought.reduce((acc, it) => acc + it.estimatedPrice * (it.quantity || 1), 0);
    return { pending: pending.length, bought: bought.length, pendingTotal, boughtTotal };
  }, [shoppingItems]);

  const toggleBought = async (item: ShoppingItem) => {
    await updateShoppingItem({ ...item, bought: !item.bought });
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => {
    const category = categories.find((c) => c.id === item.categoryId);
    const hasTransaction = Boolean(item.convertedTransactionId);
    return (
      <GlassCard style={{ marginBottom: designTokens.spacing.md }} padding="md">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.sm }}>
          <Checkbox
            status={item.bought ? 'checked' : 'unchecked'}
            onPress={() => toggleBought(item)}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                designTokens.typography.subtitle,
                {
                  color: theme.colors.onSurface,
                  textDecorationLine: item.bought ? 'line-through' : 'none',
                  opacity: item.bought ? 0.65 : 1,
                },
              ]}
            >
              {item.name}
            </Text>
            <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
              {item.quantity} {item.unit || ''} · Tah. {formatCurrency(item.estimatedPrice * (item.quantity || 1))}
              {category ? ` · ${category.name}` : ''}
            </Text>
            {item.note ? (
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}>
                {item.note}
              </Text>
            ) : null}
            {hasTransaction ? (
              <View style={{ flexDirection: 'row', marginTop: 6 }}>
                <Chip
                  compact
                  icon="check-decagram"
                  style={{ backgroundColor: theme.colors.tertiaryContainer }}
                  textStyle={{ color: theme.colors.onTertiaryContainer }}
                >
                  Gidere dönüştürüldü
                </Chip>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {item.bought && !hasTransaction ? (
              <IconButton
                icon="cash-plus"
                iconColor={theme.colors.tertiary}
                onPress={() =>
                  navigation.navigate('AddTransaction', {
                    prefill: { shoppingItemId: item.id },
                  })
                }
              />
            ) : null}
            <IconButton
              icon="pencil-outline"
              onPress={() => navigation.navigate('ShoppingEditor', { id: item.id })}
            />
            <IconButton
              icon="trash-can-outline"
              onPress={() => deleteShoppingItem(item.id)}
            />
          </View>
        </View>
      </GlassCard>
    );
  };

  return (
    <View style={styles.root}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <View style={[styles.container, { maxWidth: isWide ? 1100 : undefined, alignSelf: 'center', width: '100%' }]}>
          <View style={[styles.summaryRow, { flexDirection: isWide ? 'row' : 'column', gap: designTokens.spacing.md }]}>
            <GlassCard style={{ flex: 1 }} tone="primary" padding="lg">
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                BEKLEYEN
              </Text>
              <Text style={[designTokens.typography.display, { color: theme.colors.primary }]}>
                {totals.pending}
              </Text>
              <Text style={[designTokens.typography.body, { color: theme.colors.onSurface }]}>
                Tah. {formatCurrency(totals.pendingTotal)}
              </Text>
            </GlassCard>
            <GlassCard style={{ flex: 1 }} tone="warm" padding="lg">
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                ALINANLAR
              </Text>
              <Text style={[designTokens.typography.display, { color: theme.colors.tertiary }]}>
                {totals.bought}
              </Text>
              <Text style={[designTokens.typography.body, { color: theme.colors.onSurface }]}>
                Tah. {formatCurrency(totals.boughtTotal)}
              </Text>
            </GlassCard>
          </View>

          <Searchbar
            value={query}
            onChangeText={setQuery}
            placeholder="Ürün ara"
            style={styles.search}
          />

          <View style={styles.filterRow}>
            <Chip selected={filter === 'all'} onPress={() => setFilter('all')}>
              Tümü
            </Chip>
            <Chip selected={filter === 'pending'} onPress={() => setFilter('pending')}>
              Bekleyenler
            </Chip>
            <Chip selected={filter === 'bought'} onPress={() => setFilter('bought')}>
              Alınanlar
            </Chip>
          </View>

          {filtered.length === 0 ? (
            <GlassCard style={{ marginTop: designTokens.spacing.lg, alignItems: 'center' }}>
              <MaterialCommunityIcons
                name="cart-outline"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[designTokens.typography.subtitle, { marginTop: 8, color: theme.colors.onSurface }]}>
                Liste boş
              </Text>
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }]}>
                Sağ alttaki + ile ilk ürününüzü ekleyin.
              </Text>
            </GlassCard>
          ) : (
            <FlatList
              data={filtered}
              renderItem={renderItem}
              keyExtractor={(it) => it.id}
              contentContainerStyle={{ paddingTop: designTokens.spacing.md, paddingBottom: 120 }}
            />
          )}
        </View>
      </SafeAreaView>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('ShoppingEditor')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: designTokens.spacing.lg, paddingTop: designTokens.spacing.md },
  summaryRow: { marginBottom: designTokens.spacing.md },
  search: { marginBottom: designTokens.spacing.sm, borderRadius: designTokens.radius.md },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: designTokens.spacing.sm },
  fab: { position: 'absolute', right: 20, bottom: 20 },
});
