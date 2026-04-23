import React, { useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAdmin } from '../context/AdminContext';
import type { Announcement, AnnouncementCategory } from '../db/siteConfig';
import type { RootStackParamList, TabsParamList } from '../navigation/types';
import { GlassCard } from './GlassCard';
import { designTokens } from '../theme';

type BannerNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

const CATEGORY_META: Record<
  AnnouncementCategory,
  { icon: string; label: string; tint: string }
> = {
  news: { icon: 'newspaper-variant', label: 'Haber', tint: '#3B82F6' },
  campaign: { icon: 'gift-outline', label: 'Kampanya', tint: '#F59E0B' },
  system: { icon: 'information-outline', label: 'Sistem', tint: '#10B981' },
};

interface Props {
  navigation: BannerNav;
}

export function AnnouncementBanner({ navigation }: Props) {
  const theme = useTheme();
  const { undismissedAnnouncements, dismissAnnouncement } = useAdmin();
  const [index, setIndex] = useState(0);

  const items = useMemo(() => undismissedAnnouncements.slice(0, 5), [undismissedAnnouncements]);
  if (items.length === 0) return null;

  const clampedIndex = Math.min(index, items.length - 1);
  const current = items[clampedIndex];
  const meta = CATEGORY_META[current.category] ?? CATEGORY_META.news;
  const hasMore = items.length > 1;

  return (
    <GlassCard tone="primary" padding="md" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: meta.tint + '22' }]}>
          <MaterialCommunityIcons name={meta.icon} size={22} color={meta.tint} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[designTokens.typography.caption, { color: meta.tint, fontWeight: '700' }]}>
            {meta.label.toUpperCase()}
          </Text>
          <Text
            style={[designTokens.typography.subtitle, { color: theme.colors.onSurface }]}
            numberOfLines={2}
          >
            {current.title}
          </Text>
        </View>
        <IconButton
          icon="close"
          size={18}
          onPress={() => dismissAnnouncement(current.id)}
          accessibilityLabel="Duyuruyu kapat"
        />
      </View>

      <Text
        style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, marginTop: 4 }]}
        numberOfLines={3}
      >
        {plainPreview(current.body)}
      </Text>

      <View style={styles.actionsRow}>
        {current.ctaLabel && current.ctaUrl ? (
          <Button
            mode="contained-tonal"
            compact
            icon="open-in-new"
            onPress={() => {
              void Linking.openURL(current.ctaUrl!).catch(() => undefined);
            }}
          >
            {current.ctaLabel}
          </Button>
        ) : null}
        <Button
          mode="text"
          compact
          icon="arrow-right"
          onPress={() => navigation.navigate('Announcements')}
        >
          Tüm duyurular
        </Button>
        {hasMore ? (
          <View style={styles.pager}>
            <IconButton
              icon="chevron-left"
              size={18}
              disabled={clampedIndex === 0}
              onPress={() => setIndex((i) => Math.max(0, i - 1))}
            />
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              {clampedIndex + 1}/{items.length}
            </Text>
            <IconButton
              icon="chevron-right"
              size={18}
              disabled={clampedIndex === items.length - 1}
              onPress={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            />
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

function plainPreview(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#~-]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

const styles = StyleSheet.create({
  card: {
    marginBottom: designTokens.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
});
