import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../context/ThemeContext';
import { designTokens } from '../theme';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  padding?: keyof typeof designTokens.spacing | number;
  radius?: keyof typeof designTokens.radius | number;
  tone?: 'neutral' | 'primary' | 'warm';
}

export function GlassCard({
  children,
  style,
  intensity,
  padding = 'lg',
  radius = 'lg',
  tone = 'neutral',
  ...rest
}: GlassCardProps) {
  const { mode } = useAppTheme();
  const glass = mode === 'dark' ? designTokens.glass.dark : designTokens.glass.light;

  const resolvedPadding = typeof padding === 'number' ? padding : designTokens.spacing[padding];
  const resolvedRadius = typeof radius === 'number' ? radius : designTokens.radius[radius];

  const toneOverlay: ViewStyle | undefined =
    tone === 'primary'
      ? { backgroundColor: glass.highlight }
      : tone === 'warm'
      ? { backgroundColor: 'rgba(251,191,36,0.08)' }
      : undefined;

  const webStyle: ViewStyle =
    Platform.OS === 'web'
      ? ({
          backgroundColor: glass.background,
          backdropFilter: `blur(${glass.blur}px) saturate(160%)`,
          WebkitBackdropFilter: `blur(${glass.blur}px) saturate(160%)`,
        } as unknown as ViewStyle)
      : {};

  const containerStyle: StyleProp<ViewStyle> = [
    styles.card,
    {
      borderRadius: resolvedRadius,
      padding: resolvedPadding,
      borderColor: glass.border,
      borderBottomColor: glass.borderBottom,
      shadowColor: mode === 'dark' ? '#000' : '#1E1B4B',
      shadowOpacity: mode === 'dark' ? 0.45 : 0.1,
    },
    webStyle,
    style,
  ];

  if (Platform.OS === 'web') {
    return (
      <View style={containerStyle} {...rest}>
        {toneOverlay ? <View style={[StyleSheet.absoluteFillObject, { borderRadius: resolvedRadius }, toneOverlay]} /> : null}
        {children}
      </View>
    );
  }

  return (
    <View style={containerStyle} {...rest}>
      <BlurView
        intensity={intensity ?? glass.blur * 3}
        tint={mode === 'dark' ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFillObject, { borderRadius: resolvedRadius }]}
      />
      <View style={[StyleSheet.absoluteFillObject, { borderRadius: resolvedRadius, backgroundColor: glass.background }]} />
      {toneOverlay ? <View style={[StyleSheet.absoluteFillObject, { borderRadius: resolvedRadius }, toneOverlay]} /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },
});
