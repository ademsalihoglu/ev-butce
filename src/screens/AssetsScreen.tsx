import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Chip, IconButton, Menu, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GlassCard } from '../components/GlassCard';
import { GradientBackground } from '../components/GradientBackground';
import { useData } from '../context/DataContext';
import type { RootStackParamList } from '../navigation/types';
import { designTokens } from '../theme';
import { formatCurrency } from '../utils/format';
import {
  ALL_CURRENCIES,
  CURRENCY_META,
  CachedRates,
  convertToTRY,
  formatAssetAmount,
  getRates,
} from '../utils/rates';
import type { Asset, AssetCurrency } from '../db/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AssetsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<Nav>();
  const { assets, deleteAsset } = useData();
  const [rates, setRates] = useState<CachedRates | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [filter, setFilter] = useState<'all' | 'fiat' | 'metal' | 'crypto'>('all');

  const loadRates = useCallback(async (force = false) => {
    setLoadingRates(true);
    try {
      const r = await getRates(force);
      setRates(r);
    } finally {
      setLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    loadRates(false);
  }, [loadRates]);

  const filteredAssets = useMemo(() => {
    if (filter === 'all') return assets;
    return assets.filter((a) => CURRENCY_META[a.currency].group === filter);
  }, [assets, filter]);

  const totals = useMemo(() => {
    if (!rates) return { total: 0, byCurrency: new Map<AssetCurrency, { amount: number; tryValue: number }>() };
    let total = 0;
    const byCurrency = new Map<AssetCurrency, { amount: number; tryValue: number }>();
    for (const a of assets) {
      const tryValue = convertToTRY(a.amount, a.currency, rates.rates);
      total += tryValue;
      const prev = byCurrency.get(a.currency) ?? { amount: 0, tryValue: 0 };
      byCurrency.set(a.currency, {
        amount: prev.amount + a.amount,
        tryValue: prev.tryValue + tryValue,
      });
    }
    return { total, byCurrency };
  }, [assets, rates]);

  const lastUpdated = rates?.fetchedAt
    ? new Date(rates.fetchedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground variant="hero" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loadingRates} onRefresh={() => loadRates(true)} />}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineSmall" style={{ fontWeight: '700', color: theme.colors.onPrimary }}>
              Varlıklar
            </Text>
            <Text style={{ color: theme.colors.onPrimary, opacity: 0.85, marginTop: 2 }}>
              Döviz, altın ve kripto varlıklarının anlık TRY karşılığı
            </Text>
          </View>
          <IconButton
            icon="refresh"
            mode="contained"
            iconColor={theme.colors.onPrimary}
            containerColor="rgba(255,255,255,0.2)"
            onPress={() => loadRates(true)}
            disabled={loadingRates}
          />
        </View>

        <GlassCard padding="xl" radius="xl" tone="primary">
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, letterSpacing: 1 }}>
            TOPLAM SERVET (TRY)
          </Text>
          <Text
            variant="displaySmall"
            style={{ fontWeight: '700', marginTop: 4, fontVariant: ['tabular-nums'] }}
          >
            {formatCurrency(totals.total)}
          </Text>
          <View style={styles.metaRow}>
            <Chip
              compact
              icon={rates?.source === 'network' ? 'access-point' : rates?.source === 'cache' ? 'history' : 'wifi-off'}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
              textStyle={{ fontSize: 11 }}
            >
              {rates?.source === 'network'
                ? `Canlı · ${lastUpdated}`
                : rates?.source === 'cache'
                ? `Önbellek · ${lastUpdated}`
                : 'Varsayılan kur'}
            </Chip>
            {loadingRates ? <ActivityIndicator size={16} style={{ marginLeft: designTokens.spacing.sm }} /> : null}
          </View>
        </GlassCard>

        <View style={styles.filterRow}>
          {([
            { key: 'all', label: 'Tümü', icon: 'view-grid-outline' },
            { key: 'fiat', label: 'Döviz', icon: 'cash-multiple' },
            { key: 'metal', label: 'Altın', icon: 'gold' },
            { key: 'crypto', label: 'Kripto', icon: 'bitcoin' },
          ] as const).map((f) => (
            <Chip
              key={f.key}
              icon={f.icon}
              selected={filter === f.key}
              onPress={() => setFilter(f.key)}
              style={{ backgroundColor: filter === f.key ? theme.colors.primaryContainer : theme.colors.surface }}
              compact
            >
              {f.label}
            </Chip>
          ))}
        </View>

        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('AssetEditor', undefined)}
          style={{ alignSelf: 'flex-start' }}
        >
          Varlık Ekle
        </Button>

        {filteredAssets.length === 0 ? (
          <GlassCard padding="xl" radius="lg">
            <View style={{ alignItems: 'center', gap: designTokens.spacing.sm }}>
              <MaterialCommunityIcons name="safe" size={42} color={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {filter === 'all'
                  ? 'Henüz varlık eklemedin. Dolar, altın veya kripto cinsinden birikimlerini ekleyerek toplam servetini izle.'
                  : 'Bu kategoride varlık yok.'}
              </Text>
            </View>
          </GlassCard>
        ) : (
          filteredAssets.map((asset) => (
            <AssetRow
              key={asset.id}
              asset={asset}
              rates={rates}
              onEdit={() => navigation.navigate('AssetEditor', { id: asset.id })}
              onDelete={() => deleteAsset(asset.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AssetRow({
  asset,
  rates,
  onEdit,
  onDelete,
}: {
  asset: Asset;
  rates: CachedRates | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = CURRENCY_META[asset.currency];
  const tryValue = rates ? convertToTRY(asset.amount, asset.currency, rates.rates) : 0;
  const perUnit = rates ? rates.rates[asset.currency] ?? 0 : 0;

  return (
    <Card mode="elevated">
      <Card.Content>
        <View style={styles.assetHeader}>
          <View style={[styles.iconBubble, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name={meta.icon} size={22} color={theme.colors.onPrimaryContainer} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>
              {asset.label}
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
              {meta.label} · 1 {asset.currency} ≈ {formatCurrency(perUnit)}
            </Text>
          </View>
          <Menu
            visible={menuOpen}
            onDismiss={() => setMenuOpen(false)}
            anchor={<IconButton icon="dots-vertical" onPress={() => setMenuOpen(true)} />}
          >
            <Menu.Item
              leadingIcon="pencil"
              onPress={() => {
                setMenuOpen(false);
                onEdit();
              }}
              title="Düzenle"
            />
            <Menu.Item
              leadingIcon="delete"
              onPress={() => {
                setMenuOpen(false);
                onDelete();
              }}
              title="Sil"
            />
          </Menu>
        </View>
        <View style={styles.valueRow}>
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 13 }}>
            {formatAssetAmount(asset.amount, asset.currency)}
          </Text>
          <Text variant="titleLarge" style={{ fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {formatCurrency(tryValue)}
          </Text>
        </View>
        {asset.note ? (
          <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 6 }}>
            {asset.note}
          </Text>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.lg,
    paddingBottom: 120,
    gap: designTokens.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: designTokens.spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
  },
  iconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: designTokens.spacing.md,
  },
});
