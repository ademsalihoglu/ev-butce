import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const brand = {
  primary: '#4F46E5',
  secondary: '#10B981',
  tertiary: '#F59E0B',
  error: '#EF4444',
};

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: brand.primary,
    secondary: brand.secondary,
    tertiary: brand.tertiary,
    error: brand.error,
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#818CF8',
    secondary: '#34D399',
    tertiary: '#FBBF24',
    error: '#F87171',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
  },
};

export type AppTheme = typeof lightTheme;
