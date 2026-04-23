import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Portal,
  SegmentedButtons,
  Snackbar,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useData } from '../context/DataContext';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAdmin } from '../context/AdminContext';
import { useGroup } from '../context/GroupContext';
import type { Category, TransactionType } from '../db';
import { GlassCard } from '../components/GlassCard';
import { GradientBackground } from '../components/GradientBackground';
import { designTokens } from '../theme';
import { exportTransactionsToExcel, exportTransactionsToPdf } from '../utils/export';
import { currentMonthKey, toIsoDate } from '../utils/format';

const PALETTE = [
  '#EF4444', '#F59E0B', '#EAB308', '#10B981', '#06B6D4',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
];

const ICON_CHOICES = [
  'food', 'home-city', 'file-document', 'gamepad-variant', 'bus', 'heart-pulse',
  'cash', 'trending-up', 'cart', 'school', 'dog', 'airplane', 'dots-horizontal',
];

type ExportRange = 'all' | 'month' | 'custom';

export default function SettingsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { mode, setMode } = useAppTheme();
  const { user, signOutUser } = useAuth();
  const { isAdmin, undismissedAnnouncements, visibleAnnouncements } = useAdmin();
  const { activeGroup, available: groupsAvailable } = useGroup();
  const { categories, transactions, addCategory, updateCategory, deleteCategory, resetAll } = useData();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState<TransactionType | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [exportRange, setExportRange] = useState<ExportRange>('all');
  const [exportFrom, setExportFrom] = useState<string>('');
  const [exportTo, setExportTo] = useState<string>(toIsoDate(new Date()));
  const [busy, setBusy] = useState<'excel' | 'pdf' | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const resolvedRange = useMemo(() => {
    if (exportRange === 'all') return { from: undefined, to: undefined };
    if (exportRange === 'month') {
      const key = currentMonthKey();
      return { from: `${key}-01`, to: toIsoDate(new Date()) };
    }
    return { from: exportFrom || undefined, to: exportTo || undefined };
  }, [exportRange, exportFrom, exportTo]);

  const runExport = async (kind: 'excel' | 'pdf') => {
    setBusy(kind);
    try {
      const fn = kind === 'excel' ? exportTransactionsToExcel : exportTransactionsToPdf;
      await fn({
        transactions,
        categories,
        from: resolvedRange.from,
        to: resolvedRange.to,
        title: 'Ev Bütçe Raporu',
      });
      setToast(kind === 'excel' ? 'Excel dışa aktarıldı.' : 'PDF hazır.');
    } catch (e) {
      setToast((e as Error).message ?? 'Dışa aktarım başarısız.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {user ? (
            <GlassCard tone="primary" padding="lg">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.md }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: theme.colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: theme.colors.onPrimary, fontSize: 24, fontWeight: '700' }}>
                    {(user.displayName ?? user.email ?? '?').trim().charAt(0).toLocaleUpperCase('tr')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
                    {user.displayName || 'Hesap'}
                  </Text>
                  <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                    {user.email}
                  </Text>
                </View>
                <IconButton icon="logout" onPress={() => signOutUser()} />
              </View>
            </GlassCard>
          ) : null}

          <GlassCard padding="lg">
            <SectionTitle icon="theme-light-dark">Görünüm</SectionTitle>
            <View style={styles.row}>
              <Text style={{ color: theme.colors.onSurface }}>Koyu tema</Text>
              <Switch value={mode === 'dark'} onValueChange={(v) => setMode(v ? 'dark' : 'light')} />
            </View>
          </GlassCard>

          {visibleAnnouncements.length > 0 ? (
            <GlassCard padding="lg">
              <SectionTitle icon="bullhorn-outline">Duyurular</SectionTitle>
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 10 }]}>
                {undismissedAnnouncements.length > 0
                  ? `${undismissedAnnouncements.length} okunmamış duyuru var.`
                  : `${visibleAnnouncements.length} aktif duyuru.`}
              </Text>
              <Button
                mode="contained-tonal"
                icon="arrow-right"
                onPress={() => navigation.navigate('Announcements')}
              >
                Duyuruları görüntüle
              </Button>
            </GlassCard>
          ) : null}

          <GlassCard padding="lg">
            <SectionTitle icon="information-outline">Hakkında</SectionTitle>
            <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 10 }]}>
              İletişim bilgileri, destek ve sosyal bağlantılar.
            </Text>
            <Button
              mode="outlined"
              icon="information-outline"
              onPress={() => navigation.navigate('About')}
            >
              Hakkında sayfasını aç
            </Button>
          </GlassCard>

          {isAdmin ? (
            <GlassCard tone="primary" padding="lg">
              <SectionTitle icon="shield-account">Admin</SectionTitle>
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 10 }]}>
                Site ayarlarını, SEO'yu ve kullanıcı duyurularını bu panelden yönetin.
              </Text>
              <Button
                mode="contained"
                icon="shield-account"
                onPress={() => navigation.navigate('AdminPanel')}
              >
                Admin Paneli
              </Button>
            </GlassCard>
          ) : null}

          {groupsAvailable ? (
            <GlassCard padding="lg">
              <SectionTitle icon="account-group">Aile Grubu</SectionTitle>
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 10 }]}>
                {activeGroup
                  ? `Aktif: ${activeGroup.name} (${activeGroup.memberIds.length} üye). Tüm işlemler grup üyeleriyle paylaşılır.`
                  : 'Bu cihazda yerel veri kullanılıyor. Bir grup oluştur veya davet kodu ile katıl.'}
              </Text>
              <Button
                mode={activeGroup ? 'outlined' : 'contained'}
                icon="account-multiple-plus"
                onPress={() => navigation.navigate('FamilyGroup')}
              >
                {activeGroup ? 'Grubu yönet' : 'Grup oluştur / katıl'}
              </Button>
            </GlassCard>
          ) : null}

          <GlassCard padding="lg">
            <SectionTitle icon="file-export-outline">Dışa Aktar</SectionTitle>
            <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 10 }]}>
              Gelir/gider verilerinizi Excel ya da PDF olarak indirin.
            </Text>
            <SegmentedButtons
              value={exportRange}
              onValueChange={(v) => setExportRange(v as ExportRange)}
              buttons={[
                { value: 'all', label: 'Tümü' },
                { value: 'month', label: 'Bu Ay' },
                { value: 'custom', label: 'Aralık' },
              ]}
              style={{ marginBottom: 12 }}
            />
            {exportRange === 'custom' ? (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TextInput
                  label="Başlangıç (YYYY-MM-DD)"
                  value={exportFrom}
                  onChangeText={setExportFrom}
                  mode="outlined"
                  style={{ flex: 1 }}
                />
                <TextInput
                  label="Bitiş (YYYY-MM-DD)"
                  value={exportTo}
                  onChangeText={setExportTo}
                  mode="outlined"
                  style={{ flex: 1 }}
                />
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button
                mode="contained"
                icon="file-excel"
                loading={busy === 'excel'}
                disabled={busy !== null}
                onPress={() => runExport('excel')}
                style={{ flex: 1 }}
              >
                Excel (.xlsx)
              </Button>
              <Button
                mode="contained-tonal"
                icon="file-pdf-box"
                loading={busy === 'pdf'}
                disabled={busy !== null}
                onPress={() => runExport('pdf')}
                style={{ flex: 1 }}
              >
                PDF
              </Button>
            </View>
          </GlassCard>

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

          <GlassCard padding="lg">
            <SectionTitle icon="database-alert">Veri</SectionTitle>
            <Button
              mode="outlined"
              icon="restore"
              textColor={theme.colors.error}
              onPress={() => setResetOpen(true)}
              style={{ borderColor: theme.colors.error }}
            >
              Tüm verileri sıfırla
            </Button>
          </GlassCard>

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
                <Text>Tüm işlemler, alışveriş listeleri ve notlar silinir. Kategoriler varsayılana döner.</Text>
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
      </SafeAreaView>
      <Snackbar visible={!!toast} onDismiss={() => setToast(null)} duration={3000}>
        {toast}
      </Snackbar>
    </View>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>{children}</Text>
    </View>
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
  const theme = useTheme();
  return (
    <GlassCard padding="lg">
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, flex: 1 }]}>
          {title}
        </Text>
        <IconButton icon="plus" onPress={onAdd} />
      </View>
      {categories.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Kategori yok.</Text>
      ) : (
        categories.map((cat, idx) => (
          <React.Fragment key={cat.id}>
            {idx > 0 && <Divider />}
            <List.Item
              title={cat.name}
              titleStyle={{ color: theme.colors.onSurface }}
              style={{ paddingLeft: 0 }}
              left={() => (
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: cat.color + '22',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: 0,
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
    </GlassCard>
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
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 120,
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
