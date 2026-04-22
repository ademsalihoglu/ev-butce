import React from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppThemeProvider, useAppTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { GroupProvider } from './src/context/GroupContext';
import { DataProvider, useData } from './src/context/DataContext';
import { AdminProvider, useAdmin } from './src/context/AdminContext';
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

function setMeta(name: string, content: string): void {
  if (typeof document === 'undefined') return;
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('name', name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content ?? '');
}

function AppShell() {
  const theme = useTheme();
  const { user } = useAuth();
  const { loading } = useData();
  const { siteConfig } = useAdmin();

  // Sync web <title> / meta description / keywords from siteConfig.
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (siteConfig.seoTitle) {
      document.title = siteConfig.seoTitle;
    }
    setMeta('description', siteConfig.seoDescription);
    setMeta('keywords', siteConfig.seoKeywords);
  }, [siteConfig.seoTitle, siteConfig.seoDescription, siteConfig.seoKeywords]);

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
          <AdminProvider>
            <GroupProvider>
              <DataProvider>
                <AppShell />
              </DataProvider>
            </GroupProvider>
          </AdminProvider>
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
