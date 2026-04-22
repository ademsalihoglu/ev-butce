import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, Chip, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { useData } from '../context/DataContext';
import { RootStackParamList } from '../navigation/types';
import { designTokens } from '../theme';
import { Note } from '../db';

type Props = NativeStackScreenProps<RootStackParamList, 'NoteEditor'>;

export default function NoteEditorScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const { notes, addNote, updateNote } = useData();
  const id = route.params?.id;
  const linkedTransactionId = route.params?.linkedTransactionId ?? null;
  const linkedDate = route.params?.linkedDate ?? null;
  const existing = useMemo(() => notes.find((n) => n.id === id), [notes, id]);
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [pinned, setPinned] = useState(existing?.pinned ?? false);

  const save = async () => {
    const now = new Date().toISOString();
    if (existing) {
      const next: Note = {
        ...existing,
        title: title.trim(),
        body,
        pinned,
        updatedAt: now,
      };
      await updateNote(next);
    } else {
      await addNote({
        title: title.trim(),
        body,
        pinned,
        createdAt: now,
        updatedAt: now,
        linkedTransactionId: linkedTransactionId ?? null,
        linkedDate: linkedDate ?? null,
      });
    }
    navigation.goBack();
  };

  const mdStyles = {
    body: { color: theme.colors.onSurface, fontSize: 14, lineHeight: 22 },
    heading1: { color: theme.colors.onSurface, fontSize: 24, fontWeight: '700' as const, marginTop: 12 },
    heading2: { color: theme.colors.onSurface, fontSize: 20, fontWeight: '700' as const, marginTop: 12 },
    heading3: { color: theme.colors.onSurface, fontSize: 16, fontWeight: '700' as const, marginTop: 8 },
    link: { color: theme.colors.primary },
    code_inline: {
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.tertiary,
      padding: 2,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onSurface,
      padding: 8,
      borderRadius: 8,
    },
    fence: {
      backgroundColor: theme.colors.surfaceVariant,
      color: theme.colors.onSurface,
      padding: 8,
      borderRadius: 8,
    },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { color: theme.colors.onSurface },
  };

  const editorPane = (
    <GlassCard padding="lg" radius="xl">
      <TextInput
        label="Başlık"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
      />
      <View style={{ height: designTokens.spacing.md }} />
      <TextInput
        label="İçerik (Markdown destekli)"
        value={body}
        onChangeText={setBody}
        mode="outlined"
        multiline
        numberOfLines={isWide ? 14 : 10}
        style={{ minHeight: isWide ? 320 : 240, textAlignVertical: 'top' }}
      />
      <View style={{ flexDirection: 'row', marginTop: designTokens.spacing.sm }}>
        <Chip
          selected={pinned}
          onPress={() => setPinned((v) => !v)}
          icon={pinned ? 'pin' : 'pin-outline'}
        >
          Sabitle
        </Chip>
      </View>
    </GlassCard>
  );

  const previewPane = (
    <GlassCard padding="lg" radius="xl">
      <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginBottom: 6 }]}>
        ÖNİZLEME
      </Text>
      <Text style={[designTokens.typography.title, { color: theme.colors.onSurface, marginBottom: 10 }]}>
        {title || 'Başlıksız Not'}
      </Text>
      {body ? (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Markdown style={mdStyles as any}>{body}</Markdown>
      ) : (
        <Text style={[designTokens.typography.body, { color: theme.colors.onSurfaceVariant }]}>
          Markdown girdikçe burada önizleme göreceksiniz.
        </Text>
      )}
    </GlassCard>
  );

  return (
    <View style={styles.root}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[designTokens.typography.title, { color: theme.colors.onSurface, marginBottom: 8 }]}>
            {existing ? 'Notu düzenle' : 'Yeni not'}
          </Text>

          {!isWide ? (
            <SegmentedButtons
              value={tab}
              onValueChange={(v) => setTab(v as 'edit' | 'preview')}
              buttons={[
                { value: 'edit', label: 'Yaz', icon: 'pencil' },
                { value: 'preview', label: 'Önizle', icon: 'eye' },
              ]}
              style={{ marginBottom: designTokens.spacing.md }}
            />
          ) : null}

          {isWide ? (
            <View style={{ flexDirection: 'row', gap: designTokens.spacing.md }}>
              <View style={{ flex: 1 }}>{editorPane}</View>
              <View style={{ flex: 1 }}>{previewPane}</View>
            </View>
          ) : tab === 'edit' ? (
            editorPane
          ) : (
            previewPane
          )}

          <View style={{ flexDirection: 'row', gap: designTokens.spacing.sm, marginTop: designTokens.spacing.lg }}>
            <Button mode="contained" onPress={save} icon="content-save" contentStyle={{ paddingVertical: 6 }} style={{ flex: 1 }}>
              Kaydet
            </Button>
            <Button onPress={() => navigation.goBack()}>İptal</Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: designTokens.spacing.lg, paddingBottom: designTokens.spacing.xxl },
});
