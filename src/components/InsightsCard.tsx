import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MD3Theme, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { Insight, InsightTone } from '../utils/insights';
import { designTokens } from '../theme';
import { GlassCard } from './GlassCard';

function toneColors(tone: InsightTone, theme: MD3Theme) {
  switch (tone) {
    case 'positive':
      return { bg: theme.colors.secondaryContainer, fg: theme.colors.onSecondaryContainer, accent: '#10B981' };
    case 'warning':
      return { bg: theme.colors.tertiaryContainer, fg: theme.colors.onTertiaryContainer, accent: '#D97706' };
    case 'danger':
      return { bg: theme.colors.errorContainer, fg: theme.colors.onErrorContainer, accent: theme.colors.error };
    case 'info':
      return { bg: theme.colors.primaryContainer, fg: theme.colors.onPrimaryContainer, accent: theme.colors.primary };
    case 'neutral':
    default:
      return {
        bg: theme.colors.surfaceVariant,
        fg: theme.colors.onSurfaceVariant,
        accent: theme.colors.onSurfaceVariant,
      };
  }
}

export function InsightsCard({ insights }: { insights: Insight[] }) {
  const theme = useTheme();
  return (
    <GlassCard padding="lg" radius="lg">
      <View style={styles.header}>
        <MaterialCommunityIcons name="robot-happy-outline" size={22} color={theme.colors.primary} />
        <Text variant="titleMedium" style={{ fontWeight: '700' }}>
          Akıllı Özet
        </Text>
      </View>
      <Text style={[styles.sub, { color: theme.colors.onSurfaceVariant }]}>
        Geçen aya göre harcama trendin ve öneriler.
      </Text>
      <View style={{ gap: designTokens.spacing.sm, marginTop: designTokens.spacing.md }}>
        {insights.length === 0 ? (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Henüz yeterli veri yok.</Text>
        ) : (
          insights.map((ins) => {
            const colors = toneColors(ins.tone, theme);
            return (
              <View
                key={ins.id}
                style={[
                  styles.row,
                  {
                    backgroundColor: colors.bg,
                    borderLeftColor: colors.accent,
                  },
                ]}
              >
                <MaterialCommunityIcons name={ins.icon} size={22} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: colors.fg }]}>{ins.title}</Text>
                  <Text style={[styles.detail, { color: colors.fg }]}>{ins.detail}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: designTokens.spacing.md,
    padding: designTokens.spacing.md,
    borderRadius: designTokens.radius.md,
    borderLeftWidth: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  detail: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.9,
  },
});
