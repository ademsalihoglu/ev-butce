import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Button,
  Chip,
  Dialog,
  Divider,
  IconButton,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { designTokens } from '../theme';
import { useGroup } from '../context/GroupContext';
import { useAuth } from '../context/AuthContext';

export default function FamilyGroupScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const {
    available,
    loading,
    myGroups,
    activeGroup,
    activeGroupId,
    members,
    createGroup,
    joinGroupByCode,
    selectGroup,
    leaveGroup,
    renameGroup,
    rotateInviteCode,
  } = useGroup();

  const [newName, setNewName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ id: string; value: string } | null>(null);
  const [leaveDialog, setLeaveDialog] = useState<{ id: string; isOwner: boolean } | null>(null);

  const isOwner = activeGroup && user && activeGroup.ownerId === user.uid;

  const handleCreate = async () => {
    setBusy('create');
    try {
      const g = await createGroup(newName);
      setNewName('');
      await selectGroup(g.id);
      setToast(`"${g.name}" oluşturuldu. Davet kodu: ${g.inviteCode}`);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleJoin = async () => {
    setBusy('join');
    try {
      const g = await joinGroupByCode(joinCode);
      setJoinCode('');
      await selectGroup(g.id);
      setToast(`"${g.name}" grubuna katıldın.`);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleRotate = async () => {
    if (!activeGroupId) return;
    setBusy('rotate');
    try {
      const code = await rotateInviteCode(activeGroupId);
      setToast(`Yeni davet kodu: ${code}`);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleLeave = async () => {
    if (!leaveDialog) return;
    setBusy('leave');
    try {
      await leaveGroup(leaveDialog.id);
      setToast(leaveDialog.isOwner ? 'Grup silindi.' : 'Gruptan ayrıldın.');
      setLeaveDialog(null);
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const handleRename = async () => {
    if (!renameDialog) return;
    setBusy('rename');
    try {
      await renameGroup(renameDialog.id, renameDialog.value);
      setRenameDialog(null);
      setToast('Grup adı güncellendi.');
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const infoText = useMemo(() => {
    if (!available) return 'Grup özelliği için Firebase yapılandırması gerekli.';
    if (activeGroup)
      return `Aktif grup: ${activeGroup.name}. Tüm işlemler, liste, notlar ve varlıklar bu grupla paylaşılıyor.`;
    return 'Henüz aktif bir grup yok. Bu cihazda yerel veri kullanılıyor.';
  }, [available, activeGroup]);

  if (!available) {
    return (
      <View style={{ flex: 1 }}>
        <GradientBackground />
        <SafeAreaView edges={['bottom']} style={{ flex: 1, padding: designTokens.spacing.lg }}>
          <GlassCard padding="lg">
            <Text style={{ color: theme.colors.onSurface }}>{infoText}</Text>
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
          <GlassCard padding="lg" tone="primary">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.md }}>
              <MaterialCommunityIcons
                name="account-group"
                size={28}
                color={theme.colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
                  Aile Grubu
                </Text>
                <Text
                  style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}
                >
                  {infoText}
                </Text>
              </View>
            </View>
          </GlassCard>

          {loading ? (
            <GlassCard padding="lg">
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            </GlassCard>
          ) : null}

          {myGroups.length > 0 ? (
            <GlassCard padding="lg">
              <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
                Gruplarım
              </Text>
              <Divider style={{ marginVertical: designTokens.spacing.sm }} />
              {myGroups.map((g) => {
                const active = g.id === activeGroupId;
                const owner = user && g.ownerId === user.uid;
                return (
                  <View key={g.id} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                        {g.name} {owner ? '· sahip' : ''}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        {g.memberIds.length} üye · Kod: {g.inviteCode}
                      </Text>
                    </View>
                    {active ? (
                      <Chip compact icon="check" style={{ marginRight: 4 }}>
                        Aktif
                      </Chip>
                    ) : (
                      <Button compact mode="text" onPress={() => selectGroup(g.id)}>
                        Seç
                      </Button>
                    )}
                    <IconButton
                      icon="pencil"
                      size={18}
                      disabled={!owner}
                      onPress={() => setRenameDialog({ id: g.id, value: g.name })}
                    />
                    <IconButton
                      icon="exit-to-app"
                      size={18}
                      iconColor={theme.colors.error}
                      onPress={() => setLeaveDialog({ id: g.id, isOwner: Boolean(owner) })}
                    />
                  </View>
                );
              })}
              {activeGroupId ? (
                <Button mode="text" onPress={() => selectGroup(null)} style={{ marginTop: 4 }}>
                  Yerel moda dön
                </Button>
              ) : null}
            </GlassCard>
          ) : null}

          {activeGroup ? (
            <GlassCard padding="lg">
              <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
                Üyeler ({activeGroup.name})
              </Text>
              <Divider style={{ marginVertical: designTokens.spacing.sm }} />
              {members.length === 0 ? (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Üye yok.</Text>
              ) : (
                members.map((m) => (
                  <View key={m.userId} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                        {m.displayName}
                      </Text>
                      <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                        {m.email}
                      </Text>
                    </View>
                    <Chip compact>{m.role === 'owner' ? 'Sahip' : 'Üye'}</Chip>
                  </View>
                ))
              )}
              <Divider style={{ marginVertical: designTokens.spacing.sm }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
                  Davet kodu:{' '}
                  <Text style={{ fontWeight: '700' }}>{activeGroup.inviteCode}</Text>
                </Text>
                {isOwner ? (
                  <Button
                    mode="outlined"
                    compact
                    loading={busy === 'rotate'}
                    onPress={handleRotate}
                  >
                    Yenile
                  </Button>
                ) : null}
              </View>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, marginTop: 6 }}>
                Bu kodu paylaştığın kişi "Gruba Katıl" alanına girerek ortak bütçeye erişebilir.
              </Text>
            </GlassCard>
          ) : null}

          <GlassCard padding="lg">
            <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
              Yeni Grup Oluştur
            </Text>
            <TextInput
              label="Grup adı"
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              style={{ marginTop: designTokens.spacing.sm }}
            />
            <Button
              mode="contained"
              onPress={handleCreate}
              loading={busy === 'create'}
              disabled={busy !== null || !newName.trim()}
              style={{ marginTop: designTokens.spacing.sm }}
            >
              Oluştur
            </Button>
          </GlassCard>

          <GlassCard padding="lg">
            <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}>
              Gruba Katıl
            </Text>
            <TextInput
              label="Davet kodu"
              value={joinCode}
              onChangeText={(v) => setJoinCode(v.toUpperCase())}
              mode="outlined"
              autoCapitalize="characters"
              maxLength={8}
              style={{ marginTop: designTokens.spacing.sm }}
            />
            <Button
              mode="contained-tonal"
              onPress={handleJoin}
              loading={busy === 'join'}
              disabled={busy !== null || !joinCode.trim()}
              style={{ marginTop: designTokens.spacing.sm }}
            >
              Katıl
            </Button>
          </GlassCard>
        </ScrollView>

        <Portal>
          <Dialog visible={!!renameDialog} onDismiss={() => setRenameDialog(null)}>
            <Dialog.Title>Grubu yeniden adlandır</Dialog.Title>
            <Dialog.Content>
              <TextInput
                value={renameDialog?.value ?? ''}
                onChangeText={(v) => setRenameDialog((prev) => (prev ? { ...prev, value: v } : prev))}
                mode="outlined"
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setRenameDialog(null)}>İptal</Button>
              <Button onPress={handleRename} loading={busy === 'rename'}>
                Kaydet
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={!!leaveDialog} onDismiss={() => setLeaveDialog(null)}>
            <Dialog.Title>{leaveDialog?.isOwner ? 'Grubu sil' : 'Gruptan ayrıl'}</Dialog.Title>
            <Dialog.Content>
              <Text>
                {leaveDialog?.isOwner
                  ? 'Sahibi olduğun bir gruptan ayrılırsan grup silinir. Devam edilsin mi?'
                  : 'Bu gruptan ayrılmak istediğine emin misin?'}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setLeaveDialog(null)}>Vazgeç</Button>
              <Button onPress={handleLeave} loading={busy === 'leave'} textColor={theme.colors.error}>
                Evet
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Snackbar
          visible={!!toast}
          onDismiss={() => setToast(null)}
          duration={4000}
          action={{ label: 'Tamam', onPress: () => setToast(null) }}
        >
          {toast ?? ''}
        </Snackbar>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.md,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
});
