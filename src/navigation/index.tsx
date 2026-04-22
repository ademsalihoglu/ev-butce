import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from 'react-native-paper';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import type { RootStackParamList, TabsParamList } from './types';
import { useAppTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabsParamList>();

function TabsNavigator() {
  const theme = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.onSurface },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
        },
        tabBarIcon: ({ color, size }) => {
          const name =
            route.name === 'Dashboard'
              ? 'view-dashboard'
              : route.name === 'Transactions'
              ? 'format-list-bulleted'
              : route.name === 'Reports'
              ? 'chart-pie'
              : 'cog';
          return <MaterialCommunityIcons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Özet' }} />
      <Tabs.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'İşlemler' }} />
      <Tabs.Screen name="Reports" component={ReportsScreen} options={{ title: 'Raporlar' }} />
      <Tabs.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ayarlar' }} />
    </Tabs.Navigator>
  );
}

export default function RootNavigation() {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const navTheme =
    mode === 'dark'
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.onSurface,
            border: theme.colors.surfaceVariant,
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
            border: theme.colors.surfaceVariant,
            primary: theme.colors.primary,
          },
        };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTitleStyle: { color: theme.colors.onSurface },
          headerTintColor: theme.colors.primary,
        }}
      >
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="AddTransaction"
          component={AddTransactionScreen}
          options={{ title: 'Yeni İşlem', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
