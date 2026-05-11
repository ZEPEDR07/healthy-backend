import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.nav,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrição',
          tabBarIcon: ({ color, size }) => <Ionicons name="restaurant" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tips"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
