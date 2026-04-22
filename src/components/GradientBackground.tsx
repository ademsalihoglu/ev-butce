import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../context/ThemeContext';
import { designTokens } from '../theme';

interface GradientBackgroundProps {
  variant?: 'background' | 'hero' | 'primary';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function GradientBackground({ variant = 'background', style, children }: GradientBackgroundProps) {
  const { mode } = useAppTheme();
  const palette = mode === 'dark' ? designTokens.gradients.dark : designTokens.gradients.light;
  const colors = palette[variant];

  return (
    <LinearGradient
      colors={colors as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
    >
      {children ? <View style={StyleSheet.absoluteFill}>{children}</View> : null}
    </LinearGradient>
  );
}
