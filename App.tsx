import React from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GroupProvider } from './src/context/GroupContext';
import { DataProvider, useData } from './src/context/DataContext';
import RootNavigation from './src/navigation';

if (Platform.OS === 'web') {
  const iconFont = require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf');
  const style = `@font-face {
    src: url(${iconFont});
    font-family: MaterialCommunityIcons;
  }`;
  if (typeof document !== 'undefined') {
    const el = document.createElement('style');
    el.appendChild(document.createTextNode(style));
    document.head.appendChild(el);
    // Global body tweaks for a more premium feel on web.
    const base = document.createElement('style');
    base.appendChild(
      document.createTextNode(`
        html, body, #root { margin: 0; padding: 0; min-height: 100%; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }
      `)
    );
    document.head.appendChild(base);
  }
}

function AppShell() {
  const theme = useTheme();
  const { user } = useAuth();
  const { loading } = useData();

  if (user && loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
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
        <AuthProvider>
          <GroupProvider>
            <DataProvider>
              <AppShell />
            </DataProvider>
          </GroupProvider>
        </AuthProvider>
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
