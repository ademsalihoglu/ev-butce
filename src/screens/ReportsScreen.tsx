import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Card, Menu, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { PieChart, PieLegend, PieSlice } from '../components/PieChart';
import { useData } from '../context/DataContext';
import { TransactionType } from '../db';
import { currentMonthKey, formatCurrency, monthKey, monthLabel } from '../utils/format';

export default function ReportsScreen() {
  const theme = useTheme();
  const { transactions, categories } = useData();
  const { width } = useWindowDimensions();
  const isWide = width >= 800;
  const [type, setType] = useState<TransactionType>('expense');
  const [month, setMonth] = useState<string>(currentMonthKey());
  const [menuOpen, setMenuOpen] = useState(false);

  const monthOptions = useMemo(() => {
    const set = new Set<string>([currentMonthKey()]);
    transactions.forEach((t) => set.add(monthKey(t.date)));
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const slices: PieSlice[] = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== type) continue;
      if (monthKey(t.date) !== month) continue;
      byCat.set(t.categoryId, (byCat.get(t.categoryId) ?? 0) + t.amount);
    }
    return [...byCat.entries()]
      .map(([id, value]) => {
        const cat = categories.find((c) => c.id === id);
        return {
          key: id,
          label: cat?.name ?? 'Diğer',
          value,
          color: cat?.color ?? theme.colors.primary,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, type, month, theme.colors.primary]);

  const total = slices.reduce((s, x) => s + x.value, 0);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>
          Raporlar
        </Text>
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Button mode="outlined" icon="calendar" onPress={() => setMenuOpen(true)}>
              {monthLabel(month)}
            </Button>
          }
        >
          {monthOptions.map((m) => (
            <Menu.Item
              key={m}
              onPress={() => {
                setMonth(m);
                setMenuOpen(false);
              }}
              title={monthLabel(m)}
            />
          ))}
        </Menu>
      </View>

      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as TransactionType)}
        buttons={[
          { value: 'expense', label: 'Gider', icon: 'arrow-up' },
          { value: 'income', label: 'Gelir', icon: 'arrow-down' },
        ]}
      />

      <Card mode="elevated">
        <Card.Content>
          <View style={[styles.chartRow, isWide && styles.chartRowWide]}>
            <View style={{ alignItems: 'center' }}>
              <PieChart
                data={slices}
                size={240}
                centerLabel={type === 'expense' ? 'Toplam Gider' : 'Toplam Gelir'}
                centerValue={formatCurrency(total)}
              />
            </View>
            <View style={{ flex: 1, minWidth: 200, gap: 12 }}>
              <Text variant="titleMedium">Kategori Dağılımı</Text>
              {slices.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Seçili ay için veri yok.
                </Text>
              ) : (
                <PieLegend data={slices} />
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      <Card mode="elevated">
        <Card.Title title="Ay Özeti" titleVariant="titleMedium" />
        <Card.Content style={{ gap: 4 }}>
          <Row label="İşlem Sayısı" value={String(slices.length ? slices.length : 0) + ' kategori'} />
          <Row
            label={type === 'expense' ? 'Toplam Gider' : 'Toplam Gelir'}
            value={formatCurrency(total)}
          />
          {slices[0] && <Row label="En Yüksek Kategori" value={`${slices[0].label} · ${formatCurrency(slices[0].value)}`} />}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text style={{ fontWeight: '600', fontVariant: ['tabular-nums'] }}>{value}</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  chartRow: {
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
  },
  chartRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
});
