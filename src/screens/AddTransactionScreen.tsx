import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DatePickerField } from '../components/DatePickerField';
import { GlassCard } from '../components/GlassCard';
import { GradientBackground } from '../components/GradientBackground';
import { useData } from '../context/DataContext';
import type { RootStackParamList } from '../navigation/types';
import type { TransactionType } from '../db';
import { currentMonthKey, parseAmount, toIsoDate } from '../utils/format';
import { designTokens } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

export default function AddTransactionScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const editingId = route.params?.id;
  const prefillShoppingId = route.params?.prefill?.shoppingItemId ?? null;
  const {
    categories,
    transactions,
    shoppingItems,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateShoppingItem,
  } = useData();

  const existing = useMemo(
    () => (editingId ? transactions.find((t) => t.id === editingId) ?? null : null),
    [editingId, transactions]
  );

  const shoppingItem = useMemo(
    () => (prefillShoppingId ? shoppingItems.find((it) => it.id === prefillShoppingId) ?? null : null),
    [prefillShoppingId, shoppingItems]
  );

  const initialAmount = existing
    ? String(existing.amount).replace('.', ',')
    : shoppingItem
    ? String(shoppingItem.estimatedPrice * (shoppingItem.quantity || 1)).replace('.', ',')
    : '';
  const initialDescription = existing?.description ?? (shoppingItem ? shoppingItem.name : '');
  const initialCategoryId = existing?.categoryId ?? shoppingItem?.categoryId ?? '';
  const initialType: TransactionType = existing?.type ?? (shoppingItem ? 'expense' : 'expense');

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>(initialAmount);
  const [description, setDescription] = useState<string>(initialDescription);
  const [date, setDate] = useState<string>(existing?.date ?? toIsoDate(new Date()));
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: editingId ? 'İşlemi Düzenle' : shoppingItem ? 'Gidere Dönüştür' : 'Yeni İşlem',
    });
  }, [navigation, editingId, shoppingItem]);

  const visibleCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!visibleCategories.find((c) => c.id === categoryId)) {
      setCategoryId(visibleCategories[0]?.id ?? '');
    }
  }, [visibleCategories, categoryId]);

  const canSubmit = amount.length > 0 && categoryId.length > 0;

  async function handleSubmit() {
    const parsed = parseAmount(amount);
    if (parsed === null || parsed <= 0) {
      setError('Geçerli bir tutar girin.');
      return;
    }
    if (!categoryId) {
      setError('Kategori seçin.');
      return;
    }
    const payload = {
      amount: parsed,
      description: description.trim(),
      date,
      categoryId,
      type,
    };
    try {
      let createdId: string | null = null;
      if (editingId && existing) {
        await updateTransaction({ id: existing.id, ...payload });
      } else {
        const created = await addTransaction(payload);
        createdId = created.id;
      }
      if (shoppingItem && createdId) {
        await updateShoppingItem({
          ...shoppingItem,
          bought: true,
          convertedTransactionId: createdId,
        });
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.');
    }
  }

  async function handleDelete() {
    if (!existing) return;
    await deleteTransaction(existing.id);
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground />
      <ScrollView contentContainerStyle={styles.container}>
        <GlassCard padding="xl" radius="xl">
          {shoppingItem ? (
            <Chip
              icon="cart-check"
              style={{ alignSelf: 'flex-start', marginBottom: designTokens.spacing.md, backgroundColor: theme.colors.tertiaryContainer }}
              textStyle={{ color: theme.colors.onTertiaryContainer }}
            >
              "{shoppingItem.name}" alışveriş listesinden
            </Chip>
          ) : null}

          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as TransactionType)}
            buttons={[
              { value: 'expense', label: 'Gider', icon: 'arrow-up' },
              { value: 'income', label: 'Gelir', icon: 'arrow-down' },
            ]}
          />

          <View style={{ height: designTokens.spacing.md }} />

          <TextInput
            label="Tutar"
            mode="outlined"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0,00"
            left={<TextInput.Affix text="₺" />}
          />

          <View style={{ height: designTokens.spacing.md }} />

          <TextInput
            label="Açıklama"
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder="örn. market alışverişi"
          />

          <View style={{ height: designTokens.spacing.md }} />

          <DatePickerField value={date} onChange={setDate} />

          <View style={{ height: designTokens.spacing.md }} />

          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            Kategori
          </Text>
          <View style={styles.categoryGrid}>
            {visibleCategories.map((cat) => {
              const selected = categoryId === cat.id;
              return (
                <Button
                  key={cat.id}
                  mode={selected ? 'contained' : 'outlined'}
                  onPress={() => setCategoryId(cat.id)}
                  buttonColor={selected ? cat.color : undefined}
                  textColor={selected ? '#fff' : cat.color}
                  icon={({ size }) => (
                    <MaterialCommunityIcons
                      name={cat.icon}
                      size={size}
                      color={selected ? '#fff' : cat.color}
                    />
                  )}
                  style={{ borderColor: cat.color }}
                  compact
                >
                  {cat.name}
                </Button>
              );
            })}
            {visibleCategories.length === 0 && (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Bu türde kategori yok. Ayarlar'dan ekleyin.
              </Text>
            )}
          </View>

          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }} variant="bodySmall">
            Bu ay: {currentMonthKey()}
          </Text>

          <View style={styles.actions}>
            {existing ? (
              <Button mode="text" icon="trash-can-outline" onPress={handleDelete} textColor={theme.colors.error}>
                Sil
              </Button>
            ) : (
              <View />
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button mode="outlined" onPress={() => navigation.goBack()}>
                İptal
              </Button>
              <Button mode="contained" onPress={handleSubmit} disabled={!canSubmit}>
                {existing ? 'Güncelle' : 'Kaydet'}
              </Button>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={3000}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.lg,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: designTokens.spacing.lg,
  },
});
