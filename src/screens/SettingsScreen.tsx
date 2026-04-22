import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  SegmentedButtons,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import type { Category, TransactionType } from '../db';

const PALETTE = [
  '#EF4444', '#F59E0B', '#EAB308', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
];

const ICON_CHOICES = [
  'food', 'home-city', 'file-document', 'gamepad-variant', 'bus', 'heart-pulse',
  'cash', 'trending-up', 'cart', 'school', 'dog', 'airplane', 'dots-horizontal',
];

export default function SettingsScreen() {
  const theme = useTheme();
  const { mode, setMode } = useAppTheme();
  const { categories, addCategory, updateCategory, deleteCategory, resetAll } = useData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState<TransactionType | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Card mode="elevated">
        <Card.Title title="Görünüm" titleVariant="titleMedium" />
        <Card.Content>
          <View style={styles.row}>
            <Text>Koyu tema</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
            />
          </View>
        </Card.Content>
      </Card>

      <CategoryGroup
        title="Gider Kategorileri"
        type="expense"
        categories={categories.filter((c) => c.type === 'expense')}
        onEdit={setEditing}
        onDelete={deleteCategory}
        onAdd={() => setCreating('expense')}
      />
      <CategoryGroup
        title="Gelir Kategorileri"
        type="income"
        categories={categories.filter((c) => c.type === 'income')}
        onEdit={setEditing}
        onDelete={deleteCategory}
        onAdd={() => setCreating('income')}
      />

      <Card mode="elevated">
        <Card.Title title="Veri" titleVariant="titleMedium" />
        <Card.Content>
          <Button
            mode="outlined"
            icon="restore"
            textColor={theme.colors.error}
            onPress={() => setResetOpen(true)}
          >
            Tüm verileri sıfırla
          </Button>
        </Card.Content>
      </Card>

      <Portal>
        <CategoryDialog
          visible={!!editing || !!creating}
          initial={editing ?? undefined}
          defaultType={creating ?? 'expense'}
          onDismiss={() => {
            setEditing(null);
            setCreating(null);
          }}
          onSave={async (draft) => {
            if (editing) {
              await updateCategory({ ...editing, ...draft });
            } else {
              await addCategory(draft);
            }
            setEditing(null);
            setCreating(null);
          }}
        />

        <Dialog visible={resetOpen} onDismiss={() => setResetOpen(false)}>
          <Dialog.Title>Verileri sıfırla</Dialog.Title>
          <Dialog.Content>
            <Text>Tüm işlemler ve kategoriler varsayılanlara döner. Bu işlem geri alınamaz.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetOpen(false)}>Vazgeç</Button>
            <Button
              textColor={theme.colors.error}
              onPress={async () => {
                await resetAll();
                setResetOpen(false);
              }}
            >
              Sıfırla
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

interface CategoryGroupProps {
  title: string;
  type: TransactionType;
  categories: Category[];
  onEdit: (c: Category) => void;
  onDelete: (id: string) => Promise<void>;
  onAdd: () => void;
}

function CategoryGroup({ title, categories, onEdit, onDelete, onAdd }: CategoryGroupProps) {
  return (
    <Card mode="elevated">
      <Card.Title
        title={title}
        titleVariant="titleMedium"
        right={(props) => <IconButton {...props} icon="plus" onPress={onAdd} />}
      />
      <Card.Content style={{ paddingHorizontal: 0 }}>
        {categories.length === 0 ? (
          <Text style={{ padding: 16 }}>Kategori yok.</Text>
        ) : (
          categories.map((cat, idx) => (
            <React.Fragment key={cat.id}>
              {idx > 0 && <Divider />}
              <List.Item
                title={cat.name}
                left={() => (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: cat.color + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 8,
                    }}
                  >
                    <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                  </View>
                )}
                right={() => (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="pencil" onPress={() => onEdit(cat)} />
                    <IconButton icon="trash-can-outline" onPress={() => onDelete(cat.id)} />
                  </View>
                )}
              />
            </React.Fragment>
          ))
        )}
      </Card.Content>
    </Card>
  );
}

interface CategoryDialogProps {
  visible: boolean;
  initial?: Category;
  defaultType: TransactionType;
  onDismiss: () => void;
  onSave: (draft: Omit<Category, 'id'>) => Promise<void>;
}

function CategoryDialog({ visible, initial, defaultType, onDismiss, onSave }: CategoryDialogProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? PALETTE[0]);
  const [icon, setIcon] = useState(initial?.icon ?? 'tag');
  const [type, setType] = useState<TransactionType>(initial?.type ?? defaultType);

  React.useEffect(() => {
    if (visible) {
      setName(initial?.name ?? '');
      setColor(initial?.color ?? PALETTE[0]);
      setIcon(initial?.icon ?? 'tag');
      setType(initial?.type ?? defaultType);
    }
  }, [visible, initial, defaultType]);

  return (
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{initial ? 'Kategoriyi Düzenle' : 'Yeni Kategori'}</Dialog.Title>
      <Dialog.Content>
        <View style={{ gap: 12 }}>
          <TextInput
            mode="outlined"
            label="Ad"
            value={name}
            onChangeText={setName}
          />
          <SegmentedButtons
            value={type}
            onValueChange={(v) => setType(v as TransactionType)}
            buttons={[
              { value: 'expense', label: 'Gider' },
              { value: 'income', label: 'Gelir' },
            ]}
          />
          <Text variant="labelMedium">Renk</Text>
          <View style={styles.palette}>
            {PALETTE.map((c) => (
              <IconButton
                key={c}
                icon={color === c ? 'check' : 'circle'}
                iconColor={color === c ? '#fff' : c}
                containerColor={c}
                size={18}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
          <Text variant="labelMedium">İkon</Text>
          <View style={styles.palette}>
            {ICON_CHOICES.map((i) => (
              <IconButton
                key={i}
                icon={i}
                onPress={() => setIcon(i)}
                mode={icon === i ? 'contained' : undefined}
              />
            ))}
          </View>
        </View>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>İptal</Button>
        <Button
          mode="contained"
          disabled={name.trim().length === 0}
          onPress={() => onSave({ name: name.trim(), color, icon, type })}
        >
          Kaydet
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 80,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});
