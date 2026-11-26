import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { KnightArenaTheme } from '../../src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: KnightArenaTheme.colors.surfaceDark,
        },
        headerTintColor: KnightArenaTheme.colors.brandPrimary,
        tabBarStyle: {
          backgroundColor: KnightArenaTheme.colors.surfaceDark,
          borderTopColor: KnightArenaTheme.colors.surfaceBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: KnightArenaTheme.colors.brandPrimary,
        tabBarInactiveTintColor: KnightArenaTheme.colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🏛</Text>,
        }}
      />
      <Tabs.Screen
        name="play"
        options={{
          title: 'Play',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚔</Text>,
        }}
      />
      <Tabs.Screen
        name="puzzles"
        options={{
          title: 'Puzzles',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🧩</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
