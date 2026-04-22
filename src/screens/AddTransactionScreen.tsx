import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  SegmentedButtons,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DatePickerField } from '../components/DatePickerField';
import { useData } from '../context/DataContext';
import type { RootStackParamList } from '../navigation/types';
import type { TransactionType } from '../db';
import { currentMonthKey, parseAmount, toIsoDate } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'AddTransaction'>;

export default function AddTransactionScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const editingId = route.params?.id;
  const {
    categories,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useData();

  const existing = useMemo(
    () => (editingId ? transactions.find((t) => t.id === editingId) ?? null : null),
    [editingId, transactions]
  );

  const [type, setType] = useState<TransactionType>(existing?.type ?? 'expense');
  const [amount, setAmount] = useState<string>(existing ? String(existing.amount).replace('.', ',') : '');
  const [description, setDescription] = useState<string>(existing?.description ?? '');
  const [date, setDate] = useState<string>(existing?.date ?? toIsoDate(new Date()));
  const [categoryId, setCategoryId] = useState<string>(existing?.categoryId ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: editingId ? 'İşlemi Düzenle' : 'Yeni İşlem' });
  }, [navigation, editingId]);

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
      if (editingId && existing) {
        await updateTransaction({ id: existing.id, ...payload });
      } else {
        await addTransaction(payload);
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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <SegmentedButtons
        value={type}
        onValueChange={(v) => setType(v as TransactionType)}
        buttons={[
          { value: 'expense', label: 'Gider', icon: 'arrow-up' },
          { value: 'income', label: 'Gelir', icon: 'arrow-down' },
        ]}
      />

      <TextInput
        label="Tutar"
        mode="outlined"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0,00"
        left={<TextInput.Affix text="₺" />}
      />

      <TextInput
        label="Açıklama"
        mode="outlined"
        value={description}
        onChangeText={setDescription}
        placeholder="örn. market alışverişi"
      />

      <DatePickerField value={date} onChange={setDate} />

      <View style={{ gap: 8 }}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
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
      </View>

      <Text style={{ color: theme.colors.onSurfaceVariant }} variant="bodySmall">
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

      <Snackbar visible={!!error} onDismiss={() => setError(null)} duration={3000}>
        {error}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
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
    marginTop: 8,
  },
});
