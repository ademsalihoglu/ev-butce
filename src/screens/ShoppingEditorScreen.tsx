import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { useData } from '../context/DataContext';
import { RootStackParamList } from '../navigation/types';
import { designTokens } from '../theme';
import { ShoppingItem } from '../db';

type Props = NativeStackScreenProps<RootStackParamList, 'ShoppingEditor'>;

export default function ShoppingEditorScreen({ route, navigation }: Props) {
  const id = route.params?.id;
  const theme = useTheme();
  const { shoppingItems, categories, addShoppingItem, updateShoppingItem } = useData();
  const existing = useMemo(() => shoppingItems.find((it) => it.id === id), [shoppingItems, id]);

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );

  const [name, setName] = useState(existing?.name ?? '');
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? 1));
  const [unit, setUnit] = useState(existing?.unit ?? 'adet');
  const [price, setPrice] = useState(
    existing ? existing.estimatedPrice.toString() : ''
  );
  const [note, setNote] = useState(existing?.note ?? '');
  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ?? expenseCategories[0]?.id ?? ''
  );
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Ürün adı gerekli.');
      return;
    }
    const qty = Number(quantity.replace(',', '.'));
    const prc = Number(price.replace(',', '.')) || 0;
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Geçerli bir miktar girin.');
      return;
    }
    if (!categoryId) {
      setError('Kategori seçin.');
      return;
    }
    if (existing) {
      const updated: ShoppingItem = {
        ...existing,
        name: name.trim(),
        quantity: qty,
        unit: unit.trim() || 'adet',
        estimatedPrice: prc,
        note: note.trim(),
        categoryId,
      };
      await updateShoppingItem(updated);
    } else {
      await addShoppingItem({
        name: name.trim(),
        quantity: qty,
        unit: unit.trim() || 'adet',
        estimatedPrice: prc,
        note: note.trim(),
        categoryId,
        bought: false,
        convertedTransactionId: null,
        createdAt: new Date().toISOString(),
      });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard padding="xl" radius="xl">
            <Text style={[designTokens.typography.title, { color: theme.colors.onSurface, marginBottom: 12 }]}>
              {existing ? 'Ürünü düzenle' : 'Listeye ürün ekle'}
            </Text>
            <View style={{ gap: designTokens.spacing.md }}>
              <TextInput
                label="Ürün adı"
                value={name}
                onChangeText={setName}
                mode="outlined"
              />
              <View style={{ flexDirection: 'row', gap: designTokens.spacing.sm }}>
                <TextInput
                  label="Miktar"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                  mode="outlined"
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Birim"
                  value={unit}
                  onChangeText={setUnit}
                  mode="outlined"
                  style={{ flex: 1 }}
                />
              </View>
              <TextInput
                label="Tahmini birim fiyat (₺)"
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                mode="outlined"
              />
              <TextInput
                label="Not (opsiyonel)"
                value={note}
                onChangeText={setNote}
                mode="outlined"
                multiline
                numberOfLines={2}
              />
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                Kategori
              </Text>
              <View style={styles.chipRow}>
                {expenseCategories.map((cat) => (
                  <Chip
                    key={cat.id}
                    selected={categoryId === cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    icon={cat.icon}
                    style={{ marginBottom: 6 }}
                  >
                    {cat.name}
                  </Chip>
                ))}
              </View>
              {error ? (
                <HelperText type="error" visible>
                  {error}
                </HelperText>
              ) : null}
              <Button mode="contained" onPress={handleSave} icon="content-save" contentStyle={{ paddingVertical: 6 }}>
                Kaydet
              </Button>
              <Button onPress={() => navigation.goBack()}>İptal</Button>
            </View>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: designTokens.spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
