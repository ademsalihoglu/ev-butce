import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { useAdmin } from '../context/AdminContext';
import type { Announcement, AnnouncementCategory } from '../db/siteConfig';
import { designTokens } from '../theme';

const CATEGORY_META: Record<
  AnnouncementCategory,
  { icon: string; label: string; tint: string }
> = {
  news: { icon: 'newspaper-variant', label: 'Haber', tint: '#3B82F6' },
  campaign: { icon: 'gift-outline', label: 'Kampanya', tint: '#F59E0B' },
  system: { icon: 'information-outline', label: 'Sistem', tint: '#10B981' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AnnouncementsScreen() {
  const theme = useTheme();
  const { visibleAnnouncements, announcementsLoading } = useAdmin();

  const sorted = useMemo(() => visibleAnnouncements, [visibleAnnouncements]);

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {announcementsLoading ? (
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Duyurular yükleniyor…
            </Text>
          ) : sorted.length === 0 ? (
            <GlassCard padding="lg" style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons
                name="bell-off-outline"
                size={36}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={[designTokens.typography.subtitle, { marginTop: 6, color: theme.colors.onSurface }]}>
                Şu anda aktif duyuru yok.
              </Text>
              <Text
                style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}
              >
                Yeniliklerden ve kampanyalardan burada haberdar olacaksınız.
              </Text>
            </GlassCard>
          ) : (
            sorted.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const theme = useTheme();
  const meta = CATEGORY_META[announcement.category] ?? CATEGORY_META.news;
  return (
    <GlassCard padding="lg" style={{ marginBottom: designTokens.spacing.md }}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: meta.tint + '22' }]}>
          <MaterialCommunityIcons name={meta.icon} size={20} color={meta.tint} />
        </View>
        <Chip compact style={{ backgroundColor: meta.tint + '22' }} textStyle={{ color: meta.tint }}>
          {meta.label}
        </Chip>
        <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginLeft: 'auto' }]}>
          {formatDate(announcement.publishAt)}
        </Text>
      </View>
      <Text style={[designTokens.typography.title, { color: theme.colors.onSurface, marginTop: 8 }]}>
        {announcement.title}
      </Text>
      <View style={{ marginTop: 6 }}>
        <Markdown
          style={{
            body: { color: theme.colors.onSurface },
            paragraph: { color: theme.colors.onSurface, marginTop: 4, marginBottom: 4 },
            link: { color: theme.colors.primary },
            code_inline: {
              backgroundColor: theme.colors.surfaceVariant,
              color: theme.colors.onSurface,
              padding: 2,
              borderRadius: 4,
            },
          }}
        >
          {announcement.body}
        </Markdown>
      </View>
      {announcement.ctaLabel && announcement.ctaUrl ? (
        <Button
          mode="contained-tonal"
          icon="open-in-new"
          style={{ marginTop: 10, alignSelf: 'flex-start' }}
          onPress={() => void Linking.openURL(announcement.ctaUrl!).catch(() => undefined)}
        >
          {announcement.ctaLabel}
        </Button>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
