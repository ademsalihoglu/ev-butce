import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, TextInput, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassCard } from '../components/GlassCard';
import { GradientBackground } from '../components/GradientBackground';
import { useData } from '../context/DataContext';
import type { RootStackParamList } from '../navigation/types';
import type { AssetCurrency } from '../db/types';
import { ALL_CURRENCIES, CURRENCY_META } from '../utils/rates';
import { parseAmount } from '../utils/format';
import { designTokens } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AssetEditor'>;

export default function AssetEditorScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const editingId = route.params?.id;
  const { assets, addAsset, updateAsset, deleteAsset } = useData();

  const existing = useMemo(
    () => (editingId ? assets.find((a) => a.id === editingId) ?? null : null),
    [editingId, assets]
  );

  const [label, setLabel] = useState(existing?.label ?? '');
  const [amount, setAmount] = useState(existing ? String(existing.amount).replace('.', ',') : '');
  const [currency, setCurrency] = useState<AssetCurrency>(existing?.currency ?? 'USD');
  const [note, setNote] = useState(existing?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: editingId ? 'Varlığı Düzenle' : 'Varlık Ekle' });
  }, [navigation, editingId]);

  async function handleSave() {
    const parsed = parseAmount(amount);
    if (!label.trim()) {
      setError('Varlık adı girin.');
      return;
    }
    if (parsed === null || parsed <= 0) {
      setError('Geçerli bir miktar girin.');
      return;
    }
    const now = new Date().toISOString();
    try {
      if (existing) {
        await updateAsset({
          ...existing,
          label: label.trim(),
          amount: parsed,
          currency,
          note: note.trim() || undefined,
          updatedAt: now,
        });
      } else {
        await addAsset({
          label: label.trim(),
          amount: parsed,
          currency,
          note: note.trim() || undefined,
          createdAt: now,
          updatedAt: now,
        });
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.');
    }
  }

  async function handleDelete() {
    if (!existing) return;
    await deleteAsset(existing.id);
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground />
      <ScrollView contentContainerStyle={styles.container}>
        <GlassCard padding="xl" radius="xl">
          <TextInput
            label="Varlık adı"
            placeholder="Örn. Döviz hesabı, Nakit, Cüzdan"
            value={label}
            onChangeText={setLabel}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Miktar"
            placeholder="0,00"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            right={<TextInput.Affix text={CURRENCY_META[currency].symbol} />}
          />

          <Text style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            Para birimi
          </Text>
          <View style={styles.chipWrap}>
            {ALL_CURRENCIES.map((c) => {
              const meta = CURRENCY_META[c];
              const selected = currency === c;
              return (
                <Chip
                  key={c}
                  icon={meta.icon}
                  selected={selected}
                  onPress={() => setCurrency(c)}
                  style={{
                    backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface,
                  }}
                  compact
                >
                  {c === 'XAU' ? 'Altın' : c}
                </Chip>
              );
            })}
          </View>

          <TextInput
            label="Not (opsiyonel)"
            placeholder="Banka adı, cüzdan, vs."
            value={note}
            onChangeText={setNote}
            mode="outlined"
            style={styles.input}
            multiline
          />

          {error ? (
            <Text style={{ color: theme.colors.error, marginTop: designTokens.spacing.sm }}>{error}</Text>
          ) : null}

          <View style={styles.actions}>
            <Button mode="contained" icon="content-save" onPress={handleSave}>
              Kaydet
            </Button>
            {existing ? (
              <Button mode="outlined" icon="delete" onPress={handleDelete} textColor={theme.colors.error}>
                Sil
              </Button>
            ) : null}
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.lg,
    paddingBottom: 80,
  },
  input: {
    marginTop: designTokens.spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginTop: designTokens.spacing.xl,
  },
});
