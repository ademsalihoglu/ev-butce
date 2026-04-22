import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '../components/GradientBackground';
import { GlassCard } from '../components/GlassCard';
import { useAdmin } from '../context/AdminContext';
import { designTokens } from '../theme';

export default function AboutScreen() {
  const theme = useTheme();
  const { siteConfig } = useAdmin();

  const rows: Array<{ icon: string; label: string; value?: string; href?: string }> = [
    siteConfig.contactEmail
      ? { icon: 'email-outline', label: 'E-posta', value: siteConfig.contactEmail, href: `mailto:${siteConfig.contactEmail}` }
      : null,
    siteConfig.contactPhone
      ? { icon: 'phone-outline', label: 'Telefon', value: siteConfig.contactPhone, href: `tel:${siteConfig.contactPhone}` }
      : null,
    siteConfig.contactAddress
      ? { icon: 'map-marker-outline', label: 'Adres', value: siteConfig.contactAddress }
      : null,
    siteConfig.supportUrl
      ? { icon: 'lifebuoy', label: 'Destek', value: siteConfig.supportUrl, href: siteConfig.supportUrl }
      : null,
  ].filter(Boolean) as Array<{ icon: string; label: string; value?: string; href?: string }>;

  return (
    <View style={{ flex: 1 }}>
      <GradientBackground />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <GlassCard padding="lg" style={{ alignItems: 'center' }}>
            {siteConfig.logoUrl ? (
              <Image
                source={{ uri: siteConfig.logoUrl }}
                style={{ width: 96, height: 96, borderRadius: 16, marginBottom: 10 }}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons name="wallet-outline" size={64} color={theme.colors.primary} />
            )}
            <Text style={[designTokens.typography.title, { color: theme.colors.onSurface, marginTop: 6 }]}>
              {siteConfig.siteName}
            </Text>
            <Text
              style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }]}
            >
              {siteConfig.seoDescription}
            </Text>
          </GlassCard>

          {rows.length > 0 ? (
            <GlassCard padding="lg">
              <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, marginBottom: 8 }]}>
                İletişim
              </Text>
              {rows.map((r, idx) => (
                <React.Fragment key={r.label}>
                  {idx > 0 ? <Divider /> : null}
                  <View style={styles.row}>
                    <MaterialCommunityIcons name={r.icon} size={22} color={theme.colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[designTokens.typography.caption, { color: theme.colors.onSurfaceVariant }]}>
                        {r.label}
                      </Text>
                      <Text style={{ color: theme.colors.onSurface }}>{r.value}</Text>
                    </View>
                    {r.href ? (
                      <Button
                        mode="text"
                        compact
                        onPress={() => void Linking.openURL(r.href!).catch(() => undefined)}
                      >
                        Aç
                      </Button>
                    ) : null}
                  </View>
                </React.Fragment>
              ))}
            </GlassCard>
          ) : null}

          {siteConfig.socialLinks.length > 0 ? (
            <GlassCard padding="lg">
              <Text style={[designTokens.typography.subtitle, { color: theme.colors.onSurface, marginBottom: 8 }]}>
                Sosyal Medya
              </Text>
              <View style={styles.socialRow}>
                {siteConfig.socialLinks.map((l) => (
                  <Button
                    key={l.label + l.url}
                    mode="contained-tonal"
                    icon="open-in-new"
                    onPress={() => void Linking.openURL(l.url).catch(() => undefined)}
                  >
                    {l.label}
                  </Button>
                ))}
              </View>
            </GlassCard>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: designTokens.spacing.lg,
    paddingBottom: 120,
    gap: designTokens.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
