import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from './GradientBackground';
import { GlassCard } from './GlassCard';
import { designTokens } from '../theme';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  return (
    <View style={styles.root}>
      <GradientBackground variant="hero" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { padding: isWide ? designTokens.spacing.xxl : designTokens.spacing.lg },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.brand, { marginBottom: designTokens.spacing.xl }]}>
              <Text style={[designTokens.typography.caption, { color: 'rgba(255,255,255,0.8)' }]}>
                EV BÜTÇE
              </Text>
              <Text style={[designTokens.typography.display, { color: '#FFFFFF', marginTop: 4 }]}>
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    designTokens.typography.body,
                    { color: 'rgba(226,232,240,0.9)', marginTop: 8, maxWidth: 460 },
                  ]}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <View style={[styles.cardWrap, { maxWidth: isWide ? 480 : undefined, alignSelf: 'center', width: '100%' }]}>
              <GlassCard padding="xl" radius="xl">
                {children}
              </GlassCard>
              {footer ? (
                <View style={{ marginTop: designTokens.spacing.lg, alignItems: 'center' }}>
                  <Text style={[designTokens.typography.caption, { color: 'rgba(255,255,255,0.85)' }]}>
                    {footer}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Text
        style={[
          designTokens.typography.caption,
          styles.footer,
          { color: theme.dark ? 'rgba(226,232,240,0.45)' : 'rgba(15,23,42,0.4)' },
        ]}
      >
        © {new Date().getFullYear()} Ev Bütçe
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'flex-start', alignSelf: 'center', width: '100%', maxWidth: 480 },
  cardWrap: {},
  footer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
});
