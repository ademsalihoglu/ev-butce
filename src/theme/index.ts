import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

/**
 * Premium palette — deep indigo/navy base with warm gold highlights and semantic
 * greens/reds. A single source of truth for both color schemes + non-color tokens
 * (spacing, radii, gradients, glass surfaces).
 */

const tokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    pill: 999,
  },
};

const lightBrand = {
  primary: '#4338CA', // deep indigo
  onPrimary: '#FFFFFF',
  primaryContainer: '#E0E7FF',
  onPrimaryContainer: '#1E1B4B',
  secondary: '#0EA5E9', // cyan-ish
  tertiary: '#F59E0B', // warm gold
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
};

const darkBrand = {
  primary: '#8B8EF2',
  onPrimary: '#111127',
  primaryContainer: '#3730A3',
  onPrimaryContainer: '#EEF2FF',
  secondary: '#38BDF8',
  tertiary: '#FBBF24',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
};

export const lightTheme = {
  ...MD3LightTheme,
  roundness: tokens.radius.md / 4, // paper treats roundness as scalar multiple
  colors: {
    ...MD3LightTheme.colors,
    primary: lightBrand.primary,
    onPrimary: lightBrand.onPrimary,
    primaryContainer: lightBrand.primaryContainer,
    onPrimaryContainer: lightBrand.onPrimaryContainer,
    secondary: lightBrand.secondary,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#CFFAFE',
    onSecondaryContainer: '#082F49',
    tertiary: lightBrand.tertiary,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#FEF3C7',
    onTertiaryContainer: '#78350F',
    error: lightBrand.danger,
    onError: '#FFFFFF',
    background: '#F6F7FB',
    onBackground: '#0F172A',
    surface: '#FFFFFF',
    onSurface: '#0F172A',
    surfaceVariant: '#E2E8F0',
    onSurfaceVariant: '#475569',
    outline: '#CBD5F5',
    outlineVariant: '#E2E8F0',
    elevation: {
      level0: 'transparent',
      level1: '#FAFBFF',
      level2: '#F3F5FC',
      level3: '#ECEFFA',
      level4: '#E6EAF8',
      level5: '#DFE4F5',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: tokens.radius.md / 4,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkBrand.primary,
    onPrimary: darkBrand.onPrimary,
    primaryContainer: darkBrand.primaryContainer,
    onPrimaryContainer: darkBrand.onPrimaryContainer,
    secondary: darkBrand.secondary,
    onSecondary: '#042F49',
    secondaryContainer: '#0C4A6E',
    onSecondaryContainer: '#BAE6FD',
    tertiary: darkBrand.tertiary,
    onTertiary: '#422006',
    tertiaryContainer: '#78350F',
    onTertiaryContainer: '#FEF3C7',
    error: darkBrand.danger,
    onError: '#0F172A',
    background: '#0B0F1E',
    onBackground: '#E2E8F0',
    surface: '#131A2E',
    onSurface: '#E2E8F0',
    surfaceVariant: '#1E2541',
    onSurfaceVariant: '#94A3B8',
    outline: '#334155',
    outlineVariant: '#1E293B',
    elevation: {
      level0: 'transparent',
      level1: '#141B2F',
      level2: '#182039',
      level3: '#1C2541',
      level4: '#1F2A49',
      level5: '#233055',
    },
  },
};

export type AppTheme = typeof lightTheme;

/** Non-MD3 design tokens — gradients, glass, typography. */
export const designTokens = {
  ...tokens,
  typography: {
    display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const, letterSpacing: -0.5 },
    title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.2 },
    subtitle: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
    body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
    caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.2 },
    mono: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.3 },
  },
  gradients: {
    light: {
      background: ['#EEF2FF', '#F6F7FB', '#E0E7FF'] as const,
      primary: ['#6366F1', '#4338CA'] as const,
      income: ['#22C55E', '#10B981'] as const,
      expense: ['#EF4444', '#DC2626'] as const,
      gold: ['#F59E0B', '#D97706'] as const,
      hero: ['#4338CA', '#7C3AED', '#0EA5E9'] as const,
    },
    dark: {
      background: ['#0B0F1E', '#101634', '#0B0F1E'] as const,
      primary: ['#6366F1', '#312E81'] as const,
      income: ['#22C55E', '#047857'] as const,
      expense: ['#F87171', '#B91C1C'] as const,
      gold: ['#FBBF24', '#B45309'] as const,
      hero: ['#312E81', '#5B21B6', '#0369A1'] as const,
    },
  },
  glass: {
    light: {
      background: 'rgba(255,255,255,0.65)',
      border: 'rgba(255,255,255,0.75)',
      borderBottom: 'rgba(148,163,184,0.25)',
      highlight: 'rgba(99,102,241,0.12)',
      blur: 24,
    },
    dark: {
      background: 'rgba(20,27,47,0.55)',
      border: 'rgba(148,163,184,0.15)',
      borderBottom: 'rgba(15,23,42,0.7)',
      highlight: 'rgba(129,140,248,0.18)',
      blur: 28,
    },
  },
};
