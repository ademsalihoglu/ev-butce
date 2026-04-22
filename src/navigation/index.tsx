import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useTheme } from 'react-native-paper';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShoppingListScreen from '../screens/ShoppingListScreen';
import ShoppingEditorScreen from '../screens/ShoppingEditorScreen';
import NotesScreen from '../screens/NotesScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import type { AuthStackParamList, RootStackParamList, TabsParamList } from './types';
import { useAppTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { designTokens } from '../theme';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function TabsNavigator() {
  const theme = useTheme();
  const { mode } = useAppTheme();

  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '700' },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor:
            Platform.OS === 'web'
              ? mode === 'dark'
                ? 'rgba(19,26,46,0.85)'
                : 'rgba(255,255,255,0.85)'
              : 'transparent',
          borderTopColor: theme.colors.outlineVariant,
          position: Platform.OS === 'web' ? 'absolute' : undefined,
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          height: 62,
          paddingTop: 6,
          paddingBottom: 10,
        },
        tabBarBackground:
          Platform.OS !== 'web'
            ? () => (
                <BlurView
                  tint={mode === 'dark' ? 'dark' : 'light'}
                  intensity={80}
                  style={StyleSheet.absoluteFill}
                />
              )
            : undefined,
        tabBarIcon: ({ color, size, focused }) => {
          const iconName: Record<keyof TabsParamList, string> = {
            Dashboard: focused ? 'view-dashboard' : 'view-dashboard-outline',
            Transactions: focused ? 'format-list-bulleted-square' : 'format-list-bulleted',
            Shopping: focused ? 'cart' : 'cart-outline',
            Notes: focused ? 'notebook' : 'notebook-outline',
            Reports: focused ? 'chart-pie' : 'chart-arc',
            Settings: focused ? 'cog' : 'cog-outline',
          };
          return <MaterialCommunityIcons name={iconName[route.name]} size={size} color={color} />;
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Özet' }} />
      <Tabs.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'İşlemler' }} />
      <Tabs.Screen name="Shopping" component={ShoppingListScreen} options={{ title: 'Liste' }} />
      <Tabs.Screen name="Notes" component={NotesScreen} options={{ title: 'Notlar' }} />
      <Tabs.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar' }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
    </Tabs.Navigator>
  );
}

function MainNavigator() {
  const theme = useTheme();
  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '700' },
        headerTintColor: theme.colors.primary,
      }}
    >
      <RootStack.Screen name="Main" component={TabsNavigator} options={{ headerShown: false }} />
      <RootStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'Yeni İşlem', presentation: 'modal' }}
      />
      <RootStack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={{ title: 'Not', presentation: 'modal' }}
      />
      <RootStack.Screen
        name="ShoppingEditor"
        component={ShoppingEditorScreen}
        options={{ title: 'Alışveriş Kalemi', presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}

export default function RootNavigation() {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const { user, initializing } = useAuth();

  const navTheme =
    mode === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onSurface,
            border: theme.colors.outlineVariant,
            primary: theme.colors.primary,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onSurface,
            border: theme.colors.outlineVariant,
            primary: theme.colors.primary,
          },
        };

  if (initializing) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
          padding: designTokens.spacing.lg,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
