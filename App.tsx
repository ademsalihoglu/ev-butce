import React from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { DataProvider, useData } from './src/context/DataContext';
import RootNavigation from './src/navigation';

if (Platform.OS === 'web') {
  // Register the vector icon font for web so MaterialCommunityIcons renders correctly.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const iconFont = require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf');
  const style = `@font-face {
    src: url(${iconFont});
    font-family: MaterialCommunityIcons;
  }`;
  if (typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.appendChild(document.createTextNode(style));
    document.head.appendChild(el);
  }
}

function AppShell() {
  const theme = useTheme();
  const { loading } = useData();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  return <RootNavigation />;
}

function ThemedApp() {
  const { theme, mode } = useAppTheme();
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <DataProvider>
          <AppShell />
        </DataProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <AppThemeProvider>
      <ThemedApp />
    </AppThemeProvider>
  );
}
