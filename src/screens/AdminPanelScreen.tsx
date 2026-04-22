import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
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
import { collection, getDocs, query, where } from 'firebase/firestore';
import { GlassCard } from '../components/GlassCard';
import { GradientBackground } from '../components/GradientBackground';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import {
  Announcement,
  AnnouncementCategory,
  SocialLink,
  commitAdminChanges,
  deleteAnnouncement,
  saveSiteConfig,
  subscribeAdmins,
  upsertAnnouncement,
} from '../db/siteConfig';
import { getDb } from '../firebase';
import { designTokens } from '../theme';

type TabKey = 'general' | 'seo' | 'contact' | 'announcements' | 'admins';

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'general', label: 'Genel', icon: 'tune' },
  { key: 'seo', label: 'SEO', icon: 'earth' },
  { key: 'contact', label: 'İletişim', icon: 'phone' },
  { key: 'announcements', label: 'Duyurular', icon: 'bullhorn' },
  { key: 'admins', label: 'Yöneticiler', icon: 'shield-account' },
];

export default function AdminPanelScreen() {
  const theme = useTheme();
  const { isAdmin, siteConfig } = useAdmin();
  const [tab, setTab] = useState<TabKey>('general');
  const [toast, setToast] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1 }}>
        <GradientBackground />
        <SafeAreaView edges={['bottom']} style={{ flex: 1, justifyContent: 'center' }}>
          <GlassCard padding="lg" style={{ margin: designTokens.spacing.lg, alignItems: 'center' }}>
            <MaterialCommunityIcons name="lock-outline" size={36} color={theme.colors.onSurfaceVariant} />
            <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, marginTop: 6 }]}>
              Bu sayfa yalnızca yönetici hesaplarına açıktır.
            </Text>
          </GlassCard>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={[designTokens.typography.title, { color: theme.colors.onSurface }]}>
            Admin Paneli
          </Text>
          <Text
            style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 2 }]}
          >
            Site ayarları, iletişim bilgileri ve kullanıcı duyuruları.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <Chip
                  key={t.key}
                  icon={t.icon}
                  selected={active}
                  showSelectedCheck={false}
                  onPress={() => setTab(t.key)}
                  style={{
                    marginRight: 8,
                    backgroundColor: active ? theme.colors.primaryContainer : undefined,
                  }}
                >
                  {t.label}
                </Chip>
              );
            })}
          </ScrollView>

          {tab === 'general' ? (
            <GeneralTab siteConfig={siteConfig} onToast={setToast} />
          ) : tab === 'seo' ? (
            <SeoTab siteConfig={siteConfig} onToast={setToast} />
          ) : tab === 'contact' ? (
            <ContactTab siteConfig={siteConfig} onToast={setToast} />
          ) : tab === 'announcements' ? (
            <AnnouncementsTab onToast={setToast} />
          ) : (
            <AdminsTab onToast={setToast} />
          )}
        </ScrollView>
      </SafeAreaView>
      <Snackbar
        visible={!!toast}
        onDismiss={() => setToast(null)}
        duration={2600}
      >
        {toast ?? ''}
      </Snackbar>
    </View>
  );
}

// -----------------------------------------------------------------------------
// Genel & SEO tabs
// -----------------------------------------------------------------------------

function GeneralTab({ siteConfig, onToast }: { siteConfig: typeof import('../db/siteConfig').DEFAULT_SITE_CONFIG; onToast: (msg: string) => void }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [siteName, setSiteName] = useState(siteConfig.siteName);
  const [logoUrl, setLogoUrl] = useState(siteConfig.logoUrl);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSiteName(siteConfig.siteName);
    setLogoUrl(siteConfig.logoUrl);
  }, [siteConfig.siteName, siteConfig.logoUrl]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveSiteConfig({ siteName: siteName.trim(), logoUrl: logoUrl.trim() }, user.uid);
      onToast('Genel ayarlar kaydedildi.');
    } catch (e) {
      onToast((e as Error).message ?? 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard padding="lg" style={styles.tabCard}>
      <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, marginBottom: 10 }]}>
        Site Kimliği
      </Text>
      <TextInput
        label="Site adı"
        value={siteName}
        onChangeText={setSiteName}
        mode="outlined"
        style={{ marginBottom: 12 }}
      />
      <TextInput
        label="Logo URL (https://...)"
        value={logoUrl}
        onChangeText={setLogoUrl}
        mode="outlined"
        autoCapitalize="none"
        placeholder="https://example.com/logo.png"
      />
      {logoUrl ? (
        <View style={styles.logoPreview}>
          <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 6 }]}>
            Önizleme
          </Text>
          <Image
            source={{ uri: logoUrl }}
            style={{ width: 120, height: 120, borderRadius: 12, backgroundColor: theme.colors.surfaceVariant }}
            resizeMode="contain"
          />
        </View>
      ) : null}
      <Button
        mode="contained"
        icon="content-save"
        loading={saving}
        disabled={saving}
        onPress={save}
        style={{ marginTop: 16 }}
      >
        Kaydet
      </Button>
    </GlassCard>
  );
}

function SeoTab({ siteConfig, onToast }: { siteConfig: typeof import('../db/siteConfig').DEFAULT_SITE_CONFIG; onToast: (msg: string) => void }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [seoTitle, setSeoTitle] = useState(siteConfig.seoTitle);
  const [seoDescription, setSeoDescription] = useState(siteConfig.seoDescription);
  const [seoKeywords, setSeoKeywords] = useState(siteConfig.seoKeywords);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSeoTitle(siteConfig.seoTitle);
    setSeoDescription(siteConfig.seoDescription);
    setSeoKeywords(siteConfig.seoKeywords);
  }, [siteConfig.seoTitle, siteConfig.seoDescription, siteConfig.seoKeywords]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveSiteConfig(
        {
          seoTitle: seoTitle.trim(),
          seoDescription: seoDescription.trim(),
          seoKeywords: seoKeywords.trim(),
        },
        user.uid
      );
      onToast('SEO ayarları kaydedildi.');
    } catch (e) {
      onToast((e as Error).message ?? 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard padding="lg" style={styles.tabCard}>
      <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, marginBottom: 10 }]}>
        Arama Motoru Görünümü
      </Text>
      <TextInput
        label="Başlık (title)"
        value={seoTitle}
        onChangeText={setSeoTitle}
        mode="outlined"
        style={{ marginBottom: 12 }}
      />
      <TextInput
        label="Açıklama (description)"
        value={seoDescription}
        onChangeText={setSeoDescription}
        multiline
        numberOfLines={3}
        mode="outlined"
        style={{ marginBottom: 12 }}
      />
      <TextInput
        label="Anahtar kelimeler (virgülle)"
        value={seoKeywords}
        onChangeText={setSeoKeywords}
        mode="outlined"
      />
      <View style={[styles.seoPreview, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
          ÖNİZLEME
        </Text>
        <Text style={{ color: '#1a0dab', fontSize: 18 }} numberOfLines={1}>
          {seoTitle || '—'}
        </Text>
        <Text style={{ color: '#006621', fontSize: 13 }} numberOfLines={1}>
          https://ev-butce.example.com
        </Text>
        <Text style={{ color: theme.colors.onSurface, fontSize: 13 }} numberOfLines={2}>
          {seoDescription || '—'}
        </Text>
      </View>
      <Button
        mode="contained"
        icon="content-save"
        loading={saving}
        disabled={saving}
        onPress={save}
        style={{ marginTop: 16 }}
      >
        Kaydet
      </Button>
    </GlassCard>
  );
}

function ContactTab({ siteConfig, onToast }: { siteConfig: typeof import('../db/siteConfig').DEFAULT_SITE_CONFIG; onToast: (msg: string) => void }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [email, setEmail] = useState(siteConfig.contactEmail);
  const [phone, setPhone] = useState(siteConfig.contactPhone);
  const [address, setAddress] = useState(siteConfig.contactAddress);
  const [support, setSupport] = useState(siteConfig.supportUrl);
  const [links, setLinks] = useState<SocialLink[]>(siteConfig.socialLinks);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmail(siteConfig.contactEmail);
    setPhone(siteConfig.contactPhone);
    setAddress(siteConfig.contactAddress);
    setSupport(siteConfig.supportUrl);
    setLinks(siteConfig.socialLinks);
  }, [siteConfig]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveSiteConfig(
        {
          contactEmail: email.trim(),
          contactPhone: phone.trim(),
          contactAddress: address.trim(),
          supportUrl: support.trim(),
          socialLinks: links
            .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
            .filter((l) => l.label && l.url),
        },
        user.uid
      );
      onToast('İletişim bilgileri kaydedildi.');
    } catch (e) {
      onToast((e as Error).message ?? 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard padding="lg" style={styles.tabCard}>
      <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, marginBottom: 10 }]}>
        İletişim Bilgileri
      </Text>
      <TextInput label="E-posta" value={email} onChangeText={setEmail} mode="outlined" autoCapitalize="none" style={{ marginBottom: 10 }} />
      <TextInput label="Telefon" value={phone} onChangeText={setPhone} mode="outlined" style={{ marginBottom: 10 }} />
      <TextInput label="Adres" value={address} onChangeText={setAddress} mode="outlined" multiline numberOfLines={2} style={{ marginBottom: 10 }} />
      <TextInput label="Destek/yardım URL" value={support} onChangeText={setSupport} mode="outlined" autoCapitalize="none" />

      <Divider style={{ marginVertical: 14 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
          Sosyal Bağlantılar
        </Text>
        <Button
          mode="contained-tonal"
          compact
          icon="plus"
          onPress={() => setLinks((l) => [...l, { label: '', url: '' }])}
        >
          Ekle
        </Button>
      </View>
      {links.length === 0 ? (
        <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 8 }]}>
          Henüz sosyal bağlantı yok.
        </Text>
      ) : (
        links.map((l, i) => (
          <View key={i} style={styles.linkRow}>
            <TextInput
              label="Etiket"
              value={l.label}
              onChangeText={(v) => setLinks((prev) => prev.map((x, idx) => (idx === i ? { ...x, label: v } : x)))}
              mode="outlined"
              dense
              style={{ flex: 1 }}
            />
            <TextInput
              label="URL"
              value={l.url}
              onChangeText={(v) => setLinks((prev) => prev.map((x, idx) => (idx === i ? { ...x, url: v } : x)))}
              mode="outlined"
              dense
              autoCapitalize="none"
              style={{ flex: 2 }}
            />
            <IconButton
              icon="trash-can-outline"
              onPress={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </View>
        ))
      )}

      <Button
        mode="contained"
        icon="content-save"
        loading={saving}
        disabled={saving}
        onPress={save}
        style={{ marginTop: 16 }}
      >
        Kaydet
      </Button>
    </GlassCard>
  );
}

// -----------------------------------------------------------------------------
// Announcements tab
// -----------------------------------------------------------------------------

interface AnnouncementDraft {
  id?: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  ctaLabel: string;
  ctaUrl: string;
  publishAt: string;
  expiresAt: string;
  active: boolean;
}

function emptyDraft(): AnnouncementDraft {
  return {
    title: '',
    body: '',
    category: 'news',
    ctaLabel: '',
    ctaUrl: '',
    publishAt: new Date().toISOString(),
    expiresAt: '',
    active: true,
  };
}

function AnnouncementsTab({ onToast }: { onToast: (msg: string) => void }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { announcements } = useAdmin();
  const [draft, setDraft] = useState<AnnouncementDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => setDraft(emptyDraft());
  const openEdit = (a: Announcement) =>
    setDraft({
      id: a.id,
      title: a.title,
      body: a.body,
      category: a.category,
      ctaLabel: a.ctaLabel ?? '',
      ctaUrl: a.ctaUrl ?? '',
      publishAt: a.publishAt,
      expiresAt: a.expiresAt ?? '',
      active: a.active,
    });

  const persist = async () => {
    if (!draft || !user) return;
    if (!draft.title.trim()) {
      onToast('Başlık boş olamaz.');
      return;
    }
    setSaving(true);
    try {
      await upsertAnnouncement({
        id: draft.id,
        title: draft.title.trim(),
        body: draft.body,
        category: draft.category,
        ctaLabel: draft.ctaLabel.trim() || undefined,
        ctaUrl: draft.ctaUrl.trim() || undefined,
        publishAt: draft.publishAt || new Date().toISOString(),
        expiresAt: draft.expiresAt || undefined,
        active: draft.active,
        createdBy: user.uid,
      });
      onToast(draft.id ? 'Duyuru güncellendi.' : 'Duyuru yayınlandı.');
      setDraft(null);
    } catch (e) {
      onToast((e as Error).message ?? 'Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (a: Announcement) => {
    try {
      await deleteAnnouncement(a.id);
      onToast('Duyuru silindi.');
    } catch (e) {
      onToast((e as Error).message ?? 'Silme başarısız.');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <GlassCard padding="lg" style={styles.tabCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
          Duyurular ({announcements.length})
        </Text>
        <Button mode="contained" icon="plus" onPress={openNew}>
          Yeni Duyuru
        </Button>
      </View>

      {announcements.length === 0 ? (
        <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 12 }]}>
          Henüz duyuru yok. Yeni bir duyuru oluştur.
        </Text>
      ) : (
        announcements.map((a) => (
          <View key={a.id} style={[styles.rowItem, { borderTopColor: theme.colors.outlineVariant }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Chip compact style={{ height: 22 }} textStyle={{ fontSize: 10 }}>
                  {a.category}
                </Chip>
                {!a.active ? (
                  <Chip compact style={{ height: 22, backgroundColor: theme.colors.surfaceVariant }} textStyle={{ fontSize: 10 }}>
                    pasif
                  </Chip>
                ) : null}
              </View>
              <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{a.title}</Text>
              <Text
                style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}
                numberOfLines={1}
              >
                {a.body || '—'}
              </Text>
            </View>
            <IconButton icon="pencil-outline" onPress={() => openEdit(a)} />
            <IconButton icon="trash-can-outline" onPress={() => setConfirmDelete(a)} />
          </View>
        ))
      )}

      <Portal>
        <Dialog visible={!!draft} onDismiss={() => setDraft(null)}>
          <Dialog.Title>{draft?.id ? 'Duyuruyu Düzenle' : 'Yeni Duyuru'}</Dialog.Title>
          <Dialog.ScrollArea>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 6 }}>
              {draft ? (
                <View style={{ gap: 10 }}>
                  <TextInput
                    label="Başlık"
                    value={draft.title}
                    onChangeText={(v) => setDraft({ ...draft, title: v })}
                    mode="outlined"
                  />
                  <SegmentedButtons
                    value={draft.category}
                    onValueChange={(v) => setDraft({ ...draft, category: v as AnnouncementCategory })}
                    buttons={[
                      { value: 'news', label: 'Haber', icon: 'newspaper-variant' },
                      { value: 'campaign', label: 'Kampanya', icon: 'gift-outline' },
                      { value: 'system', label: 'Sistem', icon: 'information-outline' },
                    ]}
                  />
                  <TextInput
                    label="İçerik (Markdown destekli)"
                    value={draft.body}
                    onChangeText={(v) => setDraft({ ...draft, body: v })}
                    mode="outlined"
                    multiline
                    numberOfLines={6}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      label="CTA metin"
                      value={draft.ctaLabel}
                      onChangeText={(v) => setDraft({ ...draft, ctaLabel: v })}
                      mode="outlined"
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      label="CTA URL"
                      value={draft.ctaUrl}
                      onChangeText={(v) => setDraft({ ...draft, ctaUrl: v })}
                      mode="outlined"
                      autoCapitalize="none"
                      style={{ flex: 2 }}
                    />
                  </View>
                  <TextInput
                    label="Yayın tarihi (ISO)"
                    value={draft.publishAt}
                    onChangeText={(v) => setDraft({ ...draft, publishAt: v })}
                    mode="outlined"
                    autoCapitalize="none"
                  />
                  <TextInput
                    label="Bitiş tarihi (opsiyonel, ISO)"
                    value={draft.expiresAt}
                    onChangeText={(v) => setDraft({ ...draft, expiresAt: v })}
                    mode="outlined"
                    autoCapitalize="none"
                  />
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.colors.onSurface }}>Aktif</Text>
                    <Switch value={draft.active} onValueChange={(v) => setDraft({ ...draft, active: v })} />
                  </View>
                </View>
              ) : null}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDraft(null)}>Vazgeç</Button>
            <Button mode="contained" onPress={persist} loading={saving} disabled={saving}>
              Kaydet
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={!!confirmDelete} onDismiss={() => setConfirmDelete(null)}>
          <Dialog.Title>Duyuru silinsin mi?</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              “{confirmDelete?.title}” kalıcı olarak silinecek.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDelete(null)}>Vazgeç</Button>
            <Button
              mode="contained"
              buttonColor={theme.colors.error}
              onPress={() => confirmDelete && doDelete(confirmDelete)}
            >
              Sil
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </GlassCard>
  );
}

// -----------------------------------------------------------------------------
// Admins tab
// -----------------------------------------------------------------------------

interface AdminRow {
  userId: string;
  email: string;
}

function AdminsTab({ onToast }: { onToast: (msg: string) => void }) {
  const theme = useTheme();
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeAdmins((items) => setAdmins(items.map((a) => ({ userId: a.userId, email: a.email }))));
    return () => unsub();
  }, []);

  const add = async () => {
    if (!user) return;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setSaving(true);
    try {
      // Look up user by email in the `users` collection (written on sign-in).
      const q = query(collection(getDb(), 'users'), where('email', '==', trimmed));
      const snap = await getDocs(q);
      if (snap.empty) {
        onToast('Bu e-posta ile kayıtlı kullanıcı bulunamadı. Önce bu hesabın uygulamaya giriş yapmış olması gerekir.');
        return;
      }
      const target = snap.docs[0];
      if (admins.some((a) => a.userId === target.id)) {
        onToast('Bu kullanıcı zaten yönetici.');
        return;
      }
      await commitAdminChanges({
        add: [{ userId: target.id, email: trimmed, addedBy: user.uid }],
        remove: [],
      });
      setEmail('');
      onToast('Yönetici eklendi.');
    } catch (e) {
      onToast((e as Error).message ?? 'Ekleme başarısız.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: AdminRow) => {
    if (!user) return;
    if (row.userId === user.uid) {
      onToast('Kendinizi yönetici listesinden çıkaramazsınız.');
      return;
    }
    try {
      await commitAdminChanges({ add: [], remove: [row.userId] });
      onToast('Yönetici kaldırıldı.');
    } catch (e) {
      onToast((e as Error).message ?? 'Silme başarısız.');
    }
  };

  return (
    <GlassCard padding="lg" style={styles.tabCard}>
      <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, marginBottom: 10 }]}>
        Yönetici Listesi ({admins.length})
      </Text>
      <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 10 }]}>
        Yeni yönetici eklemek için kullanıcının önce uygulamaya en az bir kez giriş yapmış olması gerekir.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          autoCapitalize="none"
          style={{ flex: 1 }}
        />
        <Button mode="contained" icon="plus" onPress={add} loading={saving} disabled={saving}>
          Ekle
        </Button>
      </View>

      <Divider style={{ marginVertical: 14 }} />

      {admins.length === 0 ? (
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Henüz yönetici yok.</Text>
      ) : (
        admins.map((a) => (
          <View key={a.userId} style={[styles.rowItem, { borderTopColor: theme.colors.outlineVariant }]}>
            <MaterialCommunityIcons name="shield-account" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>{a.email}</Text>
              <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                {a.userId === user?.uid ? 'Siz' : a.userId}
              </Text>
            </View>
            <IconButton
              icon="trash-can-outline"
              onPress={() => remove(a)}
              disabled={a.userId === user?.uid}
            />
          </View>
        ))
      )}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.lg,
    paddingBottom: 120,
    gap: designTokens.spacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  tabCard: {
    marginTop: 4,
  },
  logoPreview: {
    marginTop: 14,
    alignItems: 'flex-start',
  },
  seoPreview: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    gap: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
