import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  SegmentedButtons,
  Snackbar,
  Switch,
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
import type { RecurrenceFrequency, Transaction, TransactionType } from '../db';
import { currentMonthKey, parseAmount, toIsoDate } from '../utils/format';
import { designTokens } from '../theme';
import { pickImageAsBase64, runOcr } from '../utils/ocr';
import { cancelRecurring, scheduleRecurring } from '../utils/notifications';

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

  const ocrPrefill = route.params?.prefill?.ocr;

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>(
    ocrPrefill?.amount !== undefined ? String(ocrPrefill.amount).replace('.', ',') : initialAmount
  );
  const [description, setDescription] = useState<string>(initialDescription);
  const [date, setDate] = useState<string>(
    ocrPrefill?.date ?? existing?.date ?? toIsoDate(new Date())
  );
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [recurringOn, setRecurringOn] = useState<boolean>(Boolean(existing?.recurring));
  const [recurringFreq, setRecurringFreq] = useState<RecurrenceFrequency>(
    existing?.recurring?.frequency ?? 'monthly'
  );
  const [recurringDay, setRecurringDay] = useState<number>(
    existing?.recurring?.dueDay ?? new Date(existing?.date ?? Date.now()).getDate()
  );

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
    const recurring = recurringOn
      ? { frequency: recurringFreq, dueDay: recurringDay }
      : null;
    const payload = {
      amount: parsed,
      description: description.trim(),
      date,
      categoryId,
      type,
      recurring,
    };
    try {
      let saved: Transaction | null = null;
      if (editingId && existing) {
        const next: Transaction = { id: existing.id, ...payload };
        await updateTransaction(next);
        saved = next;
      } else {
        saved = await addTransaction(payload);
      }
      if (shoppingItem && saved) {
        await updateShoppingItem({
          ...shoppingItem,
          bought: true,
          convertedTransactionId: saved.id,
        });
      }
      if (saved) {
        if (recurring) await scheduleRecurring(saved);
        else await cancelRecurring(saved.id);
      }
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydedilemedi.');
    }
  }

  async function handleOcr() {
    setOcrLoading(true);
    try {
      const image = await pickImageAsBase64();
      if (!image) return;
      const result = await runOcr(image);
      if (result.error) {
        setError(`OCR hatası: ${result.error}`);
        return;
      }
      let applied = 0;
      if (result.amount !== null) {
        setAmount(String(result.amount).replace('.', ','));
        applied += 1;
      }
      if (result.date) {
        setDate(result.date);
        applied += 1;
      }
      if (applied === 0) {
        setToast('Fişten tutar/tarih çıkarılamadı — elle düzenleyebilirsin.');
      } else {
        setToast(`Fişten ${applied === 2 ? 'tutar + tarih' : '1 alan'} dolduruldu.`);
      }
    } finally {
      setOcrLoading(false);
    }
  }

  async function handleDelete() {
    if (!existing) return;
    await cancelRecurring(existing.id);
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

          <View style={styles.ocrRow}>
            <TextInput
              label="Tutar"
              mode="outlined"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0,00"
              left={<TextInput.Affix text="₺" />}
              style={{ flex: 1 }}
            />
            <Button
              mode="contained-tonal"
              icon={ocrLoading ? undefined : 'camera-plus-outline'}
              onPress={handleOcr}
              disabled={ocrLoading}
              style={styles.ocrButton}
              contentStyle={{ height: 48 }}
            >
              {ocrLoading ? 'Okunuyor…' : 'Fişten doldur'}
            </Button>
          </View>
          {ocrLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <ActivityIndicator size={14} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                OCR.space üzerinden okunuyor…
              </Text>
            </View>
          ) : null}

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

          <View style={styles.recurringPanel}>
            <View style={styles.recurringHeader}>
              <MaterialCommunityIcons name="repeat-variant" size={22} color={theme.colors.primary} />
              <Text style={{ fontWeight: '700', flex: 1 }}>Tekrarlayan ödeme</Text>
              <Switch value={recurringOn} onValueChange={setRecurringOn} />
            </View>
            {recurringOn ? (
              <View style={{ gap: designTokens.spacing.sm, marginTop: designTokens.spacing.sm }}>
                <SegmentedButtons
                  value={recurringFreq}
                  onValueChange={(v) => {
                    const f = v as RecurrenceFrequency;
                    setRecurringFreq(f);
                    if (f === 'weekly' && recurringDay > 6) setRecurringDay(1);
                    if (f === 'monthly' && recurringDay > 31) setRecurringDay(1);
                  }}
                  buttons={[
                    { value: 'monthly', label: 'Aylık', icon: 'calendar-month' },
                    { value: 'weekly', label: 'Haftalık', icon: 'calendar-week' },
                  ]}
                />
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 4 }}>
                  {recurringFreq === 'monthly'
                    ? 'Her ayın kaçında tekrarlansın?'
                    : 'Haftanın hangi günü tekrarlansın?'}
                </Text>
                <View style={styles.dayGrid}>
                  {recurringFreq === 'monthly'
                    ? Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                        <Chip
                          key={d}
                          selected={recurringDay === d}
                          onPress={() => setRecurringDay(d)}
                          compact
                          style={{
                            backgroundColor:
                              recurringDay === d ? theme.colors.primaryContainer : theme.colors.surface,
                          }}
                        >
                          {String(d)}
                        </Chip>
                      ))
                    : ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map((name, i) => (
                        <Chip
                          key={i}
                          selected={recurringDay === i}
                          onPress={() => setRecurringDay(i)}
                          compact
                          style={{
                            backgroundColor:
                              recurringDay === i ? theme.colors.primaryContainer : theme.colors.surface,
                          }}
                        >
                          {name}
                        </Chip>
                      ))}
                </View>
                <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                  Hatırlatıcı: Dashboard'da "Yaklaşan ödemeler" kartında görünecek. Mobilde kurulum yapılıysa bildirim de alırsın.
                </Text>
              </View>
            ) : null}
          </View>

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
        {error ?? ''}
      </Snackbar>
      <Snackbar visible={!!toast} onDismiss={() => setToast(null)} duration={2500}>
        {toast ?? ''}
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
  ocrRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: designTokens.spacing.sm,
  },
  ocrButton: {
    alignSelf: 'stretch',
  },
  recurringPanel: {
    marginTop: designTokens.spacing.lg,
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.25)',
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  recurringHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
